import { describe, it, expect, vi, afterEach } from "vitest";
import { isMonitoringEnabled, buildSentryOptions, captureError, initMonitoring } from "../src/lib/monitoring";

afterEach(() => {
  vi.unstubAllEnvs();
});

// Monitoring is optional. A build with no DSN must not fetch the SDK, and
// must not fail because it is absent.
describe("without a DSN", () => {
  it("reports itself as disabled", () => {
    vi.stubEnv("VITE_SENTRY_DSN", "");
    expect(isMonitoringEnabled()).toBe(false);
  });

  it("initMonitoring resolves false without loading anything", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "");
    await expect(initMonitoring()).resolves.toBe(false);
  });

  it("captureError resolves false rather than throwing", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "");
    await expect(captureError(new Error("boom"))).resolves.toBe(false);
  });
});

describe("with a DSN", () => {
  it("reports itself as enabled", () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://key@o0.ingest.sentry.io/0");
    expect(isMonitoringEnabled()).toBe(true);
  });
});

// This app has private messages and a login form; nothing typed into it
// should reach a third-party dashboard.
describe("the payload scrubber", () => {
  it("does not opt into personally identifying data", () => {
    expect(buildSentryOptions().sendDefaultPii).toBe(false);
  });

  it("samples traces rather than sending all of them", () => {
    expect(buildSentryOptions().tracesSampleRate).toBeLessThan(1);
  });

  it("strips the Authorization header in either casing", () => {
    const { beforeSend } = buildSentryOptions();
    const event = beforeSend({
      request: {
        headers: { Authorization: "Bearer a", authorization: "Bearer b", "user-agent": "test" },
      },
    });
    expect(event.request.headers.Authorization).toBeUndefined();
    expect(event.request.headers.authorization).toBeUndefined();
    expect(event.request.headers["user-agent"]).toBe("test");
  });

  it("passes an event with no request through", () => {
    const { beforeSend } = buildSentryOptions();
    expect(beforeSend({ message: "plain" }).message).toBe("plain");
  });

  it("does not enable Session Replay, which would record typing", () => {
    const options = buildSentryOptions();
    expect(options.replaysSessionSampleRate).toBeUndefined();
    expect(options.replaysOnErrorSampleRate).toBeUndefined();
    expect(options.integrations).toBeUndefined();
  });
});
