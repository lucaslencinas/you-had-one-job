import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "You Had One Job",
  description: "A chaotic multiplayer party game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
