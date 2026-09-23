import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import CountrySearch from "./CountrySearch";

/**
 * These tests stub `fetch` directly rather than pulling in MSW, to keep the
 * scaffold dependency-light. Swap in MSW handlers for richer network-level
 * mocking (see WRITEUP.md for the full testing plan).
 */

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}

const NIGERIA = {
  results: [{ id: 1, name: "Nigeria", country: "Nigeria", country_code: "NG" }],
};

const NIGER = {
  results: [{ id: 2, name: "Niger", country: "Niger", country_code: "NE" }],
};

function mergeResults(...batches: { results: any[] }[]) {
  return { results: batches.flatMap((b) => b.results) };
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("CountrySearch", () => {
  it("shows results after the debounce window", async () => {
    global.fetch = vi.fn(() => jsonResponse(NIGERIA)) as any;
    render(<CountrySearch />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "nig" },
    });

    vi.advanceTimersByTime(300);
    await waitFor(() => expect(screen.getByText("Nigeria")).toBeInTheDocument());
  });

  it("shows the empty state for zero matches", async () => {
    global.fetch = vi.fn(() => jsonResponse({ results: [] })) as any;
    render(<CountrySearch />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "zzz" },
    });

    vi.advanceTimersByTime(300);
    await waitFor(() =>
      expect(screen.getByText(/No countries match/)).toBeInTheDocument()
    );
  });

  it("shows an error state when the request fails", async () => {
    global.fetch = vi.fn(() => Promise.resolve(new Response("", { status: 500 }))) as any;
    render(<CountrySearch />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "nig" },
    });

    vi.advanceTimersByTime(300);
    await waitFor(() =>
      expect(screen.getByText(/Couldn't load results/)).toBeInTheDocument()
    );
  });

  it("ignores a stale response that resolves after a newer one", async () => {
    // First request ("nig") resolves slowly with Nigeria+Niger results;
    // second request ("nige") resolves fast with just Nigeria.
    let resolveFirst: (v: unknown) => void;
    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    global.fetch = vi
      .fn()
      .mockImplementationOnce(() => firstPromise)
      .mockImplementationOnce(() => jsonResponse(NIGERIA)) as any;

    render(<CountrySearch />);
    const input = screen.getByRole("combobox");

    fireEvent.change(input, { target: { value: "nig" } });
    vi.advanceTimersByTime(300);

    fireEvent.change(input, { target: { value: "nige" } });
    vi.advanceTimersByTime(300);

    // Newer ("nige") request resolves first.
    await waitFor(() => expect(screen.getByText("Nigeria")).toBeInTheDocument());

    // Now the stale ("nig") request resolves — it must NOT overwrite the list.
    resolveFirst!(await jsonResponse(mergeResults(NIGERIA, NIGER)));
    await new Promise((r) => setTimeout(r, 0));

    expect(screen.queryByText("Niger")).not.toBeInTheDocument();
  });
});
