import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

const EditRecipe = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [form, setForm] = useState({ title: "", instructions: "", category: "" });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecipe = async () => {
      const res = await API.get(`/recipes/${id}`);
      setRecipe(res.data);
      setForm({
        title: res.data.title,
        instructions: res.data.instructions,
        category: res.data.category,
      });
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
      await API.put(`/recipes/${id}`, form);
      navigate("/profile");
    } catch (err) {
      console.error("Failed to update recipe:", err);
      alert("Failed to save changes.");
      setSubmitting(false);
    }
  };

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
      <button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
};

export default EditRecipe;
