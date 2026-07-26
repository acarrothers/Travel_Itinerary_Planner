"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { tokens } from "@trip-itinerary/ui";
import type { Trip } from "@trip-itinerary/core";
import { api } from "../../lib/api";
import { describeApiError } from "../../lib/apiError";
import { pageContainer } from "../../lib/layout";

// Saved itineraries for signed-in users — view or reopen to update.
export default function MyTripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    api.listItineraries()
      .then(setTrips)
      .catch((e) => { if (e?.status === 401) router.replace("/login?next=/trips"); else setError(describeApiError(e)); });
  }, [router]);

  async function remove(id: string) {
    if (!confirm("Delete this itinerary? This can't be undone.")) return;
    setBusyId(id);
    try { await api.deleteItinerary(id); setTrips((cur) => (cur ?? []).filter((t) => t.id !== id)); }
    catch (e: any) { setError(describeApiError(e)); }
    finally { setBusyId(null); }
  }

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const cityOf = (t: Trip) => (t.preferences.destinations[0] ?? "Trip").split(",")[0].trim();

  return (
    <div style={{ fontFamily: tokens.font.family, color: tokens.color.ink, background: tokens.color.surface, minHeight: "100vh" }}>
      <header style={{ borderBottom: `1px solid ${tokens.color.border}`, background: tokens.color.bg }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "16px clamp(16px, 4vw, 32px)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", fontFamily: tokens.font.heading, fontWeight: 800, fontSize: tokens.font.h2, color: tokens.color.primaryDark }}>
            Trip Experience <span style={{ color: tokens.color.primary }}>Planner</span>
          </Link>
          <Link href="/" style={{ textDecoration: "none", fontFamily: tokens.font.heading, fontWeight: 700, color: tokens.color.primary }}>Plan a new trip</Link>
        </div>
      </header>

      <main style={pageContainer}>
        <h1 style={{ fontFamily: tokens.font.heading, fontWeight: 800, fontSize: tokens.font.h1, color: tokens.color.primaryDark }}>My Trips</h1>
        {error && <p style={{ color: tokens.color.danger }}>{error}</p>}
        {!trips && !error && <p style={{ color: tokens.color.muted }}>Loading…</p>}
        {trips && trips.length === 0 && (
          <p style={{ color: tokens.color.muted }}>No saved itineraries yet. <Link href="/" style={{ color: tokens.color.primary, fontWeight: 700 }}>Plan your first trip →</Link></p>
        )}
        {trips && trips.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: tokens.space.md, marginTop: tokens.space.md }}>
            {trips.map((t) => (
              <div key={t.id} style={{ display: "flex", flexDirection: "column",
                background: tokens.color.bg, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.lg, padding: tokens.space.md }}>
                <Link href={`/itinerary?id=${t.id}`} style={{ textDecoration: "none", flex: 1 }}>
                  <div style={{ fontFamily: tokens.font.heading, fontWeight: 700, fontSize: tokens.font.h3, color: tokens.color.primaryDark }}>{cityOf(t)} Trip</div>
                  <div style={{ color: tokens.color.muted, fontSize: tokens.font.small, marginTop: 4 }}>
                    {t.days.length} {t.days.length === 1 ? "day" : "days"}
                    {t.preferences.interests.length ? ` • ${t.preferences.interests.slice(0, 2).map(cap).join(" & ")}` : ""}
                  </div>
                  <div style={{ color: tokens.color.muted, fontSize: 12, marginTop: 8 }}>Saved {new Date(t.createdAt).toLocaleDateString()}</div>
                </Link>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: tokens.space.sm, paddingTop: tokens.space.sm, borderTop: `1px solid ${tokens.color.borderSoft}` }}>
                  <button onClick={() => remove(t.id)} disabled={busyId === t.id}
                    style={{ background: "none", border: "none", color: tokens.color.danger, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                    {busyId === t.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
