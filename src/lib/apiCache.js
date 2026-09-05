// A small TTL cache for the external food APIs.
//
// The ingredient index is one request returning around 575 rows, and the
// cuisine list and category rails barely change from one week to the next.
// Refetching them on every visit costs the reader a spinner and TheMealDB
// a request, for data that was already correct.
//
// Two layers, deliberately: an in-memory map that makes a repeat call
// within the same page view free, and sessionStorage so the data survives
// a navigation or a reload without outliving the tab. Not localStorage -
// this is a convenience, and a stale ingredient list should not follow
// someone around for weeks.

const memory = new Map();

const STORAGE_PREFIX = "recipehub:cache:";

// Storage access throws rather than returning null when a browser is
// configured to block site data, so every touch is guarded; the cache
// simply becomes memory-only in that case.
const readStored = (key) => {
  try {
    return window.sessionStorage.getItem(STORAGE_PREFIX + key);
  } catch {
    return null;
  }
};

const writeStored = (key, value) => {
  try {
    window.sessionStorage.setItem(STORAGE_PREFIX + key, value);
  } catch {
    // Full, or blocked. The in-memory copy still stands for this page view.
  }
};

const isFresh = (entry, ttlMs) =>
  entry && typeof entry.at === "number" && Date.now() - entry.at < ttlMs;

// Runs `fetcher` only when there is no fresh copy. Concurrent callers for
// the same key share one in-flight request rather than each starting their
// own, which is what stops two components mounting at once from doubling
// the traffic they were meant to save.
const inFlight = new Map();

export const cached = async (key, ttlMs, fetcher) => {
  const hit = memory.get(key);
  if (isFresh(hit, ttlMs)) return hit.value;

  if (!hit) {
    const raw = readStored(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (isFresh(parsed, ttlMs)) {
          memory.set(key, parsed);
          return parsed.value;
        }
      } catch {
        // Corrupt entry: fall through and refetch.
      }
    }
  }

  if (inFlight.has(key)) return inFlight.get(key);

  const request = (async () => {
    try {
      const value = await fetcher();
      const entry = { at: Date.now(), value };
      memory.set(key, entry);
      writeStored(key, JSON.stringify(entry));
      return value;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, request);
  return request;
};

// Exposed for tests, and for a future "refresh" control.
export const clearCache = () => {
  memory.clear();
  inFlight.clear();
  try {
    for (const key of Object.keys(window.sessionStorage)) {
      if (key.startsWith(STORAGE_PREFIX)) window.sessionStorage.removeItem(key);
    }
  } catch {
    /* nothing to clear if storage is unavailable */
  }
};
