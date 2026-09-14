import API from "../services/api";

/**
 * Send chosen photos to a recipe that already exists.
 *
 * One at a time, because the endpoint takes one file per request and
 * because five parallel 8MB uploads from a phone is a worse experience
 * than five sequential ones.
 *
 * Never throws. A photo failing is not the same as the recipe failing -
 * by the time this runs the recipe is saved - so the caller gets back
 * what did not make it and decides what to say.
 *
 * @param {string} recipeId
 * @param {File[]} photos
 * @returns {Promise<string[]>} the names of the photos that did not upload.
 */
export const uploadRecipePhotos = async (recipeId, photos) => {
  if (!recipeId || !photos?.length) return [];

  const failed = [];
  for (const photo of photos) {
    const body = new FormData();
    // "file" is the field name the upload middleware listens for.
    body.append("file", photo);
    try {
      await API.post(`/recipes/${recipeId}/media`, body);
    } catch {
      failed.push(photo.name);
    }
  }
  return failed;
};
