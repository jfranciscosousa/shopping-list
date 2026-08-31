import QueryProvider from "@/components/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import type React from "react";
import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const display = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-dm-serif",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Smart Shopping List",
  description: "AI-powered shopping list that automatically categorizes your items",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable}`}>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
