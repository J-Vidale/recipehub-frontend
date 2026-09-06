// A small fetch-based API client that keeps the call sites' existing
// shape: `API.get(url, { params })` etc. resolve to `{ data }`, and a
// non-2xx response rejects with an error carrying `.response.status` and
// `.response.data`.
//
// This replaces axios, which cost ~13kB gzipped in the main bundle that
// every visitor downloads, for a feature set this app barely used
// (a request header, a 401 handler, and query-string building - all of
// which fetch/URLSearchParams do natively).

import { getStored, removeStored } from "../lib/storage";
import { requestStarted, requestFinished } from "../lib/requestActivity";

// Same default as before the axios removal, and the same value
// SocketContext derives its origin from - production sets VITE_API_URL.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// The API's own origin, i.e. BASE_URL without the trailing /api. The health
// endpoint lives at the root rather than under /api, and the status page
// needs to name the configured URL in its output.
export const API_BASE_URL = BASE_URL;
export const API_ORIGIN = BASE_URL.replace(/\/api\/?$/, "");

// Mirrors axios's error shape so existing `err.response?.data?.message`
// handling keeps working unchanged.
//
// `kind` separates "the server answered, and said no" from "the request
// never reached a server at all". Without it a failed connection was a
// bare TypeError with no .response, so every call site reading
// err.response?.data?.message got undefined and fell back to whatever its
// generic message was - which on the login form meant a server that was
// unreachable reported "Invalid credentials".
export class ApiError extends Error {
  constructor(message, status, data, kind = "http") {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.response = { status, data };
  }
}

// True when the request never got an answer: wrong API URL, the server
// asleep or down, no internet, or a CORS rejection (which the browser
// reports as an ordinary network failure, deliberately, so a page cannot
// probe what it is not allowed to read).
export const isNetworkError = (error) => error?.kind === "network";

const NETWORK_MESSAGE =
  "Can't reach the RecipeHub server. It may be starting up - wait a moment and try again.";

const buildUrl = (path, params) => {
  const url = `${BASE_URL}${path}`;
  if (!params) return url;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    // Skip undefined/null so `{ cursor: undefined }` doesn't become
    // `?cursor=undefined`, which the backend would treat as a real value.
    if (value === undefined || value === null) continue;
    search.append(key, value);
  }
  const qs = search.toString();
  return qs ? `${url}?${qs}` : url;
};

// A 401 on an authenticated request means the token is missing, invalid, or
// expired. Clear the stale session and send the user to login instead of
// leaving every page independently guessing why its request just failed.
const handleUnauthorized = () => {
  if (!getStored("token")) return;
  removeStored("user");
  removeStored("token");
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

const request = async (method, path, body, options = {}) => {
  const headers = { ...(options.headers || {}) };

  const token = getStored("token");
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (body instanceof FormData) {
    // Let the browser set Content-Type so it can include the multipart
    // boundary. Setting it by hand produces a body the server can't parse.
    delete headers["Content-Type"];
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res;
  requestStarted();
  try {
    res = await fetch(buildUrl(path, options.params), {
      method,
      headers,
      body: payload,
      credentials: "include",
    });
  } catch (cause) {
    // fetch only rejects for network-level failures; an HTTP error is a
    // resolved response. Classifying it here means every call site gets a
    // usable error instead of a bare TypeError.
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    const error = new ApiError(
      offline ? "You appear to be offline." : NETWORK_MESSAGE,
      0,
      null,
      "network"
    );
    // The original TypeError says which host failed, which is the one clue
    // worth keeping when someone opens the console to work out why.
    error.cause = cause;
    throw error;
  } finally {
    // Counted down as soon as the response headers arrive; reading the
    // body is fast and local, and leaving the counter up until then would
    // keep the waking-up notice on screen after the wait was over.
    requestFinished();
  }

  // 204 and other empty responses have no JSON to parse.
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    if (res.status === 401) handleUnauthorized();
    throw new ApiError(
      data?.message || `Request failed with status ${res.status}`,
      res.status,
      data
    );
  }

  return { data, status: res.status };
};

const API = {
  get: (path, options) => request("GET", path, undefined, options),
  post: (path, body, options) => request("POST", path, body, options),
  put: (path, body, options) => request("PUT", path, body, options),
  patch: (path, body, options) => request("PATCH", path, body, options),
  delete: (path, options) => request("DELETE", path, undefined, options),
};

export default API;
