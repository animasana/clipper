import type { Metadata } from "next";

import { themeInitScript } from "@/lib/clipper/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clipper — At-home grooming in Seoul",
  description: "Book a thoughtful, at-home grooming visit for your favorite pet.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // The head script adds .dark before React hydrates, so the class is expected to differ.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-sand text-charcoal antialiased">
        {children}
      </body>
    </html>
  );
}
