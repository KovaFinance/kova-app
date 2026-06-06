import type { Metadata, Viewport } from "next";
// Volt Dark typefaces — self-hosted (CSP-safe), exposed via the literal family names
// referenced by app/globals.css (:root --font-display / --font-mono).
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Kova — Ahorra primero. Siempre.",
  description:
    "Kova turns every payment into dollar savings, automatically. Non-custodial, built on Stellar, for the gig economy and the unbanked.",
  applicationName: "Kova",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
