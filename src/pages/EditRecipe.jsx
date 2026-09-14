import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import IngredientFields from "../components/IngredientFields";
import RecipePhotos from "../components/RecipePhotos";
import { uploadRecipePhotos } from "../lib/uploadPhotos";
import CategoryAutocomplete from "../components/CategoryAutocomplete";
import Seo from "../components/Seo";
import { asArray } from "../lib/apiShape";
import Field from "../components/Field";
import { MAX_TITLE_LENGTH, MAX_INSTRUCTIONS_LENGTH } from "../lib/recipeLimits";

const EditRecipe = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [form, setForm] = useState({ title: "", instructions: "", category: "" });
  const [ingredients, setIngredients] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [media, setMedia] = useState([]);
  const [photos, setPhotos] = useState([]);
  const navigate = useNavigate();
  const toast = useToast();

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
        setIngredients(asArray(res.data?.ingredients));
        setMedia(asArray(res.data?.media));
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

  // Deleting is immediate rather than staged with the rest of the form.
  // The recipe already exists, the endpoint removes the asset from
  // Cloudinary as well as the row, and a delete held until Save would
  // leave the two out of step if the reader navigated away.
  const handleRemovePhoto = async (mediaId) => {
    const previous = media;
    setMedia((current) => current.filter((item) => item._id !== mediaId));
    try {
      await API.delete(`/recipes/${id}/media/${mediaId}`);
    } catch (err) {
      setMedia(previous);
      toast.error(err?.message || "Could not remove that photo.");
    }
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

      // As on the create form: the text is saved by this point, so a photo
      // that fails to upload is reported as a photo failing, not as the
      // edit failing.
      const failed = await uploadRecipePhotos(id, photos);
      toast[failed.length ? "error" : "success"](
        failed.length
          ? `Changes saved, but ${failed.length} photo${failed.length === 1 ? "" : "s"} did not upload.`
          : "Changes saved."
      );
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
        <p className="text-danger mb-4">{error}</p>
        <button type="button" onClick={() => navigate("/your-recipes")} className="btn-secondary">
          Back to Your Recipes
        </button>
      </div>
    );
  }

  if (!recipe) return <div className="page-container max-w-lg text-center text-soft">Loading...</div>;

  return (
    <div className="page-container max-w-lg">
      <Seo
        title={recipe.title ? `Edit ${recipe.title}` : "Edit Recipe"}
        description="Update your recipe on RecipeHub."
        noindex
      />
      <div className="card">
        <h1 className="page-title mb-6">Edit Recipe</h1>
        {submitError && <p className="text-danger text-sm mb-4">{submitError}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            maxLength={MAX_TITLE_LENGTH}
          />
          <CategoryAutocomplete
            label="Category"
            hint="Optional. Pick a suggestion or type your own."
            value={form.category}
            onChange={(category) => setForm((prev) => ({ ...prev, category }))}
          />
          <Field
            as="textarea"
            label="Instructions"
            name="instructions"
            value={form.instructions}
            onChange={handleChange}
            maxLength={MAX_INSTRUCTIONS_LENGTH}
            rows={6}
            hint="Write #hashtags anywhere in here to tag the recipe."
          />
          <IngredientFields ingredients={ingredients} setIngredients={setIngredients} />
          <RecipePhotos
            existing={media}
            pending={photos}
            onPendingChange={setPhotos}
            onRemoveExisting={handleRemovePhoto}
            busy={submitting}
          />
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditRecipe;
