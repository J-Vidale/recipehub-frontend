// Wakes the API while the page is still loading.
//
// On free hosting the API sleeps after about fifteen minutes idle and
// takes roughly thirty seconds to come back. Nothing starts that until
// the first request, and on the pages where the wait hurts most there is
// no first request for a while: someone opening /login spends twenty
// seconds typing before anything is sent, then waits the full thirty from
// there. Asking the API for its health endpoint at page load overlaps the
// two, so by the time the form is submitted the server is usually up.
//
// Deliberately not the API client: this must not count towards the
// in-flight requests that decide whether the "waking the server" notice
// appears, or /terms - which needs no API at all - would show it.
//
// The health endpoint does no database work and returns a few dozen bytes,
// so the cost of being wrong about this is negligible.

import { API_ORIGIN } from "../services/api";

let warmed = false;

export const warmApi = (origin = API_ORIGIN, fetchImpl = globalThis.fetch) => {
  // Empty means the API shares this page's origin, so the connection is
  // already open and there is nothing asleep behind it.
  if (warmed || !origin || typeof fetchImpl !== "function") return false;
  warmed = true;

  try {
    fetchImpl(`${origin}/`, {
      // No credentials and no cache: this is a wake-up call, not a read.
      credentials: "omit",
      cache: "no-store",
    }).catch(() => {});
  } catch {
    // A malformed origin, or a browser refusing the request outright.
    // Nothing here is worth reporting: the pages that need the API will
    // report their own failures with far better context.
  }
  return true;
};

// Test seam: the guard above is module state, so a suite needs to clear it.
export const __resetWarmApi = () => {
  warmed = false;
};
