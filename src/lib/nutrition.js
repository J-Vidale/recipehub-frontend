// Rough macros for a recipe, built from a small table of per-100g values.
//
// These are typical published values for raw or standard-prepared foods,
// rounded. They are estimates and the UI says so. Real numbers depend on
// cut, brand, fat trimmed, how much oil stayed in the pan and how much
// water boiled off, none of which a recipe line records.
//
// The table is deliberately short. An ingredient that is not in it is
// reported as uncovered rather than approximated, and the panel shows how
// much of the recipe the estimate actually accounts for. A number derived
// from four of eleven ingredients should not look like a complete one.

// kcal, protein, carbs, fat, fibre - all per 100g.
const PER_100G = {
  // Meat and poultry
  "chicken": [165, 31, 0, 3.6, 0], "chicken breast": [165, 31, 0, 3.6, 0],
  "chicken thighs": [209, 26, 0, 10.9, 0], "beef": [250, 26, 0, 15, 0],
  "minced beef": [254, 26, 0, 16, 0], "steak": [271, 25, 0, 19, 0],
  "pork": [242, 27, 0, 14, 0], "bacon": [541, 37, 1.4, 42, 0],
  "sausages": [301, 12, 2.5, 27, 0], "lamb": [294, 25, 0, 21, 0],
  "turkey": [189, 29, 0, 7.4, 0], "ham": [145, 21, 1.5, 5.5, 0],
  "duck": [337, 19, 0, 28, 0],

  // Fish and seafood
  "salmon": [208, 20, 0, 13, 0], "tuna": [132, 28, 0, 1.3, 0],
  "cod": [82, 18, 0, 0.7, 0], "haddock": [90, 20, 0, 0.6, 0],
  "prawns": [99, 24, 0.2, 0.3, 0], "shrimp": [99, 24, 0.2, 0.3, 0],
  "mussels": [86, 12, 3.7, 2.2, 0], "anchovies": [131, 20, 0, 4.8, 0],

  // Dairy and eggs
  "milk": [61, 3.2, 4.8, 3.3, 0], "whole milk": [61, 3.2, 4.8, 3.3, 0],
  "butter": [717, 0.9, 0.1, 81, 0], "cheese": [402, 25, 1.3, 33, 0],
  "cheddar": [402, 25, 1.3, 33, 0], "parmesan": [431, 38, 4.1, 29, 0],
  "mozzarella": [280, 28, 3.1, 17, 0], "cream": [340, 2.1, 2.8, 36, 0],
  "double cream": [449, 1.7, 2.7, 48, 0], "yogurt": [59, 10, 3.6, 0.4, 0],
  "greek yogurt": [59, 10, 3.6, 0.4, 0], "eggs": [155, 13, 1.1, 11, 0],
  "egg": [155, 13, 1.1, 11, 0], "egg yolks": [322, 16, 3.6, 27, 0],

  // Grains, flour, starch
  "flour": [364, 10, 76, 1, 2.7], "plain flour": [364, 10, 76, 1, 2.7],
  "bread": [265, 9, 49, 3.2, 2.7], "breadcrumbs": [395, 13, 72, 5.3, 4.5],
  "rice": [130, 2.7, 28, 0.3, 0.4], "basmati rice": [130, 2.7, 28, 0.3, 0.4],
  "pasta": [131, 5, 25, 1.1, 1.8], "spaghetti": [131, 5, 25, 1.1, 1.8],
  "oats": [389, 17, 66, 7, 11], "couscous": [112, 3.8, 23, 0.2, 1.4],
  "noodles": [138, 4.5, 25, 2.1, 1.2], "tortilla": [312, 8, 51, 8, 3],

  // Vegetables
  "onion": [40, 1.1, 9.3, 0.1, 1.7], "onions": [40, 1.1, 9.3, 0.1, 1.7],
  "garlic": [149, 6.4, 33, 0.5, 2.1], "tomatoes": [18, 0.9, 3.9, 0.2, 1.2],
  "tomato": [18, 0.9, 3.9, 0.2, 1.2], "potatoes": [77, 2, 17, 0.1, 2.2],
  "carrots": [41, 0.9, 9.6, 0.2, 2.8], "celery": [16, 0.7, 3, 0.2, 1.6],
  "mushrooms": [22, 3.1, 3.3, 0.3, 1], "spinach": [23, 2.9, 3.6, 0.4, 2.2],
  "peppers": [31, 1, 6, 0.3, 2.1], "broccoli": [34, 2.8, 7, 0.4, 2.6],
  "peas": [81, 5.4, 14, 0.4, 5.7], "sweetcorn": [86, 3.2, 19, 1.2, 2.7],
  "aubergine": [25, 1, 6, 0.2, 3], "courgette": [17, 1.2, 3.1, 0.3, 1],
  "cabbage": [25, 1.3, 6, 0.1, 2.5], "leek": [61, 1.5, 14, 0.3, 1.8],

  // Pulses
  "lentils": [116, 9, 20, 0.4, 8], "chickpeas": [164, 8.9, 27, 2.6, 7.6],
  "kidney beans": [127, 8.7, 23, 0.5, 6.4], "black beans": [132, 8.9, 24, 0.5, 8.7],

  // Fats, oils, sugars
  "olive oil": [884, 0, 0, 100, 0], "oil": [884, 0, 0, 100, 0],
  "vegetable oil": [884, 0, 0, 100, 0], "sugar": [387, 0, 100, 0, 0],
  "caster sugar": [387, 0, 100, 0, 0], "brown sugar": [380, 0, 98, 0, 0],
  "honey": [304, 0.3, 82, 0, 0.2], "maple syrup": [260, 0, 67, 0.1, 0],

  // Nuts
  "almonds": [579, 21, 22, 50, 12.5], "walnuts": [654, 15, 14, 65, 6.7],
  "cashews": [553, 18, 30, 44, 3.3], "peanuts": [567, 26, 16, 49, 8.5],
  "peanut butter": [588, 25, 20, 50, 6],

  // Store cupboard
  "soy sauce": [53, 8.1, 4.9, 0.6, 0.8], "tomato puree": [82, 4.3, 19, 0.5, 4.1],
  "coconut milk": [230, 2.3, 5.5, 24, 0], "stock": [4, 0.5, 0.4, 0.1, 0],
  "chocolate": [546, 4.9, 61, 31, 7], "cocoa powder": [228, 20, 58, 14, 33],
};

