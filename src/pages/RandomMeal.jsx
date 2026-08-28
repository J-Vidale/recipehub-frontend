import React, { useEffect, useState } from 'react';

const RandomMeal = () => {
  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRandomMeal = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
      const data = await res.json();
      setMeal(data.meals[0]);
    } catch (err) {
      console.error('Error fetching random meal:', err);
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

  if (!meal) return <p className="page-container text-center text-gray-600">Loading...</p>;

  return (
    <div className="page-container max-w-2xl">
      <div className="card">
        <h2 className="text-2xl font-bold text-green-700 mb-3">{meal.strMeal}</h2>
        <img
          src={meal.strMealThumb}
          alt={meal.strMeal}
          loading="lazy"
          className="w-full rounded-lg mb-4 object-cover max-h-80"
        />
        <p className="text-gray-700 mb-1"><strong>Category:</strong> {meal.strCategory}</p>
        <p className="text-gray-700 mb-4"><strong>Area:</strong> {meal.strArea}</p>
        <p className="text-gray-600 mb-4 whitespace-pre-line">{meal.strInstructions}</p>
        <div className="flex items-center gap-3">
          <button onClick={fetchRandomMeal} disabled={loading} className="btn-primary">
            {loading ? "Shuffling..." : "Shuffle again"}
          </button>
          <a href={meal.strSource} target="_blank" rel="noreferrer" className="text-green-700 hover:underline">
            Recipe Source
          </a>
        </div>
      </div>
    </div>
  );
};

export default RandomMeal;
