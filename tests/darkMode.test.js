import { describe, it, expect, beforeAll } from "vitest";
import { readFile, readdir } from "node:fs/promises";

// Dark mode here is not a second stylesheet; it is the same tokens with
// different values. That only holds while two things stay true: every
// colour token has a dark value, and no component reaches past the tokens
// for a fixed colour. Both are easy to break by adding one rule, and
// neither breaks visibly in the mode you happen to be developing in.

let css;
beforeAll(async () => {
  css = await readFile(new URL("../src/index.css", import.meta.url), "utf8");
});

const blockOf = (source, opener) => {
  const start = source.indexOf(opener);
  if (start === -1) return "";
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, i);
    }
  }
  return "";
};

const tokensIn = (block) =>
  new Set([...block.matchAll(/^\s*(--color-[\w-]+)\s*:/gm)].map((m) => m[1]));

describe("the dark palette", () => {
  it("is declared, and follows the reader's system setting", () => {
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    // Without this, native controls and scrollbars stay light on a dark
    // page - the one part of the UI CSS variables cannot reach.
    expect(css).toMatch(/color-scheme:\s*light dark/);
  });

  it("gives every colour token a dark value", () => {
    const light = tokensIn(blockOf(css, ":root {"));
    const dark = tokensIn(blockOf(css, "@media (prefers-color-scheme: dark)"));

    expect(light.size).toBeGreaterThan(15);
    const missing = [...light].filter((token) => !dark.has(token));
    expect(missing, `no dark value for: ${missing.join(", ")}`).toEqual([]);
  });

  it("defines no dark token that does not exist in light", () => {
    const light = tokensIn(blockOf(css, ":root {"));
    const dark = tokensIn(blockOf(css, "@media (prefers-color-scheme: dark)"));
    const orphans = [...dark].filter((token) => !light.has(token));
    expect(orphans, `dark-only tokens: ${orphans.join(", ")}`).toEqual([]);
  });
});

describe("components do not reach past the tokens", () => {
  // Tailwind's palette classes are fixed values. text-gray-600 on a dark
  // ground is unreadable, and bg-white is a white rectangle in the middle
  // of a dark page.
  it("uses no fixed-colour utility class", async () => {
    const offences = [];
    const dirs = ["src/pages", "src/components", "src/context", "src/layout"];
    const pattern =
      /\b(?:bg|text|border|ring|divide|from|to|via)-(?:white|black|gray|slate|zinc|neutral|stone|green|red|amber|yellow|blue|emerald)(?:-\d{2,3})?\b/g;

    for (const dir of dirs) {
      const url = new URL(`../${dir}/`, import.meta.url);
      let names;
      try {
        names = await readdir(url);
      } catch {
        continue;
      }
      for (const name of names) {
        if (!/\.jsx?$/.test(name)) continue;
        const source = await readFile(new URL(name, url), "utf8");
        for (const match of source.matchAll(pattern)) {
          const line = source.slice(0, match.index).split("\n").length;
          offences.push(`${dir}/${name}:${line}  ${match[0]}`);
        }
      }
    }

    expect(offences, `fixed colours in markup:\n${offences.join("\n")}`).toEqual([]);
  });

  // A handful of places sit on a ground that does not flip: a scrim over a
  // photograph, a saturated cuisine tile. Those keep a literal white, and
  // each says so in a comment, so the count is allowed to be small but not
  // to grow quietly.
  it("keeps fixed colours in the stylesheet to the documented few", () => {
    const literals = css
      .split("\n")
      .filter((line) => /#[0-9a-fA-F]{3,6}\b/.test(line))
      .filter((line) => !/--(color|gradient|shadow)/.test(line))
      .filter((line) => !line.trim().startsWith("/*") && !line.trim().startsWith("*"));

    expect(literals.length, `undocumented literals:\n${literals.join("\n")}`).toBeLessThanOrEqual(4);
    for (const line of literals) {
      expect(line, `literal without a reason: ${line.trim()}`).toMatch(/\/\*|#000/);
    }
  });
});
