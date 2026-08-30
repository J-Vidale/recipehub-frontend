// Safe localStorage access.
//
// Reading localStorage throws a SecurityError - not just returns null - in
// browsers configured to block site data, in private-mode variants, and
// whenever the app is embedded in a cross-origin iframe. Because the auth
// token is read on nearly every render path, an unguarded access there
// takes down the whole app with a blank screen rather than degrading to a
// logged-out experience. These wrappers fail closed instead.

export const getStored = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const setStored = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    // Also covers quota-exceeded, which Safari raises in private mode.
    return false;
  }
};

export const removeStored = (key) => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* nothing useful to do if storage is unavailable */
  }
};
