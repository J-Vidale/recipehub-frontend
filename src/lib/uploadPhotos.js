import API from "../services/api";
import { refusalMessage } from "./refusalMessage";

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
 * @returns {Promise<{ name: string, reason: string | null }[]>} what did
 *   not upload, and why where the server said. The reason used to be
 *   thrown away, so someone whose photo was one over the recipe's limit,
 *   or whose upload hit Cloudinary while it was down, was told only that
 *   it "did not upload" - and had nothing to go on but trying the same
 *   file again.
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
    } catch (err) {
      failed.push({ name: photo.name, reason: refusalMessage(err) });
    }
  }
  return failed;
};

/**
 * What to tell someone about photos that did not upload.
 *
 * The reasons are the server's own sentences, and the same one usually
 * applies to every photo in a batch ("Recipes can have at most 5 photos"),
 * so they are deduplicated rather than repeated per file.
 */
export const describeFailedUploads = (failed, prefix) => {
  const count = failed.length;
  const plural = count === 1 ? "photo" : "photos";
  const reasons = [...new Set(failed.map((item) => item.reason).filter(Boolean))];
  const because = reasons.length ? ` ${reasons.join(" ")}` : "";
  return `${prefix} ${count} ${plural} did not upload.${because}`;
};
