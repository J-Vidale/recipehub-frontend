import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import IngredientFields from "../components/IngredientFields";
import CategoryAutocomplete from "../components/CategoryAutocomplete";
import Seo from "../components/Seo";
import Field from "../components/Field";

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
        <h1 className="page-title mb-6">Create a Recipe</h1>
        {error && <p className="text-danger text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Roast chicken with lemon"
          />
          <CategoryAutocomplete
            label="Category"
            hint="Optional. Pick a suggestion or type your own."
            value={formData.category}
            onChange={(category) => setFormData((prev) => ({ ...prev, category }))}
          />
          <Field
            as="textarea"
            label="Instructions"
            name="instructions"
            value={formData.instructions}
            onChange={handleChange}
            rows={6}
            hint="Write #hashtags anywhere in here to tag the recipe."
          />
          <IngredientFields ingredients={ingredients} setIngredients={setIngredients} />
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Publishing..." : "Publish recipe"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRecipe;
