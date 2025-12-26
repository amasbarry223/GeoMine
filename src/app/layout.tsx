import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GeoMine RC-Insight - Plateforme d'Analyse Géophysique",
  description: "Plateforme professionnelle d'analyse et d'interprétation des données de résistivité et chargeabilité pour l'exploration minière",
  keywords: ["GeoMine", "RC-Insight", "géophysique", "résistivité", "chargeabilité", "exploration minière", "inversion", "tomographie"],
  authors: [{ name: "GeoMine Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "GeoMine RC-Insight",
    description: "Analyse géophysique avancée pour l'exploration minière",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground font-sans`}
      >
        <SessionProvider>
          <ThemeProvider defaultTheme="dark" attribute="class">
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
