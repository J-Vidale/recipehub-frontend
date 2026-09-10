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

// One scan, structural rather than a list of known key names.
//
// There used to be a second test here that looked for data.recipes,
// data.tags and friends. It missed setComments(res.data) - the API
// returns a bare array there, so the assignment named no key - and this
// scan catches that case by construction, so keeping both meant two
// descriptions of one rule, one of them weaker.
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
            // Through any normaliser, not asArray specifically. A named
            // one that does more - dropping entries whose shape this
            // component cannot render, say - satisfies the rule more
            // strongly, and the rule is about the response never arriving
            // unexamined, not about one function's name.
            if (!/^\s*(res\.data|data)\b/.test(arg)) continue;
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
