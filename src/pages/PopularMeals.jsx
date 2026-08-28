// src/pages/PopularMeals.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const PopularMeals = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopularMeals = async () => {
      try {
        const res = await fetch('https://www.themealdb.com/api/json/v1/1/filter.php?c=Beef');
        const data = await res.json();
        setMeals(data.meals.slice(0, 10)); // display top 10 beef meals as "popular"
      } catch (err) {
        console.error('Error fetching popular meals:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPopularMeals();
  }, []);

  return (
    <div className="page-container max-w-6xl">
      <h2 className="text-3xl font-bold text-green-700 mb-8 text-center">Popular Meals</h2>
      {loading ? (
        <p className="text-center text-gray-600">Loading...</p>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.isArray(meals) ? meals.map(meal => (
            <Link to={`/meals/${meal.idMeal}`} key={meal.idMeal} className="card card-hover overflow-hidden p-0">
              <img src={meal.strMealThumb} alt={meal.strMeal} loading="lazy" className="w-full h-40 object-cover" />
              <h3 className="font-semibold p-3">{meal.strMeal}</h3>
            </Link>
          )) : null}
        </div>
      )}
    </div>
  );
};

export default PopularMeals;
