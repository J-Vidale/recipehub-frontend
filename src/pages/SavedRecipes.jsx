import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

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
            ? savedRecipes.map((recipe) => (
                <Link
                  to={`/recipes/${recipe._id}`}
                  key={recipe._id}
                  className="card hover:shadow-lg transition"
                >
                  <h2 className="text-lg font-semibold text-green-700 mb-2">
                    {recipe.title}
                  </h2>
                  <p className="text-gray-600 text-sm mb-2">
                    {recipe.instructions?.slice(0, 120)}...
                  </p>
                  <p className="text-xs text-gray-400">
                    Saved on:{" "}
                    {recipe.savedAt
                      ? new Date(recipe.savedAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </Link>
              ))
            : null}
        </div>
      )}
    </div>
  );
};

export default SavedRecipes;
