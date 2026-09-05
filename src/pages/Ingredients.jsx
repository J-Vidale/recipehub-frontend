import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import Breadcrumbs from "../components/Breadcrumbs";
import { fetchIngredients, ingredientImage } from "../utils/mealdb";

// The whole ingredient list arrives in one request, so filtering happens
// here rather than over the network. Typing stays instant and TheMealDB
// gets one call per visit instead of one per keystroke.
const VISIBLE_STEP = 60;

// Not every ingredient has a photo. Rather than leave a broken image
// icon, the tile drops to its first letter, which keeps the grid even.
const IngredientTile = ({ name }) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Link to={`/ingredients/${encodeURIComponent(name)}`} className="ingredient-tile card-hover">
      <div className="ingredient-tile__media">
        {imageFailed ? (
          <span className="ingredient-tile__fallback" aria-hidden="true">
            {name.charAt(0)}
          </span>
        ) : (
          <img
            src={ingredientImage(name)}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        )}
      </div>
      <span className="ingredient-tile__name">{name}</span>
    </Link>
  );
};

const Ingredients = () => {
  const [all, setAll] = useState([]);
  const [status, setStatus] = useState("loading");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(VISIBLE_STEP);

  useEffect(() => {
    let cancelled = false;
    fetchIngredients()
      .then((list) => {
        if (cancelled) return;
        setAll(list);
        setStatus(list.length ? "ready" : "empty");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((item) => item.name.toLowerCase().includes(q));
  }, [all, query]);

  useEffect(() => {
    setVisible(VISIBLE_STEP);
  }, [query]);

  return (
    <div className="page-container max-w-6xl">
      <Seo
        title="Browse Recipes by Ingredient"
        description="Search the ingredient list and see which dishes use what you already have in the cupboard."
      />
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Ingredients" }]} />

      <h1 className="text-3xl font-bold text-green-700 mb-2">Browse by ingredient</h1>
      <p className="text-gray-600 mb-6 max-w-2xl">
        Find something you already have, and see what you can make with it.
      </p>

      <label htmlFor="ingredient-filter" className="sr-only">
        Filter ingredients
      </label>
      <input
        id="ingredient-filter"
        type="text"
        className="input mb-6 max-w-sm"
        placeholder="Filter ingredients"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={status !== "ready"}
      />

      {status === "loading" && (
        <ul className="ingredient-grid">
          {Array.from({ length: 18 }).map((_, i) => (
            <li key={i} className="skeleton" style={{ height: "8rem", borderRadius: "0.75rem" }} />
          ))}
        </ul>
      )}

      {status === "error" && (
        <p className="text-gray-600">
          The ingredient list could not be loaded just now. Try again in a moment.
        </p>
      )}

      {status === "ready" && (
        <>
          <p className="text-sm text-gray-500 mb-4" role="status">
            {matches.length === all.length
              ? `${all.length} ingredients`
              : `${matches.length} of ${all.length} ingredients match "${query.trim()}"`}
          </p>

          {matches.length === 0 ? (
            <p className="text-gray-600">Nothing matches that. Try a shorter word.</p>
          ) : (
            <>
              <ul className="ingredient-grid">
                {matches.slice(0, visible).map((item) => (
                  <li key={item.name}>
                    <IngredientTile name={item.name} />
                  </li>
                ))}
              </ul>

              {visible < matches.length && (
                <div className="text-center mt-8">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setVisible((v) => v + VISIBLE_STEP)}
                  >
                    Show more ingredients
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Ingredients;
