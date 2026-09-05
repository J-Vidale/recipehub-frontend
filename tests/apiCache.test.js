// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { cached, clearCache } from "../src/lib/apiCache";

beforeEach(() => {
  clearCache();
  window.sessionStorage.clear();
  vi.useRealTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("caching", () => {
  it("calls the fetcher once and reuses the result", async () => {
    const fetcher = vi.fn().mockResolvedValue(["a"]);
    expect(await cached("k", 1000, fetcher)).toEqual(["a"]);
    expect(await cached("k", 1000, fetcher)).toEqual(["a"]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("keeps separate keys separate", async () => {
    const one = vi.fn().mockResolvedValue(1);
    const two = vi.fn().mockResolvedValue(2);
    expect(await cached("one", 1000, one)).toBe(1);
    expect(await cached("two", 1000, two)).toBe(2);
  });

  it("refetches once the entry has aged past its TTL", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce("first").mockResolvedValueOnce("second");
    expect(await cached("k", 50, fetcher)).toBe("first");

    // Move the clock rather than sleeping, so the test stays fast.
    const realNow = Date.now;
    vi.spyOn(Date, "now").mockImplementation(() => realNow() + 5000);

    expect(await cached("k", 50, fetcher)).toBe("second");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

describe("concurrent callers", () => {
  // Two components mounting at once must not each start their own request;
  // that would double the traffic this is meant to remove.
  it("share a single in-flight request", async () => {
    let resolve;
    const fetcher = vi.fn(() => new Promise((r) => { resolve = r; }));

    const a = cached("k", 1000, fetcher);
    const b = cached("k", 1000, fetcher);
    resolve(["shared"]);

    expect(await a).toEqual(["shared"]);
    expect(await b).toEqual(["shared"]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("lets a later caller retry after a failure", async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce("recovered");

    await expect(cached("k", 1000, fetcher)).rejects.toThrow("offline");
    // A failed request must not be left in the in-flight map, or every
    // later caller would await a promise that already rejected.
    expect(await cached("k", 1000, fetcher)).toBe("recovered");
  });
});

describe("sessionStorage", () => {
  it("survives a page navigation by reading the stored copy", async () => {
    const fetcher = vi.fn().mockResolvedValue(["stored"]);
    await cached("k", 10000, fetcher);

    // Simulate a fresh page: memory is empty, sessionStorage is not.
    const { clearCache: clear } = await import("../src/lib/apiCache");
    clear();
    // clearCache also wipes storage, so re-seed it the way a real reload
    // would have found it.
    window.sessionStorage.setItem(
      "recipehub:cache:k",
      JSON.stringify({ at: Date.now(), value: ["stored"] })
    );

    const second = vi.fn().mockResolvedValue(["fresh"]);
    expect(await cached("k", 10000, second)).toEqual(["stored"]);
    expect(second).not.toHaveBeenCalled();
  });

  it("ignores a corrupt stored entry and refetches", async () => {
    window.sessionStorage.setItem("recipehub:cache:k", "{not json");
    const fetcher = vi.fn().mockResolvedValue("recovered");
    expect(await cached("k", 10000, fetcher)).toBe("recovered");
  });

  it("ignores a stored entry that has expired", async () => {
    window.sessionStorage.setItem(
      "recipehub:cache:k",
      JSON.stringify({ at: Date.now() - 60000, value: "old" })
    );
    const fetcher = vi.fn().mockResolvedValue("new");
    expect(await cached("k", 1000, fetcher)).toBe("new");
  });

  it("still works when storage throws, as it does when site data is blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });

    const fetcher = vi.fn().mockResolvedValue("value");
    expect(await cached("k", 1000, fetcher)).toBe("value");
    // Memory caching still applies within the page view.
    expect(await cached("k", 1000, fetcher)).toBe("value");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe("clearCache", () => {
  it("forces the next call to refetch", async () => {
    const fetcher = vi.fn().mockResolvedValue("v");
    await cached("k", 10000, fetcher);
    clearCache();
    await cached("k", 10000, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("leaves unrelated sessionStorage keys alone", async () => {
    window.sessionStorage.setItem("someone-elses-key", "keep me");
    await cached("k", 10000, vi.fn().mockResolvedValue("v"));
    clearCache();
    expect(window.sessionStorage.getItem("someone-elses-key")).toBe("keep me");
  });
});
