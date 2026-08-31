import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo" });

export const metadata: Metadata = {
  title: "EstateX — Real Estate Discovery Platform",
  description:
    "Discover, explore and compare premium real estate projects. Real-time inventory, interactive masterplans, and flexible payment plans.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className={`${inter.variable} ${cairo.variable} bg-slate-50 font-sans text-slate-900 antialiased`}>
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-sm font-black text-white">
                E
              </span>
              <span className="text-lg font-extrabold tracking-tight">EstateX</span>
            </Link>
            <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
              <Link href="/projects/azure-hills" className="transition hover:text-emerald-700">
                Azure Hills
              </Link>
              <Link href="/admin" className="rounded-full border border-slate-300 px-4 py-1.5 transition hover:border-emerald-700 hover:text-emerald-700">
                Admin
              </Link>
            </div>
          </nav>
        </header>
        <main className="min-h-[70vh]">{children}</main>
        <footer className="mt-16 border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
            <p>© {new Date().getFullYear()} EstateX Developments. All rights reserved.</p>
            <p>MVP demo — Phase 1 Foundation &amp; Core Experience</p>
          </div>
        </footer>
      </body>
    </html>
  );
}