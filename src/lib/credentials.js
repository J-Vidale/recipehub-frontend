// The same rules the API applies to a new account, checked here first.
//
// This is a copy, deliberately. The two services deploy separately, so the
// client cannot import the server's copy, and the server must keep its own
// regardless - a rule enforced only in a browser is not enforced. What
// this buys is the round trip: on free hosting the API may be asleep, and
// learning "usernames need three characters" after a thirty-second wait is
// a bad way to find out.
//
// If the two ever disagree, the server wins and its message is what the
// form shows.

export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 30;
export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 128;

const USERNAME_SHAPE = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const MAX_EMAIL_LENGTH = 254;

export const USERNAME_HINT =
  "Letters, numbers, and . _ - starting with a letter or number.";

export const validateUsername = (value) => {
  const username = typeof value === "string" ? value.trim() : "";
  if (!username) return "Enter a username";
  if (username.length < MIN_USERNAME_LENGTH) {
    return `Usernames are at least ${MIN_USERNAME_LENGTH} characters`;
  }
  if (username.length > MAX_USERNAME_LENGTH) {
    return `Usernames are at most ${MAX_USERNAME_LENGTH} characters`;
  }
  if (!USERNAME_SHAPE.test(username)) return USERNAME_HINT;
  return null;
};

export const validateEmail = (value) => {
  const email = typeof value === "string" ? value.trim() : "";
  if (!email) return "Enter your email address";
  if (email.length > MAX_EMAIL_LENGTH) return "That address is too long";
  if (!EMAIL_SHAPE.test(email)) return "That does not look like an email address";
  return null;
};

export const validatePassword = (value) => {
  const password = typeof value === "string" ? value : "";
  if (!password) return "Choose a password";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Passwords are at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Passwords are at most ${MAX_PASSWORD_LENGTH} characters`;
  }
  return null;
};
