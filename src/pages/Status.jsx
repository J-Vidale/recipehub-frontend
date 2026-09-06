import React, { useCallback, useEffect, useState } from "react";
import Seo from "../components/Seo";
import API, { isNetworkError, API_BASE_URL, API_ORIGIN } from "../services/api";

// A page for the one job that is otherwise guesswork: finding out why the
// site and its API are not talking to each other.
//
// Every failure between the two looks identical from a normal page - a
// wrong API URL, an API that is asleep, and a missing CORS entry all
// produce the same empty list. This asks the API directly and says which
// of those it is, with the variable to change.
//
// Not indexed, and it exposes nothing that is not already public: the URL
// it calls is baked into the JavaScript every visitor downloads.

const CHECKS = [
  {
    id: "reachable",
    label: "API reachable",
    // The health endpoint sits at the API's root, outside /api, and needs
    // neither auth nor the database - so it isolates "can we reach the
    // server at all" from everything downstream of it.
    run: async () => {
      let res;
      try {
        res = await fetch(`${API_ORIGIN}/`, { headers: { Accept: "application/json" } });
      } catch {
        const err = new Error("No answer from the server.");
        err.kind = "network";
        throw err;
      }
      if (!res.ok) throw new Error(`Responded ${res.status}`);
      const data = await res.json().catch(() => null);
      return { detail: data?.service ? `Responded: ${data.service}` : "Responded" };
    },
  },
  {
    id: "cors",
    label: "Browser allowed to read the response",
    run: async () => {
      await API.get("/categories");
      return { detail: "The browser was given permission to read the reply." };
    },
  },
  {
    id: "database",
    label: "Database connected",
    run: async () => {
      const { data } = await API.get("/recipes", { params: { limit: 1 } });
      const count = Array.isArray(data?.recipes) ? data.recipes.length : 0;
      return {
        detail:
          count > 0
            ? "Answered a query with at least one recipe."
            : "Answered a query. No recipes published yet.",
      };
    },
  },
];

const HINTS = {
  reachable: [
    "VITE_API_URL on the web service must be the API's URL with /api on the end.",
    "It has no production default: unset, the built site calls localhost.",
    "On free hosting the first request after a quiet spell can take ~30s. Try again once.",
  ],
  cors: [
    "CORS_ORIGINS on the API service must list this exact origin.",
    "Include the www variant too if you use one, comma separated.",
    "The API must be redeployed after changing it.",
  ],
  database: [
    "MONGO_URI on the API service must be the Atlas connection string, with the real password in place of <db_password>.",
    "Atlas Network Access must allow 0.0.0.0/0 - free hosting has no fixed outbound address.",
  ],
};

const Status = () => {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);

  const runChecks = useCallback(async () => {
    setRunning(true);
    setResults({});
    for (const check of CHECKS) {
      setResults((prev) => ({ ...prev, [check.id]: { state: "running" } }));
      try {
        const { detail } = await check.run();
        setResults((prev) => ({ ...prev, [check.id]: { state: "pass", detail } }));
      } catch (error) {
        setResults((prev) => ({
          ...prev,
          [check.id]: {
            state: "fail",
            detail: isNetworkError(error)
              ? "No answer from the server."
              : `The server answered ${error?.response?.status ?? "with an error"}: ${error.message}`,
          },
        }));
      }
    }
    setRunning(false);
  }, []);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  const apiUrl = import.meta.env.VITE_API_URL
    ? API_BASE_URL
    : `${API_BASE_URL} (VITE_API_URL is unset - this is the localhost fallback)`;
  const siteUrl = import.meta.env.VITE_SITE_URL || "(unset - falling back to the Render URL)";
  const firstFailure = CHECKS.find((c) => results[c.id]?.state === "fail");

  return (
    <div className="page-container max-w-3xl">
      <Seo
        title="Connection Status"
        description="Check whether this site can reach its API."
        noindex
      />

      <h1 className="text-3xl font-bold text-green-700 mb-2">Connection status</h1>
      <p className="text-gray-600 mb-8">
        Whether this site can reach its API, and what to change if it cannot.
      </p>

      <dl className="status-config">
        <dt>This page</dt>
        <dd>{window.location.origin}</dd>
        <dt>Calling API at</dt>
        <dd>{apiUrl}</dd>
        <dt>VITE_SITE_URL</dt>
        <dd>{siteUrl}</dd>
      </dl>

      <ul className="status-list">
        {CHECKS.map((check) => {
          const result = results[check.id] || { state: "pending" };
          return (
            <li key={check.id} className={`status-item status-item--${result.state}`}>
              <span className="status-item__state" aria-hidden="true">
                {result.state === "pass" ? "✓" : result.state === "fail" ? "✗" : "…"}
              </span>
              <div>
                <p className="status-item__label">
                  {check.label}
                  <span className="sr-only">
                    {result.state === "pass" ? ": passed" : result.state === "fail" ? ": failed" : ": checking"}
                  </span>
                </p>
                {result.detail && <p className="status-item__detail">{result.detail}</p>}
              </div>
            </li>
          );
        })}
      </ul>

      <button type="button" className="btn-secondary mt-6" onClick={runChecks} disabled={running}>
        {running ? "Checking..." : "Run the checks again"}
      </button>

      {firstFailure && (
        <section className="status-hints">
          <h2 className="text-lg font-bold mb-2">
            What to check for &ldquo;{firstFailure.label}&rdquo;
          </h2>
          <ul>
            {HINTS[firstFailure.id].map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            The later checks depend on this one, so fix it first and run them again.
          </p>
        </section>
      )}
    </div>
  );
};

export default Status;
