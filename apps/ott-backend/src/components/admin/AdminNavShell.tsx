"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AdminNav } from "./AdminNav";

const NAV_LINKS = [
  { href: "/admin/movies", label: "Movies" },
  { href: "/admin/tv-shows", label: "TV Shows" },
  { href: "/admin/providers", label: "Providers" },
  { href: "/admin/sync", label: "Sync" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/notifications", label: "Notifications" },
];

interface Props {
  logout: () => Promise<void>;
}

export function AdminNavShell({ logout }: Props) {
  const [pending, startTransition] = useTransition();
  const pathname = usePathname();

  function handleLogout() {
    startTransition(() => logout());
  }

  return (
    <nav className="border-b bg-white px-4 py-3 flex items-center gap-2">
      <span className="font-bold text-sm shrink-0">OTT Admin</span>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-1 ml-2">
        <AdminNav />
      </div>

      {/* Desktop logout */}
      <div className="hidden md:flex items-center gap-2 ml-auto">
        <Separator orientation="vertical" className="h-5" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          disabled={pending}
        >
          Logout
        </Button>
      </div>

      {/* Mobile hamburger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden ml-auto">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 flex flex-col">
          <SheetHeader className="px-5 py-4 border-b">
            <SheetTitle className="text-left">OTT Admin</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-3 flex-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="p-3 border-t">
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start"
              onClick={handleLogout}
              disabled={pending}
            >
              Logout
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
