import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import IngredientFields from "../components/IngredientFields";

const CreateRecipe = () => {
  const [formData, setFormData] = useState({
    title: "",
    instructions: "",
    category: "",
  });
  const [ingredients, setIngredients] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await API.post("/recipes", {
        ...formData,
        ingredients: ingredients.filter((i) => i.name.trim() && i.amount.trim()),
      });
      navigate("/your-recipes");
    } catch (error) {
      console.error("Create recipe error:", error.message);
      alert("Failed to create recipe.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Create Recipe</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <input
          type="text"
          name="title"
          placeholder="Recipe Title"
          value={formData.title}
          onChange={handleChange}
          className="w-full p-2 border"
          required
        />
        <input
          type="text"
          name="category"
          placeholder="Category"
          value={formData.category}
          onChange={handleChange}
          className="w-full p-2 border"
        />
        <textarea
          name="instructions"
          placeholder="Instructions"
          value={formData.instructions}
          onChange={handleChange}
          className="w-full p-2 border"
          required
        />
        <IngredientFields ingredients={ingredients} setIngredients={setIngredients} />
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default CreateRecipe;
