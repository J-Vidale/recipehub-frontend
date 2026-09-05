import { describe, it, expect } from "vitest";
import { parseMeasure, toGrams, formatGrams } from "../src/lib/units";

describe("parseMeasure", () => {
  it.each([
    ["200g", 200, "g"],
    ["1 cup", 1, "cup"],
    ["1 1/2 cups", 1.5, "cups"],
    ["½ tsp", 0.5, "tsp"],
    ["2 1/4 lb", 2.25, "lb"],
    ["3 oz", 3, "oz"],
    ["1.5 kg", 1.5, "kg"],
    ["2 tbs", 2, "tbs"],
  ])("reads %s as %f %s", (raw, quantity, unit) => {
    const parsed = parseMeasure(raw);
    expect(parsed).not.toBeNull();
    expect(parsed.quantity).toBeCloseTo(quantity, 3);
    expect(parsed.unit).toBe(unit);
  });

  it.each(["to taste", "a pinch", "dash", "", "   "])(
    "returns null for %o, which carries no quantity",
    (raw) => {
      expect(parseMeasure(raw)).toBeNull();
    }
  );

  it("does not throw on non-string input", () => {
    expect(parseMeasure(null)).toBeNull();
    expect(parseMeasure(undefined)).toBeNull();
    expect(parseMeasure(42)).toBeNull();
  });
});

describe("toGrams: mass units", () => {
  it("passes grams through", () => {
    expect(toGrams("200g", "flour")).toBeCloseTo(200, 5);
  });

  it("converts pounds and ounces by definition, not approximation", () => {
    expect(toGrams("1 lb", "beef")).toBeCloseTo(453.59237, 5);
    expect(toGrams("8 oz", "beef")).toBeCloseTo(226.796, 2);
  });

  it("converts kilograms", () => {
    expect(toGrams("1.5 kg", "potatoes")).toBeCloseTo(1500, 5);
  });

  it("needs no ingredient name, because mass is mass", () => {
    expect(toGrams("100 g", null)).toBeCloseTo(100, 5);
  });
});

describe("toGrams: volume units", () => {
  it("uses the ingredient's density, so the same volume gives different weights", () => {
    const flour = toGrams("1 cup", "plain flour");
    const honey = toGrams("1 cup", "honey");
    expect(flour).toBeCloseTo(125, 0);
    expect(honey).toBeCloseTo(336, 0);
    expect(honey).toBeGreaterThan(flour * 2);
  });

  it("finds the most specific density match", () => {
    // "extra virgin olive oil" must resolve to olive oil (0.915), not the
    // broader "oil" (0.918); the two differ enough to be worth checking.
    const specific = toGrams("1 cup", "extra virgin olive oil");
    expect(specific).toBeCloseTo(236.588 * 0.915, 1);
  });

  it("refuses rather than guessing when the density is unknown", () => {
    expect(toGrams("1 cup", "chopped rhubarb")).toBeNull();
    expect(toGrams("1 tsp", "smoked paprika")).toBeNull();
  });

  it("refuses when there is no ingredient to look up", () => {
    expect(toGrams("1 cup", null)).toBeNull();
    expect(toGrams("1 cup", undefined)).toBeNull();
  });
});

describe("toGrams: counts are not weights", () => {
  it.each([
    ["2", "eggs"],
    ["1", "onion"],
    ["3", "carrots"],
  ])("treats %s %s as a count and returns null", (measure, name) => {
    expect(toGrams(measure, name)).toBeNull();
  });
});

describe("formatGrams", () => {
  it("keeps one decimal below 10g, where spices live", () => {
    expect(formatGrams(2.34)).toBe("2.3 g");
  });

  it("rounds to whole grams in the normal range", () => {
    expect(formatGrams(226.8)).toBe("227 g");
  });

  it("switches to kilograms above 1000g", () => {
    expect(formatGrams(1500)).toBe("1.50 kg");
    expect(formatGrams(2000)).toBe("2 kg");
  });

  it("passes null through rather than printing NaN", () => {
    expect(formatGrams(null)).toBeNull();
    expect(formatGrams(NaN)).toBeNull();
    expect(formatGrams(Infinity)).toBeNull();
  });
});
