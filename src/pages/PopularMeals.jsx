// src/pages/PopularMeals.jsx
import React, { useEffect, useState } from 'react';
import MealRail from '../components/MealRail';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import { fetchMealsByCategory, fetchDrinksByCategory } from '../utils/mealdb';

// A fixed, curated subset rather than every category TheMealDB has (60+)
// - enough variety for a genuine "browse by section" feel without an
// overwhelming wall of rails or 15+ API calls on page load.
const MEAL_SECTIONS = ["Beef", "Chicken", "Dessert", "Seafood", "Vegetarian", "Pasta"];
const DRINK_SECTIONS = ["Cocktail", "Ordinary Drink"];

const PopularMeals = () => {
  const [mealSections, setMealSections] = useState({});
  const [drinkSections, setDrinkSections] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const mealResults = await Promise.all(
          MEAL_SECTIONS.map((category) => fetchMealsByCategory(category))
        );
        setMealSections(Object.fromEntries(MEAL_SECTIONS.map((c, i) => [c, mealResults[i]])));

        const drinkResults = await Promise.all(
          DRINK_SECTIONS.map((category) => fetchDrinksByCategory(category))
        );
        setDrinkSections(Object.fromEntries(DRINK_SECTIONS.map((c, i) => [c, drinkResults[i]])));
      } catch (err) {
        console.error('Error fetching popular meals/drinks:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  return (
    <div className="page-container max-w-6xl">
      <Seo
        title="Popular Meals and Drinks"
        description="Browse popular dishes by category - beef, chicken, dessert, seafood, vegetarian and pasta - plus cocktails and everyday drinks, with photos and full recipes."
      />
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Popular meals and drinks" }]} />
      <h1 className="text-3xl font-bold text-green-700 mb-8 text-center">Popular Meals &amp; Drinks</h1>
      {loading ? (
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton h-5 w-40 mb-3" />
              <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="skeleton flex-shrink-0" style={{ width: "13rem", aspectRatio: "4 / 3" }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {MEAL_SECTIONS.map((category) => (
            <MealRail
              key={category}
              title={category}
              items={(mealSections[category] || []).map((m) => ({ id: m.idMeal, title: m.strMeal, thumb: m.strMealThumb }))}
              linkTo={(id) => `/meals/${id}`}
            />
          ))}
          {DRINK_SECTIONS.map((category) => (
            <MealRail
              key={category}
              title={category === "Ordinary Drink" ? "Drinks" : category}
              items={(drinkSections[category] || []).map((d) => ({ id: d.idDrink, title: d.strDrink, thumb: d.strDrinkThumb }))}
              linkTo={(id) => `/drinks/${id}`}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default PopularMeals;
