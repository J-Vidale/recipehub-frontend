import { useRef } from "react";

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
      <h3 className="text-lg font-medium mt-4 mb-2">Ingredients</h3>
      {ingredients.map((ingredient, index) => (
        <div key={keysRef.current[index]} className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Name"
            value={ingredient.name}
            onChange={(e) => handleChange(index, "name", e.target.value)}
            className="border p-2 w-1/2"
          />
          <input
            type="text"
            placeholder="Amount"
            value={ingredient.amount}
            onChange={(e) => handleChange(index, "amount", e.target.value)}
            className="border p-2 w-1/3"
          />
          <button
            type="button"
            onClick={() => handleRemove(index)}
            className="text-red-500"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        className="text-blue-500 underline mt-2"
      >
        + Add Ingredient
      </button>
    </div>
  );
}

export default IngredientFields;
