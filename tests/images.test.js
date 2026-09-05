import { describe, it, expect } from "vitest";
import {
  cloudinaryImage,
  recipeCardImage,
  recipeHeroImage,
  recipeThumbImage,
  avatarImage,
} from "../src/lib/images";

const CLOUDINARY = "https://res.cloudinary.com/demo/image/upload/v1712/photo.jpg";

describe("cloudinaryImage", () => {
  it("injects format and quality negotiation", () => {
    expect(cloudinaryImage(CLOUDINARY, { width: 600 })).toContain("/upload/f_auto,q_auto,w_600,c_limit/");
  });

  it("caps width without upscaling when only a width is given", () => {
    expect(cloudinaryImage(CLOUDINARY, { width: 600 })).toContain("c_limit");
  });

  it("crops when given both dimensions", () => {
    const url = cloudinaryImage(CLOUDINARY, { width: 96, height: 96 });
    expect(url).toContain("w_96");
    expect(url).toContain("h_96");
    expect(url).toContain("c_fill");
    expect(url).not.toContain("c_limit");
  });

  it("leaves non-Cloudinary URLs alone", () => {
    const external = "https://www.themealdb.com/images/media/meals/x.jpg";
    expect(cloudinaryImage(external, { width: 600 })).toBe(external);
  });

  it("does not stack a second transformation onto a URL that has one", () => {
    // Applying a transform on top of an existing one compounds them rather
    // than replacing, which produces the wrong image.
    const already = "https://res.cloudinary.com/demo/image/upload/w_300,c_fill/v1/photo.jpg";
    expect(cloudinaryImage(already, { width: 600 })).toBe(already);
  });

  it("returns non-string input unchanged rather than throwing", () => {
    expect(cloudinaryImage(null, { width: 600 })).toBeNull();
    expect(cloudinaryImage(undefined, { width: 600 })).toBeUndefined();
  });

  it("handles a Cloudinary URL with no upload marker", () => {
    const odd = "https://res.cloudinary.com/demo/raw/fetch/photo.jpg";
    expect(cloudinaryImage(odd, { width: 600 })).toBe(odd);
  });
});

describe("the named sizes match where each image is rendered", () => {
  it.each([
    [recipeCardImage, "w_600"],
    [recipeHeroImage, "w_1200"],
    [recipeThumbImage, "w_160"],
  ])("%o applies %s", (fn, expected) => {
    expect(fn(CLOUDINARY)).toContain(expected);
  });

  it("takes an avatar size, defaulting to 96", () => {
    expect(avatarImage(CLOUDINARY)).toContain("w_96");
    expect(avatarImage(CLOUDINARY, 56)).toContain("w_56");
  });
});
