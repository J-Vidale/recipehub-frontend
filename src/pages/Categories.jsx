// src/pages/Categories.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const Categories = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("https://www.themealdb.com/api/json/v1/1/categories.php");
        setCategories(res.data.categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Meal Categories</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {Array.isArray(categories) ? (
          categories.map((cat) => (
            <div key={cat.idCategory} className="border p-4 rounded shadow hover:shadow-lg transition">
              <img src={cat.strCategoryThumb} alt={cat.strCategory} loading="lazy" className="w-full h-32 object-cover rounded mb-2" />
              <h3 className="font-semibold text-lg">{cat.strCategory}</h3>
              <p className="text-sm text-gray-600">{cat.strCategoryDescription.slice(0, 100)}...</p>
            </div>
          ))
        ) : null}
      </div>
    </div>
  );
};

export default Categories;