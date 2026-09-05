// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NutritionPanel from "../src/components/NutritionPanel";

// A deliberate mix: an exact mass, a convertible volume, a count with no
// weight, and an ingredient absent from the macro table.
const INGREDIENTS = [
  { ingredient: "Plain Flour", measure: "1 cup" },
  { ingredient: "Butter", measure: "200g" },
  { ingredient: "Eggs", measure: "2" },
  { ingredient: "Almonds", measure: "4 oz" },
  { ingredient: "Smoked Paprika", measure: "1 tsp" },
];

const weightFor = (name) => {
  const cell = screen.getByRole("cell", { name });
  const cells = within(cell.closest("tr")).getAllByRole("cell");
  return cells[2].textContent.trim();
};

describe("weights column", () => {
  it("shows exact masses unchanged and converts ounces", () => {
    render(<NutritionPanel ingredients={INGREDIENTS} />);
    expect(weightFor("Butter")).toBe("200 g");
    expect(weightFor("Almonds")).toBe("113 g");
  });

  it("converts a volume using the ingredient's density", () => {
    render(<NutritionPanel ingredients={INGREDIENTS} />);
    expect(weightFor("Plain Flour")).toBe("125 g");
  });

  it("shows a dash rather than inventing a weight for a count", () => {
    render(<NutritionPanel ingredients={INGREDIENTS} />);
    expect(weightFor("Eggs")).toBe("—");
  });

  it("shows a dash for a volume whose density is unknown", () => {
    render(<NutritionPanel ingredients={INGREDIENTS} />);
    expect(weightFor("Smoked Paprika")).toBe("—");
  });

  it("says how many could be converted", () => {
    render(<NutritionPanel ingredients={INGREDIENTS} />);
    expect(screen.getByText(/3 of 5 ingredients could be converted/)).toBeInTheDocument();
  });
});

describe("macros", () => {
  it("states coverage rather than presenting a partial sum as complete", () => {
    render(<NutritionPanel ingredients={INGREDIENTS} />);
    expect(screen.getByText(/estimated from \d+ of \d+ ingredients/)).toBeInTheDocument();
  });

  it("qualifies the numbers in words", () => {
    render(<NutritionPanel ingredients={INGREDIENTS} />);
    expect(screen.getByText(/rough guide rather than a label/)).toBeInTheDocument();
  });

  it("halving the servings roughly doubles the per-serving figure", async () => {
    const user = userEvent.setup();
    render(<NutritionPanel ingredients={INGREDIENTS} />);
    const readKcal = () =>
      Number(document.querySelector(".macro__value").textContent.replace(/[^\d.]/g, ""));

    const atFour = readKcal();
    const input = screen.getByLabelText("Servings");
    // Clearing then typing must not append to a clamped value.
    await user.clear(input);
    expect(input).toHaveValue(null);
    await user.type(input, "2");
    expect(input).toHaveValue(2);
    const atTwo = readKcal();

    expect(atTwo).toBeGreaterThan(atFour * 1.9);
    expect(atTwo).toBeLessThan(atFour * 2.1);
  });

  it("cannot be driven to zero servings", async () => {
    const user = userEvent.setup();
    render(<NutritionPanel ingredients={INGREDIENTS} />);
    const input = screen.getByLabelText("Servings");
    await user.clear(input);
    await user.type(input, "0");
    // The field may read 0 mid-edit, but blur normalises it and the maths
    // never divides by zero.
    expect(Number.isFinite(readKcalSafely())).toBe(true);
    await user.tab(); // a real focus change, so React's onBlur state update flushes
    expect(Number(input.value)).toBeGreaterThanOrEqual(1);
  });

  it("shows no macro tiles when nothing could be estimated", () => {
    render(<NutritionPanel ingredients={[{ ingredient: "Rhubarb", measure: "2 stalks" }]} />);
    expect(document.querySelectorAll(".macro")).toHaveLength(0);
  });
});

const readKcalSafely = () =>
  Number(document.querySelector(".macro__value").textContent.replace(/[^\d.]/g, ""));

describe("allergens", () => {
  it("flags what the ingredients imply", () => {
    render(<NutritionPanel ingredients={INGREDIENTS} />);
    // "Eggs" is also an ingredient row, so scope to the allergen chips.
    const flagged = [...document.querySelectorAll(".allergen__label")].map((el) => el.textContent);
    for (const label of ["Milk", "Eggs", "Nuts", "Cereals containing gluten"]) {
      expect(flagged).toContain(label);
    }
  });

  it("names the ingredient behind each flag", () => {
    render(<NutritionPanel ingredients={INGREDIENTS} />);
    expect(screen.getByText("from butter")).toBeInTheDocument();
  });

  it("tells the reader to check the actual label", () => {
    render(<NutritionPanel ingredients={INGREDIENTS} />);
    expect(screen.getAllByText(/read the label/i).length).toBeGreaterThan(0);
  });

  // The panel must never turn "we found nothing" into "this is safe".
  it("says explicitly that no matches is not a free-from claim", () => {
    render(<NutritionPanel ingredients={[{ ingredient: "Rhubarb", measure: "2 stalks" }]} />);
    expect(
      screen.getByText(/not the same as the dish being free from them/)
    ).toBeInTheDocument();
  });
});

describe("edge cases", () => {
  it("renders nothing at all for an empty ingredient list", () => {
    const { container } = render(<NutritionPanel ingredients={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("does not throw when ingredients is missing", () => {
    expect(() => render(<NutritionPanel />)).not.toThrow();
  });

  it("skips malformed entries rather than crashing", () => {
    expect(() =>
      render(<NutritionPanel ingredients={[null, { measure: "1 cup" }, { ingredient: "Butter", measure: "10g" }]} />)
    ).not.toThrow();
  });
});
