import { afterEach } from "vitest";

// jest-dom's matchers and React Testing Library both need a DOM, and the
// pure-logic suites run in the node environment, so this is guarded rather
// than imported at the top level.
//
// The explicit cleanup matters: without it, every render() leaves its tree
// in the document and the next test's queries match elements from the
// previous one. Auto-cleanup only registers itself when Vitest runs with
// globals enabled, which this project does not.
if (typeof document !== "undefined") {
  await import("@testing-library/jest-dom/vitest");
  const { cleanup } = await import("@testing-library/react");
  afterEach(cleanup);
}
