// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setHandoff, takeHandoff } from "../src/lib/handoff";

// Deleting an account ends in a full reload, because the page it happens
// on sits behind ProtectedRoute and every in-app ending finished by asking
// someone to log into the account they had just deleted. A reload takes
// the toast with it, so the confirmation is handed to the next load.

beforeEach(() => window.sessionStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("handing a message to the next page load", () => {
  it("gives it back once", () => {
    setHandoff("Your account has been deleted.");
    expect(takeHandoff()).toBe("Your account has been deleted.");
  });

  it("does not give it back twice", () => {
    // Otherwise a refresh repeats the confirmation for something that
    // happened once.
    setHandoff("Your account has been deleted.");
    takeHandoff();
    expect(takeHandoff()).toBeNull();
  });

  it("returns nothing when there is nothing waiting", () => {
    expect(takeHandoff()).toBeNull();
  });

  it("uses sessionStorage, so it cannot outlive the tab", () => {
    setHandoff("hello");
    expect(window.sessionStorage.getItem("recipehub:handoff")).toBe("hello");
    expect(window.localStorage.getItem("recipehub:handoff")).toBeNull();
  });

  it("survives storage being blocked outright", () => {
    // Private modes throw on access rather than returning null. Losing the
    // confirmation is a shame; throwing here would be a crash on the page
    // after a deletion that already happened.
    // Storage.prototype, not window.sessionStorage: jsdom accepts an
    // instance spy and then ignores it, so a test written that way never
    // reaches the throwing path it claims to cover.
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(setHandoff("hello")).toBe(false);
    expect(takeHandoff()).toBeNull();
  });
});
