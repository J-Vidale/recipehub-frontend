import React from "react";
import { Link } from "react-router-dom";

// The shared recipe tile used by every grid in the app (Explore, tag
// pages, search, feed, profiles). Photo-forward - a food app's cards
// live or die on their imagery - with a soft gradient + initial letter
// fallback for recipes that don't have a photo yet.
const RecipeCard = ({ recipe }) => {
  const thumbnail = recipe.media?.[0]?.url;

  return (
    <Link to={`/recipes/${recipe._id}`} className="card recipe-card card-hover">
      <div className="recipe-card__media">
        {thumbnail ? (
          <img src={thumbnail} alt="" loading="lazy" />
        ) : (
          <div className="recipe-card__placeholder" aria-hidden="true">
            {recipe.title?.[0]?.toUpperCase() || "🍽"}
          </div>
        )}
        {recipe.category && <span className="recipe-card__badge">{recipe.category}</span>}
      </div>
      <div className="recipe-card__body">
        <h3 className="font-semibold text-gray-900 leading-snug">{recipe.title}</h3>
        {recipe.user?.username && (
          <div className="recipe-card__author">
            {recipe.user.avatarUrl ? (
              <img src={recipe.user.avatarUrl} alt="" className="avatar avatar-xs" />
            ) : (
              <span className="avatar avatar-xs">{recipe.user.username[0]?.toUpperCase()}</span>
            )}
            <span>{recipe.user.username}</span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default RecipeCard;
