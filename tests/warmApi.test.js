import { describe, it, expect, vi, beforeEach } from "vitest";
import { warmApi, __resetWarmApi } from "../src/lib/warmApi";

beforeEach(() => __resetWarmApi());

describe("warmApi", () => {
  it("asks the API's root for something cheap", () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });
    expect(warmApi("https://api.example.com", fetchImpl)).toBe(true);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.example.com/");
    expect(options.credentials).toBe("omit");
    expect(options.cache).toBe("no-store");
  });

  it("only ever fires once", () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });
    warmApi("https://api.example.com", fetchImpl);
    warmApi("https://api.example.com", fetchImpl);
    warmApi("https://api.example.com", fetchImpl);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  // Nothing is asleep behind an origin the page is already served from.
  it("does nothing when the API shares this origin", () => {
    const fetchImpl = vi.fn();
    expect(warmApi("", fetchImpl)).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  // It runs before anything is rendered, so a throw here would take the
  // whole page with it - and the page needs the API far more than the
  // wake-up call does.
  it("swallows a rejected request", () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("connection refused"));
    expect(() => warmApi("https://api.example.com", fetchImpl)).not.toThrow();
  });

  it("swallows a fetch that throws synchronously", () => {
    const fetchImpl = vi.fn(() => {
      throw new TypeError("Failed to construct 'Request'");
    });
    expect(() => warmApi("https://api.example.com", fetchImpl)).not.toThrow();
  });

  // A browser old enough to have no fetch. Passing undefined would take
  // the default parameter instead, which is the real global.
  it("does nothing where there is no fetch at all", () => {
    expect(warmApi("https://api.example.com", null)).toBe(false);
  });
});

describe("it is wired in before the app renders", () => {
  it("runs at the top of main.jsx, not inside a component", async () => {
    const { readFile } = await import("node:fs/promises");
    const source = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
    const warmAt = source.indexOf("warmApi()");
    const renderAt = source.indexOf("createRoot");
    expect(warmAt).toBeGreaterThan(-1);
    expect(warmAt).toBeLessThan(renderAt);
  });
});
