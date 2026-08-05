import { useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet } from "react-native";
import { tokens } from "@trip-itinerary/ui";
import type { Trip, Offer, TripPreferences, User } from "@trip-itinerary/core";
import { api } from "../lib/api";
import { OnboardingForm } from "../components/OnboardingForm";
import { ItineraryDetail } from "../components/ItineraryDetail";

// Plan (or open a saved) itinerary. Guest-accessible; members' trips persist.
export function ItineraryScreen({ user, openTripId }: { user: User | null; openTripId?: string | null }) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadOffers(id: string) { try { setOffers(await api.tripOffers(id)); } catch { setOffers([]); } }

  // Open a saved trip when requested from the Trips list.
  useEffect(() => {
    if (!openTripId) return;
    setLoading(true); setError(null);
    api.getItinerary(openTripId).then(async (t) => { setTrip(t); await loadOffers(t.id); })
      .catch((e) => setError(e?.message ?? "Couldn't load that trip."))
      .finally(() => setLoading(false));
  }, [openTripId]);

  async function build(prefs: TripPreferences) {
    setLoading(true); setError(null); setTrip(null); setOffers([]);
    try {
      const t = await api.createItinerary(prefs);
      setTrip(t); await loadOffers(t.id);
    } catch (e: any) {
      setError(e?.status === 429 ? (e.message ?? "You've reached your itinerary limit for today.") : "Couldn't reach the API.");
    } finally { setLoading(false); }
  }

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.h1}>Plan a trip</Text>
      {!trip ? (
        <>
          <Text style={styles.sub}>Build a day-by-day itinerary with offers matched to each day.</Text>
          <OnboardingForm onGenerate={build} loading={loading} submitLabel="Build itinerary" loadingLabel="Building…" />
        </>
      ) : null}
      {error ? <Text style={styles.err}>{error}</Text> : null}
      {trip ? (
        <>
          <Text style={user ? styles.savedOk : styles.savePrompt}>
            {user ? "✓ Saved to your account — see the Trips tab." : "This itinerary won't be saved. Log in (Account tab) to save it."}
          </Text>
          <ItineraryDetail trip={trip} offers={offers} />
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: tokens.space.lg, paddingBottom: 40 },
  h1: { color: tokens.color.primaryDark, fontSize: tokens.font.h1, fontWeight: "800" },
  sub: { color: tokens.color.muted, marginTop: 2, marginBottom: tokens.space.md },
  err: { color: tokens.color.danger, marginTop: tokens.space.md },
  savedOk: { marginTop: tokens.space.md, color: tokens.color.teal, backgroundColor: "#E4F1F2", borderWidth: 1, borderColor: tokens.color.teal, borderRadius: tokens.radius.md, padding: 10, fontSize: 13, overflow: "hidden" },
  savePrompt: { marginTop: tokens.space.md, color: tokens.color.primaryDark, backgroundColor: tokens.color.light, borderWidth: 1, borderColor: tokens.color.border, borderRadius: tokens.radius.md, padding: 10, fontSize: 13, overflow: "hidden" },
});
