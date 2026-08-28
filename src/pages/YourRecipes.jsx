import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import RecipeCard from "../components/RecipeCard";

const YourRecipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const res = await API.get("/recipes/mine");
        setRecipes(res.data.recipes || []);
      } catch (error) {
        console.error("Error fetching recipes:", error.message);
        setError("Couldn't load your recipes. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    const fetchSaved = async () => {
      try {
        const res = await API.get("/recipes/saved");
        setSavedIds(res.data.map((r) => r._id));
      } catch {
        setSavedIds([]);
      }
    };

    fetchRecipes();
    fetchSaved();
  }, []);

  const handleSave = async (recipeId, currentlySaved) => {
    // Optimistic: flip the UI immediately, revert if the request fails.
    setSavingId(recipeId);
    if (currentlySaved) {
      setSavedIds((prev) => prev.filter((id) => id !== recipeId));
    } else {
      setSavedIds((prev) => [...prev, recipeId]);
    }

    try {
      if (currentlySaved) {
        await API.delete(`/recipes/unsave/${recipeId}`);
      } else {
        await API.post(`/recipes/save/${recipeId}`, {});
      }
    } catch {
      // Revert on failure
      if (currentlySaved) {
        setSavedIds((prev) => [...prev, recipeId]);
      } else {
        setSavedIds((prev) => prev.filter((id) => id !== recipeId));
      }
      alert("Failed to update saved recipes.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="page-container max-w-6xl">
      <h1 className="text-3xl font-bold text-green-700 mb-6">Your Recipes</h1>
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : recipes.length === 0 ? (
        <p className="text-gray-600">No recipes found. Add some!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {recipes.map((recipe) => {
            const isSaved = savedIds.includes(recipe._id);
            return (
              <RecipeCard
                key={recipe._id}
                recipe={recipe}
                actions={
                  <>
                    <Link to={`/edit/${recipe._id}`} className="btn-secondary flex-1">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleSave(recipe._id, isSaved)}
                      disabled={savingId === recipe._id}
                      className={`flex-1 ${isSaved ? "btn-danger" : "btn-primary"}`}
                    >
                      {isSaved ? "Unsave" : "Save"}
                    </button>
                  </>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default YourRecipes;
