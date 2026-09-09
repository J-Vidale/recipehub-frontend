// Reading lists out of API responses without trusting their shape.
//
// Every list page did `setThings(res.data.things)` and then mapped over
// the result. When the response is not the shape the page expects, that
// throws inside render and the error boundary replaces the whole page
// with "Something went wrong" - no navigation, no footer, nothing to do
// but go home.
//
// The response being the wrong shape is not hypothetical. The two
// services deploy separately, so there is always a window where a browser
// holding the new client talks to the old API, or the reverse. A page
// that renders empty during that window is a page that recovers by
// itself; a page that throws is an outage.
//
// This is deliberately not validation. It answers one question - can I
// map over this - and leaves everything else to the caller.

export const asArray = (value) => (Array.isArray(value) ? value : []);

// Cursors are compared for truthiness to decide whether a "load more"
// button appears, so an absent one has to be falsy rather than undefined
// spreading into a query string.
export const asCursor = (value) => (typeof value === "string" && value ? value : null);
