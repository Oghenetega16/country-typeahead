"use client";

/**
 * Application layer — the typeahead's behavior, independent of how it's
 * drawn. Owns: debouncing, in-flight/stale-request handling, result status,
 * and keyboard navigation state. `CountrySearch.tsx` is the only thing that
 * knows this is rendered as an input + listbox; this hook doesn't know
 * about JSX at all, which is what makes it independently testable and,
 * if the UI ever needed to change shape (e.g. a full-page results view
 * instead of a dropdown), reusable as-is.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { searchPlaces, type PlaceResult } from "@/lib/geocoding";

export type SearchStatus = "idle" | "loading" | "success" | "empty" | "error";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function useTypeaheadSearch(debounceMs = 300) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selected, setSelected] = useState<PlaceResult | null>(null);

  const debouncedQuery = useDebouncedValue(query, debounceMs);

  // Guards against out-of-order responses: only the most recent request's
  // AbortController/id is allowed to write to state.
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();

    abortRef.current?.abort();

    if (trimmed.length < 2) {
      setStatus("idle");
      setResults([]);
      setIsOpen(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestIdRef.current;

    setStatus("loading");
    setIsOpen(true);

    searchPlaces(trimmed, controller.signal)
      .then((data) => {
        if (requestId !== requestIdRef.current) return; // stale — ignore
        setResults(data);
        setStatus(data.length === 0 ? "empty" : "success");
        setActiveIndex(data.length > 0 ? 0 : -1);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return; // expected on cancellation
        if (requestId !== requestIdRef.current) return;
        setErrorMessage(err?.message ?? "Something went wrong");
        setStatus("error");
        setResults([]);
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  const commitSelection = useCallback((place: PlaceResult) => {
    setSelected(place);
    setQuery(place.name);
    setIsOpen(false);
    setResults([]);
    setStatus("idle");
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || results.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((i) => (i + 1) % results.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((i) => (i - 1 + results.length) % results.length);
          break;
        case "Home":
          e.preventDefault();
          setActiveIndex(0);
          break;
        case "End":
          e.preventDefault();
          setActiveIndex(results.length - 1);
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0) commitSelection(results[activeIndex]);
          break;
        case "Escape":
          setIsOpen(false);
          break;
      }
    },
    [isOpen, results, activeIndex, commitSelection]
  );

  const onQueryChange = useCallback((value: string) => {
    setSelected(null);
    setQuery(value);
  }, []);

  const reopenIfResults = useCallback(() => {
    if (results.length > 0) setIsOpen(true);
  }, [results.length]);

  return {
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
    closeList: () => setIsOpen(false),
  };
}
