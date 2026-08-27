import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../services/api";

const RecipeDetail = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await API.get(`/recipes/${id}`);
        setRecipe(response.data);
      } catch (error) {
        console.error("Error fetching recipe:", error);
      }
    };
    fetchRecipe();
  }, [id]);

  useEffect(() => {
    if (!recipe) return; // Don't run if recipe is not loaded yet
    API.get("/recipes/saved").then((res) => {
      setIsSaved(res.data.some((r) => r._id === recipe._id));
    });
  }, [recipe?._id, recipe]);

  const handleSave = async () => {
    const previouslySaved = isSaved;
    // Optimistic: flip the UI immediately, revert if the request fails.
    setIsSaved(!previouslySaved);
    setSaving(true);
    try {
      if (previouslySaved) {
        await API.delete(`/recipes/unsave/${recipe._id}`);
      } else {
        await API.post(`/recipes/save/${recipe._id}`, {});
      }
    } catch {
      setIsSaved(previouslySaved);
      alert("Failed to update saved recipes.");
    } finally {
      setSaving(false);
    }
  };

  if (!recipe) return <div className="p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow mt-10">
        <h1 className="text-3xl font-bold text-green-700 mb-4">
          <Link to={`/recipes/${recipe._id}`}>{recipe.title}</Link>
        </h1>
        <p className="text-gray-700 mb-4">{recipe.description}</p>
        <div>
          <h2 className="font-semibold text-lg">Ingredients:</h2>
          <ul className="list-disc list-inside">
            {recipe.ingredients.map((item, index) => (
              <li key={index}>
                {item.name} - {item.amount}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-4 py-2 rounded disabled:opacity-60 ${
            isSaved ? "bg-red-500 text-white" : "bg-green-500 text-white"
          }`}
        >
          {isSaved ? "Unsave" : "Save"}
        </button>
      </div>
    </div>
  );
};

export default RecipeDetail;
