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

  if (loading) return <p>Loading meal...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="meal-detail">
      <h1>{meal.strMeal}</h1>
      <img
        src={meal.strMealThumb}
        alt={meal.strMeal}
        loading="lazy"
        style={{ maxWidth: "300px", borderRadius: "10px" }}
      />
      <p><strong>Category:</strong> {meal.strCategory}</p>
      <p><strong>Area:</strong> {meal.strArea}</p>
      <p><strong>Instructions:</strong></p>
      <p>{meal.strInstructions}</p>

      <h3>Ingredients</h3>
      <ul>
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

      {meal.strYoutube && (
        <div>
          <h3>Video Recipe</h3>
          <a href={meal.strYoutube} target="_blank" rel="noreferrer">
            Watch on YouTube
          </a>
        </div>
      )}
    </div>
  );
}

export default MealDetail;
