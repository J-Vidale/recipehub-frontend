// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getStored, setStored, removeStored } from "../src/lib/storage";

// The whole point of this module is that localStorage *throws* when site
// data is blocked, rather than returning null. Because the auth token is
// read on nearly every render, an unguarded access white-screens the app.
// These tests make that failure mode explicit.
const throwing = () => {
  throw new DOMException("The operation is insecure.", "SecurityError");
};

describe("when localStorage works normally", () => {
  beforeEach(() => window.localStorage.clear());

  it("round-trips a value", () => {
    expect(setStored("token", "abc")).toBe(true);
    expect(getStored("token")).toBe("abc");
    removeStored("token");
    expect(getStored("token")).toBeNull();
  });

  it("returns null for a key that was never set", () => {
    expect(getStored("missing")).toBeNull();
  });
});

describe("when the browser blocks site data", () => {
  it("getStored returns null instead of throwing", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(throwing);
    expect(() => getStored("token")).not.toThrow();
    expect(getStored("token")).toBeNull();
  });

  it("setStored reports failure instead of throwing", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(throwing);
    expect(() => setStored("token", "abc")).not.toThrow();
    expect(setStored("token", "abc")).toBe(false);
  });

  it("removeStored swallows the error", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(throwing);
    expect(() => removeStored("token")).not.toThrow();
  });

  it("survives a quota error, which Safari raises in private mode", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    expect(setStored("big", "x".repeat(100))).toBe(false);
  });
});
