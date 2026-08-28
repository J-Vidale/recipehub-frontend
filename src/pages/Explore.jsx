// src/pages/Explore.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';

const Explore = () => {
  const [recipes, setRecipes] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllRecipes = async () => {
      try {
        const res = await API.get('/recipes', { params: { page: 1 } });
        setRecipes(res.data.recipes);
        setPage(1);
        setHasMore(res.data.hasMore);
      } catch (err) {
        console.error('Error fetching recipes:', err);
        setError("Couldn't load recipes. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllRecipes();
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await API.get('/recipes', { params: { page: nextPage } });
      setRecipes((prev) => [...prev, ...res.data.recipes]);
      setPage(nextPage);
      setHasMore(res.data.hasMore);
    } catch (err) {
      console.error('Error fetching more recipes:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <h2 className="text-3xl font-bold text-green-700 mb-8 text-center">Explore Recipes</h2>
      {loading ? (
        <p className="text-center text-gray-600">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : (
        <>
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {recipes.map(recipe => (
              <Link to={`/recipes/${recipe._id}`} key={recipe._id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition flex flex-col">
                <h3 className="text-xl font-semibold mb-2">{recipe.title}</h3>
                <p className="text-gray-600 flex-1">{recipe.instructions?.slice(0, 100)}...</p>
              </Link>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2 rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Explore;
