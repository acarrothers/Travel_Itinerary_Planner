"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { tokens } from "@trip-itinerary/ui";
import { api } from "../../lib/api";

/**
 * Requires a signed-in session before any admin UI renders. This is a usability
 * gate, not the security boundary — the API enforces RBAC on every admin route
 * (see apps/api/src/auth.ts). It keeps the CMS off the public surface so the
 * pages aren't reachable by simply guessing the URL.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "ok">("checking");

  useEffect(() => {
    api.me()
      .then(() => setState("ok"))
      .catch(() => router.replace("/login?next=/admin"));
  }, [router]);

  if (state === "checking") {
    return (
      <main style={{ maxWidth: 960, margin: "0 auto", padding: tokens.space.xl, fontFamily: tokens.font.family }}>
        <p style={{ color: tokens.color.muted, fontSize: tokens.font.body }}>Checking your session…</p>
      </main>
    );
  }
  return <>{children}</>;
}
