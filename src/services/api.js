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

// Same default as before the axios removal, and the same value
// SocketContext derives its origin from - production sets VITE_API_URL.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Mirrors axios's error shape so existing `err.response?.data?.message`
// handling keeps working unchanged.
class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.response = { status, data };
  }
}

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

  const res = await fetch(buildUrl(path, options.params), {
    method,
    headers,
    body: payload,
    credentials: "include",
  });

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
