import React, { useEffect, useState } from 'react';

const RandomMeal = () => {
  const [meal, setMeal] = useState(null);

  useEffect(() => {
    const fetchRandomMeal = async () => {
      try {
        const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
        const data = await res.json();
        setMeal(data.meals[0]);
      } catch (err) {
        console.error('Error fetching random meal:', err);
      }
    };
    fetchRandomMeal();
  }, []);

  if (!meal) return <p>Loading...</p>;

  return (
    <div className="random-meal">
      <h2>{meal.strMeal}</h2>
      <img src={meal.strMealThumb} alt={meal.strMeal} loading="lazy" />
      <p><strong>Category:</strong> {meal.strCategory}</p>
      <p><strong>Area:</strong> {meal.strArea}</p>
      <p>{meal.strInstructions}</p>
      <a href={meal.strSource} target="_blank" rel="noreferrer">Recipe Source</a>
    </div>
  );
};

export default RandomMeal;
