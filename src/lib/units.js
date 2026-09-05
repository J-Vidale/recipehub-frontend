// Turning a recipe measure into grams.
//
// Two different jobs hide in here. Mass units ("8 oz", "1 lb", "200g")
// convert exactly, by definition. Volume units ("1 cup", "2 tbsp") do
// not: a cup of flour and a cup of honey differ by more than a factor of
// two, so a volume only becomes a weight once you know what is in the
// cup. Anything we cannot convert honestly returns null and the caller
// shows the original text instead of inventing a number.

// Unicode fractions appear in real measure strings often enough to be
// worth handling rather than dropping on the floor.
const UNICODE_FRACTIONS = {
  "¼": 0.25, "½": 0.5, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3,
  "⅕": 0.2, "⅖": 0.4, "⅗": 0.6, "⅘": 0.8,
  "⅙": 1 / 6, "⅚": 5 / 6, "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875,
};

// Exact by definition, so these need no ingredient context.
const MASS_UNITS = {
  g: 1, gram: 1, grams: 1, gr: 1,
  kg: 1000, kilo: 1000, kilos: 1000, kilogram: 1000, kilograms: 1000,
  mg: 0.001,
  oz: 28.349523125, ounce: 28.349523125, ounces: 28.349523125,
  lb: 453.59237, lbs: 453.59237, pound: 453.59237, pounds: 453.59237,
};

// Volumes in millilitres. Converting these to grams needs a density.
const VOLUME_UNITS = {
  ml: 1, milliliter: 1, milliliters: 1, millilitre: 1, millilitres: 1,
  l: 1000, liter: 1000, liters: 1000, litre: 1000, litres: 1000,
  tsp: 4.92892, teaspoon: 4.92892, teaspoons: 4.92892,
  tbs: 14.7868, tbsp: 14.7868, tablespoon: 14.7868, tablespoons: 14.7868,
  cup: 236.588, cups: 236.588,
  pint: 473.176, pints: 473.176,
  quart: 946.353, quarts: 946.353,
  "fl oz": 29.5735,
};

// Grams per millilitre. Water is 1.0; everything else is relative to it.
// Only ingredients whose density is genuinely well known are listed - a
// guessed density is worse than no number at all, because it looks just
// as authoritative on screen.
const DENSITY_G_PER_ML = {
  water: 1.0, milk: 1.03, stock: 1.0, broth: 1.0, wine: 0.99, juice: 1.04,
  "olive oil": 0.915, oil: 0.918, "vegetable oil": 0.918, "sunflower oil": 0.92,
  butter: 0.911, honey: 1.42, "maple syrup": 1.32, syrup: 1.37,
  "plain flour": 0.53, flour: 0.53, "self-raising flour": 0.53, "wholemeal flour": 0.55,
  sugar: 0.85, "caster sugar": 0.85, "granulated sugar": 0.85,
  "brown sugar": 0.93, "icing sugar": 0.56,
  salt: 1.22, rice: 0.85, oats: 0.41, "rolled oats": 0.41,
  cream: 1.01, "double cream": 0.99, yogurt: 1.03, "greek yogurt": 1.03,
  "soy sauce": 1.12, vinegar: 1.01, "tomato puree": 1.07, passata: 1.05,
  "cocoa powder": 0.52, cornstarch: 0.63, cornflour: 0.63,
};

const normalise = (text) => text.toLowerCase().trim().replace(/\s+/g, " ");

const densityFor = (ingredientName) => {
  if (!ingredientName) return null;
  const name = normalise(ingredientName);
  if (DENSITY_G_PER_ML[name] !== undefined) return DENSITY_G_PER_ML[name];
  // Fall back to the longest listed name contained in the ingredient, so
  // "extra virgin olive oil" finds "olive oil" rather than plain "oil".
  let best = null;
  let bestLength = 0;
  for (const [key, value] of Object.entries(DENSITY_G_PER_ML)) {
    if (name.includes(key) && key.length > bestLength) {
      best = value;
      bestLength = key.length;
    }
  }
  return best;
};

// "1 1/2 cups", "½ tsp", "200g", "2 1/4 lb", "1 tbsp" -> { quantity, unit }
// Returns null when there is no number to work with ("to taste", "a
// pinch", "dash"), which is a normal outcome, not an error.
export const parseMeasure = (raw) => {
  if (typeof raw !== "string") return null;
  const text = normalise(raw).replace(/[()]/g, " ");
  if (!text) return null;

  // Pull leading quantity: an optional whole number, then an optional
  // fraction (ascii or unicode).
  const unicodeFraction = Object.keys(UNICODE_FRACTIONS).join("");
  const pattern = new RegExp(
    `^(\\d+(?:\\.\\d+)?)?\\s*(?:(\\d+)\\s*/\\s*(\\d+)|([${unicodeFraction}]))?\\s*(.*)$`
  );
  const match = text.match(pattern);
  if (!match) return null;

  const [, whole, num, den, unicode, rest] = match;
  let quantity = 0;
  if (whole) quantity += parseFloat(whole);
  if (num && den && Number(den) !== 0) quantity += Number(num) / Number(den);
  if (unicode) quantity += UNICODE_FRACTIONS[unicode];
  if (!quantity) return null;

  // The unit is the first word or two of what's left. "fl oz" is the only
  // two-word unit worth handling.
  const remainder = (rest || "").trim();
  const twoWord = remainder.split(" ").slice(0, 2).join(" ");
  const oneWord = remainder.split(" ")[0] || "";
  const unit = VOLUME_UNITS[twoWord] !== undefined ? twoWord : oneWord.replace(/\.$/, "");

  return { quantity, unit, raw };
};

// Grams, or null when we cannot say honestly. `ingredientName` is only
// consulted for volume measures, where it supplies the density.
export const toGrams = (raw, ingredientName) => {
  const parsed = parseMeasure(raw);
  if (!parsed) return null;

  const { quantity, unit } = parsed;
  if (MASS_UNITS[unit] !== undefined) {
    return quantity * MASS_UNITS[unit];
  }

  if (VOLUME_UNITS[unit] !== undefined) {
    const density = densityFor(ingredientName);
    if (density === null) return null;
    return quantity * VOLUME_UNITS[unit] * density;
  }

  // A bare number with no unit ("2 eggs", "1 onion") is a count, not a
  // weight. Guessing the mass of "1 onion" is exactly the kind of made-up
  // precision this module exists to avoid.
  return null;
};

// Grams are only meaningful to the precision we actually have. Under 10g
// one decimal is useful (spices); above that, whole grams; above a
// kilogram, kilograms.
export const formatGrams = (grams) => {
  if (grams === null || !Number.isFinite(grams)) return null;
  if (grams >= 1000) return `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 2)} kg`;
  if (grams < 10) return `${Math.round(grams * 10) / 10} g`;
  return `${Math.round(grams)} g`;
};
