// Client-side error reporting, off unless VITE_SENTRY_DSN is set at build
// time. A crash in the browser is otherwise invisible: the ErrorBoundary
// shows its fallback and nothing records why.
//
// The SDK is loaded with a dynamic import rather than a static one. It is
// around 40kB gzipped, and a static import put all of it in the entry
// chunk even with no DSN configured, taking the initial load from 79kB to
// 107kB for code that never ran. This way an unconfigured build never
// fetches it at all, and a configured one fetches it after first paint
// rather than blocking it.

let sentryPromise = null;

export const isMonitoringEnabled = () => Boolean(import.meta.env.VITE_SENTRY_DSN);

const loadSentry = () => {
  if (!sentryPromise) {
    // A failed chunk load must not be memoised: keeping the rejected
    // promise would leave monitoring permanently dead and every later
    // captureError rejecting again.
    sentryPromise = import("@sentry/react").catch((error) => {
      sentryPromise = null;
      throw error;
    });
  }
  return sentryPromise;
};

export const buildSentryOptions = () => ({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,

  // Session Replay is deliberately not enabled. It records what people
  // type, and this app has private messages and a login form.
  sendDefaultPii: false,

  beforeSend(event) {
    // The auth token travels in an Authorization header, so scrub anything
    // that could carry it out with a report.
    if (event.request?.headers) {
      delete event.request.headers.Authorization;
      delete event.request.headers.authorization;
    }
    return event;
  },
});

// Returns a promise so tests can await it; nothing in the app needs to.
// Callers do not await these, so they swallow their own failures rather
// than surfacing as unhandled rejections. Monitoring going missing is not
// worth breaking the page over.
export const initMonitoring = async () => {
  if (!isMonitoringEnabled()) return false;
  try {
    const Sentry = await loadSentry();
    Sentry.init(buildSentryOptions());
    return true;
  } catch {
    return false;
  }
};

export const captureError = async (error, context = {}) => {
  if (!isMonitoringEnabled()) return false;
  try {
    const Sentry = await loadSentry();
    Sentry.captureException(error, { extra: context });
    return true;
  } catch {
    return false;
  }
};
