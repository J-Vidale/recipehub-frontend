// A message that belongs to the next page load rather than this one.
//
// Deleting an account ends with a full reload: the page it happens on is
// behind ProtectedRoute, which sends a signed-out visitor to the login
// screen the instant the session clears - so the journey ended by asking
// someone to log into the account they had just deleted. Reloading into a
// fresh app is the honest end state anyway: no stale context, no cached
// queries, nothing still holding a dead session.
//
// A reload takes the toast with it, which is why the message is handed
// over instead. sessionStorage, not localStorage: it should not outlive
// the tab, and it must never be shown twice.

const KEY = "recipehub:handoff";

export const setHandoff = (message) => {
  try {
    window.sessionStorage.setItem(KEY, message);
    return true;
  } catch {
    // Blocked site data or private mode. Losing the confirmation is a
    // shame, not a failure - the deletion itself already happened.
    return false;
  }
};

/** Reads the pending message and clears it, so a refresh does not repeat it. */
export const takeHandoff = () => {
  try {
    const message = window.sessionStorage.getItem(KEY);
    if (message) window.sessionStorage.removeItem(KEY);
    return message || null;
  } catch {
    return null;
  }
};
