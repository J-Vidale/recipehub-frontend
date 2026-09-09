import { describe, it, expect } from "vitest";
import { asArray, asCursor } from "../src/lib/apiShape";

describe("asArray", () => {
  it("passes an array through untouched", () => {
    const list = [1, 2, 3];
    expect(asArray(list)).toBe(list);
  });

  // The shapes an API actually returns when something is off: an older
  // deploy's response, an error body, a proxy's HTML.
  it.each([undefined, null, {}, "", "<!doctype html>", 0, { recipes: [] }])(
    "turns %o into an empty array",
    (value) => {
      expect(asArray(value)).toEqual([]);
    }
  );

  it("does not treat an array-like object as a list", () => {
    expect(asArray({ length: 2, 0: "a", 1: "b" })).toEqual([]);
  });
});

describe("asCursor", () => {
  it("keeps a real cursor", () => {
    expect(asCursor("64f1c0de00000000000000aa")).toBe("64f1c0de00000000000000aa");
  });

  // Anything else has to be falsy: it decides whether a "load more"
  // button is shown, and undefined would spread into the next query
  // string as the literal string "undefined".
  it.each([undefined, null, "", 0, {}, []])("turns %o into null", (value) => {
    expect(asCursor(value)).toBeNull();
  });
});

// A source scan, because the failure it guards against only shows up at
// runtime with an unusual response: `setThings(res.data.things)` renders
// fine every day and throws the one time the shape is off, replacing the
// page with the error boundary.
describe("no page reads a list straight out of a response", () => {
  const LIST_KEYS =
    "recipes|tags|notifications|messages|conversations|users|curated|community";

  it("wraps every list read in asArray", async () => {
    const { readdir, readFile } = await import("node:fs/promises");
    const dirs = ["src/pages", "src/components", "src/context"];
    const offences = [];

    for (const dir of dirs) {
      const url = new URL(`../${dir}/`, import.meta.url);
      for (const name of await readdir(url)) {
        if (!/\.jsx?$/.test(name)) continue;
        const source = await readFile(new URL(name, url), "utf8");
        source.split("\n").forEach((line, i) => {
          const pattern = new RegExp(`\\bdata\\??\\.(${LIST_KEYS})\\b`);
          if (!pattern.test(line)) return;
          if (/asArray\(/.test(line) || /Array\.isArray\(/.test(line)) return;
          offences.push(`${dir}/${name}:${i + 1}  ${line.trim()}`);
        });
      }
    }

    expect(offences, `unguarded list reads:\n${offences.join("\n")}`).toEqual([]);
  });
});
