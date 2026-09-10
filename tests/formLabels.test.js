import { describe, it, expect } from "vitest";
import { readdir, readFile } from "node:fs/promises";

// A placeholder is not a label. It disappears the moment anything is
// typed, so a half-filled form stops saying what its fields are, and it is
// not reliably announced as the field's name.
//
// Checked in the source rather than the browser because it is a rule about
// how a field is written, and a browser check only covers the pages a
// crawler happens to reach with the data it happens to have.

// These own their labelling: Field renders a <label htmlFor>, and the
// category combobox renders its own.
const OWNS_ITS_LABEL = new Set(["Field.jsx", "CategoryAutocomplete.jsx"]);

// Brace-aware, because an arrow function in an onChange contains a ">"
// and a naive non-greedy match ends the element there - which silently
// truncated the attributes before reaching aria-label and reported fields
// that were in fact labelled.
const controls = (source) => {
  const found = [];
  const opener = /<(input|textarea)\b/g;
  let m;
  while ((m = opener.exec(source))) {
    let depth = 0;
    let i = m.index + m[0].length;
    for (; i < source.length; i += 1) {
      const c = source[i];
      if (c === "{") depth += 1;
      else if (c === "}") depth -= 1;
      else if (c === ">" && depth === 0) break;
    }
    found.push({
      tag: m[1],
      attrs: source.slice(m.index + m[0].length, i),
      index: m.index,
    });
  }
  return found;
};

describe("every field in the markup carries its own name", () => {
  it("has aria-label, an id a label points at, or comes from Field", async () => {
    const offences = [];

    for (const dir of ["src/pages", "src/components", "src/layout"]) {
      const url = new URL(`../${dir}/`, import.meta.url);
      let names;
      try {
        names = await readdir(url);
      } catch {
        continue;
      }
      for (const name of names) {
        if (!/\.jsx$/.test(name)) continue;
        if (OWNS_ITS_LABEL.has(name)) continue;
        const source = await readFile(new URL(name, url), "utf8");

        for (const control of controls(source)) {
          const { attrs } = control;
          if (/type=["']hidden["']/.test(attrs)) continue;
          if (/type=["']file["']/.test(attrs) && /aria-label|id=/.test(attrs)) continue;
          if (/aria-label|aria-labelledby|\bid=/.test(attrs)) continue;
          const line = source.slice(0, control.index).split("\n").length;
          const hint = (attrs.match(/placeholder=["']([^"']+)/) || [])[1] || attrs.trim().slice(0, 40);
          offences.push(`${dir}/${name}:${line}  <${control.tag}> ${hint}`);
        }
      }
    }

    expect(offences, `fields with no accessible name:\n${offences.join("\n")}`).toEqual([]);
  });

  // Guards the scan itself: if the regex stopped matching anything, the
  // test above would pass on an empty set and prove nothing.
  it("actually finds the fields it is checking", async () => {
    const source = await readFile(
      new URL("../src/components/IngredientFields.jsx", import.meta.url),
      "utf8"
    );
    expect(controls(source).length).toBeGreaterThanOrEqual(2);
  });
});
