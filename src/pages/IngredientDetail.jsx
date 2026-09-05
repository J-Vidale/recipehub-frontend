import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Seo from "../components/Seo";
import Breadcrumbs from "../components/Breadcrumbs";
import MealGrid from "../components/MealGrid";
import { fetchMealsByIngredient, ingredientImage } from "../utils/mealdb";

const IngredientDetail = () => {
  const { name = "" } = useParams();
  const ingredient = decodeURIComponent(name);
  const [meals, setMeals] = useState([]);
  const [status, setStatus] = useState("loading");
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setImageFailed(false);
    fetchMealsByIngredient(ingredient)
      .then((list) => {
        if (cancelled) return;
        setMeals(list);
        setStatus(list.length ? "ready" : "empty");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [ingredient]);

  return (
    <div className="page-container max-w-6xl">
      <Seo
        title={`Recipes with ${ingredient}`}
        description={`Dishes that use ${ingredient}, with photos, full ingredient lists and step-by-step instructions.`}
      />
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Ingredients", to: "/ingredients" },
          { label: ingredient },
        ]}
      />

      <div className="ingredient-header">
        {!imageFailed && (
          <img
            className="ingredient-header__image"
            src={ingredientImage(ingredient, false)}
            alt=""
            onError={() => setImageFailed(true)}
          />
        )}
        <div>
          <h1 className="text-3xl font-bold text-green-700 mb-1">Recipes with {ingredient}</h1>
          {status === "ready" && (
            <p className="text-gray-600">
              {meals.length} {meals.length === 1 ? "dish uses" : "dishes use"} {ingredient}.
            </p>
          )}
        </div>
      </div>

      {status === "loading" && (
        <ul className="meal-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="skeleton" style={{ aspectRatio: "4 / 3", borderRadius: "0.75rem" }} />
          ))}
        </ul>
      )}

      {status === "error" && (
        <p className="text-gray-600">
          These recipes could not be loaded just now. Try again in a moment.
        </p>
      )}

      {status === "empty" && (
        <p className="text-gray-600">
          No dishes are recorded with {ingredient}.{" "}
          <Link to="/ingredients" className="underline">
            Pick another ingredient
          </Link>
          .
        </p>
      )}

      {status === "ready" && (
        <MealGrid
          items={meals.map((m) => ({ id: m.idMeal, title: m.strMeal, thumb: m.strMealThumb }))}
          linkTo={(id) => `/meals/${id}`}
        />
      )}
    </div>
  );
};

export default IngredientDetail;
