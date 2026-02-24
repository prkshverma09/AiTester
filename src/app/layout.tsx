import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MathDiagnose",
  description: "AI-powered math diagnostic platform for children ages 5–12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
