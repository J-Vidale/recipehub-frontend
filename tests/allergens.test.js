import { describe, it, expect } from "vitest";
import * as allergensModule from "../src/lib/allergens";
import { detectAllergens } from "../src/lib/allergens";

const ids = (names) => detectAllergens(names).map((a) => a.id);

describe("the module's safety contract", () => {
  // If this test ever fails, someone has added a way to assert a dish is
  // free from an allergen. That is the one thing this module must not be
  // able to do: a missed match is not evidence of absence.
  it("exports detectAllergens and nothing else", () => {
    expect(Object.keys(allergensModule)).toEqual(["detectAllergens"]);
  });

  it("returns an empty list rather than a claim when nothing matches", () => {
    expect(detectAllergens(["Rhubarb", "Water"])).toEqual([]);
  });

  it("survives junk input without throwing", () => {
    expect(detectAllergens(null)).toEqual([]);
    expect(detectAllergens(undefined)).toEqual([]);
    expect(detectAllergens([])).toEqual([]);
    expect(detectAllergens(["", "   ", 42, null, {}])).toEqual([]);
  });

  it("names the ingredient behind every flag so the reader can check it", () => {
    const [milk] = detectAllergens(["Whole Milk", "Butter"]);
    expect(milk.id).toBe("milk");
    expect(milk.matchedBy).toEqual(["whole milk", "butter"]);
  });

  it("does not repeat an ingredient in matchedBy", () => {
    const [milk] = detectAllergens(["Butter", "Butter"]);
    expect(milk.matchedBy).toEqual(["butter"]);
  });
});

describe("detects the allergens it should", () => {
  it.each([
    [["Milk", "Flour", "Eggs"], ["milk", "gluten", "eggs"]],
    [["Prawns", "Soy Sauce"], ["crustaceans", "soya", "gluten"]],
    [["Almonds"], ["tree-nuts"]],
    [["Mussels", "White Wine"], ["molluscs", "sulphites"]],
    [["Tahini"], ["sesame"]],
    [["Dijon Mustard"], ["mustard"]],
    [["Celeriac"], ["celery"]],
    [["Anchovies"], ["fish"]],
    [["Tofu"], ["soya"]],
    [["Peanut Butter"], ["peanuts"]],
    [["Lupin Flour"], ["lupin"]],
  ])("flags %o as %o", (ingredients, expected) => {
    const found = ids(ingredients);
    for (const id of expected) expect(found).toContain(id);
  });
});

// These are the cases where naive substring matching goes wrong. Each one
// is a real ingredient that would be mislabelled by a simpler
// implementation, and getting them wrong is what makes the whole panel
// untrustworthy.
describe("does not raise the false positives that would make it useless", () => {
  it.each([
    ["Almond Milk", "milk", "a plant milk is not dairy"],
    ["Coconut Milk", "milk", "coconut milk is not dairy"],
    ["Peanut Butter", "milk", "peanut butter is not dairy"],
    ["Cocoa Butter", "milk", "cocoa butter is not dairy"],
    ["Peanut Butter", "tree-nuts", "a peanut is a legume, not a tree nut"],
    ["Coconut", "tree-nuts", "coconut is reported separately"],
    ["Nutmeg", "tree-nuts", "nutmeg is a spice"],
    ["Water Chestnuts", "tree-nuts", "a water chestnut is not a nut"],
    ["Aubergine", "eggs", "aubergine is a vegetable"],
    ["Eggplant", "eggs", "so is eggplant"],
  ])("%s is not flagged as %s (%s)", (ingredient, mustNotHave) => {
    expect(ids([ingredient])).not.toContain(mustNotHave);
  });
});

// A free-from label has to disqualify the whole ingredient. An earlier
// version stripped the phrase as a span, which left "flour" behind and
// flagged gluten-free flour as containing gluten.
describe("honours free-from labels", () => {
  it.each([
    ["Gluten-Free Flour", "gluten"],
    ["Gluten Free Pasta", "gluten"],
    ["Dairy-Free Milk", "milk"],
    ["Non-Dairy Cream", "milk"],
    ["Egg-Free Mayonnaise", "eggs"],
    ["Nut-Free Almond Essence", "tree-nuts"],
  ])("%s is not flagged as %s", (ingredient, mustNotHave) => {
    expect(ids([ingredient])).not.toContain(mustNotHave);
  });

  it("still flags an ordinary version of the same ingredient", () => {
    expect(ids(["Plain Flour"])).toContain("gluten");
    expect(ids(["Mayonnaise"])).toContain("eggs");
  });
});

// Buckwheat is not wheat, so the grain itself carries no gluten. Flour
// milled from it is a different question: commercial buckwheat flour is
// very often cut with wheat flour, and this module errs towards flagging
// when the honest answer is "check the bag". Over-flagging costs someone
// a recipe; under-flagging is the failure that matters.
describe("buckwheat", () => {
  it("does not flag the grain itself", () => {
    expect(ids(["Buckwheat"])).not.toContain("gluten");
    expect(ids(["Buckwheat Groats"])).not.toContain("gluten");
  });

  it("does flag flour milled from it, because blends are common", () => {
    expect(ids(["Buckwheat Flour"])).toContain("gluten");
  });
});

describe("coconut", () => {
  // US labelling counts coconut as a tree nut; EU labelling does not.
  // Reporting it under its own name states the fact without taking a side.
  it("is reported on its own rather than as a nut", () => {
    const found = ids(["Coconut Cream"]);
    expect(found).toContain("coconut");
    expect(found).not.toContain("tree-nuts");
  });
});
