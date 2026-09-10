import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import * as limits from "../src/lib/recipeLimits";

// The API rejects an over-long title, instruction body, category or
// ingredient, and the form now stops someone at the point they are typing
// rather than after they press Publish and lose the round trip. That only
// works while the two agree, so this reads the backend's own constants
// rather than restating them.

const backend = async (file) =>
  readFile(new URL(`../../recipehub-backend/${file}`, import.meta.url), "utf8").catch(() => null);

const constantIn = (source, name) => {
  const match = source.match(new RegExp(`${name}\\s*=\\s*(\\d+)`));
  return match ? Number(match[1]) : null;
};

describe("the form's limits", () => {
  it.each([
    ["MAX_TITLE_LENGTH", "controllers/recipeController.js"],
    ["MAX_INSTRUCTIONS_LENGTH", "controllers/recipeController.js"],
    ["MAX_INGREDIENT_FIELD_LENGTH", "controllers/recipeController.js"],
    ["MAX_INGREDIENTS", "controllers/recipeController.js"],
    ["MAX_CATEGORY_LENGTH", "utils/moderateText.js"],
  ])("match the API's %s", async (name, file) => {
    const source = await backend(file);
    // The backend is a sibling checkout, not a dependency. When it is not
    // there (CI builds the frontend alone) there is nothing to compare to.
    if (source === null) return;
    const theirs = constantIn(source, name);
    expect(theirs, `${name} is not declared in ${file}`).not.toBeNull();
    expect(limits[name]).toBe(theirs);
  });
});

describe("the recipe form", () => {
  it.each([
    ["CreateRecipe.jsx", "MAX_TITLE_LENGTH"],
    ["CreateRecipe.jsx", "MAX_INSTRUCTIONS_LENGTH"],
    ["EditRecipe.jsx", "MAX_TITLE_LENGTH"],
    ["EditRecipe.jsx", "MAX_INSTRUCTIONS_LENGTH"],
  ])("caps its fields: %s / %s", async (file, name) => {
    const source = await readFile(new URL(`../src/pages/${file}`, import.meta.url), "utf8");
    expect(source).toMatch(new RegExp(`maxLength=\\{${name}\\}`));
  });

  it("caps ingredient names and amounts", async () => {
    const source = await readFile(new URL("../src/components/IngredientFields.jsx", import.meta.url), "utf8");
    expect([...source.matchAll(/maxLength=\{MAX_INGREDIENT_FIELD_LENGTH\}/g)]).toHaveLength(2);
  });

  it("stops adding rows at the ceiling rather than letting the save fail", async () => {
    const source = await readFile(new URL("../src/components/IngredientFields.jsx", import.meta.url), "utf8");
    expect(source).toMatch(/ingredients\.length >= MAX_INGREDIENTS/);
    expect(source).toMatch(/disabled=\{atLimit\}/);
    // Disabling the button alone is not enough: a stale render or a
    // programmatic call would still push a row past the limit.
    expect(source).toMatch(/if \(atLimit\) return;/);
  });
});
