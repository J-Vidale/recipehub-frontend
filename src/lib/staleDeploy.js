// A deploy replaces every hashed asset. Anyone with the site already open
// is holding an index.html that names the previous hashes, and those files
// are gone - so the next click on a route they have not visited yet fails
// to import its chunk. Before this, that surfaced as the error boundary's
// "An unexpected error occurred", which is both alarming and wrong: nothing
// is broken, the site is simply newer than the tab.
//
// Reloading fetches the current index.html and with it the current hashes,
// which is the whole fix. The only real hazard is doing it in a loop, so a
// reload is attempted once per short window and the boundary handles the
// case where that has already been spent.

const ATTEMPT_KEY = "recipehub:stale-deploy-reload";
const RETRY_WINDOW_MS = 10_000;

// The browsers do not agree on the wording. Chrome fails the import,
// Firefox and Safari word it differently, and a static host that serves
// index.html for a missing file - which is what SPA fallback routing does
// to a stale asset request - produces the MIME complaint instead.
const CHUNK_ERROR = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload|Failed to load module script|Loading chunk \d+ failed/i;

export const isStaleDeployError = (error) => {
  if (!error) return false;
  const message = typeof error === "string" ? error : error.message || "";
  return CHUNK_ERROR.test(message);
};

// sessionStorage throws outright in some privacy modes, so a failure to
// read it must not become a second error on top of the first. Treating it
// as "no attempt recorded" is the safe way round: the worst case is one
// extra reload, against a page that stays broken until the reader gives up.
const lastAttempt = () => {
  try {
    return Number(window.sessionStorage.getItem(ATTEMPT_KEY)) || 0;
  } catch {
    return 0;
  }
};

const recordAttempt = (at) => {
  try {
    window.sessionStorage.setItem(ATTEMPT_KEY, String(at));
  } catch {
    // Nothing to do. Without a record the guard cannot hold, which is why
    // the boundary offers the reload by hand as well.
  }
};

/**
 * Reload to pick up the current build.
 *
 * @returns {boolean} true if a reload was started, false if one was
 *   already tried within the last window - in which case reloading again
 *   would only spin, and the reader should be told what happened instead.
 */
export const recoverFromStaleDeploy = () => {
  const now = Date.now();
  if (now - lastAttempt() < RETRY_WINDOW_MS) return false;
  recordAttempt(now);
  // replace, not assign: a reload should not leave a broken step in the
  // history for the back button to land on.
  window.location.reload();
  return true;
};

/**
 * Vite fires this when a preloaded chunk cannot be fetched, which happens
 * before the dynamic import rejects and before React sees anything. It is
 * the earliest and quietest place to recover - the reader never reaches
 * the error boundary at all.
 */
export const installStaleDeployRecovery = () => {
  window.addEventListener("vite:preloadError", () => {
    // Deliberately not preventDefault. Vite treats a prevented default as
    // "handled" and lets the import resolve with undefined, so React.lazy
    // then fails on undefined.default - an error that says nothing about
    // what happened. Letting Vite rethrow means the import rejects with
    // the real message, which the error boundary can recognise if the
    // reload below has already been spent.
    recoverFromStaleDeploy();
  });
};
