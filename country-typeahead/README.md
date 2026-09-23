# Country Typeahead

A debounced country search / autocomplete component, built as the screening
task for Expert Listing's Frontend Engineer role.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS for styling
- Vitest + React Testing Library for tests

## Data source

[Open-Meteo Geocoding API](https://geocoding-api.open-meteo.com/v1/search?name={query})
— free, keyless, CORS-enabled. (Originally built against the REST
Countries API; that endpoint was deprecated by its provider mid-task and
now requires a signed-up API key, so the search moved to Open-Meteo — see
`WRITEUP.md`.)

## What it handles

- **Debounced input** — 300ms, via a small `useDebouncedValue` hook.
- **Loading / empty / error states** — rendered distinctly in the results list.
- **Keyboard navigation** — Arrow Up/Down (wraps), Home/End, Enter to select,
  Escape to close. Combobox ARIA roles (`role="combobox"`, `aria-expanded`,
  `aria-activedescendant`, `role="listbox"` / `role="option"`).
- **Out-of-order / stale responses** — every keystroke's request carries an
  incrementing id; a response is only applied to state if its id still
  matches the latest request. In-flight requests are also cancelled via
  `AbortController` when a newer one starts.

See [`WRITEUP.md`](./WRITEUP.md) for the tradeoffs, scaling notes, and
testing approach in full.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Testing

```bash
npm run test
```

`components/CountrySearch.test.tsx` covers the loading/empty/error states
and, most importantly, the stale-response guard (a slow early request must
never clobber a faster later one).

## Architecture

Split into three thin layers, rather than one file doing everything (and
short of full "Clean Architecture" layering, which would be more structure
than a single component needs):

- **`lib/geocoding.ts`** — data layer. Talks to the Open-Meteo API, knows
  nothing about React or debouncing. This is the file to change if the
  data source ever moves again (it already has once).
- **`hooks/useTypeaheadSearch.ts`** — application/behavior layer. Owns
  debouncing, stale-request handling, and keyboard-navigation state.
  Doesn't render anything, so it's independently testable and reusable
  behind a different UI if that were ever needed.
- **`components/CountrySearch.tsx`** — presentation layer. Pure markup
  driven by the hook's return value.

## Project structure

```
app/
  layout.tsx              root layout (Plus Jakarta Sans via next/font)
  page.tsx                 renders <CountrySearch />
  globals.css               tailwind entrypoint
lib/
  geocoding.ts             API client (data layer)
hooks/
  useTypeaheadSearch.ts    search/debounce/keyboard state (behavior layer)
components/
  CountrySearch.tsx        markup only (presentation layer)
  CountrySearch.test.tsx   tests
WRITEUP.md                 screening task write-up
```
