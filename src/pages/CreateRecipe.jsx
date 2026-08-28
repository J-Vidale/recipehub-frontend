import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import IngredientFields from "../components/IngredientFields";
import useCategories from "../hooks/useCategories";

const CreateRecipe = () => {
  const [formData, setFormData] = useState({
    title: "",
    instructions: "",
    category: "",
  });
  const [ingredients, setIngredients] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const categories = useCategories();

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
    <div className="page-container max-w-lg">
      <div className="card">
        <h1 className="text-2xl font-bold text-green-700 mb-6">Create Recipe</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="title"
            placeholder="Recipe Title"
            value={formData.title}
            onChange={handleChange}
            className="input"
            required
          />
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="input"
          >
            <option value="">Select a category (optional)</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <textarea
            name="instructions"
            placeholder="Instructions (write #hashtags to tag your recipe)"
            value={formData.instructions}
            onChange={handleChange}
            rows={6}
            className="input"
            required
          />
          <IngredientFields ingredients={ingredients} setIngredients={setIngredients} />
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRecipe;
