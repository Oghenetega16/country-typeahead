"use client";

/**
 * Presentation layer — pure markup and event wiring. All the actual
 * search/debounce/keyboard/stale-request behavior lives in
 * `useTypeaheadSearch` (hooks/) against `searchPlaces` (lib/geocoding.ts);
 * this file doesn't know how either of those work internally, only what
 * they expose. That's the separation of concerns being aimed for here —
 * see WRITEUP.md for why it stops short of full layered "Clean
 * Architecture" (entities/use-cases/repositories) for a component this size.
 */

import { useId, useState } from "react";
import { useTypeaheadSearch } from "@/hooks/useTypeaheadSearch";

// ---- Flag icon -----------------------------------------------------
//
// Deliberately an <img>, not an emoji. Flag emoji are drawn by the OS's
// color-emoji font — no CSS font-family can override that — and Windows in
// particular renders them as plain two-letter text instead of a picture.
// A small raster flag from flagcdn.com (CORS-friendly, no key) looks the
// same everywhere. Falls back to the ISO code as text if it 404s.
function FlagIcon({ countryCode }: { countryCode: string }) {
  const [failed, setFailed] = useState(false);

  if (!countryCode || failed) {
    return (
      <span className="mr-2 inline-block w-5 text-center text-[10px] font-semibold text-gray-400">
        {countryCode ? countryCode.toUpperCase() : ""}
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/24x18/${countryCode}.png`}
      srcSet={`https://flagcdn.com/48x36/${countryCode}.png 2x`}
      width={20}
      height={15}
      alt=""
      className="mr-2 inline-block rounded-sm"
      onError={() => setFailed(true)}
    />
  );
}

// ---- Component ----------------------------------------------------------

export default function CountrySearch() {
  const {
    query,
    onQueryChange,
    status,
    results,
    errorMessage,
    debouncedQuery,
    isOpen,
    activeIndex,
    setActiveIndex,
    selected,
    handleKeyDown,
    commitSelection,
    reopenIfResults,
  } = useTypeaheadSearch();

  const listboxId = useId();

  return (
    <div className="w-full max-w-sm">
      <label htmlFor="country-search" className="mb-1 block text-sm font-medium">
        Search for a country
      </label>

      <div className="relative">
        <input
          id="country-search"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          autoComplete="off"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="e.g. Nigeria"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={reopenIfResults}
          onKeyDown={handleKeyDown}
        />

        {status === "loading" && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            Searching…
          </span>
        )}

        {isOpen && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
          >
            {status === "error" && (
              <li className="px-3 py-2 text-sm text-red-600" role="alert">
                {`Couldn't load results — ${errorMessage}. Try again.`}
              </li>
            )}

            {status === "empty" && (
              <li className="px-3 py-2 text-sm text-gray-500">
                {`No countries match "${debouncedQuery.trim()}".`}
              </li>
            )}

            {status === "success" &&
              results.map((country, index) => (
                <li
                  key={country.id}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`cursor-pointer px-3 py-2 text-sm ${
                    index === activeIndex ? "bg-blue-50" : ""
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(e) => {
                    // onMouseDown (not onClick) so it fires before the input's onBlur.
                    e.preventDefault();
                    commitSelection(country);
                  }}
                >
                  <FlagIcon countryCode={country.countryCode} />
                  {country.name}
                  {country.region && country.region !== country.name && (
                    <span className="ml-2 text-xs text-gray-400">
                      {country.region}
                    </span>
                  )}
                </li>
              ))}
          </ul>
        )}
      </div>

      {selected && (
        <p className="mt-2 flex items-center text-sm text-gray-600">
          Selected:&nbsp;
          <FlagIcon countryCode={selected.countryCode} />
          <strong>{selected.name}</strong>
        </p>
      )}
    </div>
  );
}