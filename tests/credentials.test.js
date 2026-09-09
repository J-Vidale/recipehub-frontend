import { describe, it, expect } from "vitest";
import {
  validateUsername,
  validateEmail,
  validatePassword,
  MAX_USERNAME_LENGTH,
  MAX_PASSWORD_LENGTH,
} from "../src/lib/credentials";

// These mirror the API's rules. They exist to save a round trip, not to
// enforce anything - but if they drift looser than the server's, the form
// starts sending things the server will refuse, which is worse than not
// checking at all.

describe("validateUsername", () => {
  it.each(["marta", "marta_cooks", "joe.cooks-99", "A1b"])("accepts %s", (name) => {
    expect(validateUsername(name)).toBeNull();
  });

  it.each([
    ["nothing", ""],
    ["whitespace", "   "],
    ["two characters", "ab"],
    ["a leading separator", "_marta"],
    ["a space inside", "marta cooks"],
    ["a Cyrillic lookalike", "mаrta"],
    ["a zero-width space", "mar​ta"],
  ])("rejects %s", (_label, name) => {
    expect(validateUsername(name)).not.toBeNull();
  });

  it("matches the server's ceiling", () => {
    expect(MAX_USERNAME_LENGTH).toBe(30);
    expect(validateUsername("a".repeat(30))).toBeNull();
    expect(validateUsername("a".repeat(31))).not.toBeNull();
  });
});

describe("validateEmail", () => {
  it.each(["a@b.com", "first.last@sub.example.co.uk", "x+tag@y.dev"])(
    "accepts %s",
    (email) => {
      expect(validateEmail(email)).toBeNull();
    }
  );

  it.each(["", "nope", "a@b", "a b@c.com", "@b.com"])("rejects %o", (email) => {
    expect(validateEmail(email)).not.toBeNull();
  });
});

describe("validatePassword", () => {
  it("matches the server's floor and ceiling", () => {
    expect(validatePassword("abcde")).not.toBeNull();
    expect(validatePassword("abcdef")).toBeNull();
    expect(MAX_PASSWORD_LENGTH).toBe(128);
    expect(validatePassword("a".repeat(128))).toBeNull();
    expect(validatePassword("a".repeat(129))).not.toBeNull();
  });
});
