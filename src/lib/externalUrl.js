// A URL from somewhere else, checked before it becomes a link.
//
// TheMealDB and TheCocktailDB supply the "watch on YouTube" and "recipe
// source" addresses, and those values go straight into an href. React 19
// happens to block javascript: URLs, and browsers refuse a top-level
// navigation to a data: one, so there is no live hole here today - but
// both of those are somebody else's decision, made elsewhere, and neither
// is a rule this app states for itself.
//
// This states it: an address that arrives from a third party is a link
// only if it parses and speaks http or https. Anything else is not
// rendered as a link at all, which is better than rendering one that goes
// somewhere unexpected.

export const externalUrl = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    // Not absolute, or not a URL at all. Relative addresses are not
    // expected from these sources and would resolve against this site.
    return null;
  }
};
