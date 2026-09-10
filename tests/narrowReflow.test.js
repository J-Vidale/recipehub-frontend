import { describe, it, expect } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

// A flex child defaults to min-width:auto, which means it refuses to
// shrink below its content. One long unbroken word - a 30-character
// username, which validateUsername allows, or an email address - then
// pushes the whole row past its container. At 320px, the width WCAG 1.4.10
// reflow is measured at, four places broke this way and the overflow was
// clipped rather than scrollable, so the text was simply gone.
//
// The fix is min-w-0 on the flex child so it can give way, plus
// break-words on the text so it has somewhere to break. This guards the
// pattern: a div that grows or fills inside a flex row needs min-w-0.

const jsxFiles = async () => {
  const root = new URL("../src/", import.meta.url).pathname;
  const found = [];
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.name.endsWith(".jsx")) found.push(path);
    }
  };
  await walk(root);
  return found;
};

// Buttons and links sized to share a row are a different case: their
// content is a short label the author controls, and min-w-0 would let it
// squash. Only containers holding text from the database are at issue.
const isControl = (className) => /\bbtn-|\binput\b/.test(className);

describe("flex children that hold user text", () => {
  it("can shrink below their content", async () => {
    const offenders = [];
    for (const file of await jsxFiles()) {
      const source = await readFile(file, "utf8");
      for (const match of source.matchAll(/<div className="([^"]*)"/g)) {
        const className = match[1];
        if (!/(^|\s)flex-1(\s|$)/.test(className)) continue;
        if (isControl(className)) continue;
        if (/\bmin-w-0\b/.test(className)) continue;
        offenders.push(`${file.split("/src/")[1]}: <div className="${className}">`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("the places a long username broke the layout", () => {
  const cases = [
    ["pages/UserProfile.jsx", /className="flex items-center gap-4 min-w-0"/],
    ["pages/UserProfile.jsx", /flex flex-wrap gap-x-4 gap-y-1/],
    ["pages/Profile.jsx", /content-title mb-1 break-words/],
    ["pages/RecipeDetail.jsx", /by \{recipe\.user\.username\}/],
    ["components/CommentSection.jsx", /className="break-words"/],
  ];

  it.each(cases)("keep their fix: %s", async (file, pattern) => {
    const source = await readFile(new URL(`../src/${file}`, import.meta.url), "utf8");
    expect(source).toMatch(pattern);
  });

  it("lets the featured byline break rather than overflow", async () => {
    const css = await readFile(new URL("../src/index.css", import.meta.url), "utf8");
    const start = css.indexOf("  .featured__author,");
    expect(start).toBeGreaterThan(-1);
    const block = css.slice(start, css.indexOf("}", start));
    expect(block).toMatch(/min-width:\s*0/);
    expect(css).toMatch(/\.featured__author[^{]*\{[^}]*overflow-wrap:\s*anywhere/s);
  });
});

// Text people type can carry a token with no break opportunity in it: a
// long word, an unspaced URL, a run of characters typed to be annoying.
// Left alone it pushes its container wide and the pane scrolls sideways.
// At 320px an 84-character word made the message card 738px, the category
// badge a 605px pill inside a 270px card, and the nutrition table 1473px.
describe("text with nowhere to break", () => {
  it("wraps inside a message bubble", async () => {
    const source = await readFile(new URL("../src/pages/ConversationView.jsx", import.meta.url), "utf8");
    expect(source).toMatch(/max-w-\[75%\][^`]*break-words/);
  });

  it("truncates the category badge rather than widening the card", async () => {
    const css = await readFile(new URL("../src/index.css", import.meta.url), "utf8");
    const start = css.indexOf("  .recipe-card__badge {");
    expect(start).toBeGreaterThan(-1);
    const block = css.slice(start, css.indexOf("}", start));
    expect(block).toMatch(/max-width:/);
    expect(block).toMatch(/text-overflow:\s*ellipsis/);
  });

  it("wraps a cuisine or ingredient tile label", async () => {
    const css = await readFile(new URL("../src/index.css", import.meta.url), "utf8");
    const start = css.indexOf("  .tile__label {");
    expect(start).toBeGreaterThan(-1);
    expect(css.slice(start, css.indexOf("}", start))).toMatch(/overflow-wrap:\s*anywhere/);
  });

  it("wraps a nutrition table cell", async () => {
    const css = await readFile(new URL("../src/index.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.nutrition__table th,\s*\n\s*\.nutrition__table td \{[^}]*overflow-wrap:\s*anywhere/);
  });
});
