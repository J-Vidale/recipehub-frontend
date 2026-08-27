// src/pages/Meals.jsx
import React, { useState } from "react";
import axios from "axios";

const Meals = () => {
  const [search, setSearch] = useState("");
  const [meals, setMeals] = useState([]);

  const handleSearch = async () => {
    try {
      const res = await axios.get(`https://www.themealdb.com/api/json/v1/1/search.php?s=${search}`);
      setMeals(res.data.meals || []);
    } catch (error) {
      console.error("Error fetching meals:", error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Search Meals</h2>
      <div className="flex mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="border p-2 rounded-l w-full"
        />
        <button onClick={handleSearch} className="bg-green-600 text-white px-4 rounded-r">
          Search
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {meals.map((meal) => (
          <div key={meal.idMeal} className="border p-4 rounded shadow">
            <img src={meal.strMealThumb} alt={meal.strMeal} loading="lazy" className="w-full h-32 object-cover rounded mb-2" />
            <h3 className="font-semibold text-center">{meal.strMeal}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Meals;