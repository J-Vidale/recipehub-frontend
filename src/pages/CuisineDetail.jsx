import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Seo from "../components/Seo";
import Breadcrumbs from "../components/Breadcrumbs";
import MealGrid from "../components/MealGrid";
import { fetchMealsByArea } from "../utils/mealdb";

const CuisineDetail = () => {
  const { area = "" } = useParams();
  const cuisine = decodeURIComponent(area);
  const [meals, setMeals] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetchMealsByArea(cuisine)
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
  }, [cuisine]);

  const count = meals.length;

  return (
    <div className="page-container max-w-6xl">
      <Seo
        title={`${cuisine} Recipes`}
        description={`${cuisine} dishes with photos, full ingredient lists and step-by-step instructions.`}
      />
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Cuisines", to: "/cuisines" },
          { label: cuisine },
        ]}
      />

      <h1 className="text-3xl font-bold text-green-700 mb-2">{cuisine} recipes</h1>
      {status === "ready" && (
        <p className="text-gray-600 mb-8">
          {count} {count === 1 ? "dish" : "dishes"} filed under {cuisine}.
        </p>
      )}

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
          No dishes are filed under {cuisine}.{" "}
          <Link to="/cuisines" className="underline">
            Pick another cuisine
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

export default CuisineDetail;
