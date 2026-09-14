import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import IngredientFields from "../components/IngredientFields";
import RecipePhotos from "../components/RecipePhotos";
import { uploadRecipePhotos, describeFailedUploads } from "../lib/uploadPhotos";
import CategoryAutocomplete from "../components/CategoryAutocomplete";
import Seo from "../components/Seo";
import Field from "../components/Field";
import { MAX_TITLE_LENGTH, MAX_INSTRUCTIONS_LENGTH } from "../lib/recipeLimits";

const CreateRecipe = () => {
  const [formData, setFormData] = useState({
    title: "",
    instructions: "",
    category: "",
  });
  const [ingredients, setIngredients] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState([]);
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
      const { data: recipe } = await API.post("/recipes", {
        ...formData,
        ingredients: ingredients.filter((i) => i.name.trim() && i.amount.trim()),
      });

      // The photos wait for the recipe, because the endpoint that takes
      // them needs its id. A photo that fails to upload must not read as a
      // recipe that failed to publish - it is already published - so the
      // failures are reported and the recipe still counts.
      const failed = await uploadRecipePhotos(recipe?._id, photos);
      if (failed.length) {
        toast.error(
          `${describeFailedUploads(failed, "Recipe published, but")} You can add them by editing the recipe.`
        );
      } else {
        toast.success("Recipe published.");
      }
      navigate("/your-recipes");
      return;
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
            maxLength={MAX_TITLE_LENGTH}
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
            maxLength={MAX_INSTRUCTIONS_LENGTH}
            rows={6}
            hint="Write #hashtags anywhere in here to tag the recipe."
          />
          <IngredientFields ingredients={ingredients} setIngredients={setIngredients} />
          <RecipePhotos pending={photos} onPendingChange={setPhotos} busy={submitting} />
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? (photos.length ? "Publishing and uploading..." : "Publishing...") : "Publish recipe"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRecipe;
