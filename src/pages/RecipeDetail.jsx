import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import LikeButton from "../components/LikeButton";
import ShareButton from "../components/ShareButton";
import CommentSection from "../components/CommentSection";
import ReportButton from "../components/ReportButton";
import HashtagText from "../components/HashtagText";
import RecipeCard from "../components/RecipeCard";

const RecipeDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [moreFromUser, setMoreFromUser] = useState([]);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await API.get(`/recipes/${id}`);
        setRecipe(response.data);
        setActiveMediaIndex(0);
      } catch (error) {
        console.error("Error fetching recipe:", error);
        setError("Couldn't load this recipe. It may have been deleted.");
      }
    };
    fetchRecipe();
  }, [id]);

  useEffect(() => {
    if (!recipe?.user?._id) return;
    API.get(`/recipes/user/${recipe.user._id}`, { params: { page: 1, limit: 8 } })
      .then((res) => setMoreFromUser(res.data.recipes.filter((r) => r._id !== recipe._id)))
      .catch((err) => console.error("Failed to fetch more recipes from this user:", err));
  }, [recipe]);

  useEffect(() => {
    if (!recipe || !user) return; // Only logged-in users have a saved list to check
    API.get("/recipes/saved").then((res) => {
      setIsSaved(res.data.some((r) => r._id === recipe._id));
    }).catch((err) => {
      console.error("Failed to check saved status:", err);
    });
  }, [recipe, user]);

  const handleSave = async () => {
    const previouslySaved = isSaved;
    // Optimistic: flip the UI immediately, revert if the request fails.
    setIsSaved(!previouslySaved);
    setSaving(true);
    try {
      if (previouslySaved) {
        await API.delete(`/recipes/unsave/${recipe._id}`);
      } else {
        await API.post(`/recipes/save/${recipe._id}`, {});
      }
    } catch {
      setIsSaved(previouslySaved);
      alert("Failed to update saved recipes.");
    } finally {
      setSaving(false);
    }
  };

  if (error) return <div className="page-container text-center text-red-600">{error}</div>;
  if (!recipe) return <div className="page-container text-center text-gray-600">Loading...</div>;

  const media = recipe.media || [];
  const activeMedia = media[activeMediaIndex];

  return (
    <div className="page-container max-w-2xl">
      <div className="card">
        <div className="detail-hero">
          {activeMedia ? (
            <img src={activeMedia.url} alt="" />
          ) : (
            <div className="detail-hero__placeholder" aria-hidden="true">🍽</div>
          )}
        </div>
        {media.length > 1 && (
          <div className="detail-hero-strip">
            {media.map((item, i) => (
              <img
                key={item.publicId || i}
                src={item.url}
                alt=""
                className={i === activeMediaIndex ? "is-active" : ""}
                onClick={() => setActiveMediaIndex(i)}
              />
            ))}
          </div>
        )}
        <h1 className="text-3xl font-bold text-green-700 mb-2">
          {recipe.title}
        </h1>
        {recipe.user?.username && (
          <Link to={`/users/${recipe.user._id}`} className="flex items-center gap-2 mb-4">
            {recipe.user.avatarUrl ? (
              <img src={recipe.user.avatarUrl} alt={recipe.user.username} className="avatar avatar-xs" />
            ) : (
              <span className="avatar avatar-xs">{recipe.user.username[0]?.toUpperCase()}</span>
            )}
            <span className="text-sm text-gray-500 hover:underline">by {recipe.user.username}</span>
          </Link>
        )}
        <HashtagText text={recipe.instructions} className="text-gray-700 mb-4" />
        <div className="mb-4">
          <h2 className="font-semibold text-lg mb-2">Ingredients</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            {recipe.ingredients.map((item, index) => (
              <li key={index}>
                {item.name} - {item.amount}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <LikeButton
            recipeId={recipe._id}
            initialLikeCount={recipe.likeCount || 0}
            initialLikedByMe={false}
          />
          <ShareButton
            recipeId={recipe._id}
            initialShareCount={recipe.shareCount || 0}
            initialSharedByMe={false}
          />
          {user ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className={isSaved ? "btn-danger" : "btn-primary"}
            >
              {isSaved ? "Unsave" : "Save"}
            </button>
          ) : (
            <Link to="/login" className="btn-primary">
              Log in to save
            </Link>
          )}
        </div>

        <div className="mt-3">
          <ReportButton targetType="recipe" targetId={recipe._id} />
        </div>

        <CommentSection
          recipeId={recipe._id}
          recipeOwnerId={recipe.user?._id}
          pinnedCommentId={recipe.pinnedComment}
        />
      </div>

      {moreFromUser.length > 0 && (
        <div className="rail">
          <h3 className="rail__title">More from {recipe.user?.username}</h3>
          <div className="rail__track">
            {moreFromUser.map((r) => (
              <div key={r._id} className="rail__card">
                <RecipeCard recipe={r} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeDetail;
