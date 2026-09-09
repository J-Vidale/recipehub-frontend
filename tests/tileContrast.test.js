import { describe, it, expect, beforeAll } from "vitest";
import { readFile } from "node:fs/promises";

// The scrim under a tile's label is doing a legibility job, not a
// decorative one, and it only works if it paints over the highlight rather
// than under it. Both facts are invisible in a diff, and neither is caught
// by anything else: removing the scrim leaves a page that still looks fine
// at this tile size.

let css;
beforeAll(async () => {
  css = await readFile(new URL("../src/index.css", import.meta.url), "utf8");
});

const tileOverlay = () => {
  const at = css.indexOf(".tile::after");
  expect(at, ".tile::after is gone").toBeGreaterThan(-1);
  return css.slice(at, css.indexOf("}", at));
};

describe("the tile label's backdrop", () => {
  it("darkens the foot of the tile", () => {
    const overlay = tileOverlay();
    expect(overlay).toMatch(/linear-gradient\(\s*to top/);
    expect(overlay).toMatch(/rgb\(0 0 0 \/ 0\.45\)/);
  });

  // The first background layer paints on top. With the order reversed the
  // white highlight would sit over the scrim and lift the label's
  // background back towards the colour the scrim exists to darken.
  it("paints over the highlight, not under it", () => {
    const overlay = tileOverlay();
    const scrimAt = overlay.indexOf("linear-gradient");
    const highlightAt = overlay.indexOf("radial-gradient");
    expect(scrimAt).toBeGreaterThan(-1);
    expect(highlightAt).toBeGreaterThan(-1);
    expect(scrimAt).toBeLessThan(highlightAt);
  });

  it("stays behind the label rather than over it", () => {
    const label = css.slice(css.indexOf(".tile__label"), css.indexOf("}", css.indexOf(".tile__label")));
    expect(label).toMatch(/z-index:\s*1/);
    expect(label).toMatch(/position:\s*relative/);
  });
});
