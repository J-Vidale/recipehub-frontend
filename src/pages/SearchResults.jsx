import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import API from "../services/api";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [results, setResults] = useState({ recipes: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!q.trim()) {
      setResults({ recipes: [], users: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    API.get("/search", { params: { q, limit: 25 } })
      .then((res) => setResults(res.data))
      .catch((err) => {
        console.error("Search failed:", err);
        setError("Couldn't load search results. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [q]);

  const hasResults = results.recipes.length > 0 || results.users.length > 0;

  return (
    <div className="page-container max-w-3xl">
      <h2 className="text-2xl font-bold text-green-700 mb-6">
        Search results for "{q}"
      </h2>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : !hasResults ? (
        <p className="text-gray-600">No results found.</p>
      ) : (
        <div className="space-y-8">
          {results.users.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">People</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {results.users.map((u) => (
                  <Link
                    key={u._id}
                    to={`/users/${u._id}`}
                    className="card-sm hover:shadow-md transition"
                  >
                    <p className="font-semibold">{u.username}</p>
                    <p className="text-sm text-gray-500">{u.followerCount} followers</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {results.recipes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Recipes</h3>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {results.recipes.map((r) => (
                  <Link
                    key={r._id}
                    to={`/recipes/${r._id}`}
                    className="card hover:shadow-lg transition flex flex-col"
                  >
                    <h4 className="font-semibold mb-1">{r.title}</h4>
                    {r.user?.username && (
                      <p className="text-xs text-gray-500 mb-2">by {r.user.username}</p>
                    )}
                    <p className="text-sm text-gray-600 flex-1">
                      {r.instructions?.slice(0, 100)}...
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
