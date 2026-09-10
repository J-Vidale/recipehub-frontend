import { useRef } from "react";
import { CloseIcon } from "./icons";
import { MAX_INGREDIENT_FIELD_LENGTH, MAX_INGREDIENTS } from "../lib/recipeLimits";

function IngredientFields({ ingredients, setIngredients }) {
  // Stable per-row identity, decoupled from array position, so React
  // doesn't reuse a DOM node (and its focused input) for a different
  // ingredient after a row above it is removed.
  const nextKeyId = useRef(0);
  const keysRef = useRef([]);
  if (keysRef.current.length !== ingredients.length) {
    keysRef.current = ingredients.map(() => `ing-${nextKeyId.current++}`);
  }

  const handleChange = (index, field, value) => {
    setIngredients(
      ingredients.map((ingredient, i) =>
        i === index ? { ...ingredient, [field]: value } : ingredient
      )
    );
  };

  const atLimit = ingredients.length >= MAX_INGREDIENTS;

  const handleAdd = () => {
    if (atLimit) return;
    keysRef.current = [...keysRef.current, `ing-${nextKeyId.current++}`];
    setIngredients([...ingredients, { name: "", amount: "" }]);
  };

  const handleRemove = (index) => {
    keysRef.current = keysRef.current.filter((_, i) => i !== index);
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-strong mt-2 mb-2">Ingredients</h3>
      {/* One visible pair of column headings rather than a label on every
          row, which would repeat "Name / Amount" down the page. Each input
          still carries its own accessible name, numbered, so a screen
          reader announces which row it is in. */}
      {ingredients.length > 0 && (
        <div className="ingredient-row ingredient-row--headings" aria-hidden="true">
          <span>Name</span>
          <span>Amount</span>
          <span />
        </div>
      )}
      {ingredients.map((ingredient, index) => (
        <div key={keysRef.current[index]} className="ingredient-row">
          <input
            type="text"
            aria-label={`Ingredient ${index + 1} name`}
            placeholder="Plain flour"
            value={ingredient.name}
            onChange={(e) => handleChange(index, "name", e.target.value)}
            maxLength={MAX_INGREDIENT_FIELD_LENGTH}
            className="input"
          />
          <input
            type="text"
            aria-label={`Ingredient ${index + 1} amount`}
            placeholder="200 g"
            value={ingredient.amount}
            onChange={(e) => handleChange(index, "amount", e.target.value)}
            maxLength={MAX_INGREDIENT_FIELD_LENGTH}
            className="input"
          />
          <button
            type="button"
            onClick={() => handleRemove(index)}
            className="text-danger hover:text-danger px-1"
            aria-label={`Remove ingredient${ingredient.name ? ` ${ingredient.name}` : ` ${index + 1}`}`}
          >
            <CloseIcon />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        disabled={atLimit}
        className="tap-target text-brand hover:underline text-sm mt-1 disabled:opacity-60 disabled:no-underline"
      >
        + Add Ingredient
      </button>
      {atLimit && (
        <p className="text-xs text-muted mt-1">
          A recipe can have up to {MAX_INGREDIENTS} ingredients.
        </p>
      )}
    </div>
  );
}

export default IngredientFields;
