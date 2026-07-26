"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { tokens } from "@trip-itinerary/ui";
import type { Trip, Offer, TripPreferences, PartyType, BudgetBand, Pace, User } from "@trip-itinerary/core";
// (Offer[] localized offers now come from /offers/for-trip)
import { api } from "../../lib/api";
import { describeApiError } from "../../lib/apiError";
import { pageContainer } from "../../lib/layout";
import { ItineraryDetail } from "../components/ItineraryDetail";

function prefsFromParams(p: URLSearchParams): TripPreferences {
  const list = (p.get("interests") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return {
    destinations: [p.get("dest") ?? "Lisbon, Portugal"],
    nights: Number(p.get("nights")) || 4,
    party: (p.get("party") as PartyType) || "couple",
    adults: Number(p.get("adults")) || 2,
    children: Number(p.get("children")) || 0,
    budget: (p.get("budget") as BudgetBand) || "mid",
    interests: list.length ? list : ["food", "culture"],
    pace: (p.get("pace") as Pace) || "balanced",
  };
}

function ItineraryInner() {
  const params = useSearchParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limited, setLimited] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const ran = useRef(false); // guard against double-build in strict mode

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    api.me().then((m) => setUser(m.user)).catch(() => { /* guest */ });

    const savedId = params.get("id");
    const build = async () => {
      try {
        let t: Trip;
        if (savedId) {
          t = await api.getItinerary(savedId);
        } else {
          const res = await api.createItinerary(prefsFromParams(params));
          t = res;
        }
        setTrip(t);
        try { setOffers(await api.tripOffers(t.id)); } catch { /* offers optional */ }
      } catch (e: any) {
        if (e?.status === 429) setLimited(e?.body?.message || "You've reached your itinerary limit for today.");
        else setError(describeApiError(e));
      } finally { setLoading(false); }
    };
    build();
  }, [params]);

  return (
    <div style={{ fontFamily: tokens.font.family, color: tokens.color.ink, background: tokens.color.surface, minHeight: "100vh" }}>
      <header style={{ borderBottom: `1px solid ${tokens.color.border}`, background: tokens.color.bg }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "16px clamp(16px, 4vw, 32px)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", fontFamily: tokens.font.heading, fontWeight: 800, fontSize: tokens.font.h2, color: tokens.color.primaryDark }}>
            Trip Experience <span style={{ color: tokens.color.primary }}>Planner</span>
          </Link>
          <nav style={{ display: "flex", gap: tokens.space.md, alignItems: "center" }}>
            {user
              ? <Link href="/trips" style={{ textDecoration: "none", fontFamily: tokens.font.heading, fontWeight: 700, color: tokens.color.primaryDark }}>My Trips</Link>
              : <Link href="/login" style={{ textDecoration: "none", fontFamily: tokens.font.heading, fontWeight: 700, color: tokens.color.primaryDark }}>Log in</Link>}
          </nav>
        </div>
      </header>

      <main style={{ ...pageContainer, maxWidth: 1120 }}>
        {loading && <p style={{ color: tokens.color.muted }}>Building your itinerary…</p>}

        {limited && (
          <div style={{ background: tokens.color.warnBg, border: `1px solid ${tokens.color.warnBorder}`, color: tokens.color.warnText, borderRadius: tokens.radius.md, padding: tokens.space.md }}>
            {limited} <Link href="/login" style={{ color: tokens.color.primary, fontWeight: 700 }}>Log in</Link>
          </div>
        )}
        {error && <p style={{ color: tokens.color.danger }}>{error}</p>}

        {trip && (
          <>
            {/* Save state: members' itineraries persist; guests are prompted to sign up. */}
            {user
              ? <p style={{ background: "#E4F1F2", border: `1px solid ${tokens.color.teal}`, color: tokens.color.teal, borderRadius: tokens.radius.md, padding: "8px 12px", fontSize: tokens.font.small }}>✓ Saved to your account — find it under <Link href="/trips" style={{ color: tokens.color.teal, fontWeight: 700 }}>My Trips</Link>.</p>
              : <p style={{ background: tokens.color.light, border: `1px solid ${tokens.color.border}`, color: tokens.color.primaryDark, borderRadius: tokens.radius.md, padding: "8px 12px", fontSize: tokens.font.small }}>This itinerary won't be saved. <Link href="/login" style={{ color: tokens.color.primary, fontWeight: 700 }}>Log in or sign up</Link> to save it and edit it later.</p>}
            <div style={{ marginTop: tokens.space.md }}>
              <ItineraryDetail trip={trip} offers={offers} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function ItineraryPage() {
  return (
    <Suspense fallback={null}>
      <ItineraryInner />
    </Suspense>
  );
}
