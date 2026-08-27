// src/pages/Explore.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';

const Explore = () => {
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    const fetchAllRecipes = async () => {
      try {
        const res = await API.get('/recipes');
        setRecipes(res.data.recipes);
      } catch (err) {
        console.error('Error fetching recipes:', err);
      }
    };
    fetchAllRecipes();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <h2 className="text-3xl font-bold text-green-700 mb-8 text-center">Explore Recipes</h2>
      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.isArray(recipes) ? (
          recipes.map(recipe => (
            <Link to={`/recipes/${recipe._id}`} key={recipe._id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition flex flex-col">
              <h3 className="text-xl font-semibold mb-2">{recipe.title}</h3>
              <p className="text-gray-600 flex-1">{recipe.instructions?.slice(0, 100)}...</p>
            </Link>
          ))
        ) : null}
      </div>
    </div>
  );
};

export default Explore;
