import { describe, it, expect } from "vitest";
import { externalUrl } from "../src/lib/externalUrl";
import { youtubeEmbedUrl } from "../src/utils/mealdb";

// These addresses arrive from TheMealDB and TheCocktailDB and go straight
// into an href. React 19 blocks javascript: URLs and browsers refuse a
// top-level navigation to a data: one, so there is no live hole today -
// but both are somebody else's decision, made elsewhere, and neither is a
// rule this app states for itself.

describe("externalUrl", () => {
  it.each([
    "https://www.youtube.com/watch?v=abc123",
    "http://example.com/recipe",
    "https://example.co.uk/a/b?c=d#e",
  ])("passes %s through", (url) => {
    expect(externalUrl(url)).toBe(new URL(url).href);
  });

  it("tolerates surrounding whitespace", () => {
    expect(externalUrl("  https://example.com  ")).toBe("https://example.com/");
  });

  it.each([
    ["a script URL", "javascript:alert(1)"],
    ["an uppercased one", "JavaScript:alert(1)"],
    ["one with padding", "  javascript:alert(1)  "],
    ["an inline document", "data:text/html,<script>alert(1)</script>"],
    ["a file path", "file:///etc/passwd"],
    ["another scheme entirely", "vbscript:msgbox(1)"],
  ])("refuses %s", (_label, url) => {
    expect(externalUrl(url)).toBeNull();
  });

  // Relative addresses would resolve against this site, which is not what
  // a "recipe source" from a third party can possibly mean.
  it.each(["/somewhere", "somewhere", "//evil.example.com", ""])(
    "refuses the non-absolute %o",
    (url) => {
      expect(externalUrl(url)).toBeNull();
    }
  );

  it.each([undefined, null, 42, {}, ["https://example.com"]])(
    "refuses %o rather than throwing",
    (value) => {
      expect(externalUrl(value)).toBeNull();
    }
  );
});

describe("youtubeEmbedUrl", () => {
  it("builds the player URL from a watch URL", () => {
    expect(youtubeEmbedUrl("https://www.youtube.com/watch?v=1IszT_guI08")).toBe(
      "https://www.youtube.com/embed/1IszT_guI08"
    );
  });

  it("takes the id from anywhere in the query", () => {
    expect(youtubeEmbedUrl("https://www.youtube.com/watch?t=30&v=1IszT_guI08&x=1")).toBe(
      "https://www.youtube.com/embed/1IszT_guI08"
    );
  });

  // The id used to be "anything up to the next &", which would carry a
  // slash, a quote or a space out of a third party's response and into a
  // src attribute.
  it.each([
    ["a path escape", "https://www.youtube.com/watch?v=../../evil"],
    ["a quote", 'https://www.youtube.com/watch?v=a"onerror="alert(1)'],
    ["a space", "https://www.youtube.com/watch?v=abc def"],
    ["an empty id", "https://www.youtube.com/watch?v="],
  ])("refuses %s", (_label, url) => {
    expect(youtubeEmbedUrl(url)).toBeNull();
  });

  it.each([undefined, null, "", "https://vimeo.com/12345", 42])(
    "returns null for %o",
    (value) => {
      expect(youtubeEmbedUrl(value)).toBeNull();
    }
  );
});

// The point of the helper is that it is used, not that it exists.
describe("the pages that render a third party's address", () => {
  it.each([
    ["src/pages/MealDetail.jsx", "strYoutube"],
    ["src/pages/RandomMeal.jsx", "strSource"],
  ])("%s guards %s", async (file, field) => {
    const { readFile } = await import("node:fs/promises");
    const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    expect(source).toContain("externalUrl");
    // The raw field never reaches an href.
    expect(source).not.toMatch(new RegExp(`href=\\{meal\\.${field}\\}`));
  });
});
