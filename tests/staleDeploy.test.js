// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { isStaleDeployError, recoverFromStaleDeploy, installStaleDeployRecovery } from "../src/lib/staleDeploy";

// A deploy replaces every hashed asset, so anyone with the site already
// open is holding an index.html naming files that are gone. Before this,
// their next click on an unvisited route showed "An unexpected error
// occurred" - alarming, and wrong: nothing is broken, the site is newer
// than the tab. Reloading is the whole fix; not looping is the whole risk.

const reload = vi.fn();

beforeEach(() => {
  reload.mockClear();
  window.sessionStorage.clear();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { reload, assign: vi.fn() },
  });
});

afterEach(() => vi.restoreAllMocks());

describe("recognising a stale deploy", () => {
  // The browsers do not agree on the wording, and a static host with
  // fallback routing produces a different failure again - it answers a
  // missing asset with index.html, which the browser refuses as a module.
  it.each([
    "Failed to fetch dynamically imported module: https://x/assets/Explore-a1.js",
    "error loading dynamically imported module",
    "Importing a module script failed.",
    "Unable to preload CSS for /assets/index-a1.css",
    "Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of text/html",
    "Loading chunk 42 failed",
  ])("matches: %s", (message) => {
    expect(isStaleDeployError(new Error(message))).toBe(true);
  });

  it.each([
    "Cannot read properties of undefined (reading 'title')",
    "Network request failed",
    "x is not a function",
    "",
  ])("does not match an ordinary fault: %o", (message) => {
    expect(isStaleDeployError(new Error(message))).toBe(false);
  });

  it("does not match nothing at all", () => {
    expect(isStaleDeployError(null)).toBe(false);
    expect(isStaleDeployError(undefined)).toBe(false);
  });
});

describe("recovering", () => {
  it("reloads to fetch the current build", () => {
    expect(recoverFromStaleDeploy()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("refuses to reload twice in a row, so a broken deploy cannot spin", () => {
    expect(recoverFromStaleDeploy()).toBe(true);
    expect(recoverFromStaleDeploy()).toBe(false);
    expect(recoverFromStaleDeploy()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("tries again once the window has passed", () => {
    recoverFromStaleDeploy();
    // The guard is a timestamp, so moving the clock is the honest way to
    // test it rather than reaching into the module.
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 11_000);
    expect(recoverFromStaleDeploy()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("still reloads when sessionStorage is unavailable", () => {
    // Private modes throw outright on access. A page that stays broken is
    // worse than one extra reload, so the guard fails open.
    vi.spyOn(window.sessionStorage, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(window.sessionStorage, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(recoverFromStaleDeploy()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe("the preload listener", () => {
  it("recovers when Vite reports a chunk it could not fetch", () => {
    installStaleDeployRecovery();
    window.dispatchEvent(new Event("vite:preloadError"));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("leaves the event to Vite rather than marking it handled", () => {
    // Vite treats a prevented default as "handled" and lets the import
    // resolve with undefined, so React.lazy then fails on undefined.default
    // - an error that says nothing about what happened. Letting it rethrow
    // means the boundary sees the real message.
    installStaleDeployRecovery();
    const event = new Event("vite:preloadError", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});
