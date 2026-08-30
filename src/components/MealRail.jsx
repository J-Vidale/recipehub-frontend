import React from "react";
import { Link } from "react-router-dom";

// A horizontally scrollable row of external (TheMealDB/TheCocktailDB)
// items - the "keep exploring" pattern used on PopularMeals, RandomMeal,
// and MealDetail so a single-item page always has somewhere to scroll
// next instead of dead-ending after one photo and a paragraph.
const MealRail = ({ title, items, linkTo }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="rail">
      <h3 className="rail__title">{title}</h3>
      <div className="rail__track">
        {items.map((item) => (
          <Link key={item.id} to={linkTo(item.id)} className="rail__card">
            <div className="rail__card-media">
              <img src={item.thumb} alt={item.title} loading="lazy" />
            </div>
            <p className="rail__card-title">{item.title}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MealRail;
