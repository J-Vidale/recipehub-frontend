// Tracks whether an API request has been waiting long enough to be worth
// explaining.
//
// The API sleeps on free hosting after about fifteen minutes idle, and the
// first request after that waits roughly thirty seconds for the container
// to start. Until now that looked exactly like a broken site: a bare page,
// no spinner, no message, for half a minute. Saying what is happening
// turns a fault into a wait.
//
// Deliberately not a React context: the API client is a plain module and
// should not have to reach into the component tree to report progress.

const SLOW_AFTER_MS = 4000;

let inFlight = 0;
let slowTimer = null;
let slow = false;
const listeners = new Set();

const emit = () => {
  for (const listener of listeners) listener(slow);
};

const setSlow = (value) => {
  if (slow === value) return;
  slow = value;
  emit();
};

export const subscribeToSlowRequests = (listener) => {
  listeners.add(listener);
  listener(slow);
  return () => listeners.delete(listener);
};

export const requestStarted = () => {
  inFlight += 1;
  if (inFlight === 1 && slowTimer === null) {
    slowTimer = setTimeout(() => {
      slowTimer = null;
      // Only if something is still waiting: a request that finished
      // quickly must not leave the notice behind.
      if (inFlight > 0) setSlow(true);
    }, SLOW_AFTER_MS);
  }
};

export const requestFinished = () => {
  inFlight = Math.max(0, inFlight - 1);
  if (inFlight === 0) {
    if (slowTimer !== null) {
      clearTimeout(slowTimer);
      slowTimer = null;
    }
    setSlow(false);
  }
};

// Test seam: lets a suite assert the transitions without waiting out the
// real threshold.
export const __resetRequestActivity = () => {
  if (slowTimer !== null) clearTimeout(slowTimer);
  slowTimer = null;
  inFlight = 0;
  slow = false;
  listeners.clear();
};

export const SLOW_REQUEST_THRESHOLD_MS = SLOW_AFTER_MS;
