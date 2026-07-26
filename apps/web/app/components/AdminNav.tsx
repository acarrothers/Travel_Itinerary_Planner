"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { tokens } from "@trip-itinerary/ui";

const LINKS = [
  { href: "/admin", label: "Offers" },
  { href: "/admin/partners", label: "Partners" },
  { href: "/admin/reports", label: "Reports" },
];

// Cross-links between the admin surfaces (offers CMS, partners, reports).
export function AdminNav() {
  const path = usePathname();
  return (
    <nav style={{ display: "flex", flexWrap: "wrap", gap: tokens.space.lg, borderBottom: `1px solid ${tokens.color.border}`, marginBottom: tokens.space.lg }}>
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} style={{
            textDecoration: "none", fontFamily: tokens.font.heading, fontSize: 15,
            fontWeight: active ? 700 : 500,
            color: active ? tokens.color.primaryDark : tokens.color.muted,
            padding: `${tokens.space.sm}px 2px`,
            borderBottom: `3px solid ${active ? tokens.color.accent : "transparent"}`,
          }}>{l.label}</Link>
        );
      })}
    </nav>
  );
}
