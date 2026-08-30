import React from "react";
import { Link } from "react-router-dom";
import { UtensilsIcon } from "./icons";
import { recipeCardImage, avatarImage } from "../lib/images";

// The shared recipe tile used by every grid in the app (Explore, tag
// pages, search, feed, profiles). Photo-forward - a food app's cards
// live or die on their imagery - with a soft gradient + initial letter
// fallback for recipes that don't have a photo yet. `actions`, when
// given, renders as a footer row of buttons outside the clickable link
// (Your Recipes' Edit/Delete) rather than nested inside it.
const RecipeCard = ({ recipe, actions }) => {
  const thumbnail = recipe.media?.[0]?.url;

  return (
    <div className="card recipe-card card-hover">
      <Link to={`/recipes/${recipe._id}`} className="recipe-card__link">
        <div className="recipe-card__media">
          {thumbnail ? (
            <img
              src={recipeCardImage(thumbnail)}
              alt={recipe.title}
              loading="lazy"
              decoding="async"
              width="600"
              height="450"
            />
          ) : (
            <div className="recipe-card__placeholder" aria-hidden="true">
              {recipe.title?.[0]?.toUpperCase() || <UtensilsIcon size="2rem" />}
            </div>
          )}
          {recipe.category && <span className="recipe-card__badge">{recipe.category}</span>}
        </div>
        <div className="recipe-card__body">
          <h3 className="font-semibold text-gray-900 leading-snug">{recipe.title}</h3>
          {recipe.user?.username && (
            <div className="recipe-card__author">
              {recipe.user.avatarUrl ? (
                <img src={avatarImage(recipe.user.avatarUrl, 56)} alt="" className="avatar avatar-xs" loading="lazy" />
              ) : (
                <span className="avatar avatar-xs">{recipe.user.username[0]?.toUpperCase()}</span>
              )}
              <span>{recipe.user.username}</span>
            </div>
          )}
        </div>
      </Link>
      {actions && <div className="recipe-card__actions">{actions}</div>}
    </div>
  );
};

export default RecipeCard;
