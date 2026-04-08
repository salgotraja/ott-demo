"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Movies" },
  { href: "/tv", label: "TV Shows" },
  { href: "/providers", label: "Providers" },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex-shrink-0">
              <span className="text-2xl font-bold text-white">OTT Demo</span>
              <p className="hidden sm:block text-xs text-zinc-400 mt-0.5">
                Discover movies and streaming providers
              </p>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-semibold pb-1 transition-colors ${
                    isActive(link.href, pathname)
                      ? "text-white border-b-2 border-blue-500"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen(true)}
              className="md:hidden p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav sheet */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-72 bg-zinc-900 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <span className="text-lg font-bold text-white">Menu</span>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition ${
                    isActive(link.href, pathname)
                      ? "bg-blue-600 text-white"
                      : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
