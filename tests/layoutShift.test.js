import { describe, it, expect } from "vitest";
import { readFile, readdir } from "node:fs/promises";

// Cumulative Layout Shift measures how much the page moves under the
// reader after they can already see it. The recipe page measured 0.66,
// where 0.1 is good and 0.25 is poor. Two causes, both structural:
//
//   1. The footer sat directly under whatever had rendered so far, so a
//      route showing "Loading..." put it a third of the way down the page
//      and then shoved it hundreds of pixels when the content arrived.
//   2. Seven pages rendered their waiting state at full width and their
//      content at max-w-2xl or max-w-4xl. React reuses the same node, so
//      it resized from 1280 to 672 in place.
//
// Both are now 0.00 to 0.005 across every route measured.

const css = await readFile(new URL("../src/index.css", import.meta.url), "utf8");

const rule = (selector) => {
  const start = css.indexOf(`${selector} {`);
  expect(start, `${selector} rule is gone`).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf("}", start));
};

describe("the page shell", () => {
  it("pins the footer to the bottom of the viewport", () => {
    const block = rule("#root");
    expect(block).toMatch(/display:\s*flex/);
    expect(block).toMatch(/flex-direction:\s*column/);
    expect(block).toMatch(/min-height:\s*100vh/);
  });

  it("reserves a viewport of main, so a short page keeps the footer below the fold", () => {
    // The sticky footer alone is not enough: the footer is around 300px
    // tall, so on a short page it is still on screen and still moves.
    expect(rule("#root > main")).toMatch(/min-height:\s*calc\(100vh - [\d.]+rem\)/);
  });

  it("measures the viewport with vh, not dvh", () => {
    // dvh changes as a phone's address bar hides, which would trade this
    // shift for a new one on every scroll.
    expect(rule("#root")).not.toMatch(/dvh/);
    expect(rule("#root > main")).not.toMatch(/dvh/);
  });
});

describe("a page's waiting state", () => {
  it("is as wide as the content that replaces it", async () => {
    const dir = new URL("../src/pages/", import.meta.url).pathname;
    const offenders = [];
    for (const name of await readdir(dir)) {
      if (!name.endsWith(".jsx")) continue;
      const source = await readFile(dir + name, "utf8");
      const containers = [...source.matchAll(/className="page-container([^"]*)"/g)]
        .map((m) => m[1]);
      if (containers.length < 2) continue;
      const widthOf = (rest) => (rest.match(/\bmax-w-[\w[\]-]+/) || [null])[0];
      const widths = new Set(containers.map(widthOf));
      // One width for the page. A page with no max-width anywhere is
      // full-bleed by choice and consistent with itself.
      if (widths.size > 1) {
        offenders.push(`${name}: ${[...widths].map((w) => w || "(full width)").join(" vs ")}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("the hero's feature column", () => {
  it("is held open while the newest recipe is still on its way", async () => {
    const source = await readFile(new URL("../src/pages/Home.jsx", import.meta.url), "utf8");
    // Settled is not the same question as "is there anything to show":
    // without it the column collapses on first paint and the copy beside
    // it recentres when the card lands.
    expect(source).toMatch(/const \[settled, setSettled\] = useState\(false\)/);
    expect(source).toMatch(/\.finally\(/);
    expect(source).toMatch(/!settled &&/);
    expect(source).toMatch(/featured--pending/);
  });

  it("keeps the placeholder out of the accessibility tree", async () => {
    const source = await readFile(new URL("../src/pages/Home.jsx", import.meta.url), "utf8");
    const block = source.slice(source.indexOf("!settled &&"), source.indexOf("featured--pending"));
    expect(block).toMatch(/aria-hidden="true"/);
  });

  it("stands the placeholder's parts at the real card's measured heights", () => {
    // Measured, not guessed: the label's line box is 1.125rem and the meta
    // row is 1.75rem because an avatar sets its height, not the text. With
    // these the placeholder and the card are both 520px and the swap moves
    // nothing.
    expect(rule("  .skeleton-line--label")).toMatch(/height:\s*1\.125rem/);
    expect(rule("  .skeleton-line--meta")).toMatch(/height:\s*1\.75rem/);
  });
});
