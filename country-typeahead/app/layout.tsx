import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// next/font self-hosts the font at build time (no runtime request to
// Google, no layout shift) and exposes it as a CSS variable, which
// tailwind.config.ts then wires up as the default sans-serif stack.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Country Typeahead",
  description: "Debounced country search — Expert Listing screening task",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body suppressHydrationWarning className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
