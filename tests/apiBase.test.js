import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { normaliseApiBase, originOf, DEFAULT_API_BASE } from "../src/lib/apiBase";

describe("normaliseApiBase", () => {
  it("leaves a correctly written value alone", () => {
    expect(normaliseApiBase("https://api.example.com/api")).toBe("https://api.example.com/api");
  });

  // The mistake this exists for: the host's dashboard gives you the service
  // URL, which has no path, and every call then goes somewhere the API does
  // not serve.
  it("adds the missing /api when the service URL was pasted as-is", () => {
    expect(normaliseApiBase("https://api.example.com")).toBe("https://api.example.com/api");
    expect(normaliseApiBase("https://api.example.com/")).toBe("https://api.example.com/api");
  });

  it("tolerates whitespace, trailing slashes and a stray query string", () => {
    expect(normaliseApiBase("  https://api.example.com/api/  ")).toBe(
      "https://api.example.com/api"
    );
    expect(normaliseApiBase("https://api.example.com/api?utm=1")).toBe(
      "https://api.example.com/api"
    );
  });

  it("assumes https when the scheme was left off", () => {
    expect(normaliseApiBase("api.example.com")).toBe("https://api.example.com/api");
  });

  it("keeps a non-default port", () => {
    expect(normaliseApiBase("http://localhost:5000")).toBe("http://localhost:5000/api");
  });

  // A deployment where the site and the API share a hostname.
  it("supports a path on its own", () => {
    expect(normaliseApiBase("/api")).toBe("/api");
    expect(normaliseApiBase("/")).toBe("/api");
    expect(normaliseApiBase("/backend")).toBe("/backend/api");
  });

  // Someone serving the API under another prefix knows better than this.
  it("does not touch a value that already carries a path", () => {
    expect(normaliseApiBase("https://example.com/v2/api")).toBe("https://example.com/v2/api");
    expect(normaliseApiBase("https://example.com/backend")).toBe("https://example.com/backend");
  });

  it("falls back to localhost only when there is nothing set", () => {
    expect(normaliseApiBase(undefined)).toBe(DEFAULT_API_BASE);
    expect(normaliseApiBase("")).toBe(DEFAULT_API_BASE);
    expect(normaliseApiBase("   ")).toBe(DEFAULT_API_BASE);
  });

  // Silently substituting localhost here would make a typo look exactly
  // like an unset variable, and the status page shows this value.
  it("hands back an unusable value as written rather than hiding it", () => {
    expect(normaliseApiBase("not a url")).toBe("not a url");
    expect(normaliseApiBase("ftp://example.com")).toBe("ftp://example.com");
  });
});

describe("originOf", () => {
  it("drops the path", () => {
    expect(originOf("https://api.example.com/api")).toBe("https://api.example.com");
    expect(originOf("http://localhost:5000/api")).toBe("http://localhost:5000");
  });

  it("is empty for a same-origin base, which means the page's own origin", () => {
    expect(originOf("/api")).toBe("");
  });

  it("does something sensible with an unusable base", () => {
    expect(originOf("not a url")).toBe("not a url");
    expect(originOf(undefined)).toBe("");
  });
});

// Two modules deriving the backend's origin with their own regex is how
// they end up disagreeing about an unusual value.
describe("nothing derives the API origin on its own", () => {
  it.each(["src/services/api.js", "src/context/SocketContext.jsx"])(
    "%s goes through the shared helpers",
    async (file) => {
      const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
      expect(source).toContain("apiBase");
      expect(source).not.toMatch(/replace\(\/\\\/api/);
    }
  );
});
