import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kingdoms of Eternity",
  description: "Build your kingdom. Gather resources. Shape your legacy."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
