import { absoluteUrl, SITE_NAME } from "./site";

// schema.org/Recipe payloads. Search engines use these for recipe rich
// results (photo, author, ratings), so the field names below follow the
// spec rather than our internal shapes.

/** Reference meal from TheMealDB. */
export const mealRecipeSchema = (meal, path) => ({
  "@context": "https://schema.org",
  "@type": "Recipe",
  name: meal.strMeal,
  image: meal.strMealThumb ? [meal.strMealThumb] : undefined,
  url: absoluteUrl(path),
  description: `${meal.strMeal} - a ${meal.strArea} ${meal.strCategory} recipe with ingredients and step-by-step instructions.`,
  recipeCategory: meal.strCategory || undefined,
  recipeCuisine: meal.strArea || undefined,
  keywords: meal.strTags || undefined,
  recipeIngredient: ingredientStrings(meal, 20),
  recipeInstructions: instructionSteps(meal.strInstructions),
  video: meal.strYoutube
    ? { "@type": "VideoObject", name: `${meal.strMeal} cooking video`, embedUrl: meal.strYoutube }
    : undefined,
  author: { "@type": "Organization", name: "TheMealDB" },
});

/** Reference drink from TheCocktailDB. */
export const drinkRecipeSchema = (drink, path) => ({
  "@context": "https://schema.org",
  "@type": "Recipe",
  name: drink.strDrink,
  image: drink.strDrinkThumb ? [drink.strDrinkThumb] : undefined,
  url: absoluteUrl(path),
  description: `${drink.strDrink} - how to make this ${drink.strCategory || "drink"}, with ingredients and instructions.`,
  recipeCategory: drink.strCategory || undefined,
  recipeIngredient: ingredientStrings(drink, 15),
  recipeInstructions: instructionSteps(drink.strInstructions),
  author: { "@type": "Organization", name: "TheCocktailDB" },
});

/** Recipe published by a RecipeHub member. */
export const communityRecipeSchema = (recipe, path) => ({
  "@context": "https://schema.org",
  "@type": "Recipe",
  name: recipe.title,
  image: recipe.media?.length ? recipe.media.map((m) => m.url) : undefined,
  url: absoluteUrl(path),
  description: recipe.instructions
    ? `${recipe.instructions.slice(0, 200)}${recipe.instructions.length > 200 ? "..." : ""}`
    : `${recipe.title} on ${SITE_NAME}.`,
  recipeCategory: recipe.category || undefined,
  keywords: recipe.tags?.length ? recipe.tags.join(", ") : undefined,
  datePublished: recipe.createdAt || undefined,
  recipeIngredient: recipe.ingredients?.length
    ? recipe.ingredients.map((i) => `${i.amount} ${i.name}`.trim())
    : undefined,
  recipeInstructions: instructionSteps(recipe.instructions),
  author: recipe.user?.username
    ? { "@type": "Person", name: recipe.user.username, url: absoluteUrl(`/users/${recipe.user._id}`) }
    : undefined,
  interactionStatistic: [
    {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/LikeAction",
      userInteractionCount: recipe.likeCount || 0,
    },
    {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/CommentAction",
      userInteractionCount: recipe.commentCount || 0,
    },
  ],
});

// TheMealDB/TheCocktailDB flatten ingredients onto strIngredient1..N with
// matching strMeasureN; schema.org wants them as single combined strings.
const ingredientStrings = (item, max) => {
  const out = [];
  for (let i = 1; i <= max; i++) {
    const name = item[`strIngredient${i}`];
    const measure = item[`strMeasure${i}`];
    if (name && name.trim()) {
      out.push(`${measure?.trim() || ""} ${name.trim()}`.trim());
    }
  }
  return out.length ? out : undefined;
};

// Splits a free-text instructions blob into HowToStep entries. Blank
// lines and stray numbering are common in the source data, so short or
// empty fragments are dropped rather than emitted as empty steps.
const instructionSteps = (text) => {
  if (!text) return undefined;
  const steps = text
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 3);
  if (!steps.length) return undefined;
  return steps.map((step) => ({ "@type": "HowToStep", text: step }));
};
