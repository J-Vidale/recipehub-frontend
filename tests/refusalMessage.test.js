import { describe, it, expect } from "vitest";
import { refusalMessage } from "../src/lib/refusalMessage";
import { ApiError } from "../src/services/api";

// Liking, sharing and commenting all update optimistically and revert when
// the request fails - silently. Once blocking started refusing those with
// a 403 and a sentence written to be read, the revert was all anyone saw:
// the heart filled, emptied, and nothing said why.

const http = (status, message) => new ApiError("x", status, message ? { message } : {});

describe("what gets passed on to the person", () => {
  it("gives the server's reason for a refusal", () => {
    expect(refusalMessage(http(403, "You cannot like this recipe"))).toBe(
      "You cannot like this recipe"
    );
  });

  it.each([400, 404, 409, 429])("passes on a %i as well", (status) => {
    expect(refusalMessage(http(status, "No"))).toBe("No");
  });

  it("trims the message, so whitespace is not mistaken for a reason", () => {
    expect(refusalMessage(http(403, "  Blocked  "))).toBe("Blocked");
    expect(refusalMessage(http(403, "   "))).toBeNull();
  });
});

describe("what stays silent", () => {
  it("says nothing when the request never reached a server", () => {
    // The revert is the whole story there, and a toast on every flaky tap
    // is noise the person can do nothing about.
    expect(refusalMessage(new ApiError("offline", 0, null, "network"))).toBeNull();
  });

  it("says nothing for a dead session", () => {
    // The API client already clears the session and leaves for /login; a
    // toast would be talking to a page on its way out.
    expect(refusalMessage(http(401, "Session ended. Please log in again."))).toBeNull();
  });

  it("says nothing for a server error, which names nothing the person did", () => {
    expect(refusalMessage(http(500, "Server error"))).toBeNull();
  });

  it("says nothing when the server sent no message", () => {
    expect(refusalMessage(http(403))).toBeNull();
  });

  it("survives being handed something that is not an error at all", () => {
    expect(refusalMessage(null)).toBeNull();
    expect(refusalMessage(undefined)).toBeNull();
    expect(refusalMessage(new Error("plain"))).toBeNull();
    expect(refusalMessage({ response: { status: "403", data: { message: "no" } } })).toBeNull();
  });
});
