import { describe, it, expect, beforeAll } from "vitest";
import { readFile } from "node:fs/promises";

// The skip link is reached only by keyboard, it is the first tab stop on
// every page, and its entire purpose is to save a keyboard user the walk
// through the navigation. Animating it into view spends the thing it
// exists to give back - so it appears at once, and there is nothing here
// for prefers-reduced-motion to turn off.

let css;
beforeAll(async () => {
  css = await readFile(new URL("../src/index.css", import.meta.url), "utf8");
});

// Comments stripped: the rule below explains in prose why there is no
// transition here, and a naive search for the word finds that instead of a
// declaration.
const withoutComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, "");

const skipLinkBlock = () => {
  const start = css.indexOf("  .skip-link {");
  expect(start, ".skip-link rule is gone").toBeGreaterThan(-1);
  return withoutComments(css.slice(start, css.indexOf("}", start)));
};

describe("the skip link", () => {
  it("does not animate", () => {
    expect(skipLinkBlock()).not.toMatch(/transition:/);
    // Nor anywhere else: a later rule could put one back.
    const anySkipTransition = [...withoutComments(css).matchAll(/\.skip-link[^{]*\{[^}]*\}/g)]
      .filter((m) => /transition:/.test(m[0]));
    expect(anySkipTransition.map((m) => m[0])).toEqual([]);
  });

  it("stays focusable when it is off screen", () => {
    const block = skipLinkBlock();
    // display:none and visibility:hidden both take it out of the tab
    // order, which would remove the only way to use it.
    expect(block).not.toMatch(/display:\s*none/);
    expect(block).not.toMatch(/visibility:\s*hidden/);
    expect(block).toMatch(/position:\s*absolute/);
  });

  it("is rendered on every page, not per route", async () => {
    const layout = await readFile(new URL("../src/layout/MainLayout.jsx", import.meta.url), "utf8").catch(() => "");
    const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
    expect(`${layout}${app}`).toMatch(/skip-link/);
  });
});
