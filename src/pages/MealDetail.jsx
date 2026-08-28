import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function MealDetail() {
  const { id } = useParams();
  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMeal = async () => {
      try {
        const res = await fetch(
          `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
        );
        const data = await res.json();
        if (data.meals && data.meals.length > 0) {
          setMeal(data.meals[0]);
        } else {
          setError("Meal not found.");
        }
      } catch {
        setError("Failed to fetch meal.");
      } finally {
        setLoading(false);
      }
    };

    fetchMeal();
  }, [id]);

  if (loading) return <p className="page-container text-center text-gray-600">Loading meal...</p>;
  if (error) return <p className="page-container text-center text-red-600">{error}</p>;

  return (
    <div className="page-container max-w-2xl">
      <div className="card">
        <div className="detail-hero">
          <img src={meal.strMealThumb} alt={meal.strMeal} loading="lazy" />
        </div>
        <h1 className="text-2xl font-bold text-green-700 mb-3">{meal.strMeal}</h1>
        <div className="flex gap-2 mb-4">
          <span className="recipe-card__badge" style={{ position: "static" }}>{meal.strCategory}</span>
          <span className="recipe-card__badge" style={{ position: "static" }}>{meal.strArea}</span>
        </div>

        <h3 className="font-semibold text-lg mb-2">Ingredients</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
          {Array.from({ length: 20 }).map((_, i) => {
            const ingredient = meal[`strIngredient${i + 1}`];
            const measure = meal[`strMeasure${i + 1}`];
            if (ingredient && ingredient.trim()) {
              return (
                <li key={i}>
                  {ingredient} - {measure}
                </li>
              );
            }
            return null;
          })}
        </ul>

        <h3 className="font-semibold text-lg mb-2">Instructions</h3>
        <p className="text-gray-600 whitespace-pre-line mb-4">{meal.strInstructions}</p>

        {meal.strYoutube && (
          <a href={meal.strYoutube} target="_blank" rel="noreferrer" className="btn-primary inline-flex">
            Watch on YouTube
          </a>
        )}
      </div>
    </div>
  );
}

export default MealDetail;
