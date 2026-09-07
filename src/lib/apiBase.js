// Works out the API's base URL from VITE_API_URL.
//
// The variable has to be the API's URL with /api on the end, and the
// commonest way to get it wrong is to paste the service URL straight from
// the host's dashboard, which has no path. That produced a base of
// "https://api.example.com" and every call went to a path the API does not
// serve, giving 404s that look nothing like a configuration mistake.
//
// So: a value with no path gets /api appended, trailing slashes and stray
// query strings are dropped, and a value that already carries a path is
// left exactly as written - a deployment serving the API under some other
// prefix knows better than this function does.

export const DEFAULT_API_BASE = "http://localhost:5000/api";

const stripTrailingSlashes = (value) => value.replace(/\/+$/, "");

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

export const normaliseApiBase = (raw) => {
  if (typeof raw !== "string" || !raw.trim()) return DEFAULT_API_BASE;
  const trimmed = raw.trim();

  // A path on its own is a same-origin deployment: the site and the API
  // share a hostname and something in front of them routes /api.
  if (trimmed.startsWith("/")) {
    const path = stripTrailingSlashes(trimmed);
    return path.endsWith("/api") ? path : `${path}/api`;
  }

  // "api.example.com/api" with no scheme is a URL to everyone except URL().
  const withScheme = HAS_SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url;
  try {
    url = new URL(withScheme);
  } catch {
    // Unparseable: hand it back as written rather than quietly falling back
    // to localhost, which would look like the variable was never set.
    return trimmed;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return trimmed;

  const path = stripTrailingSlashes(url.pathname);
  return `${url.origin}${path === "" ? "/api" : path}`;
};

// The API's own origin: the base without its path. The health endpoint
// lives at the root rather than under /api, and the status page checks it
// there to tell "cannot reach the server" apart from "reached it, and was
// not allowed to read the reply".
export const originOf = (base) => {
  if (typeof base !== "string") return "";
  if (base.startsWith("/")) return ""; // same-origin: the page's own origin
  try {
    return new URL(base).origin;
  } catch {
    return stripTrailingSlashes(base).replace(/\/api$/, "");
  }
};
