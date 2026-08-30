import React, { useEffect, useState } from 'react';
import MealRail from '../components/MealRail';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import { fetchSomeMeals, youtubeEmbedUrl } from '../utils/mealdb';

const RandomMeal = () => {
  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moreMeals, setMoreMeals] = useState([]);

  const fetchRandomMeal = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const data = await res.json();
      // TheMealDB signals "nothing to return" with {"meals": null} rather
      // than an error status, so the array has to be checked before it is
      // indexed - otherwise the page throws and sits on "Loading..."
      // forever with nothing shown to the reader.
      const next = data?.meals?.[0];
      if (!next) throw new Error('No meal returned');
      setMeal(next);
    } catch (err) {
      console.error('Error fetching random meal:', err);
      setError("We couldn't fetch a random meal just now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Only runs once on mount - the "Shuffle again" button below calls the
  // same function to get a new meal without needing to leave and
  // re-enter this page (that was the bug: nothing else ever re-triggered
  // this effect).
  useEffect(() => {
    fetchRandomMeal();
  }, []);

  useEffect(() => {
    fetchSomeMeals(10)
      .then(setMoreMeals)
      .catch((err) => console.error('Failed to fetch more meals:', err));
  }, []);

  if (!meal) {
    return (
      <div className="page-container max-w-2xl text-center">
        <Seo
          title="Random Meal"
          description="Not sure what to cook? Get a randomly picked recipe with photo, ingredients and step-by-step instructions."
        />
        <h1 className="text-2xl font-bold text-green-700 mb-3">Random Meal</h1>
        {error ? (
          <>
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={fetchRandomMeal} disabled={loading} className="btn-primary">
              {loading ? "Trying again..." : "Try again"}
            </button>
          </>
        ) : (
          <p className="text-gray-600">Finding you something to cook...</p>
        )}
      </div>
    );
  }

  const embedUrl = youtubeEmbedUrl(meal.strYoutube);

  return (
    <div className="page-container max-w-2xl">
      <Seo
        title="Random Meal"
        description="Not sure what to cook? Get a randomly picked recipe with photo, ingredients and step-by-step instructions, and reshuffle until something looks good."
      />
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Random meal" }]} />
      <div className="card">
        <div className="detail-hero">
          <img src={meal.strMealThumb} alt={`${meal.strMeal}, a ${meal.strArea} ${meal.strCategory.toLowerCase()} dish`} loading="lazy" />
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
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
              allowFullScreen
            />
          </div>
        )}
        <p className="text-gray-600 mb-4 whitespace-pre-line">{meal.strInstructions}</p>
        <div className="flex items-center gap-3 mb-2">
          <button onClick={fetchRandomMeal} disabled={loading} className="btn-primary">
            {loading ? "Shuffling..." : "Shuffle again"}
          </button>
          <a href={meal.strSource} target="_blank" rel="noreferrer" className="text-green-700 hover:underline">
            Recipe Source
          </a>
        </div>
      </div>

      <MealRail title="Keep exploring" items={moreMeals.map((m) => ({ id: m.idMeal, title: m.strMeal, thumb: m.strMealThumb }))} linkTo={(id) => `/meals/${id}`} />
    </div>
  );
};

export default RandomMeal;
