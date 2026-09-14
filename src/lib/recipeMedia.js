// Mirrors what the media endpoint accepts, so a file that cannot possibly
// work is refused here rather than after an 8MB upload. The API is still
// the authority - these are a courtesy - so the numbers have to match
// controllers/mediaController.js and middleware/uploadMiddleware.js in the
// backend, and the tests assert they do.

export const MAX_PHOTOS = 5;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

// Images only. The backend also accepts video, but every place the app
// renders media renders it as an <img> - the detail hero, the thumbnail
// strip, the cards - so an uploaded video would show as a broken image.
// Offering it here would be offering something the site cannot display.
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_TYPES.join(",");

const megabytes = (bytes) => Math.round(bytes / (1024 * 1024));

/**
 * @returns {string|null} why this file cannot be used, or null if it can.
 */
export const photoProblem = (file) => {
  if (!file) return "No file chosen.";
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Photos must be JPEG, PNG or WebP.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `Photos must be ${megabytes(MAX_IMAGE_BYTES)}MB or smaller.`;
  }
  return null;
};

/**
 * Sorts a chosen set into what can be added and what cannot, respecting
 * how many photos the recipe already has.
 *
 * @param {File[]} files
 * @param {number} alreadyHave
 * @returns {{accepted: File[], problems: string[]}}
 */
export const sortPhotos = (files, alreadyHave = 0) => {
  const accepted = [];
  const problems = [];
  let room = MAX_PHOTOS - alreadyHave;

  for (const file of files) {
    const problem = photoProblem(file);
    if (problem) {
      problems.push(`${file.name}: ${problem}`);
      continue;
    }
    if (room <= 0) {
      problems.push(`${file.name}: a recipe can have at most ${MAX_PHOTOS} photos.`);
      continue;
    }
    accepted.push(file);
    room -= 1;
  }

  return { accepted, problems };
};
