import React, { useEffect, useState } from "react";
import API from "../services/api";
import RecipeCard from "../components/RecipeCard";

const SavedRecipes = () => {
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSavedRecipes = async () => {
      try {
        const res = await API.get("/recipes/saved");
        setSavedRecipes(res.data);
      } catch (err) {
        console.error("Failed to fetch saved recipes:", err);
        setError("Couldn't load your saved recipes. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSavedRecipes();
  }, []);

  return (
    <div className="page-container max-w-6xl">
      <h1 className="text-3xl font-bold text-green-700 mb-6">Saved Recipes</h1>
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : savedRecipes.length === 0 ? (
        <p className="text-gray-600">You haven't saved any recipes yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.isArray(savedRecipes)
            ? savedRecipes.map((recipe) => <RecipeCard key={recipe._id} recipe={recipe} />)
            : null}
        </div>
      )}
    </div>
  );
};

export default SavedRecipes;
