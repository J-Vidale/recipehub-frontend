// src/pages/Explore.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import RecipeCard from '../components/RecipeCard';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';

const Explore = () => {
  const [recipes, setRecipes] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [popularTags, setPopularTags] = useState([]);

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

    API.get('/tags/popular', { params: { limit: 10 } })
      .then((res) => setPopularTags(res.data.tags))
      .catch((err) => console.error('Failed to fetch popular tags:', err));
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
    <div className="page-container max-w-6xl">
      <Seo
        title="Explore Recipes"
        description="Browse every recipe shared by the RecipeHub community, newest first, and jump into the hashtags people are cooking with right now."
      />
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Explore" }]} />
      <h1 className="text-3xl font-bold text-green-700 mb-4 text-center">Explore Recipes</h1>
      {popularTags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {popularTags.map(({ tag, count }) => (
            <Link
              key={tag}
              to={`/tag/${tag}`}
              className="card-sm card-hover px-3 py-1 text-sm text-green-700"
            >
              #{tag} <span className="text-gray-400">{count}</span>
            </Link>
          ))}
        </div>
      )}
      {loading ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card overflow-hidden p-0">
              <div className="skeleton" style={{ aspectRatio: "4 / 3" }} />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : (
        <>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe._id} recipe={recipe} />
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

export default Explore;
