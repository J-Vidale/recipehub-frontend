import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";
import RecipeCard from "../components/RecipeCard";
import Seo from "../components/Seo";
import Breadcrumbs from "../components/Breadcrumbs";
import { asArray, asCursor } from '../lib/apiShape';

const TagPage = () => {
  const { tag } = useParams();
  const [recipes, setRecipes] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    API.get(`/recipes/tag/${tag}`, { params: {} })
      .then((res) => {
        setRecipes(asArray(res.data?.recipes));
        setNextCursor(asCursor(res.data?.nextCursor));
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
      const res = await API.get(`/recipes/tag/${tag}`, { params: { cursor: nextCursor } });
      setRecipes((prev) => [...prev, ...asArray(res.data?.recipes)]);
      setNextCursor(asCursor(res.data?.nextCursor));
    } catch (err) {
      console.error("Failed to load more:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="page-container max-w-6xl">
      <Seo
        title={`#${tag} recipes`}
        description={`Every RecipeHub recipe tagged #${tag}, shared by home cooks in the community.`}
      />
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Explore", to: "/explore" },
          { label: `#${tag}` },
        ]}
      />
      <h1 className="page-title mb-6">#{tag}</h1>
      {loading ? (
        <p className="text-center text-soft">Loading...</p>
      ) : error ? (
        <p className="text-center text-danger">{error}</p>
      ) : recipes.length === 0 ? (
        <p className="text-center text-soft">No recipes tagged #{tag} yet.</p>
      ) : (
        <>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe._id} recipe={recipe} />
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

export default TagPage;
