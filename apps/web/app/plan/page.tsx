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

  if (!user) return <main style={{ padding: tokens.space.xl, color: tokens.color.mid }}>Loading…</main>;

  const remainingText = rate ? (rate.remaining < 0 ? "Unlimited" : `${rate.remaining} of ${rate.limit} left today`) : "";
  const outOfTrips = rate ? (rate.remaining === 0 && rate.limit >= 0) : false;

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: tokens.space.xl }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: tokens.space.md }}>
        <div style={{ fontSize: 13, color: tokens.color.mid }}>
          {user.email} · <span style={{ color: outOfTrips ? "#C0392B" : tokens.color.navy }}>{remainingText}</span>
        </div>
        <button onClick={logout} style={{ background: "none", border: "1px solid #D5DEEC", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>Log out</button>
      </div>
      <h1 style={{ color: tokens.color.navy, fontSize: tokens.font.h1 }}>Plan a trip</h1>
      {outOfTrips && !trip && (
        <p style={{ color: "#8A5A12", background: "#FDF6E9", border: "1px solid #EBD9B4", padding: 12, borderRadius: 8 }}>
          You've used your trip{rate && rate.limit === 1 ? "" : "s"} for today ({rate?.limit}/24h on the {user.accountType} plan). Try again tomorrow.
        </p>
      )}
      <OnboardingForm onGenerate={generate} loading={loading} />
      {error && <p style={{ color: "#C0392B", marginTop: tokens.space.md }}>{error}</p>}

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
    </main>
  );
}
