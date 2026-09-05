import { describe, it, expect } from "vitest";
import { nutritionFor, estimateNutrition } from "../src/lib/nutrition";

describe("nutritionFor", () => {
  it("matches an exact name", () => {
    expect(nutritionFor("chicken breast")[0]).toBe(165);
  });

  it("is case and whitespace insensitive", () => {
    expect(nutritionFor("  Chicken Breast  ")[0]).toBe(165);
  });

  it("prefers the longest matching name over a broader one", () => {
    // "boneless chicken breast" contains both "chicken" and "chicken
    // breast"; the more specific entry has to win or every cut of chicken
    // collapses into one number.
    expect(nutritionFor("boneless chicken breast")[0]).toBe(165);
    expect(nutritionFor("chicken thighs")[3]).toBe(10.9);
  });

  it("returns null for an ingredient it does not know", () => {
    expect(nutritionFor("unlisted exotic fruit")).toBeNull();
    expect(nutritionFor("")).toBeNull();
    expect(nutritionFor(null)).toBeNull();
  });
});

describe("estimateNutrition", () => {
  const items = [
    { name: "chicken breast", grams: 400 },
    { name: "olive oil", grams: 27 },
    { name: "onion", grams: null },       // known food, no usable weight
    { name: "smoked paprika", grams: 5 }, // weight, but not in the table
  ];

  it("adds up only the ingredients it can fully account for", () => {
    const result = estimateNutrition(items);
    expect(result.counted).toEqual(["chicken breast", "olive oil"]);
    expect(result.missing).toHaveLength(2);
  });

  it("scales per-100g values by the actual weight", () => {
    const result = estimateNutrition(items);
    // 400g chicken breast at 31g protein/100g = 124g.
    expect(result.totals.protein).toBeCloseTo(124, 1);
    expect(result.totals.kcal).toBeCloseTo(899, 0);
  });

  it("reports coverage rather than presenting a partial sum as complete", () => {
    expect(estimateNutrition(items).coverage).toBeCloseTo(0.5, 5);
  });

  it("distinguishes an unknown food from a known food with no weight", () => {
    const { missing } = estimateNutrition(items);
    expect(missing.find((m) => m.name === "onion").reason).toBe("no weight");
    expect(missing.find((m) => m.name === "smoked paprika").reason).toBe("not in table");
  });

  it("returns zero coverage for an empty list without dividing by zero", () => {
    const result = estimateNutrition([]);
    expect(result.coverage).toBe(0);
    expect(result.totals.kcal).toBe(0);
    expect(Number.isNaN(result.coverage)).toBe(false);
  });

  it("handles a missing argument", () => {
    expect(() => estimateNutrition(undefined)).not.toThrow();
    expect(estimateNutrition(undefined).coverage).toBe(0);
  });

  it("ignores non-finite weights instead of producing NaN totals", () => {
    const result = estimateNutrition([
      { name: "chicken breast", grams: Infinity },
      { name: "olive oil", grams: NaN },
    ]);
    expect(result.counted).toEqual([]);
    expect(Number.isNaN(result.totals.kcal)).toBe(false);
    expect(result.totals.kcal).toBe(0);
  });

  it("rounds to a sensible precision", () => {
    const result = estimateNutrition([{ name: "olive oil", grams: 13.5 }]);
    expect(Number.isInteger(result.totals.kcal)).toBe(true);
    expect(result.totals.fat).toBeCloseTo(13.5, 1);
  });
});
