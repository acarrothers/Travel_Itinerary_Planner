"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { tokens } from "@trip-itinerary/ui";
import type { Trip, Offer, TripPreferences, ReorderInput, User, RateLimitStatus } from "@trip-itinerary/core";
import { api } from "../../lib/api";
import { OnboardingForm } from "../components/OnboardingForm";
import { ItineraryView } from "../components/ItineraryView";
import { MapView } from "../components/MapView";
import { OfferCard } from "../components/OfferCard";
import { OfferDirectory } from "../components/OfferDirectory";
import { OfferFinder } from "../components/OfferFinder";
import { pageContainer } from "../../lib/layout";

// Offer discovery is the primary flow; the itinerary planner is secondary.
type Tab = "finder" | "planner" | "directory";

export default function PlanPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [rate, setRate] = useState<RateLimitStatus | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("finder");

  // Auth guard: the session lives in an httpOnly cookie; /auth/me confirms it.
  useEffect(() => {
    api.me().then((m) => { setUser(m.user); setRate(m.rate); })
      .catch(() => router.replace("/login"));
  }, [router]);

  async function logout() { try { await api.logout(); } catch { /* ignore */ } router.replace("/login"); }
  async function refreshOffer(id: string) { setOffer(await api.matchOffer(id, "post_generation")); }

  async function generate(prefs: TripPreferences) {
    setLoading(true); setError(null); setOffer(null);
    try {
      const t = await api.createItinerary(prefs);
      setTrip(t);
      if (t._rate) setRate(t._rate);
      await refreshOffer(t.id);
    } catch (err: any) {
      if (err?.status === 429) setError(err.message || "You've reached your daily trip limit.");
      else setError("Could not reach the API. Start it with `pnpm --filter @trip-itinerary/api dev`.");
    } finally { setLoading(false); }
  }

  async function applyEdit() {
    if (!trip || !instruction.trim()) return;
    setEditing(true); setError(null);
    try { const t = await api.editItinerary(trip.id, instruction.trim()); setTrip(t); setInstruction(""); await refreshOffer(t.id); }
    catch { setError("Edit failed — is the API running?"); }
    finally { setEditing(false); }
  }
  async function reorder(mv: ReorderInput) { if (trip) setTrip(await api.reorderItem(trip.id, mv)); }

  if (!user) return <main style={{ ...pageContainer, color: tokens.color.mid }}>Loading…</main>;

  const remainingText = rate ? (rate.remaining < 0 ? "Unlimited" : `${rate.remaining} of ${rate.limit} left today`) : "";
  const outOfTrips = rate ? (rate.remaining === 0 && rate.limit >= 0) : false;

  const tabBtn = (id: Tab, text: string): React.CSSProperties => ({
    background: "none", border: "none", cursor: "pointer", fontSize: 15,
    fontWeight: tab === id ? 700 : 500,
    color: tab === id ? tokens.color.navy : tokens.color.mid,
    padding: `${tokens.space.sm}px 2px`, marginRight: tokens.space.lg,
    borderBottom: `3px solid ${tab === id ? tokens.color.accent : "transparent"}`,
  });

  return (
    <main style={pageContainer}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: tokens.space.md }}>
        <div style={{ fontSize: 13, color: tokens.color.mid }}>
          {user.email} · <span style={{ color: outOfTrips ? tokens.color.danger : tokens.color.navy }}>{remainingText}</span>
        </div>
        <button onClick={logout} style={{ background: "none", border: "1px solid #D5DEEC", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>Log out</button>
      </div>

      <nav style={{ display: "flex", flexWrap: "wrap", borderBottom: `1px solid ${tokens.color.border}`, marginBottom: tokens.space.lg }}>
        <button style={tabBtn("finder", "Find Offers")} onClick={() => setTab("finder")}>Find Offers</button>
        <button style={tabBtn("directory", "Browse Directory")} onClick={() => setTab("directory")}>Browse Directory</button>
        <button style={tabBtn("planner", "Trip Planner")} onClick={() => setTab("planner")}>Trip Planner</button>
      </nav>

      {tab === "finder" ? (
        <>
          <h1 style={{ color: tokens.color.navy, fontSize: tokens.font.h1, marginTop: 0 }}>Find travel offers</h1>
          <OfferFinder onPlanTrip={(p) => { setTab("planner"); generate(p); }} />
        </>
      ) : tab === "directory" ? (
        <>
          <h1 style={{ color: tokens.color.navy, fontSize: tokens.font.h1, marginTop: 0 }}>Partner Offer Directory</h1>
          <OfferDirectory />
        </>
      ) : (
      <>
      <h1 style={{ color: tokens.color.navy, fontSize: tokens.font.h1, marginTop: 0 }}>Plan a trip</h1>
      {outOfTrips && !trip && (
        <p style={{ color: tokens.color.warnText, background: tokens.color.warnBg, border: "1px solid #EBD9B4", padding: 12, borderRadius: 8 }}>
          You've used your trip{rate && rate.limit === 1 ? "" : "s"} for today ({rate?.limit}/24h on the {user.accountType} plan). Try again tomorrow.
        </p>
      )}
      <OnboardingForm onGenerate={generate} loading={loading} />
      {error && <p style={{ color: tokens.color.danger, marginTop: tokens.space.md }}>{error}</p>}

      {trip && (
        <div style={{ marginTop: tokens.space.lg, display: "flex", gap: 8 }}>
          <input value={instruction} onChange={(e) => setInstruction(e.target.value)}
            placeholder='Refine, e.g. "make day 2 more relaxed"'
            style={{ flex: 1, padding: "10px 12px", border: "1px solid #D5DEEC", borderRadius: tokens.radius.sm, fontSize: 15 }}
            onKeyDown={(e) => { if (e.key === "Enter") applyEdit(); }} />
          <button onClick={applyEdit} disabled={editing}
            style={{ background: tokens.color.navy, color: "#fff", border: "none", padding: "10px 18px", borderRadius: tokens.radius.sm, fontWeight: 600, cursor: "pointer", opacity: editing ? 0.6 : 1 }}>
            {editing ? "Applying…" : "Apply"}
          </button>
        </div>
      )}

      {trip && <ItineraryView trip={trip} onReorder={reorder} />}
      {trip && <MapView trip={trip} />}
      {trip && offer && <OfferCard offer={offer} clickUrl={api.trackOfferClickUrl(offer.id, trip.id)} />}
      </>
      )}
    </main>
  );
}
