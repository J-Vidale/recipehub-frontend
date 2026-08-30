// Single source of truth for the site's public identity. Everything that
// needs an absolute URL (canonical tags, Open Graph, JSON-LD, the
// sitemap generator) reads from here rather than hardcoding a host.
//
// VITE_SITE_URL should be set in the hosting environment to the site's
// real public origin. It falls back to the current Render URL so the
// build is always correct even before a custom domain is attached; point
// it at the custom domain (no trailing slash) once DNS is live.
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://recipehub-frontend-cgip.onrender.com"
).replace(/\/$/, "");

export const SITE_NAME = "RecipeHub";

export const SITE_DESCRIPTION =
  "Discover, share and save recipes from real home cooks. Browse thousands of dishes and drinks, follow the cooks you like, and build your own recipe collection.";

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const absoluteUrl = (path = "/") =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
