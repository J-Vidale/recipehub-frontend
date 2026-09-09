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

// A structural scan rather than a list of known key names.
//
// The first version of this test looked for `data.recipes`, `data.tags`
// and friends, which missed `setComments(res.data)` on the recipe page -
// the API returns a bare array there, so the assignment names no key at
// all. That one crashed the whole recipe page, comments and method and
// ingredients with it, whenever the response was not an array.
//
// The rule this checks instead: if a piece of state is declared as a
// list, everything assigned to it has to be one.
describe("state declared as a list is only ever assigned a list", () => {
  it("wraps every assignment in asArray", async () => {
    const { readdir, readFile } = await import("node:fs/promises");
    const offences = [];

    for (const dir of ["src/pages", "src/components", "src/context"]) {
      const url = new URL(`../${dir}/`, import.meta.url);
      for (const name of await readdir(url)) {
        if (!/\.jsx?$/.test(name)) continue;
        const source = await readFile(new URL(name, url), "utf8");

        // const [things, setThings] = useState([])
        const setters = [...source.matchAll(/const \[\s*\w+\s*,\s*(set\w+)\s*\]\s*=\s*useState\(\s*\[\s*\]\s*\)/g)]
          .map((m) => m[1]);

        for (const setter of setters) {
          const calls = [...source.matchAll(new RegExp(`${setter}\\(([^\n]*)`, "g"))];
          for (const call of calls) {
            const arg = call[1];
            if (arg.includes("asArray(")) continue;
            if (/^\s*\(/.test(arg) || arg.startsWith("prev")) continue; // functional update
            if (/^\s*\[\s*\]/.test(arg)) continue; // reset to empty
            // Only response bodies. A value built locally, or returned by
            // a helper that guarantees its own shape, is not this rule's
            // business.
            if (!/\bres\.data\b|\bdata\./.test(arg)) continue;
            const line = source.slice(0, call.index).split("\n").length;
            offences.push(`${dir}/${name}:${line}  ${setter}(${arg.trim()}`);
          }
        }
      }
    }

    expect(offences, `unguarded list assignments:\n${offences.join("\n")}`).toEqual([]);
  });
});

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
