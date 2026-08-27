import React, { useEffect, useState } from "react";
import API from "../services/api";

const SavedRecipes = () => {
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedRecipes = async () => {
      try {
        const res = await API.get("/recipes/saved");
        setSavedRecipes(res.data);
      } catch (err) {
        console.error("Failed to fetch saved recipes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedRecipes();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <h1 className="text-3xl font-bold text-green-700 mb-6">Saved Recipes</h1>
      {loading ? (
        <p>Loading...</p>
      ) : savedRecipes.length === 0 ? (
        <p className="text-gray-600">You haven’t saved any recipes yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.isArray(savedRecipes)
            ? savedRecipes.map((recipe) => (
                <div
                  key={recipe._id}
                  className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition"
                >
                  <h2 className="text-xl font-semibold text-green-600 mb-2">
                    {recipe.title}
                  </h2>
                  <p className="text-gray-700 text-sm mb-2">
                    {recipe.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    Saved on:{" "}
                    {recipe.savedAt
                      ? new Date(recipe.savedAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              ))
            : null}
        </div>
      )}
    </div>
  );
};

export default SavedRecipes;
