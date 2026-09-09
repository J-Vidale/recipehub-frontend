import React from "react";
import { Link } from "react-router-dom";
import { UtensilsIcon, HeartIcon, CommentIcon } from "./icons";
import { recipeHeroImage, avatarImage } from "../lib/images";

// The newest recipe on the site, rendered large enough to be the reason
// somebody keeps reading.
//
// It is a real recipe with a real photograph rather than an illustration
// of one. That decision is the whole point: this is the only element on
// the front page that proves the site has anything in it, and a drawn
// mockup of a recipe card would prove the opposite.
//
// The image is the page's largest paint, so it is fetched eagerly at high
// priority - the opposite of the cards further down, which are lazy.
const FeaturedRecipe = ({ recipe }) => {
  const photo = recipe.media?.find((item) => item.type === "image")?.url;
  const likes = Number.isFinite(recipe.likeCount) ? recipe.likeCount : 0;
  const comments = Number.isFinite(recipe.commentCount) ? recipe.commentCount : 0;

  return (
    <Link to={`/recipes/${recipe._id}`} className="featured">
      <div className="featured__media">
        {photo ? (
          <img
            src={recipeHeroImage(photo)}
            alt={recipe.title}
            fetchPriority="high"
            decoding="async"
            width="1200"
            height="900"
          />
        ) : (
          <div className="featured__placeholder" aria-hidden="true">
            <UtensilsIcon size="2.5rem" />
          </div>
        )}
      </div>

      <div className="featured__body">
        <p className="featured__label">Newest recipe</p>
        <h2 className="featured__title">{recipe.title}</h2>
        <div className="featured__meta">
          {recipe.user?.username && (
            <span className="featured__author">
              {recipe.user.avatarUrl ? (
                <img
                  src={avatarImage(recipe.user.avatarUrl, 56)}
                  alt=""
                  className="avatar avatar-xs"
                />
              ) : (
                <span className="avatar avatar-xs">
                  {recipe.user.username[0]?.toUpperCase()}
                </span>
              )}
              {recipe.user.username}
            </span>
          )}
          {likes > 0 && (
            <span className="featured__stat">
              <HeartIcon />
              <span aria-hidden="true">{likes}</span>
              <span className="sr-only">{`${likes} like${likes === 1 ? "" : "s"}`}</span>
            </span>
          )}
          {comments > 0 && (
            <span className="featured__stat">
              <CommentIcon />
              <span aria-hidden="true">{comments}</span>
              <span className="sr-only">
                {`${comments} comment${comments === 1 ? "" : "s"}`}
              </span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default FeaturedRecipe;
