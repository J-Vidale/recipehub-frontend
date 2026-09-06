import React, { useMemo, useState } from "react";
import { toGrams, formatGrams } from "../lib/units";
import { estimateNutrition } from "../lib/nutrition";
import { detectAllergens } from "../lib/allergens";

// ingredients: [{ ingredient, measure }] - the shape both TheMealDB
// helper and member recipes are normalised into by the callers.
const NutritionPanel = ({ ingredients }) => {
  // Held as text while the field is being edited. Clamping on every
  // keystroke meant clearing the box snapped it straight to 1, so the next
  // digit appended to it: clear, type "2", get 12. The value is clamped
  // where it is used and normalised on blur instead.
  const [servingsText, setServingsText] = useState("4");
  const servings = Math.min(50, Math.max(1, Number(servingsText) || 1));

  const { rows, estimate, allergens } = useMemo(() => {
    const list = (ingredients || []).filter((i) => i && i.ingredient);
    const withGrams = list.map((item) => ({
      name: item.ingredient,
      measure: item.measure,
      grams: toGrams(item.measure, item.ingredient),
    }));
    return {
      rows: withGrams,
      estimate: estimateNutrition(withGrams),
      allergens: detectAllergens(list.map((i) => i.ingredient)),
    };
  }, [ingredients]);

  if (rows.length === 0) return null;

  const perServing = (value) => {
    if (!servings || servings < 1) return value;
    const divided = value / servings;
    return divided >= 10 ? Math.round(divided) : Math.round(divided * 10) / 10;
  };

  const coveragePercent = Math.round(estimate.coverage * 100);
  const weighed = rows.filter((r) => r.grams !== null).length;

  return (
    <section className="nutrition" aria-labelledby="nutrition-heading">
      <h2 id="nutrition-heading" className="nutrition__heading">
        Weights and estimated macros
      </h2>

      {/* --- Ingredient weights ---------------------------------------- */}
      <div className="nutrition__table-scroll">
        <table className="nutrition__table">
        <caption className="sr-only">
          Each ingredient with its original measure and, where it can be worked
          out, the equivalent weight in grams
        </caption>
        <thead>
          <tr>
            <th scope="col">Ingredient</th>
            <th scope="col">Measure</th>
            <th scope="col">Weight</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.name}-${index}`}>
              <td>{row.name}</td>
              <td>{row.measure || <span className="nutrition__muted">to taste</span>}</td>
              <td>
                {row.grams === null ? (
                  <span className="nutrition__muted" title="Not convertible from this measure">
                    &mdash;
                  </span>
                ) : (
                  formatGrams(row.grams)
                )}
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>

      <p className="nutrition__note">
        {weighed} of {rows.length} ingredients could be converted to grams. A
        measure by count ("2 onions") or by eye ("a pinch") has no weight to
        convert, and a volume only becomes a weight for ingredients whose
        density is known.
      </p>

      {/* --- Macros ----------------------------------------------------- */}
      {estimate.counted.length > 0 && (
        <>
          <div className="nutrition__servings">
            <label htmlFor="servings-input">Servings</label>
            <input
              id="servings-input"
              type="number"
              min="1"
              max="50"
              value={servingsText}
              onChange={(e) => setServingsText(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
              onBlur={() => setServingsText(String(servings))}
              className="input nutrition__servings-input"
            />
          </div>

          <ul className="macro-grid">
            {[
              { label: "Calories", value: perServing(estimate.totals.kcal), unit: "kcal" },
              { label: "Protein", value: perServing(estimate.totals.protein), unit: "g" },
              { label: "Carbs", value: perServing(estimate.totals.carbs), unit: "g" },
              { label: "Fat", value: perServing(estimate.totals.fat), unit: "g" },
              { label: "Fibre", value: perServing(estimate.totals.fibre), unit: "g" },
            ].map((macro) => (
              <li key={macro.label} className="macro">
                <span className="macro__value">
                  {macro.value}
                  <span className="macro__unit">{macro.unit}</span>
                </span>
                <span className="macro__label">{macro.label}</span>
              </li>
            ))}
          </ul>

          <p className="nutrition__note">
            Per serving, estimated from {estimate.counted.length} of{" "}
            {estimate.counted.length + estimate.missing.length} ingredients (
            {coveragePercent}%). Cooking method, cut and brand all move these
            numbers, so treat them as a rough guide rather than a label.
          </p>
        </>
      )}

      {/* --- Allergens --------------------------------------------------- */}
      <h3 className="nutrition__subheading">Possible allergens</h3>
      {allergens.length === 0 ? (
        <p className="nutrition__note">
          Nothing in this ingredient list matched the allergens we check for.
          That is not the same as the dish being free from them: check the
          labels on what you actually buy.
        </p>
      ) : (
        <>
          <ul className="allergen-list">
            {allergens.map((allergen) => (
              <li key={allergen.id} className="allergen">
                <span className="allergen__label">{allergen.label}</span>
                <span className="allergen__source">from {allergen.matchedBy.join(", ")}</span>
              </li>
            ))}
          </ul>
          <p className="nutrition__note">
            Flagged from ingredient names only. A recipe line cannot show what a
            stock cube or sauce contains, whether a brand has been reformulated,
            or what the food was made alongside. If you are avoiding something,
            read the label.
          </p>
        </>
      )}
    </section>
  );
};

export default NutritionPanel;
