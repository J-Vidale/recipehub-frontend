// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { cached, clearCache } from "../src/lib/apiCache";

beforeEach(() => {
  clearCache();
  window.sessionStorage.clear();
});

// The cache holds results for up to a day. Caching a failure would mean a
// page that failed once stays broken for the rest of the tab session,
// where before a reload would have fixed it.
describe("failures are never cached", () => {
  it("a rejected fetch leaves nothing behind", async () => {
    const failing = vi.fn().mockRejectedValue(new Error("upstream 503"));
    await expect(cached("k", 100000, failing)).rejects.toThrow("upstream 503");
    expect(window.sessionStorage.getItem("recipehub:cache:k")).toBeNull();
  });

  it("and the next call tries again rather than replaying the failure", async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error("upstream 503"))
      .mockResolvedValueOnce(["recovered"]);

    await expect(cached("k", 100000, fetcher)).rejects.toThrow();
    await expect(cached("k", 100000, fetcher)).resolves.toEqual(["recovered"]);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  // The in-flight map is cleaned up in a separate .finally, so a fetcher
  // that throws before returning a promise cannot wedge a rejected promise
  // in the map and block that key permanently.
  it("a synchronously throwing fetcher does not wedge the key", async () => {
    const throwing = () => {
      throw new Error("bad input");
    };
    await expect(cached("k", 100000, throwing)).rejects.toThrow("bad input");

    const good = vi.fn().mockResolvedValue("fine");
    await expect(cached("k", 100000, good)).resolves.toBe("fine");
    expect(good).toHaveBeenCalledTimes(1);
  });

  it("still starts the request on the current tick", async () => {
    // Regression guard: deferring fetcher() by a microtask would break
    // callers that expect the request to be in flight immediately.
    const fetcher = vi.fn().mockResolvedValue("v");
    cached("k", 100000, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("concurrent callers still share one request", async () => {
    let resolve;
    const fetcher = vi.fn(() => new Promise((r) => { resolve = r; }));
    const a = cached("k", 100000, fetcher);
    const b = cached("k", 100000, fetcher);
    resolve(["shared"]);
    expect(await a).toEqual(["shared"]);
    expect(await b).toEqual(["shared"]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("a successful result is still cached", async () => {
    const fetcher = vi.fn().mockResolvedValue(["ok"]);
    await cached("k", 100000, fetcher);
    await cached("k", 100000, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
