/**
 * Root Layout Component - Next.js 15 Application Shell
 * 
 * This file defines the root layout for the entire Next.js application.
 * It wraps all pages and provides:
 * - HTML document structure
 * - Font configuration
 * - Global metadata (title, description)
 * - Global styles
 * - Hydration error suppression fix
 */

// Import Metadata type for TypeScript type safety
import type { Metadata } from "next";

// Import Google Fonts: Geist (sans-serif) and Geist Mono (monospace)
// next/font/google automatically optimizes font loading
import { Geist, Geist_Mono } from "next/font/google";

// Import global CSS styles (Tailwind CSS base, components, utilities)
import "./globals.css";

/**
 * Configure Geist Sans font
 * - variable: CSS custom property name for use in Tailwind config
 * - subsets: Only load Latin characters to reduce bundle size
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/**
 * Configure Geist Mono font (monospace for code)
 * - variable: CSS custom property name for use in Tailwind config
 * - subsets: Only load Latin characters to reduce bundle size
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Metadata Export - Defines page metadata for SEO and browser display
 * This metadata is used by Next.js to generate <head> tags
 */
export const metadata: Metadata = {
  title: "CDK API", // Browser tab title
  description: "Practice http requests", // Meta description for SEO
};

/**
 * RootLayout Component - The root layout wrapper for all pages
 * 
 * This component renders the HTML document structure and wraps all pages.
 * All pages in the app/ directory are automatically wrapped by this layout.
 * 
 * @param children - The page content to render inside the layout
 * @returns The complete HTML document structure
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // HTML root element
    // - lang="en": Declares document language for accessibility and SEO
    // - suppressHydrationWarning: Prevents React hydration errors caused by
    //   browser extensions (like Dark Reader) that inject attributes into the DOM
    //   This is a fix for the "Hydration failed" error we encountered
    <html lang="en" suppressHydrationWarning>
      <body
        // Apply font CSS variables and antialiasing
        // Template literal combines both font variables and antialiasing class
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Render the page content here */}
        {children}
      </body>
    </html>
  );
}

