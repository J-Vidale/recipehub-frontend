import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  absoluteUrl,
} from "../lib/site";

// Upserts <meta> by name or property, so repeated renders update the
// existing tag instead of appending duplicates.
const setMeta = (attr, key, content) => {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const setLink = (rel, href) => {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

// JSON-LD is kept in a single tag we own (identified by a data attribute)
// so navigating between pages replaces the previous page's structured
// data rather than stacking multiple conflicting graphs in the document.
const STRUCTURED_DATA_ID = "route-structured-data";

const setStructuredData = (data) => {
  const existing = document.getElementById(STRUCTURED_DATA_ID);
  if (!data) {
    existing?.remove();
    return;
  }
  const script = existing || document.createElement("script");
  script.type = "application/ld+json";
  script.id = STRUCTURED_DATA_ID;
  script.textContent = JSON.stringify(data);
  if (!existing) document.head.appendChild(script);
};

/**
 * Per-page document head: title, description, canonical URL, Open Graph /
 * Twitter card tags, and optional JSON-LD structured data.
 *
 * This is a client-rendered SPA, so these are applied on navigation
 * rather than served in the initial HTML. Google renders JavaScript
 * before indexing, so this is effective for search; some non-rendering
 * scrapers (certain chat/link previewers) will fall back to the static
 * defaults in index.html instead.
 *
 * @param {string}  title       Page-specific title (site name is appended).
 * @param {string}  description Meta description for this page.
 * @param {string}  image       Absolute URL of the social share image.
 * @param {object}  structuredData  JSON-LD object for this page.
 * @param {boolean} noindex     Set on private/user-specific pages that
 *                              should not appear in search results.
 */
const Seo = ({ title, description, image, structuredData, noindex = false }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Share and Discover Recipes`;
    const desc = description || SITE_DESCRIPTION;
    const canonical = absoluteUrl(pathname);
    const ogImage = image || DEFAULT_OG_IMAGE;

    document.title = fullTitle;

    setMeta("name", "description", desc);
    setLink("canonical", canonical);

    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");

    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", canonical);
    setMeta("property", "og:image", ogImage);

    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", desc);
    setMeta("name", "twitter:image", ogImage);

    setStructuredData(structuredData);
  }, [title, description, image, structuredData, noindex, pathname]);

  return null;
};

export default Seo;
