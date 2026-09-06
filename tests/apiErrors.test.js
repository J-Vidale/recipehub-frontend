// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import API, { ApiError, isNetworkError } from "../src/services/api";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// The distinction this file guards: "the server said no" is a different
// thing from "no server answered". Collapsing them is what made an
// unreachable API report itself as a rejected password.
describe("a request that never reaches a server", () => {
  const failFetch = () =>
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

  it("rejects with an ApiError rather than a bare TypeError", async () => {
    failFetch();
    await expect(API.get("/recipes")).rejects.toBeInstanceOf(ApiError);
  });

  it("is marked as a network failure", async () => {
    failFetch();
    const error = await API.get("/recipes").catch((e) => e);
    expect(isNetworkError(error)).toBe(true);
    expect(error.response.status).toBe(0);
  });

  it("carries a message a person can act on", async () => {
    failFetch();
    const error = await API.get("/recipes").catch((e) => e);
    expect(error.message).toMatch(/reach/i);
  });

  it("keeps the underlying error for the console", async () => {
    failFetch();
    const error = await API.get("/recipes").catch((e) => e);
    expect(error.cause).toBeInstanceOf(TypeError);
  });

  it("says so plainly when the browser reports being offline", async () => {
    failFetch();
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const error = await API.get("/recipes").catch((e) => e);
    expect(error.message).toMatch(/offline/i);
  });
});

describe("a request the server rejects", () => {
  const respond = (status, body) =>
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status,
      text: async () => JSON.stringify(body),
    });

  it("is not classed as a network failure", async () => {
    respond(401, { message: "Invalid username or password" });
    const error = await API.post("/auth/login", {}).catch((e) => e);
    expect(isNetworkError(error)).toBe(false);
  });

  it("keeps the server's own message and status", async () => {
    respond(401, { message: "Invalid username or password" });
    const error = await API.post("/auth/login", {}).catch((e) => e);
    expect(error.message).toBe("Invalid username or password");
    expect(error.response.status).toBe(401);
  });

  it("falls back to a status message when the body has none", async () => {
    respond(500, {});
    const error = await API.get("/recipes").catch((e) => e);
    expect(error.message).toMatch(/500/);
  });
});

describe("a successful request", () => {
  it("resolves with the parsed body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ recipes: [] }),
    });
    const { data, status } = await API.get("/recipes");
    expect(data).toEqual({ recipes: [] });
    expect(status).toBe(200);
  });

  it("handles an empty body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 204,
      text: async () => "",
    });
    const { data } = await API.delete("/recipes/1");
    expect(data).toBeNull();
  });
});

describe("isNetworkError", () => {
  it("is safe on anything", () => {
    expect(isNetworkError(null)).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
    expect(isNetworkError(new Error("plain"))).toBe(false);
    expect(isNetworkError({ kind: "network" })).toBe(true);
  });
});
