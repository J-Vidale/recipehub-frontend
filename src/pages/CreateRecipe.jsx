import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import IngredientFields from "../components/IngredientFields";
import CategoryAutocomplete from "../components/CategoryAutocomplete";
import Seo from "../components/Seo";

const CreateRecipe = () => {
  const [formData, setFormData] = useState({
    title: "",
    instructions: "",
    category: "",
  });
  const [ingredients, setIngredients] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await API.post("/recipes", {
        ...formData,
        ingredients: ingredients.filter((i) => i.name.trim() && i.amount.trim()),
      });
      toast.success("Recipe published.");
      navigate("/your-recipes");
    } catch (err) {
      console.error("Create recipe error:", err.message);
      setError(err.response?.data?.message || "Failed to create recipe.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container max-w-lg">
      <Seo
        title="Create a Recipe"
        description="Publish a new recipe on RecipeHub with ingredients, instructions and hashtags."
        noindex
      />
      <div className="card">
        <h1 className="text-2xl font-bold text-green-700 mb-6">Create a Recipe</h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category (optional)</label>
            <CategoryAutocomplete
              value={formData.category}
              onChange={(category) => setFormData((prev) => ({ ...prev, category }))}
            />
          </div>
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
