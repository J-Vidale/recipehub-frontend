// src/pages/PopularMeals.jsx
import React, { useEffect, useState } from 'react';

const PopularMeals = () => {
  const [meals, setMeals] = useState([]);

  useEffect(() => {
    const fetchPopularMeals = async () => {
      try {
        const res = await fetch('https://www.themealdb.com/api/json/v1/1/filter.php?c=Beef');
        const data = await res.json();
        setMeals(data.meals.slice(0, 10)); // display top 10 beef meals as "popular"
      } catch (err) {
        console.error('Error fetching popular meals:', err);
      }
    };
    fetchPopularMeals();
  }, []);

  return (
    <div className="popular-meals">
      <h2>Popular Meals</h2>
      <div className="meal-grid">
        {Array.isArray(meals) ? meals.map(meal => (
          <div key={meal.idMeal} className="meal-card">
            <h3>{meal.strMeal}</h3>
            <img src={meal.strMealThumb} alt={meal.strMeal} loading="lazy" />
          </div>
        )) : null}
      </div>
    </div>
  );
};

export default PopularMeals;
