// The reasoning behind /status's database check, kept out of the page so
// it can be tested without a browser - and because exporting a function
// beside a component breaks fast refresh, which is what the lint rule
// about it is there to catch.

/**
 * What the health endpoint's reported database state means for the check.
 *
 * The endpoint reports the driver's own connection state from a local
 * integer, so it costs no round trip and answers at once. Without it, a
 * wrong MONGO_URI - the likeliest thing to get wrong on a first deploy -
 * showed up only as a query that hung for mongoose's ten-second buffering
 * timeout and then came back "the server answered 500": true, slow, and
 * no help at all.
 *
 * @param {string|undefined} state The `database` field of the health
 *   response: "connected", "connecting", "disconnected", "disconnecting"
 *   or "unknown". Undefined when the health endpoint could not be read.
 * @returns {string|null} A finding to report, or null to go on and prove
 *   the connection with a real query - a connected socket is not by
 *   itself proof that the database can answer.
 */
export const databaseVerdict = (state) => {
  // No answer to go on. The query is then the only evidence there is, and
  // it fails honestly on its own.
  if (!state) return null;
  if (state === "connected") return null;
  if (state === "connecting") {
    return "The API is still connecting to its database. If this does not clear, the connection string is being rejected.";
  }
  return `The API is running, but reports its database as ${state}.`;
};
