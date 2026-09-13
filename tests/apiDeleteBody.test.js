import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// API.delete passed undefined as the body, so a password sent as
// options.data never left the browser and the server answered "your
// password is required" to someone who had just typed it. Caught by
// reading the client rather than by the request failing, because it
// failed in a way that looked like the user's mistake.

let API;
beforeEach(async () => {
  vi.resetModules();
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ message: "gone" }),
  });
  API = (await import("../src/services/api")).default;
});
afterEach(() => vi.restoreAllMocks());

const sentBody = () => {
  const [, init] = globalThis.fetch.mock.calls.at(-1);
  return init.body ? JSON.parse(init.body) : undefined;
};

describe("DELETE with a body", () => {
  it("sends what options.data carries", async () => {
    await API.delete("/users/me", { data: { password: "hunter2" } });
    expect(sentBody()).toEqual({ password: "hunter2" });
  });

  it("declares the body as JSON", async () => {
    await API.delete("/users/me", { data: { password: "hunter2" } });
    const [, init] = globalThis.fetch.mock.calls.at(-1);
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  it("keeps the password out of the URL", async () => {
    await API.delete("/users/me", { data: { password: "hunter2" } });
    const [url] = globalThis.fetch.mock.calls.at(-1);
    expect(url).not.toContain("hunter2");
  });

  it("still sends no body when there is nothing to send", async () => {
    await API.delete("/users/me/avatar");
    expect(sentBody()).toBeUndefined();
  });
});
