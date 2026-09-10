import { describe, it, expect, beforeAll } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

// WCAG 2.5.8 asks for 24x24 CSS px of target on a touch screen. Controls
// drawn as small text - Reply, Report, Pin, Delete, the comment like count -
// render around 16px tall, which is a miss on a phone. They carry the
// .tap-target class, which pads them vertically without changing the type
// size. Links sitting inside a sentence are exempt under the same rule and
// are deliberately left alone.

const MIN_TARGET_PX = 24;

let css;
beforeAll(async () => {
  css = await readFile(new URL("../src/index.css", import.meta.url), "utf8");
});

const rule = (selector) => {
  const start = css.indexOf(`  ${selector} {`);
  expect(start, `${selector} rule is gone`).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf("}", start));
};

/**
 * Read a JSX opening tag's attributes without stopping at the first ">".
 * An arrow handler such as onClick={() => setOpen(!open)} contains one, and
 * a regex that ends there truncates the attribute list and misreports a
 * padded control as unpadded.
 */
const openingTag = (source, tagStart) => {
  let depth = 0;
  let quote = null;
  for (let i = tagStart; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; continue; }
    if (ch === "{") { depth += 1; continue; }
    if (ch === "}") { depth -= 1; continue; }
    if (ch === ">" && depth === 0) return source.slice(tagStart, i + 1);
  }
  return source.slice(tagStart);
};

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

describe("the tap-target utility", () => {
  it(`reserves at least ${MIN_TARGET_PX}px of height`, () => {
    expect(rule(".tap-target")).toMatch(new RegExp(`min-height:\\s*${MIN_TARGET_PX}px`));
  });

  it("pads without inflating the type size", () => {
    expect(rule(".tap-target")).not.toMatch(/font-size:/);
  });
});

describe("controls that render as small text", () => {
  it("carry .tap-target so a finger can land on them", async () => {
    const offenders = [];
    for (const file of await jsxFiles()) {
      const source = await readFile(file, "utf8");
      let index = source.indexOf("<button");
      while (index !== -1) {
        const tag = openingTag(source, index);
        // Only the text-sized controls. Anything using .btn* already has
        // its own padding, and icon buttons are sized explicitly.
        if (/className=/.test(tag) && /\btext-xs\b/.test(tag) && !/\btap-target\b/.test(tag)) {
          offenders.push(`${file.split("/src/")[1]}: ${tag.replace(/\s+/g, " ").slice(0, 90)}`);
        }
        index = source.indexOf("<button", index + 1);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("standalone links in navigation", () => {
  it("give breadcrumb crumbs a full target", () => {
    expect(rule(".breadcrumbs a")).toMatch(new RegExp(`min-height:\\s*${MIN_TARGET_PX}px`));
  });

  it("give footer nav links a full target", () => {
    expect(rule(".site-footer nav ul a")).toMatch(new RegExp(`min-height:\\s*${MIN_TARGET_PX}px`));
  });

  it("give the section heading link a full target", () => {
    expect(rule(".section-heading__link")).toMatch(new RegExp(`min-height:\\s*${MIN_TARGET_PX}px`));
  });
});
