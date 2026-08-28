import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import IngredientFields from "../components/IngredientFields";

const EditRecipe = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [form, setForm] = useState({ title: "", instructions: "", category: "" });
  const [ingredients, setIngredients] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await API.get(`/recipes/${id}`);
        setRecipe(res.data);
        setForm({
          title: res.data.title,
          instructions: res.data.instructions,
          category: res.data.category,
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
    setSubmitting(true);
    try {
      await API.put(`/recipes/${id}`, {
        ...form,
        ingredients: ingredients.filter((i) => i.name.trim() && i.amount.trim()),
      });
      navigate("/profile");
    } catch (err) {
      console.error("Failed to update recipe:", err);
      alert("Failed to save changes.");
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div>
        <p>{error}</p>
        <button type="button" onClick={() => navigate("/your-recipes")}>
          Back to Your Recipes
        </button>
      </div>
    );
  }

  if (!recipe) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit}>
      <h2>Edit Recipe</h2>
      <input
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Title"
        required
      />
      <textarea
        name="instructions"
        value={form.instructions}
        onChange={handleChange}
        placeholder="Instructions"
        required
      />
      <input
        name="category"
        value={form.category}
        onChange={handleChange}
        placeholder="Category"
        required
      />
      <IngredientFields ingredients={ingredients} setIngredients={setIngredients} />
      <button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
};

export default EditRecipe;
