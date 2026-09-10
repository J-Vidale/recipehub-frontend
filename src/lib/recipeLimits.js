// Mirrors the ceilings the API enforces, so the form stops someone at the
// point they are typing rather than after they press Publish and lose the
// round trip. The API is still the authority - these are a courtesy, not a
// control - so the numbers here have to match controllers/recipeController.js
// in the backend, and the tests assert they do.
export const MAX_TITLE_LENGTH = 140;
export const MAX_INSTRUCTIONS_LENGTH = 10000;
export const MAX_CATEGORY_LENGTH = 40;
export const MAX_INGREDIENT_FIELD_LENGTH = 60;
export const MAX_INGREDIENTS = 100;
