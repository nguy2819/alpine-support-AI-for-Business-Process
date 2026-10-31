import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alpine Outdoor – Support Copilot",
  description: "AI-assisted customer support prototype. The system suggests, a human decides.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-slate-200 bg-white">
          <div className="flex h-14 items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-700 text-sm font-bold text-white">
                A
              </span>
              <span className="font-semibold tracking-tight">
                Alpine Outdoor <span className="font-normal text-slate-500">– Support Copilot</span>
              </span>
            </Link>
            <nav className="flex gap-1 text-sm">
              <Link href="/" className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                Cases
              </Link>
              <Link href="/eval" className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                Eval
              </Link>
              <Link href="/run" className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                Run eval
              </Link>
            </nav>
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
