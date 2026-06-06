import type { Metadata } from "next";
import { Rambla } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const rambla = Rambla({ weight: ["400", "700"], subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Empty Codes — Open Source Scraper Hub",
  description: "Share, discover, and use web scrapers. Free and open source.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={rambla.className}>
      <body className="min-h-screen flex flex-col bg-white dark:bg-black text-black dark:text-white">
        <Navbar />
        <main className="flex-1 pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
