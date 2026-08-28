import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

const DEBOUNCE_MS = 300;

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await API.get("/search", { params: { q: trimmed, limit: 5 } });
        setResults(res.data);
        setOpen(true);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const hasResults = results && (results.recipes.length > 0 || results.users.length > 0);

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results && setOpen(true)}
          placeholder="Search recipes or people..."
          className="border rounded px-3 py-1.5 text-sm w-48 md:w-64"
        />
      </form>
      {open && (
        <div className="absolute mt-1 w-72 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <p className="p-3 text-sm text-gray-500">Searching...</p>
          ) : !hasResults ? (
            <p className="p-3 text-sm text-gray-500">No results for "{query.trim()}"</p>
          ) : (
            <>
              {results.users.length > 0 && (
                <div>
                  <p className="px-3 pt-2 text-xs font-semibold text-gray-400 uppercase">People</p>
                  {results.users.map((u) => (
                    <Link
                      key={u._id}
                      to={`/users/${u._id}`}
                      onClick={() => setOpen(false)}
                      className="block px-3 py-2 hover:bg-gray-50 text-sm"
                    >
                      {u.username}
                    </Link>
                  ))}
                </div>
              )}
              {results.recipes.length > 0 && (
                <div>
                  <p className="px-3 pt-2 text-xs font-semibold text-gray-400 uppercase">Recipes</p>
                  {results.recipes.map((r) => (
                    <Link
                      key={r._id}
                      to={`/recipes/${r._id}`}
                      onClick={() => setOpen(false)}
                      className="block px-3 py-2 hover:bg-gray-50 text-sm"
                    >
                      {r.title}
                    </Link>
                  ))}
                </div>
              )}
              <button
                onClick={handleSubmit}
                className="w-full text-left px-3 py-2 text-sm text-green-700 hover:bg-gray-50 border-t"
              >
                See all results for "{query.trim()}"
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
