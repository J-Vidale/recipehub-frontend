import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { renderTemplate, apiHints } from "../vite-plugin-seo-files.js";

const root = join(import.meta.dirname, "..");
const templates = readdirSync(join(root, "seo"));
const readTemplate = (name) => readFileSync(join(root, "seo", name), "utf8");

describe("substitution", () => {
  it("replaces every placeholder", () => {
    const out = renderTemplate("a __SITE_URL__ b __SITE_URL__", "https://x.com");
    expect(out).toBe("a https://x.com b https://x.com");
  });

  it("strips a trailing slash so paths do not double up", () => {
    // "https://x.com/" + "/explore" would produce "https://x.com//explore".
    const out = renderTemplate("__SITE_URL__/explore", "https://x.com/");
    expect(out).toBe("https://x.com/explore");
  });

  it("leaves text with no placeholder alone", () => {
    expect(renderTemplate("User-agent: *", "https://x.com")).toBe("User-agent: *");
  });
});

describe("the templates themselves", () => {
  it("ships robots.txt, sitemap.xml and llms.txt", () => {
    expect(templates.sort()).toEqual(["llms.txt", "robots.txt", "sitemap.xml"]);
  });

  // This is the failure the templating exists to prevent: a hardcoded
  // Render URL surviving into a build for a custom domain, quietly telling
  // search engines the canonical home is somewhere else.
  it.each(templates)("%s hardcodes no origin", (name) => {
    expect(readTemplate(name)).not.toMatch(/https?:\/\/(?!__SITE_URL__)[a-z0-9-]+\.(onrender\.com|com|dev|io)/i);
  });

  it.each(templates)("%s uses the placeholder at least once", (name) => {
    expect(readTemplate(name)).toContain("__SITE_URL__");
  });

  it("index.html hardcodes no origin either", () => {
    const html = readFileSync(join(root, "index.html"), "utf8");
    expect(html).not.toMatch(/recipehub-frontend-cgip\.onrender\.com/);
    expect(html).toContain("__SITE_URL__");
  });
});

describe("rendered output for a custom domain", () => {
  const SITE = "https://recipehub.example";

  it("points the sitemap reference in robots.txt at the same origin", () => {
    const robots = renderTemplate(readTemplate("robots.txt"), SITE);
    expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
    expect(robots).not.toMatch(/onrender/);
  });

  it("rewrites every sitemap entry", () => {
    const sitemap = renderTemplate(readTemplate("sitemap.xml"), SITE);
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBeGreaterThan(5);
    for (const loc of locs) expect(loc.startsWith(SITE)).toBe(true);
  });

  it("produces no double slashes in a path", () => {
    const sitemap = renderTemplate(readTemplate("sitemap.xml"), `${SITE}/`);
    expect(sitemap).not.toMatch(/[^:]\/\//);
  });

  it("rewrites every llms.txt link", () => {
    const llms = renderTemplate(readTemplate("llms.txt"), SITE);
    expect(llms).not.toMatch(/onrender/);
    expect(llms).toContain(`${SITE}/cuisines`);
  });

  it("lists the newer browse pages in the sitemap", () => {
    const sitemap = renderTemplate(readTemplate("sitemap.xml"), SITE);
    expect(sitemap).toContain(`${SITE}/cuisines`);
    expect(sitemap).toContain(`${SITE}/ingredients`);
  });
});

// Connection hints for the API, written at build time because the origin
// is only known then. A preconnect earns its socket only if the page will
// really talk to that host - pointing one at localhost from a production
// build would just be a wasted DNS lookup and a misleading line in the
// document head.
describe("apiHints", () => {
  it("preconnects and pre-resolves a real API origin", () => {
    const hints = apiHints("https://api.example.com");
    expect(hints).toContain('rel="preconnect" href="https://api.example.com"');
    expect(hints).toContain('rel="dns-prefetch" href="https://api.example.com"');
    // The API is a different origin and the requests carry credentials, so
    // the speculative connection has to be opened the same way or it is
    // not the one that gets reused.
    expect(hints).toContain("crossorigin");
  });

  it.each([
    ["nothing configured", ""],
    ["the API on this same origin", ""],
    ["a developer's machine", "http://localhost:5000"],
    ["the loopback address", "http://127.0.0.1:5000"],
    ["IPv6 loopback", "http://[::1]:5000"],
  ])("emits no hint for %s", (_label, origin) => {
    expect(apiHints(origin)).toBe("");
  });

  it("is not fooled by a host that merely starts with localhost", () => {
    expect(apiHints("https://localhost-api.example.com")).not.toBe("");
  });
});
