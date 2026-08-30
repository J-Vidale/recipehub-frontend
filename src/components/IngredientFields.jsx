import { useRef } from "react";
import { CloseIcon } from "./icons";

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

  const handleAdd = () => {
    keysRef.current = [...keysRef.current, `ing-${nextKeyId.current++}`];
    setIngredients([...ingredients, { name: "", amount: "" }]);
  };

  const handleRemove = (index) => {
    keysRef.current = keysRef.current.filter((_, i) => i !== index);
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mt-2 mb-2">Ingredients</h3>
      {ingredients.map((ingredient, index) => (
        <div key={keysRef.current[index]} className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Name"
            value={ingredient.name}
            onChange={(e) => handleChange(index, "name", e.target.value)}
            className="input flex-1"
          />
          <input
            type="text"
            placeholder="Amount"
            value={ingredient.amount}
            onChange={(e) => handleChange(index, "amount", e.target.value)}
            className="input w-28"
          />
          <button
            type="button"
            onClick={() => handleRemove(index)}
            className="text-red-500 hover:text-red-700 px-1"
            aria-label={`Remove ingredient${ingredient.name ? ` ${ingredient.name}` : ` ${index + 1}`}`}
          >
            <CloseIcon />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        className="text-green-700 hover:underline text-sm mt-1"
      >
        + Add Ingredient
      </button>
    </div>
  );
}

export default IngredientFields;
