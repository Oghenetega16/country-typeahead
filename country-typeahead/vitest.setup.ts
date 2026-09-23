// Registers jest-dom's matchers (toBeInTheDocument, etc.) on Vitest's
// `expect`, both at runtime and in TypeScript's types. This is why
// `toBeInTheDocument` wasn't recognized before this file existed.
import "@testing-library/jest-dom/vitest";
