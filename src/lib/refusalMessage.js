// The server's reason for turning an action down, when it gave one.
//
// A button that updates optimistically and then reverts with nothing said
// reads as a bug: the heart fills, empties again, and the person is left
// to guess. Blocking is what made this matter - liking, sharing,
// commenting and replying all answer 403 with a sentence written to be
// read - but any refusal has something worth passing on.
//
// A failure that never reached a server stays silent on purpose. There the
// revert is the whole story, and a toast on every flaky tap is noise the
// person can do nothing about.
export const refusalMessage = (error) => {
  if (!error || error.kind === "network") return null;

  const status = error.response?.status;
  if (typeof status !== "number" || status < 400 || status >= 500) return null;

  // 401 is the dead-session case. The API client already clears the
  // session and sends the browser to the login page, so a toast here would
  // be talking to a page that is on its way out.
  if (status === 401) return null;

  const message = error.response?.data?.message;
  return typeof message === "string" && message.trim() ? message.trim() : null;
};
