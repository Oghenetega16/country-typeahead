import CountrySearch from "@/components/CountrySearch";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="mb-8 max-w-sm text-center">
        <h1 className="text-lg font-semibold">Country Typeahead</h1>
        <p className="mt-1 text-sm text-gray-500">
          Screening task for Expert Listing — debounced search against the{" "}
          <a
            href="https://open-meteo.com/en/docs/geocoding-api"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            Open-Meteo Geocoding API
          </a>
          .
        </p>
      </div>
      <CountrySearch />
    </main>
  );
}