const normalise = (text) => text.toLowerCase().trim().replace(/\s+/g, " ");

// Exact match first, then the longest listed name contained in the
// ingredient, so "boneless chicken breast" resolves to "chicken breast"
// rather than the broader "chicken".
export const nutritionFor = (ingredientName) => {
  if (typeof ingredientName !== "string") return null;
  const name = normalise(ingredientName);
  if (!name) return null;
  if (PER_100G[name]) return PER_100G[name];

  let best = null;
  let bestLength = 0;
  for (const [key, value] of Object.entries(PER_100G)) {
    if (name.includes(key) && key.length > bestLength) {
      best = value;
      bestLength = key.length;
    }
  }
  return best;
};

// items: [{ name, grams }]. grams may be null when the measure could not
// be converted, in which case the ingredient counts as uncovered - we
// know what it is but not how much, which is not enough to add it up.
//
// Returns totals plus the counts behind them, so the caller can say how
// complete the estimate is instead of presenting a partial sum as final.
export const estimateNutrition = (items) => {
  const totals = { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 };
  const counted = [];
  const missing = [];

  for (const item of items || []) {
    const per100 = nutritionFor(item.name);
    if (!per100 || item.grams === null || !Number.isFinite(item.grams)) {
      missing.push({ name: item.name, reason: per100 ? "no weight" : "not in table" });
      continue;
    }
    const factor = item.grams / 100;
    totals.kcal += per100[0] * factor;
    totals.protein += per100[1] * factor;
    totals.carbs += per100[2] * factor;
    totals.fat += per100[3] * factor;
    totals.fibre += per100[4] * factor;
    counted.push(item.name);
  }

  const total = counted.length + missing.length;
  return {
    totals: {
      kcal: Math.round(totals.kcal),
      protein: Math.round(totals.protein * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
      fibre: Math.round(totals.fibre * 10) / 10,
    },
    counted,
    missing,
    coverage: total === 0 ? 0 : counted.length / total,
  };
};
