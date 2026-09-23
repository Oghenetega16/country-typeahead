/**
 * Data layer — talks to the Open-Meteo Geocoding API and nothing else.
 * No React, no debounce/state logic, no UI. This is the piece to swap out
 * if the data source ever changes again (it already changed once — see
 * WRITEUP.md — from REST Countries to Open-Meteo).
 */

export interface PlaceResult {
  id: string;
  name: string;
  region: string;
  countryCode: string; // ISO 3166-1 alpha-2, e.g. "NG" — used for the flag image
}

export class GeocodingRequestError extends Error {}

export async function searchPlaces(
  query: string,
  signal: AbortSignal
): Promise<PlaceResult[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query
  )}&count=8&language=en&format=json`;

  const res = await fetch(url, { signal });

  if (!res.ok) {
    throw new GeocodingRequestError(`Request failed (${res.status})`);
  }

  const data = await res.json();
  const results = (data?.results ?? []) as any[];

  // Open-Meteo returns [] (no `results` key at all) rather than a 404 when
  // there's no match — that's simply "zero results", not an error.
  return results
    .map((r) => ({
      id: String(r.id),
      name: r.admin1 ? `${r.name}, ${r.admin1}` : r.name,
      region: r.country ?? "",
      countryCode: (r.country_code ?? "").toLowerCase(),
    }))
    .slice(0, 8);
}
