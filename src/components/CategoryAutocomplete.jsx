import React, { useEffect, useId, useRef, useState } from "react";
import API from "../services/api";
import { asArray } from '../lib/apiShape';

const DEBOUNCE_MS = 250;

// A "list autocomplete with manual selection" combobox (the ARIA pattern
// used by address-lookup fields): typing narrows a list of real options
// pulled from both the curated category list and categories other users
// have actually used, but nothing here is forced - picking a suggestion
// just fills the text, and whatever the user has typed is still what
// gets submitted if they never pick one. Actual moderation of a custom
// value happens server-side; this only offers suggestions.
// Both halves of the suggestion response, reduced to what this component
// can actually render. Strings and {name} objects are both accepted for
// each, because the two halves have historically differed and a client
// that dies over it is worse than one that shows fewer suggestions.
const nameOf = (entry) => {
  if (typeof entry === "string") return entry.trim();
  if (entry && typeof entry.name === "string") return entry.name.trim();
  return "";
};

const toNames = (value) => asArray(value).map(nameOf).filter(Boolean);

const toCounted = (value) =>
  asArray(value)
    .map((entry) => ({
      name: nameOf(entry),
      count: Number.isFinite(entry?.count) ? entry.count : null,
    }))
    .filter((entry) => entry.name);

// `label` is rendered here rather than by the caller so it can be tied to
// the input with htmlFor. Both forms used to put a <label> above this
// component with nothing to point at, which looks correct and announces
// nothing.
const CategoryAutocomplete = ({
  value,
  onChange,
  label = "Category",
  hint,
  placeholder = "e.g. Chicken, or your own recipe name",
}) => {
  const [open, setOpen] = useState(false);
  const [curated, setCurated] = useState([]);
  const [community, setCommunity] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  const listboxId = useId();
  const inputId = useId();
  const hintId = useId();

  const options = [
    ...curated.map((name) => ({ name, group: "curated" })),
    ...community.map((c) => ({ name: c.name, count: c.count, group: "community" })),
  ];

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      API.get("/categories/suggest", { params: { q: value || "" } })
        .then((res) => {
          // asArray promises a list; it promises nothing about what is in
          // it. The curated half is a list of strings and the community
          // half a list of {name, count}, and every option's name is later
          // lower-cased to compare against what has been typed - so one
          // entry of the wrong shape threw inside render and replaced the
          // whole Create Recipe page with the error boundary. Normalising
          // here means an unusable entry is dropped rather than fatal.
          setCurated(toNames(res.data?.curated));
          setCommunity(toCounted(res.data?.community));
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
      <label className="field__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        type="text"
        role="combobox"
        id={inputId}
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-describedby={hint ? hintId : undefined}
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
      {hint && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}

      {open && (
        <div id={listboxId} role="listbox" className="combobox-panel">
          {curated.length === 0 && community.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted">
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
                        <span className="text-xs text-muted">{c.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
          {value?.trim() && !exactMatch && (
            <p className="px-3 py-2 text-xs text-muted border-t border-soft">
              Not seeing it? Keep typing. "{value.trim()}" will be used as your category.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryAutocomplete;
