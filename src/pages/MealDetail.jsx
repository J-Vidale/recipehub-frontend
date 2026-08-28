import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MealRail from "../components/MealRail";
import { fetchMealsByCategory, extractIngredients, youtubeEmbedUrl } from "../utils/mealdb";

function MealDetail() {
  const { id } = useParams();
  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    const fetchMeal = async () => {
      setLoading(true);
      setError(null);
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

  useEffect(() => {
    if (!meal?.strCategory) return;
    fetchMealsByCategory(meal.strCategory)
      .then((meals) => setRelated(meals.filter((m) => m.idMeal !== id)))
      .catch((err) => console.error("Failed to fetch related meals:", err));
  }, [meal?.strCategory, id]);

  if (loading) return <p className="page-container text-center text-gray-600">Loading meal...</p>;
  if (error) return <p className="page-container text-center text-red-600">{error}</p>;

  const ingredients = extractIngredients(meal);
  const embedUrl = youtubeEmbedUrl(meal.strYoutube);

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

        {embedUrl && (
          <div className="video-embed">
            <iframe
              src={embedUrl}
              title={`${meal.strMeal} cooking video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        <h3 className="font-semibold text-lg mb-2">Ingredients</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
          {ingredients.map(({ ingredient, measure }, i) => (
            <li key={i}>
              {ingredient}{measure ? ` - ${measure}` : ""}
            </li>
          ))}
        </ul>

        <h3 className="font-semibold text-lg mb-2">Instructions</h3>
        <p className="text-gray-600 whitespace-pre-line mb-4">{meal.strInstructions}</p>

        {!embedUrl && meal.strYoutube && (
          <a href={meal.strYoutube} target="_blank" rel="noreferrer" className="btn-primary inline-flex">
            Watch on YouTube
          </a>
        )}
      </div>

      <MealRail
        title={`More ${meal.strCategory}`}
        items={related.map((m) => ({ id: m.idMeal, title: m.strMeal, thumb: m.strMealThumb }))}
        linkTo={(mid) => `/meals/${mid}`}
      />
    </div>
  );
}

export default MealDetail;
