import { describe, it, expect } from "vitest";
import { readFile, readdir } from "node:fs/promises";

// Lazy-loading is right for a grid of thumbnails and wrong for the image
// already filling the top of the screen: it takes that image out of the
// browser's preload scan, so the fetch cannot start until the layout has
// run. On a detail page that image is the largest paint, so the page's
// measured load time is exactly what suffers.

const readPage = (name) => readFile(new URL(`../src/pages/${name}`, import.meta.url), "utf8");

// Matches an <img ...> element, however it is wrapped across lines.
const imageTags = (source) => source.match(/<img[\s\S]*?\/>/g) ?? [];

const heroTag = (source) => {
  const heroAt = source.indexOf("detail-hero");
  if (heroAt === -1) return null;
  const from = source.slice(heroAt);
  const match = from.match(/<img[\s\S]*?\/>/);
  return match ? match[0] : null;
};

const HERO_PAGES = ["MealDetail.jsx", "DrinkDetail.jsx", "RandomMeal.jsx", "RecipeDetail.jsx"];

describe("the image at the top of a detail page", () => {
  it.each(HERO_PAGES)("%s fetches it eagerly, at high priority", async (name) => {
    const hero = heroTag(await readPage(name));
    expect(hero, `${name} has no image inside .detail-hero`).toBeTruthy();
    expect(hero).not.toMatch(/loading="lazy"/);
    expect(hero).toMatch(/fetchPriority="high"/);
  });
});

// The front page's largest paint is the featured recipe's photograph, so
// the same rule applies there: eager, high priority, and the only image on
// the page claiming it.
describe("the featured recipe on the front page", () => {
  it("is eager and high priority", async () => {
    const { readFile } = await import("node:fs/promises");
    const source = await readFile(
      new URL("../src/components/FeaturedRecipe.jsx", import.meta.url),
      "utf8"
    );
    const tags = imageTags(source);
    expect(tags.length).toBeGreaterThan(0);
    const hero = tags.find((tag) => /fetchPriority="high"/.test(tag));
    expect(hero, "no high-priority image in FeaturedRecipe").toBeTruthy();
    expect(hero).not.toMatch(/loading="lazy"/);
    expect(tags.filter((tag) => /fetchPriority="high"/.test(tag))).toHaveLength(1);
  });
});

describe("everything else", () => {
  // Only one image per page may claim high priority; naming several tells
  // the browser nothing, since the point is which one comes first.
  it("leaves high priority to the hero", async () => {
    for (const name of HERO_PAGES) {
      const source = await readPage(name);
      const prioritised = imageTags(source).filter((tag) => /fetchPriority="high"/.test(tag));
      expect(prioritised.length, `${name} prioritises ${prioritised.length} images`).toBe(1);
    }
  });

  it("is still lazy, including the embedded video players", async () => {
    const dir = new URL("../src/pages/", import.meta.url);
    let lazyElsewhere = 0;
    for (const name of await readdir(dir)) {
      if (!name.endsWith(".jsx")) continue;
      const source = await readFile(new URL(name, dir), "utf8");
      lazyElsewhere += (source.match(/loading="lazy"/g) ?? []).length;
    }
    // Guards the assertion above from passing because nothing is lazy any
    // more: the thumbnails, avatars and iframes still are.
    expect(lazyElsewhere).toBeGreaterThan(5);
  });
});
