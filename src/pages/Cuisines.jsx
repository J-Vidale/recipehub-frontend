import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import Breadcrumbs from "../components/Breadcrumbs";
import Reveal from "../components/Reveal";
import { fetchCuisines } from "../utils/mealdb";

// The index deliberately makes no per-cuisine request. Fetching a sample
// dish for each of the ~28 areas would mean 28 round trips before the
// page could paint; the tiles carry their own colour instead, derived
// from the name so a cuisine always looks the same on every visit.
const tileHue = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % 360;
  }
  return hash;
};

const Cuisines = () => {
  const [cuisines, setCuisines] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    fetchCuisines()
      .then((list) => {
        if (cancelled) return;
        setCuisines(list);
        setStatus(list.length ? "ready" : "empty");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page-container max-w-6xl">
      <Seo
        title="Browse Recipes by Cuisine"
        description="Browse dishes by where they come from. Pick a cuisine to see its recipes, with photos, ingredients and step-by-step instructions."
      />
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Cuisines" }]} />

      <h1 className="text-3xl font-bold text-green-700 mb-2">Browse by cuisine</h1>
      <p className="text-gray-600 mb-8 max-w-2xl">
        Pick a country or region to see the dishes filed under it.
      </p>

      {status === "loading" && (
        <ul className="tile-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <li key={i} className="skeleton" style={{ height: "7rem", borderRadius: "0.75rem" }} />
          ))}
        </ul>
      )}

      {status === "error" && (
        <p className="text-gray-600">
          The cuisine list could not be loaded just now. Try again in a moment.
        </p>
      )}

      {status === "empty" && <p className="text-gray-600">No cuisines were returned.</p>}

      {status === "ready" && (
        <ul className="tile-grid">
          {cuisines.map((cuisine, index) => (
            <Reveal
              as="li"
              key={cuisine}
              delay={Math.min(index, 10) * 35}
              className="tile-grid__item"
            >
              <Link
                to={`/cuisines/${encodeURIComponent(cuisine)}`}
                className="tile"
                style={{ "--tile-hue": tileHue(cuisine) }}
              >
                <span className="tile__label">{cuisine}</span>
              </Link>
            </Reveal>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Cuisines;
