// Cloudinary delivers whatever was uploaded unless you ask otherwise, so a
// 4MB phone photo is sent at full resolution into a 200px card. Injecting
// a transformation into the delivery URL makes Cloudinary do the work on
// its CDN instead: `f_auto` negotiates AVIF/WebP per browser, `q_auto`
// picks a perceptual quality level, and a width cap stops us shipping
// pixels the layout can never show.
//
// Non-Cloudinary URLs (TheMealDB thumbnails, avatars already hosted
// elsewhere) are returned untouched.

const UPLOAD_MARKER = "/image/upload/";

export const cloudinaryImage = (url, { width, height, crop = "fill" } = {}) => {
  if (typeof url !== "string" || !url.includes("res.cloudinary.com")) return url;

  const markerIndex = url.indexOf(UPLOAD_MARKER);
  if (markerIndex === -1) return url;

  const transforms = ["f_auto", "q_auto"];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (width && height) transforms.push(`c_${crop}`);
  else if (width) transforms.push("c_limit"); // width cap only: never upscale

  const head = url.slice(0, markerIndex + UPLOAD_MARKER.length);
  let tail = url.slice(markerIndex + UPLOAD_MARKER.length);

  // Don't stack a second transformation onto a URL that already carries
  // one (it would be applied on top of, not instead of, the first).
  if (/^[a-z]{1,3}_[^/]+\//.test(tail)) return url;

  return `${head}${transforms.join(",")}/${tail}`;
};

// Sizes matched to where each image is actually rendered.
export const recipeCardImage = (url) => cloudinaryImage(url, { width: 600, height: 450 });
export const recipeHeroImage = (url) => cloudinaryImage(url, { width: 1200 });
export const recipeThumbImage = (url) => cloudinaryImage(url, { width: 160, height: 160 });
export const avatarImage = (url, size = 96) => cloudinaryImage(url, { width: size, height: size });
