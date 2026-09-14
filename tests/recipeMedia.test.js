import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFile } from "node:fs/promises";
import {
  MAX_PHOTOS,
  MAX_IMAGE_BYTES,
  ACCEPTED_IMAGE_TYPES,
  photoProblem,
  sortPhotos,
} from "../src/lib/recipeMedia";

// The backend has had the whole upload pipeline since early on - the
// middleware, Cloudinary, the media controller, the cascade deletes - and
// the frontend never called it. There was no way to put a photo on a
// recipe, so every card and every hero showed the placeholder gradient,
// on a site whose own code says a food app lives or dies on its imagery.
//
// These checks are on the rules the picker applies before uploading, which
// only help while they agree with what the API will accept.

const file = (name, type, size) => ({ name, type, size });

describe("whether a file can be used", () => {
  it("accepts the types the API accepts", () => {
    for (const type of ACCEPTED_IMAGE_TYPES) {
      expect(photoProblem(file("a", type, 1000))).toBeNull();
    }
  });

  it.each([
    ["a text file", "text/plain"],
    ["a PDF", "application/pdf"],
    ["an SVG, which can carry script", "image/svg+xml"],
    ["a GIF, which the API does not list", "image/gif"],
  ])("refuses %s", (_label, type) => {
    expect(photoProblem(file("a", type, 1000))).toMatch(/JPEG, PNG or WebP/);
  });

  it("refuses a file over the size limit", () => {
    expect(photoProblem(file("big", "image/png", MAX_IMAGE_BYTES + 1))).toMatch(/8MB or smaller/);
  });

  it("accepts a file exactly at the limit", () => {
    expect(photoProblem(file("edge", "image/png", MAX_IMAGE_BYTES))).toBeNull();
  });

  it("refuses nothing at all", () => {
    expect(photoProblem(undefined)).toBeTruthy();
  });

  it("does not offer video, which the app cannot display", () => {
    // Every place media is rendered renders an <img> - the detail hero,
    // the thumbnail strip, the cards - so an uploaded video would show as
    // a broken image even though the API would take it.
    expect(ACCEPTED_IMAGE_TYPES.some((type) => type.startsWith("video/"))).toBe(false);
    expect(photoProblem(file("clip", "video/mp4", 1000))).toBeTruthy();
  });
});

describe("sorting a chosen set", () => {
  const ok = (n) => file(`ok-${n}.png`, "image/png", 1000);

  it("takes them all when there is room", () => {
    const { accepted, problems } = sortPhotos([ok(1), ok(2)], 0);
    expect(accepted).toHaveLength(2);
    expect(problems).toEqual([]);
  });

  it("stops at the ceiling and says which were left out", () => {
    const { accepted, problems } = sortPhotos(Array.from({ length: 8 }, (_, i) => ok(i)), 0);
    expect(accepted).toHaveLength(MAX_PHOTOS);
    expect(problems).toHaveLength(3);
    expect(problems[0]).toMatch(new RegExp(`at most ${MAX_PHOTOS} photos`));
  });

  it("counts the photos already on the recipe", () => {
    const { accepted, problems } = sortPhotos([ok(1), ok(2)], MAX_PHOTOS - 1);
    expect(accepted).toHaveLength(1);
    expect(problems).toHaveLength(1);
  });

  it("names the file in each problem, so it is clear which one", () => {
    const { problems } = sortPhotos([file("notes.txt", "text/plain", 10)], 0);
    expect(problems[0]).toMatch(/^notes\.txt: /);
  });

  it("keeps the good ones when one in the set is bad", () => {
    const { accepted, problems } = sortPhotos([ok(1), file("bad.txt", "text/plain", 10), ok(2)], 0);
    expect(accepted).toHaveLength(2);
    expect(problems).toHaveLength(1);
  });
});

describe("the limits", () => {
  const backend = (file) =>
    readFile(new URL(`../../recipehub-backend/${file}`, import.meta.url), "utf8").catch(() => null);

  it("match the API's", async () => {
    // The backend is a sibling checkout, not a dependency. When it is not
    // there - CI builds the frontend alone - there is nothing to compare.
    const middleware = await backend("middleware/uploadMiddleware.js");
    const controller = await backend("controllers/mediaController.js");
    if (!middleware || !controller) return;

    const bytes = middleware.match(/MAX_IMAGE_BYTES\s*=\s*(\d+)\s*\*\s*1024\s*\*\s*1024/);
    expect(bytes, "MAX_IMAGE_BYTES is not declared as MB").not.toBeNull();
    expect(MAX_IMAGE_BYTES).toBe(Number(bytes[1]) * 1024 * 1024);

    const photos = controller.match(/MAX_PHOTOS\s*=\s*(\d+)/);
    expect(photos).not.toBeNull();
    expect(MAX_PHOTOS).toBe(Number(photos[1]));

    // Every image type the API allows should be offered, and none it does not.
    const allowed = [...middleware.matchAll(/"(image\/[\w+-]+)":\s*"image"/g)].map((m) => m[1]);
    expect(allowed.length).toBeGreaterThan(0);
    expect([...ACCEPTED_IMAGE_TYPES].sort()).toEqual(allowed.sort());
  });
});

