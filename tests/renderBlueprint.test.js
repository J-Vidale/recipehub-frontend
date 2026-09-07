import { describe, it, expect, beforeAll } from "vitest";
import { readFile } from "node:fs/promises";

// The blueprint is only useful while it agrees with the repo it deploys,
// and nothing else would notice it drifting: a stale build command or a
// misspelled variable name surfaces as a failed deploy, or worse as a site
// that builds and does nothing. Text checks rather than a YAML parser -
// enough to catch drift, not enough to be worth a dependency.

const read = (name) => readFile(new URL(`../${name}`, import.meta.url), "utf8");

let blueprint;
let pkg;
let envExample;

beforeAll(async () => {
  blueprint = await read("render.yaml");
  pkg = JSON.parse(await read("package.json"));
  envExample = await read(".env.example");
});

describe("render.yaml", () => {
  it("runs the build the repo defines", () => {
    expect(pkg.scripts.build).toBe("vite build");
    expect(blueprint).toContain("buildCommand: npm ci && npm run build");
  });

  it("publishes the directory Vite writes to", async () => {
    const viteConfig = await read("vite.config.js");
    // Vite's default outDir; the blueprint has to follow if that changes.
    expect(viteConfig).not.toMatch(/outDir/);
    expect(blueprint).toContain("staticPublishPath: ./dist");
  });

  // Without this, every URL opened from outside the app is a 404: a shared
  // link, a bookmark, a search result, a refresh. Inside the app the same
  // links work, which is what makes it easy to ship and slow to notice.
  it("rewrites unknown paths to the app shell", () => {
    expect(blueprint).toMatch(/- type: rewrite\n\s+source: \/\*\n\s+destination: \/index\.html/);
  });

  it("sets the headers a static site does not get for free", () => {
    for (const header of [
      "X-Content-Type-Options",
      "X-Frame-Options",
      "Referrer-Policy",
      "Permissions-Policy",
    ]) {
      expect(blueprint, `render.yaml is missing ${header}`).toContain(`name: ${header}`);
    }
  });

  it("prompts for the API URL, which has no usable default", () => {
    expect(blueprint).toMatch(/- key: VITE_API_URL\n\s+sync: false/);
  });

  // A variable named in the blueprint but nowhere in the code is a typo
  // that costs a deploy to find.
  it("names only variables this repo documents", () => {
    const keys = [...blueprint.matchAll(/^\s*- key: ([A-Z][A-Z0-9_]*)$/gm)].map((m) => m[1]);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(envExample, `.env.example does not document ${key}`).toContain(`${key}=`);
    }
  });

  it("holds no values, only prompts", () => {
    expect(blueprint).not.toMatch(/sentry\.io\/\d/);
    expect(blueprint).not.toMatch(/^\s*value: https?:\/\//m);
  });
});

describe("the Node version", () => {
  it("is pinned, so the host does not pick one Vite cannot run", () => {
    expect(pkg.engines?.node).toBe(">=20.19 <23");
  });
});
