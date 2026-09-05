// Thin wrappers around TheMealDB and TheCocktailDB's free, keyless
// ("1" is their shared public test key, not a secret) REST APIs. Kept in
// one place so every page that pulls external meal/drink data goes
// through the same fetch/parse shape instead of duplicating it.

const MEAL_BASE = "https://www.themealdb.com/api/json/v1/1";
const COCKTAIL_BASE = "https://www.thecocktaildb.com/api/json/v1/1";

export const fetchMealCategories = async () => {
  const res = await fetch(`${MEAL_BASE}/categories.php`);
  const data = await res.json();
  return data.categories || [];
};

export const fetchMealsByCategory = async (category, limit = 12) => {
  const res = await fetch(`${MEAL_BASE}/filter.php?c=${encodeURIComponent(category)}`);
  const data = await res.json();
  return (data.meals || []).slice(0, limit);
};

export const fetchMealsByLetter = async (letter) => {
  const res = await fetch(`${MEAL_BASE}/search.php?f=${letter}`);
  const data = await res.json();
  return data.meals || [];
};

// Not every letter has meals starting with it - tries a handful of
// random letters and returns the first non-empty result, so callers get
// a reliably non-empty "explore more" list without needing their own
// retry logic.
export const fetchSomeMeals = async (count = 10) => {
  const letters = "abcdefghijklmnopqrstuvwxyz".split("");
  for (let attempt = 0; attempt < 5; attempt++) {
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const meals = await fetchMealsByLetter(letter);
    if (meals.length > 0) return meals.slice(0, count);
  }
  return [];
};

export const fetchDrinksByCategory = async (category, limit = 12) => {
  const res = await fetch(`${COCKTAIL_BASE}/filter.php?c=${encodeURIComponent(category)}`);
  const data = await res.json();
  return (data.drinks || []).slice(0, limit);
};

export const fetchDrinkById = async (id) => {
  const res = await fetch(`${COCKTAIL_BASE}/lookup.php?i=${id}`);
  const data = await res.json();
  return data.drinks?.[0] || null;
};

// Every strIngredientN/strMeasureN pair TheMealDB/TheCocktailDB flatten
// onto the object (up to 20 for meals, 15 for drinks) - collects the
// non-empty ones into a clean list instead of the caller writing the
// same Array.from({length: N}) loop everywhere it's needed.
export const extractIngredients = (item, max = 20) => {
  const list = [];
  for (let i = 1; i <= max; i++) {
    const ingredient = item[`strIngredient${i}`];
    const measure = item[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      list.push({ ingredient: ingredient.trim(), measure: measure?.trim() || "" });
    }
  }
  return list;
};

// TheMealDB stores a normal watch URL (youtube.com/watch?v=XXXX); the
// embeddable player needs youtube.com/embed/XXXX instead.
export const youtubeEmbedUrl = (watchUrl) => {
  if (!watchUrl) return null;
  const match = watchUrl.match(/[?&]v=([^&]+)/);
  if (!match) return null;
  return `https://www.youtube.com/embed/${match[1]}`;
};

// --- Browsing dimensions ---------------------------------------------
// TheMealDB exposes more than the category filter the site started with.
// Cuisine and ingredient are the two that turn a flat list of dishes into
// something you can actually explore, and both come from the same keyless
// endpoints already in use here.

// "Unknown" is a real value in their area list and means the dish has no
// recorded cuisine, so it is dropped rather than shown as a place.
export const fetchCuisines = async () => {
  const res = await fetch(`${MEAL_BASE}/list.php?a=list`);
  const data = await res.json();
  return (data.meals || [])
    .map((row) => row.strArea)
    .filter((area) => area && area !== "Unknown")
    .sort((a, b) => a.localeCompare(b));
};

export const fetchMealsByArea = async (area, limit = 60) => {
  const res = await fetch(`${MEAL_BASE}/filter.php?a=${encodeURIComponent(area)}`);
  const data = await res.json();
  return (data.meals || []).slice(0, limit);
};

// Around 575 ingredients, each with a short description. One request, so
// the index page filters client-side rather than querying per keystroke.
export const fetchIngredients = async () => {
  const res = await fetch(`${MEAL_BASE}/list.php?i=list`);
  const data = await res.json();
  return (data.meals || [])
    .filter((row) => row.strIngredient)
    .map((row) => ({
      name: row.strIngredient,
      description: row.strDescription || "",
    }))
    // Sorted here rather than trusting the upstream order, so the grid
    // reads alphabetically and a given ingredient keeps its position.
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const fetchMealsByIngredient = async (ingredient, limit = 60) => {
  const res = await fetch(`${MEAL_BASE}/filter.php?i=${encodeURIComponent(ingredient)}`);
  const data = await res.json();
  return (data.meals || []).slice(0, limit);
};

// Ingredient photos live on a predictable path rather than behind an
// endpoint. "-Small" is roughly 100px, the plain name is full size; there
// is no medium. Not every ingredient has an image, so callers should
// treat a broken load as normal (see IngredientTile).
export const ingredientImage = (name, small = true) =>
  `https://www.themealdb.com/images/ingredients/${encodeURIComponent(name)}${small ? "-Small" : ""}.png`;

// TheCocktailDB splits its catalogue the same way. Alcoholic and
// non-alcoholic is the split people actually browse by.
export const fetchDrinksByAlcoholic = async (kind, limit = 24) => {
  const res = await fetch(`${COCKTAIL_BASE}/filter.php?a=${encodeURIComponent(kind)}`);
  const data = await res.json();
  return (data.drinks || []).slice(0, limit);
};
