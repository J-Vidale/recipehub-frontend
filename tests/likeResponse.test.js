import { describe, it, expect } from "vitest";
import { likeResult } from "../src/lib/likeResponse";

// Both like buttons flip optimistically before the server answers, so on
// success the only question is whether the answer is usable. If it is not,
// the optimistic value is a better thing to keep than undefined rendered
// into the label as "undefined likes".
//
// This codebase has been bitten by trusting a response shape before - a
// recipe page crashed on m.filter when a list read came back as something
// other than an array, which is why lib/apiShape.js exists.

describe("reading a like response", () => {
  it("takes both fields when both are usable", () => {
    expect(likeResult({ likeCount: 12, likedByMe: true })).toEqual({ likeCount: 12, likedByMe: true });
  });

  it("takes a zero count, which is a real answer", () => {
    // The falsy trap: 0 likes is a number the server means.
    expect(likeResult({ likeCount: 0, likedByMe: false })).toEqual({ likeCount: 0, likedByMe: false });
  });

  it.each([
    ["a missing body", undefined],
    ["null", null],
    ["an empty object", {}],
    ["an error body", { message: "Server error" }],
    ["a string count", { likeCount: "12" }],
    ["a null count", { likeCount: null }],
    ["NaN", { likeCount: NaN }],
    ["an array", []],
  ])("keeps the optimistic value for %s", (_label, body) => {
    expect(likeResult(body).likeCount).toBeUndefined();
  });

  it.each([
    ["a truthy non-boolean", { likedByMe: 1 }],
    ["a string", { likedByMe: "true" }],
    ["nothing", {}],
  ])("keeps the optimistic flag for %s", (_label, body) => {
    expect(likeResult(body).likedByMe).toBeUndefined();
  });

  it("takes one field even when the other is unusable", () => {
    expect(likeResult({ likeCount: 5, likedByMe: "yes" })).toEqual({ likeCount: 5 });
  });
});
