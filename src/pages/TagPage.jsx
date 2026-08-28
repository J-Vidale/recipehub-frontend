import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../services/api";

const TagPage = () => {
  const { tag } = useParams();
  const [recipes, setRecipes] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    API.get(`/recipes/tag/${tag}`, { params: { page: 1 } })
      .then((res) => {
        setRecipes(res.data.recipes);
        setPage(1);
        setHasMore(res.data.hasMore);
      })
      .catch((err) => {
        console.error("Failed to load tag:", err);
        setError("Couldn't load recipes for this tag.");
      })
      .finally(() => setLoading(false));
  }, [tag]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await API.get(`/recipes/tag/${tag}`, { params: { page: nextPage } });
      setRecipes((prev) => [...prev, ...res.data.recipes]);
      setPage(nextPage);
      setHasMore(res.data.hasMore);
    } catch (err) {
      console.error("Failed to load more:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="page-container max-w-6xl">
      <h2 className="text-2xl font-bold text-green-700 mb-6 text-center">#{tag}</h2>
      {loading ? (
        <p className="text-center text-gray-600">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : recipes.length === 0 ? (
        <p className="text-center text-gray-600">No recipes tagged #{tag} yet.</p>
      ) : (
        <>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {recipes.map((recipe) => (
              <Link
                to={`/recipes/${recipe._id}`}
                key={recipe._id}
                className="card hover:shadow-lg transition flex flex-col"
              >
                <h3 className="text-lg font-semibold mb-1">{recipe.title}</h3>
                {recipe.user?.username && (
                  <p className="text-xs text-gray-500 mb-2">by {recipe.user.username}</p>
                )}
                <p className="text-gray-600 text-sm flex-1">{recipe.instructions?.slice(0, 100)}...</p>
              </Link>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn-primary"
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

export default TagPage;
