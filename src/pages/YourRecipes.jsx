import React, { useEffect, useState } from "react";
import API from "../services/api";

const YourRecipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const res = await API.get("/recipes/mine");
        setRecipes(res.data);
      } catch (error) {
        console.error("Error fetching recipes:", error.message);
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Recipes</h1>
      {recipes.length === 0 ? (
        <p>No recipes found. Add some!</p>
      ) : (
        <ul className="space-y-4">
          {Array.isArray(recipes)
            ? recipes.map((recipe) => {
                const isSaved = savedIds.includes(recipe._id);
                return (
                  <li key={recipe._id} className="p-4 bg-white shadow rounded">
                    <h2 className="text-xl font-semibold">{recipe.title}</h2>
                    <p>{recipe.description}</p>
                    <button
                      onClick={() => handleSave(recipe._id, isSaved)}
                      disabled={savingId === recipe._id}
                      className={`px-4 py-2 rounded disabled:opacity-60 ${
                        isSaved
                          ? "bg-red-500 text-white"
                          : "bg-green-500 text-white"
                      }`}
                    >
                      {isSaved ? "Unsave" : "Save"}
                    </button>
                  </li>
                );
              })
            : null}
        </ul>
      )}
    </div>
  );
};

export default YourRecipes;
