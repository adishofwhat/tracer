import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar";
import { TracerProvider } from "@/app/context/TracerContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Tracer",
  description:
    "Tracer — AI diagnostic loop tracking system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <TracerProvider>
          <NavBar />
          {children}
        </TracerProvider>
      </body>
    </html>
  );
}
