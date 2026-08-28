import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import IngredientFields from "../components/IngredientFields";
import CategoryAutocomplete from "../components/CategoryAutocomplete";

const EditRecipe = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [form, setForm] = useState({ title: "", instructions: "", category: "" });
  const [ingredients, setIngredients] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await API.get(`/recipes/${id}`);
        setRecipe(res.data);
        setForm({
          title: res.data.title,
          instructions: res.data.instructions,
          category: res.data.category || "",
        });
        setIngredients(res.data.ingredients || []);
      } catch (err) {
        console.error("Failed to fetch recipe:", err);
        setError("Couldn't load this recipe. It may have been deleted.");
      }
    };
    fetchRecipe();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      await API.put(`/recipes/${id}`, {
        ...form,
        ingredients: ingredients.filter((i) => i.name.trim() && i.amount.trim()),
      });
      navigate("/profile");
    } catch (err) {
      console.error("Failed to update recipe:", err);
      setSubmitError(err.response?.data?.message || "Failed to save changes.");
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="page-container max-w-lg text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button type="button" onClick={() => navigate("/your-recipes")} className="btn-secondary">
          Back to Your Recipes
        </button>
      </div>
    );
  }

  if (!recipe) return <div className="page-container text-center text-gray-600">Loading...</div>;

  return (
    <div className="page-container max-w-lg">
      <div className="card">
        <h2 className="text-2xl font-bold text-green-700 mb-6">Edit Recipe</h2>
        {submitError && <p className="text-red-600 text-sm mb-4">{submitError}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Title"
            className="input"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category (optional)</label>
            <CategoryAutocomplete
              value={form.category}
              onChange={(category) => setForm((prev) => ({ ...prev, category }))}
            />
          </div>
          <textarea
            name="instructions"
            value={form.instructions}
            onChange={handleChange}
            placeholder="Instructions"
            rows={6}
            className="input"
            required
          />
          <IngredientFields ingredients={ingredients} setIngredients={setIngredients} />
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditRecipe;
