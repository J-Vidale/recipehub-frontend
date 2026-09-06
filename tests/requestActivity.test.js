// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  subscribeToSlowRequests,
  requestStarted,
  requestFinished,
  __resetRequestActivity,
  SLOW_REQUEST_THRESHOLD_MS,
} from "../src/lib/requestActivity";

beforeEach(() => {
  __resetRequestActivity();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// The notice exists for one situation: the API is asleep and the first
// request takes ~30s. It must not appear for ordinary requests, and must
// not linger once the wait is over.
describe("slow-request signal", () => {
  it("stays quiet for a request that finishes quickly", () => {
    const seen = [];
    subscribeToSlowRequests((v) => seen.push(v));
    requestStarted();
    vi.advanceTimersByTime(SLOW_REQUEST_THRESHOLD_MS - 1);
    requestFinished();
    vi.advanceTimersByTime(5000);
    expect(seen).toEqual([false]);
  });

  it("fires once the request outlasts the threshold", () => {
    const seen = [];
    subscribeToSlowRequests((v) => seen.push(v));
    requestStarted();
    vi.advanceTimersByTime(SLOW_REQUEST_THRESHOLD_MS + 10);
    expect(seen.at(-1)).toBe(true);
  });

  it("clears when the request lands", () => {
    const seen = [];
    subscribeToSlowRequests((v) => seen.push(v));
    requestStarted();
    vi.advanceTimersByTime(SLOW_REQUEST_THRESHOLD_MS + 10);
    requestFinished();
    expect(seen.at(-1)).toBe(false);
  });

  it("waits for the last of several overlapping requests", () => {
    const seen = [];
    subscribeToSlowRequests((v) => seen.push(v));
    requestStarted();
    requestStarted();
    vi.advanceTimersByTime(SLOW_REQUEST_THRESHOLD_MS + 10);
    expect(seen.at(-1)).toBe(true);

    requestFinished();
    expect(seen.at(-1)).toBe(true); // one still outstanding
    requestFinished();
    expect(seen.at(-1)).toBe(false);
  });

  it("does not fire if everything finished before the timer ran", () => {
    const seen = [];
    subscribeToSlowRequests((v) => seen.push(v));
    requestStarted();
    requestFinished();
    vi.advanceTimersByTime(SLOW_REQUEST_THRESHOLD_MS * 3);
    expect(seen).toEqual([false]);
  });

  it("gives a new subscriber the current state immediately", () => {
    requestStarted();
    vi.advanceTimersByTime(SLOW_REQUEST_THRESHOLD_MS + 10);
    const seen = [];
    subscribeToSlowRequests((v) => seen.push(v));
    expect(seen[0]).toBe(true);
  });

  it("stops calling a listener that unsubscribed", () => {
    const seen = [];
    const stop = subscribeToSlowRequests((v) => seen.push(v));
    stop();
    requestStarted();
    vi.advanceTimersByTime(SLOW_REQUEST_THRESHOLD_MS + 10);
    expect(seen).toEqual([false]);
  });

  it("never lets the counter go negative", () => {
    const seen = [];
    subscribeToSlowRequests((v) => seen.push(v));
    requestFinished();
    requestFinished();
    requestStarted();
    vi.advanceTimersByTime(SLOW_REQUEST_THRESHOLD_MS + 10);
    // One real request outstanding, so the notice is correct to appear.
    expect(seen.at(-1)).toBe(true);
  });
});
