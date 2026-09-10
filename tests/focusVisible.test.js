import { describe, it, expect, beforeAll } from "vitest";
import { readFile } from "node:fs/promises";

// A focus indicator has to be findable. WCAG 1.4.11 asks for 3:1 against
// the unfocused state, and a pixel sweep of 544 tab stops across 19 routes
// found two places that missed:
//
//   - .input:focus removed the outline and replaced it with a 3px ring in
//     --color-brand-light, which measures about 1.3:1 against the page.
//   - .recipe-card__link drew the standard 2px outline at +2px offset, but
//     .recipe-card sets overflow:hidden and the link fills it edge to edge,
//     so the outline landed exactly on the clipped edge. Tabbing through a
//     grid of cards showed nothing at all.
//
// These guard both, and the general rule behind them: taking the outline
// away on focus means putting something back.

let css;
beforeAll(async () => {
  css = await readFile(new URL("../src/index.css", import.meta.url), "utf8");
});

const withoutComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, "");

// [selector, body] for every rule in the sheet.
const rules = () => {
  const out = [];
  const text = withoutComments(css);
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(text))) out.push([m[1].trim(), m[2]]);
  return out;
};

const bodyOf = (selector) => {
  const found = rules().filter(([s]) => s === selector);
  expect(found.length, `${selector} rule is gone`).toBeGreaterThan(0);
  return found.map(([, b]) => b).join("\n");
};

describe("focus indicators", () => {
  it("give text fields an outline, not only the soft ring", () => {
    const body = bodyOf(".input:focus-visible");
    expect(body).toMatch(/outline:\s*2px\s+solid\s+var\(--color-brand\)/);
  });

  it("draw the recipe card link's outline inside the clipped corner", () => {
    const body = bodyOf(".recipe-card__link:focus-visible");
    expect(body).toMatch(/outline:\s*\d+px\s+solid/);
    const offset = body.match(/outline-offset:\s*(-?[\d.]+)px/);
    expect(offset, "no outline-offset, so overflow:hidden clips it again").not.toBeNull();
    expect(Number(offset[1])).toBeLessThan(0);
  });

  it("lift the card when focus lands on the link inside it", () => {
    const lift = rules().find(([s]) => s.includes(".card-hover:focus-within"));
    expect(lift, ":focus-within is gone, so the card ignores its own link").toBeTruthy();
  });

  it("never remove the outline without putting one back", () => {
    const stripped = [];
    for (const [selector, body] of rules()) {
      if (!/:focus/.test(selector)) continue;
      if (!/outline:\s*(none|0)\b/.test(body)) continue;
      // main:focus-visible is the skip link's landing target. It takes
      // focus programmatically and is not a control, so a ring around the
      // whole page would be noise rather than help.
      if (selector.startsWith("main")) continue;
      const base = selector.replace(/:focus(-visible)?/g, "");
      const restored = rules().some(([s, b]) =>
        s.includes(base) && /:focus/.test(s) && /outline:\s*\d/.test(b)
      );
      if (!restored) stripped.push(selector);
    }
    expect(stripped).toEqual([]);
  });
});
