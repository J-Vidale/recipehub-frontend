import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../services/api";
import { refusalMessage } from "../lib/refusalMessage";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import LikeButton from "../components/LikeButton";
import ShareButton from "../components/ShareButton";
import CommentSection from "../components/CommentSection";
import ReportButton from "../components/ReportButton";
import NutritionPanel from "../components/NutritionPanel";
import HashtagText from "../components/HashtagText";
import RecipeCard from "../components/RecipeCard";
import Seo from "../components/Seo";
import Breadcrumbs from "../components/Breadcrumbs";
import { UtensilsIcon } from "../components/icons";
import { recipeHeroImage, recipeThumbImage, avatarImage } from "../lib/images";
import { communityRecipeSchema } from "../lib/structuredData";
import { asArray } from '../lib/apiShape';

const RecipeDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
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
      .then((res) => setMoreFromUser(asArray(res.data?.recipes).filter((r) => r._id !== recipe._id)))
      .catch((err) => console.error("Failed to fetch more recipes from this user:", err));
  }, [recipe]);

  // The recipe itself says whether this reader has saved it. This used to
  // fetch the whole saved list - every saved recipe, fully populated, with
  // no limit - and search it for one id, which on a well-used account
  // meant downloading hundreds of recipes to decide whether one button
  // said "Save" or "Unsave".
  useEffect(() => {
    setIsSaved(Boolean(recipe?.savedByMe));
  }, [recipe]);

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
      toast.success(previouslySaved ? "Removed from saved recipes." : "Saved to your recipes.");
    } catch (err) {
      setIsSaved(previouslySaved);
      toast.error(refusalMessage(err) || "Failed to update saved recipes.");
    } finally {
      setSaving(false);
    }
  };

  if (error) return <div className="page-container max-w-2xl text-center text-danger">{error}</div>;
  if (!recipe) return <div className="page-container max-w-2xl text-center text-soft">Loading...</div>;

  const media = recipe.media || [];
  const activeMedia = media[activeMediaIndex];

  const summary = recipe.instructions
    ? `${recipe.instructions.slice(0, 155)}${recipe.instructions.length > 155 ? "..." : ""}`
    : `${recipe.title} - a recipe shared on RecipeHub${recipe.user?.username ? ` by ${recipe.user.username}` : ""}.`;

  return (
    <div className="page-container max-w-2xl">
      <Seo
        title={recipe.title}
        description={summary}
        image={media[0]?.url}
        structuredData={communityRecipeSchema(recipe, `/recipes/${recipe._id}`)}
      />
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Explore", to: "/explore" },
          ...(recipe.user?.username
            ? [{ label: recipe.user.username, to: `/users/${recipe.user._id}` }]
            : []),
          { label: recipe.title },
        ]}
      />
      <div className="card">
        <div className="detail-hero">
          {activeMedia ? (
            <img
              src={recipeHeroImage(activeMedia.url)}
              alt={recipe.title}
              fetchPriority="high"
              decoding="async"
            />
          ) : (
            <div className="detail-hero__placeholder" aria-hidden="true"><UtensilsIcon size="4rem" /></div>
          )}
        </div>
        {media.length > 1 && (
          /* Buttons, not images with an onClick. An <img onClick> has no
             role, no tab stop and no keyboard handler, so choosing a photo
             was mouse-only and a screen reader had nothing to announce.
             The image inside is decorative once the button is named. */
          <div className="detail-hero-strip" role="group" aria-label="Photos">
            {media.map((item, i) => (
              <button
                key={item.publicId || i}
                type="button"
                aria-label={`Show photo ${i + 1} of ${media.length}`}
                aria-pressed={i === activeMediaIndex}
                className={i === activeMediaIndex ? "is-active" : ""}
                onClick={() => setActiveMediaIndex(i)}
              >
                <img src={recipeThumbImage(item.url)} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}
        <h1 className="content-title mb-2">
          {recipe.title}
        </h1>
        {recipe.user?.username && (
          <Link to={`/users/${recipe.user._id}`} className="flex items-center gap-2 mb-4">
            {recipe.user.avatarUrl ? (
              <img src={avatarImage(recipe.user.avatarUrl, 56)} alt="" className="avatar avatar-xs" loading="lazy" />
            ) : (
              <span className="avatar avatar-xs">{recipe.user.username[0]?.toUpperCase()}</span>
            )}
            <span className="text-sm text-muted hover:underline min-w-0 break-words">by {recipe.user.username}</span>
          </Link>
        )}
        <HashtagText text={recipe.instructions} className="text-strong mb-4" />
        <div className="mb-4">
          <h2 className="font-semibold text-lg mb-2">Ingredients</h2>
          <ul className="list-disc list-inside text-strong space-y-1">
            {recipe.ingredients.map((item, index) => (
              <li key={index}>
                {item.name} - {item.amount}
              </li>
            ))}
          </ul>
        </div>

        {/* Member recipes store {name, amount}; the panel works in the
            {ingredient, measure} shape the external sources use. */}
        <NutritionPanel
          ingredients={recipe.ingredients.map((item) => ({
            ingredient: item.name,
            measure: item.amount,
          }))}
        />
        <div className="flex items-center gap-3 flex-wrap">
          <LikeButton
            recipeId={recipe._id}
            initialLikeCount={recipe.likeCount || 0}
            initialLikedByMe={Boolean(recipe.likedByMe)}
          />
          <ShareButton
            recipeId={recipe._id}
            initialShareCount={recipe.shareCount || 0}
            initialSharedByMe={Boolean(recipe.sharedByMe)}
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
          <ReportButton targetType="recipe" targetId={recipe._id} ownerId={recipe.user?._id} />
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
