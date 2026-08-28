import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import LikeButton from "../components/LikeButton";

const Feed = () => {
  const [recipes, setRecipes] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await API.get("/recipes/feed");
        setRecipes(res.data.recipes);
        setNextCursor(res.data.nextCursor);
      } catch (err) {
        console.error("Error fetching feed:", err);
        setError("Couldn't load your feed. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await API.get("/recipes/feed", { params: { cursor: nextCursor } });
      setRecipes((prev) => [...prev, ...res.data.recipes]);
      setNextCursor(res.data.nextCursor);
    } catch (err) {
      console.error("Error fetching more feed items:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="page-container max-w-2xl">
      <h2 className="text-3xl font-bold text-green-700 mb-8 text-center">Your Feed</h2>
      {loading ? (
        <p className="text-center text-gray-600">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : recipes.length === 0 ? (
        <div className="card text-center text-gray-600">
          <p className="mb-4">
            No recipes yet from people you follow.
          </p>
          <Link to="/explore" className="text-green-700 underline">
            Explore recipes to find people to follow
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {recipes.map((recipe) => (
              <div key={recipe._id} className="card">
                <Link to={`/recipes/${recipe._id}`} className="text-xl font-semibold text-green-700 hover:underline">
                  {recipe.title}
                </Link>
                {recipe.user?.username && (
                  <p className="text-sm text-gray-500 mb-2">
                    by{" "}
                    <Link to={`/users/${recipe.user._id}`} className="text-green-700 hover:underline">
                      {recipe.user.username}
                    </Link>
                  </p>
                )}
                <p className="text-gray-600 mb-3">{recipe.instructions?.slice(0, 150)}...</p>
                <LikeButton
                  recipeId={recipe._id}
                  initialLikeCount={recipe.likeCount || 0}
                  initialLikedByMe={false}
                />
              </div>
            ))}
          </div>
          {nextCursor && (
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

export default Feed;
