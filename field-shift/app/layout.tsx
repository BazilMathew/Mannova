import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mannova — crop rotations for healthier Kerala soil",
  description: "Explore crop rotations for Kerala farms using NASA Earth observation data",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500;600&family=Noto+Sans+Malayalam:wght@500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
