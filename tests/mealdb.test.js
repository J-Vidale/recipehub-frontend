// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { clearCache } from "../src/lib/apiCache";
import {
  fetchCuisines,
  fetchIngredients,
  fetchMealsByArea,
  fetchMealCategories,
  ingredientImage,
  extractIngredients,
  youtubeEmbedUrl,
} from "../src/utils/mealdb";

beforeEach(() => {
  clearCache();
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const respond = (body, { ok = true, status = 200 } = {}) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok,
    status,
    json: async () => body,
  });

describe("an upstream failure is surfaced, not flattened", () => {
  // A 5xx used to become an empty list, indistinguishable from "no
  // results" - and then the cache held that empty list for a day.
  it.each([500, 502, 503, 429, 404])("rejects on HTTP %i", async (status) => {
    respond({}, { ok: false, status });
    await expect(fetchCuisines()).rejects.toThrow(String(status));
  });

  it("caches nothing after a failure", async () => {
    respond({}, { ok: false, status: 503 });
    await expect(fetchIngredients()).rejects.toThrow();
    expect(window.sessionStorage.getItem("recipehub:cache:ingredients")).toBeNull();
  });

  it("recovers on the next attempt", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ meals: [{ strArea: "Italian" }] }),
      });

    await expect(fetchCuisines()).rejects.toThrow();
    await expect(fetchCuisines()).resolves.toEqual(["Italian"]);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe("an empty answer is still a valid answer", () => {
  // {"meals": null} with a 200 is how both APIs say "nothing matched".
  it("returns an empty list rather than throwing", async () => {
    respond({ meals: null });
    await expect(fetchMealsByArea("Atlantis")).resolves.toEqual([]);
  });

  it("and caches it, because it is a real result", async () => {
    const spy = respond({ meals: null });
    await fetchMealsByArea("Atlantis");
    await fetchMealsByArea("Atlantis");
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("parsing", () => {
  it("drops the Unknown area, which means no recorded cuisine", async () => {
    respond({ meals: [{ strArea: "Italian" }, { strArea: "Unknown" }, { strArea: "Thai" }] });
    await expect(fetchCuisines()).resolves.toEqual(["Italian", "Thai"]);
  });

  it("sorts ingredients alphabetically", async () => {
    respond({
      meals: [
        { strIngredient: "Salmon", strDescription: "" },
        { strIngredient: "Aubergine", strDescription: "" },
      ],
    });
    const list = await fetchIngredients();
    expect(list.map((i) => i.name)).toEqual(["Aubergine", "Salmon"]);
  });

  it("returns categories, or an empty list when there are none", async () => {
    respond({ categories: [{ strCategory: "Beef" }] });
    await expect(fetchMealCategories()).resolves.toHaveLength(1);
    clearCache();
    respond({});
    await expect(fetchMealCategories()).resolves.toEqual([]);
  });
});

describe("helpers", () => {
  it("builds an ingredient image URL and escapes the name", () => {
    expect(ingredientImage("Olive Oil")).toContain("Olive%20Oil-Small.png");
    expect(ingredientImage("Olive Oil", false)).toContain("Olive%20Oil.png");
  });

  it("collects the flattened ingredient and measure pairs", () => {
    const item = {
      strIngredient1: "Flour", strMeasure1: "200g",
      strIngredient2: "  ", strMeasure2: "",
      strIngredient3: "Butter", strMeasure3: " 50g ",
    };
    expect(extractIngredients(item)).toEqual([
      { ingredient: "Flour", measure: "200g" },
      { ingredient: "Butter", measure: "50g" },
    ]);
  });

  it("converts a watch URL to an embed URL", () => {
    expect(youtubeEmbedUrl("https://www.youtube.com/watch?v=abc123")).toBe(
      "https://www.youtube.com/embed/abc123"
    );
    expect(youtubeEmbedUrl("https://youtu.be/abc123")).toBeNull();
    expect(youtubeEmbedUrl("")).toBeNull();
    expect(youtubeEmbedUrl(null)).toBeNull();
  });
});
