import { describe, it, expect } from "vitest";
import { databaseVerdict } from "../src/lib/statusChecks";

// /status is the page the owner reads while wiring the two Render services
// together, and a wrong MONGO_URI is the likeliest thing to get wrong on a
// first deploy. Before this the database check went straight to a query,
// which with no connection buffers for mongoose's ten-second timeout and
// then comes back "the server answered 500" - true, slow, and no help.
//
// The health endpoint reports the driver's own connection state from a
// local integer, so it costs nothing and names the problem outright.

describe("the database verdict", () => {
  it("says nothing when the API reports a connection, so the query can prove it", () => {
    // A connected socket is not proof the database can answer. Returning
    // null here is what lets the real query run.
    expect(databaseVerdict("connected")).toBeNull();
  });

  it("says nothing when the health endpoint could not be read", () => {
    // The reachability check owns that failure. The query is then the only
    // evidence there is, and it fails honestly on its own.
    expect(databaseVerdict(undefined)).toBeNull();
    expect(databaseVerdict("")).toBeNull();
  });

  it("names a rejected connection string", () => {
    expect(databaseVerdict("disconnected")).toMatch(/API is running, but reports its database as disconnected/);
  });

  it("distinguishes a cold start from a rejection", () => {
    // Mid-connect on a fresh boot is normal; still mid-connect a minute
    // later means the string is being refused. The wording has to leave
    // room for both.
    const verdict = databaseVerdict("connecting");
    expect(verdict).toMatch(/still connecting/i);
    expect(verdict).toMatch(/if this does not clear/i);
  });

  it("reports a state it does not recognise rather than passing it", () => {
    expect(databaseVerdict("unknown")).toMatch(/reports its database as unknown/);
    expect(databaseVerdict("disconnecting")).toMatch(/reports its database as disconnecting/);
  });
});

describe("the check that uses it", () => {
  it("reads health before it queries, so a dead database answers at once", async () => {
    const { readFile } = await import("node:fs/promises");
    const source = await readFile(new URL("../src/pages/Status.jsx", import.meta.url), "utf8");
    const check = source.slice(source.indexOf('id: "database"'), source.indexOf('const HINTS'));
    expect(check.indexOf("databaseVerdict")).toBeLessThan(check.indexOf('API.get("/recipes"'));
  });

  it("does not dress a clear answer up as a server error", async () => {
    const { readFile } = await import("node:fs/promises");
    const source = await readFile(new URL("../src/pages/Status.jsx", import.meta.url), "utf8");
    expect(source).toMatch(/error\.kind = "verdict"/);
    expect(source).toMatch(/error\?\.kind === "verdict"/);
  });
});
