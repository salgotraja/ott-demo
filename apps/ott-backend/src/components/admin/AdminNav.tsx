"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/admin/movies", label: "Movies" },
  { href: "/admin/tv-shows", label: "TV Shows" },
  { href: "/admin/providers", label: "Providers" },
  { href: "/admin/sync", label: "Sync" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/notifications", label: "Notifications" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      {NAV_LINKS.map((link) => (
        <Button
          key={link.href}
          variant={pathname.startsWith(link.href) ? "secondary" : "ghost"}
          size="sm"
          asChild
        >
          <Link href={link.href}>{link.label}</Link>
        </Button>
      ))}
    </>
  );
}
