import React, { useEffect, useId, useRef, useState } from "react";
import API from "../services/api";

const DEBOUNCE_MS = 250;

// A "list autocomplete with manual selection" combobox (the ARIA pattern
// used by address-lookup fields): typing narrows a list of real options
// pulled from both the curated category list and categories other users
// have actually used, but nothing here is forced - picking a suggestion
// just fills the text, and whatever the user has typed is still what
// gets submitted if they never pick one. Actual moderation of a custom
// value happens server-side; this only offers suggestions.
const CategoryAutocomplete = ({ value, onChange, placeholder = "e.g. Chicken, or your own recipe name" }) => {
  const [open, setOpen] = useState(false);
  const [curated, setCurated] = useState([]);
  const [community, setCommunity] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  const listboxId = useId();

  const options = [...curated.map((name) => ({ name, group: "curated" })), ...community.map((c) => ({ name: c.name, count: c.count, group: "community" }))];

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      API.get("/categories/suggest", { params: { q: value || "" } })
        .then((res) => {
          setCurated(res.data.curated || []);
          setCommunity(res.data.community || []);
        })
        .catch((err) => console.error("Failed to fetch category suggestions:", err));
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectOption = (name) => {
    onChange(name);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (open && activeIndex >= 0 && options[activeIndex]) {
        e.preventDefault();
        selectOption(options[activeIndex].name);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const exactMatch = options.some((o) => o.name.toLowerCase() === (value || "").trim().toLowerCase());

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={40}
        className="input"
        autoComplete="off"
      />
      {open && (
        <div id={listboxId} role="listbox" className="combobox-panel">
          {curated.length === 0 && community.length === 0 ? (
            <p className="px-3 py-3 text-sm text-gray-500">
              No matching categories found. Your typed name will be used as-is.
            </p>
          ) : (
            <>
              {curated.length > 0 && (
                <div>
                  <p className="combobox-group-label">Categories</p>
                  {curated.map((name) => {
                    const index = options.findIndex((o) => o.group === "curated" && o.name === name);
                    return (
                      <div
                        key={name}
                        role="option"
                        aria-selected={activeIndex === index}
                        className="combobox-option"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectOption(name);
                        }}
                        onMouseEnter={() => setActiveIndex(index)}
                      >
                        {name}
                      </div>
                    );
                  })}
                </div>
              )}
              {community.length > 0 && (
                <div>
                  <p className="combobox-group-label">Used by other cooks</p>
                  {community.map((c) => {
                    const index = options.findIndex((o) => o.group === "community" && o.name === c.name);
                    return (
                      <div
                        key={c.name}
                        role="option"
                        aria-selected={activeIndex === index}
                        className="combobox-option"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectOption(c.name);
                        }}
                        onMouseEnter={() => setActiveIndex(index)}
                      >
                        <span>{c.name}</span>
                        <span className="text-xs text-gray-400">{c.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
          {value?.trim() && !exactMatch && (
            <p className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200">
              Not seeing it? Keep typing. "{value.trim()}" will be used as your category.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryAutocomplete;
