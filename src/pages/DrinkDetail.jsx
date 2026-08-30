import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MealRail from "../components/MealRail";
import Seo from "../components/Seo";
import Breadcrumbs from "../components/Breadcrumbs";
import { drinkRecipeSchema } from "../lib/structuredData";
import { fetchDrinkById, fetchDrinksByCategory, extractIngredients } from "../utils/mealdb";

function DrinkDetail() {
  const { id } = useParams();
  const [drink, setDrink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchDrinkById(id)
      .then((data) => {
        if (data) setDrink(data);
        else setError("Drink not found.");
      })
      .catch(() => setError("Failed to fetch drink."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!drink?.strCategory) return;
    fetchDrinksByCategory(drink.strCategory)
      .then((drinks) => setRelated(drinks.filter((d) => d.idDrink !== id)))
      .catch((err) => console.error("Failed to fetch related drinks:", err));
  }, [drink?.strCategory, id]);

  if (loading) return <p className="page-container text-center text-gray-600">Loading drink...</p>;
  if (error) return <p className="page-container text-center text-red-600">{error}</p>;

  const ingredients = extractIngredients(drink, 15);

  return (
    <div className="page-container max-w-2xl">
      <Seo
        title={drink.strDrink}
        description={`How to make a ${drink.strDrink}${drink.strCategory ? `, a ${drink.strCategory.toLowerCase()}` : ""}. Full ingredient list, measurements and mixing instructions.`}
        image={drink.strDrinkThumb}
        structuredData={drinkRecipeSchema(drink, `/drinks/${id}`)}
      />
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Popular drinks", to: "/popular-meals" },
          { label: drink.strDrink },
        ]}
      />
      <div className="card">
        <div className="detail-hero">
          <img
            src={drink.strDrinkThumb}
            alt={`${drink.strDrink}${drink.strGlass ? ` served in a ${drink.strGlass.toLowerCase()}` : ""}`}
            loading="lazy"
          />
        </div>
        <h1 className="text-2xl font-bold text-green-700 mb-3">{drink.strDrink}</h1>
        <div className="flex gap-2 mb-4">
          {drink.strCategory && (
            <span className="recipe-card__badge" style={{ position: "static" }}>{drink.strCategory}</span>
          )}
          {drink.strAlcoholic && (
            <span className="recipe-card__badge" style={{ position: "static" }}>{drink.strAlcoholic}</span>
          )}
          {drink.strGlass && (
            <span className="recipe-card__badge" style={{ position: "static" }}>{drink.strGlass}</span>
          )}
        </div>

        <h3 className="font-semibold text-lg mb-2">Ingredients</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
          {ingredients.map(({ ingredient, measure }, i) => (
            <li key={i}>
              {ingredient}{measure ? ` - ${measure}` : ""}
            </li>
          ))}
        </ul>

        <h3 className="font-semibold text-lg mb-2">Instructions</h3>
        <p className="text-gray-600 whitespace-pre-line mb-4">{drink.strInstructions}</p>
      </div>

      <MealRail
        title={`More ${drink.strCategory}`}
        items={related.map((d) => ({ id: d.idDrink, title: d.strDrink, thumb: d.strDrinkThumb }))}
        linkTo={(did) => `/drinks/${did}`}
      />
    </div>
  );
}

export default DrinkDetail;