describe("sending them", () => {
  let uploadRecipePhotos;
  let API;

  beforeEach(async () => {
    vi.resetModules();
    API = (await import("../src/services/api")).default;
    ({ uploadRecipePhotos } = await import("../src/lib/uploadPhotos"));
  });
  afterEach(() => vi.restoreAllMocks());

  const photo = (name) => new File(["bytes"], name, { type: "image/png" });

  it("posts each photo under the field name the API reads", async () => {
    const post = vi.spyOn(API, "post").mockResolvedValue({ data: {} });
    await uploadRecipePhotos("r1", [photo("a.png"), photo("b.png")]);
    expect(post).toHaveBeenCalledTimes(2);
    const [path, body] = post.mock.calls[0];
    expect(path).toBe("/recipes/r1/media");
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("file")).toBeInstanceOf(File);
  });

  it("returns what failed rather than throwing", async () => {
    // By the time this runs the recipe is saved. A photo failing is not
    // the recipe failing, and must not be reported as one.
    vi.spyOn(API, "post")
      .mockResolvedValueOnce({ data: {} })
      .mockRejectedValueOnce(new Error("502"));
    const failed = await uploadRecipePhotos("r1", [photo("a.png"), photo("b.png")]);
    expect(failed.map((item) => item.name)).toEqual(["b.png"]);
  });

  it("keeps going after one fails", async () => {
    const post = vi.spyOn(API, "post")
      .mockRejectedValueOnce(new Error("502"))
      .mockResolvedValue({ data: {} });
    const failed = await uploadRecipePhotos("r1", [photo("a.png"), photo("b.png")]);
    expect(post).toHaveBeenCalledTimes(2);
    expect(failed.map((item) => item.name)).toEqual(["a.png"]);
  });

  it("does nothing without a recipe or without photos", async () => {
    const post = vi.spyOn(API, "post");
    expect(await uploadRecipePhotos(null, [photo("a.png")])).toEqual([]);
    expect(await uploadRecipePhotos("r1", [])).toEqual([]);
    expect(post).not.toHaveBeenCalled();
  });
});

// "2 photos did not upload" and nothing else leaves someone with one
// option: try the same files again. The server says why - the recipe is
// already at its five, the file is over the limit, Cloudinary was down -
// and that sentence used to be discarded in the catch.
describe("what to tell someone about photos that did not upload", () => {
  let uploadRecipePhotos;
  let describeFailedUploads;
  let API;

  beforeEach(async () => {
    vi.resetModules();
    API = (await import("../src/services/api")).default;
    ({ uploadRecipePhotos, describeFailedUploads } = await import("../src/lib/uploadPhotos"));
  });
  afterEach(() => vi.restoreAllMocks());

  const photo = (name) => new File(["bytes"], name, { type: "image/png" });

  const refused = (message) => {
    const err = new Error("no");
    err.response = { status: 400, data: { message } };
    return err;
  };

  it("keeps the server's reason alongside the file name", async () => {
    vi.spyOn(API, "post").mockRejectedValue(refused("Recipes can have at most 5 photos"));
    const failed = await uploadRecipePhotos("r1", [photo("a.png")]);
    expect(failed).toEqual([{ name: "a.png", reason: "Recipes can have at most 5 photos" }]);
  });

  it("says the reason once, not once per photo", () => {
    const failed = [
      { name: "a.png", reason: "Recipes can have at most 5 photos" },
      { name: "b.png", reason: "Recipes can have at most 5 photos" },
    ];
    expect(describeFailedUploads(failed, "Recipe published, but")).toBe(
      "Recipe published, but 2 photos did not upload. Recipes can have at most 5 photos"
    );
  });

  it("counts one photo as a photo", () => {
    expect(describeFailedUploads([{ name: "a.png", reason: null }], "Changes saved, but")).toBe(
      "Changes saved, but 1 photo did not upload."
    );
  });

  it("gives every distinct reason when they differ", () => {
    const failed = [
      { name: "a.png", reason: "Image exceeds 8MB limit" },
      { name: "b.png", reason: "Media upload failed" },
    ];
    const message = describeFailedUploads(failed, "Changes saved, but");
    expect(message).toContain("Image exceeds 8MB limit");
    expect(message).toContain("Media upload failed");
  });

  it("falls back to the plain count when the server said nothing", async () => {
    // A request that never reached a server has no sentence to pass on,
    // and inventing one would be worse than the count on its own.
    const err = new Error("offline");
    err.kind = "network";
    vi.spyOn(API, "post").mockRejectedValue(err);
    const failed = await uploadRecipePhotos("r1", [photo("a.png"), photo("b.png")]);
    expect(describeFailedUploads(failed, "Recipe published, but")).toBe(
      "Recipe published, but 2 photos did not upload."
    );
  });
});
