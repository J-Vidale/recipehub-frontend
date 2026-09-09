import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { normaliseApiBase, originOf } from "./src/lib/apiBase.js";

// robots.txt, sitemap.xml and llms.txt all have to state the site's real
// public origin, and they used to hardcode the Render URL. That made
// attaching a custom domain a silent SEO failure: the canonical tags and
// Open Graph URLs would move to the new domain (they read VITE_SITE_URL
// already) while these three kept pointing search engines at the old one.
//
// They now live in seo/ as templates containing __SITE_URL__, and this
// plugin substitutes the same value the app uses. The dev server serves
// them too, so /robots.txt is not a 404 while developing.

const TEMPLATE_DIR = "seo";
const PLACEHOLDER = /__SITE_URL__/g;
const API_HINTS_PLACEHOLDER = /<!-- __API_HINTS__ -->/g;

// A preconnect only earns its socket when it points at a host the page
// will really talk to. An origin that is empty (the API shares this site's
// origin, so the connection already exists) or a loopback address (a
// developer's machine, or a production build with VITE_API_URL unset) gets
// no hint at all rather than a misleading one.
const LOOPBACK = /^https?:\/\/(localhost|127\.\d+\.\d+\.\d+|\[::1\])(:|$)/;

export const apiHints = (origin) => {
  if (!origin || LOOPBACK.test(origin)) return "";
  return [
    `<link rel="preconnect" href="${origin}" crossorigin />`,
    `<link rel="dns-prefetch" href="${origin}" />`,
  ].join("\n    ");
};

const CONTENT_TYPES = {
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

const render = (root, filename, siteUrl) => {
  const raw = readFileSync(join(root, TEMPLATE_DIR, filename), "utf8");
  return raw.replace(PLACEHOLDER, siteUrl);
};

const listTemplates = (root) => {
  try {
    return readdirSync(join(root, TEMPLATE_DIR));
  } catch {
    return [];
  }
};

export default function seoFiles() {
  let root = process.cwd();
  let siteUrl = "";
  let apiOrigin = "";

  const resolveSiteUrl = (env) =>
    (env.VITE_SITE_URL || "https://recipehub-frontend-cgip.onrender.com").replace(/\/+$/, "");

  return {
    name: "recipehub-seo-files",

    configResolved(config) {
      root = config.root;
      siteUrl = resolveSiteUrl(config.env);
      // The same derivation the app uses, so the host that is preconnected
      // is the host that is called.
      apiOrigin = originOf(normaliseApiBase(config.env.VITE_API_URL));
    },

    // Serve them in dev so the files can actually be checked before deploy.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = (req.url || "").split("?")[0].replace(/^\//, "");
        if (!listTemplates(root).includes(name)) return next();
        const ext = name.slice(name.lastIndexOf("."));
        res.setHeader("Content-Type", CONTENT_TYPES[ext] || "text/plain; charset=utf-8");
        res.end(render(root, name, siteUrl));
      });
    },

    // index.html carries the canonical tag, og:url, og:image and the
    // WebSite JSON-LD. Those are what a crawler that runs no JavaScript
    // reads, and what the browser sees before React mounts and <Seo>
    // rewrites them per route, so they have to follow the same origin.
    transformIndexHtml(html) {
      return html
        .replace(PLACEHOLDER, siteUrl)
        .replace(API_HINTS_PLACEHOLDER, apiHints(apiOrigin));
    },

    // Emitted as assets rather than written after the fact, so they are
    // part of the bundle Vite reports and cannot be missed by a deploy
    // that only uploads what the build declared.
    generateBundle() {
      for (const name of listTemplates(root)) {
        this.emitFile({
          type: "asset",
          fileName: name,
          source: render(root, name, siteUrl),
        });
      }
    },
  };
}

// Exported for the test suite, which checks the substitution itself
// without running a full build.
export const renderTemplate = (raw, siteUrl) =>
  raw.replace(PLACEHOLDER, siteUrl.replace(/\/+$/, ""));
