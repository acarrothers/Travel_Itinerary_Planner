import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { tokens } from "@trip-itinerary/ui";
import type { Trip, Offer, TripPreferences, ReorderInput, User, RateLimitStatus } from "@trip-itinerary/core";
import { api } from "../lib/api";
import { OnboardingForm } from "../components/OnboardingForm";
import { ItineraryView } from "../components/ItineraryView";
import { MapView } from "../components/MapView";
import { OfferCard } from "../components/OfferCard";

export function PlannerScreen({ onLogout }: { onLogout: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [rate, setRate] = useState<RateLimitStatus | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.me().then((m) => { setUser(m.user); setRate(m.rate); }).catch(() => onLogout());
  }, []);

  async function refreshOffer(id: string) { setOffer(await api.matchOffer(id, "post_generation")); }
  async function generate(prefs: TripPreferences) {
    setLoading(true); setError(null); setOffer(null);
    try {
      const t = await api.createItinerary(prefs);
      setTrip(t); if (t._rate) setRate(t._rate); await refreshOffer(t.id);
    } catch (e: any) {
      setError(e?.status === 429 ? (e.message ?? "Daily trip limit reached.") : "Could not reach the API.");
    } finally { setLoading(false); }
  }
  async function applyEdit() {
    if (!trip || !instruction.trim()) return;
    setEditing(true); setError(null);
    try { const t = await api.editItinerary(trip.id, instruction.trim()); setTrip(t); setInstruction(""); await refreshOffer(t.id); }
    catch { setError("Edit failed."); } finally { setEditing(false); }
  }
  async function reorder(mv: ReorderInput) { if (trip) setTrip(await api.reorderItem(trip.id, mv)); }

  const remaining = rate ? (rate.remaining < 0 ? "Unlimited" : `${rate.remaining} of ${rate.limit} left today`) : "";

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.header}>
          <Text style={styles.meta}>{user?.email ?? ""} · {remaining}</Text>
          <Pressable onPress={onLogout}><Text style={styles.logout}>Log out</Text></Pressable>
        </View>
        <Text style={styles.h1}>Trip Itinerary <Text style={{ color: tokens.color.blue }}>Planner</Text></Text>
        <OnboardingForm onGenerate={generate} loading={loading} />
        {error ? <Text style={styles.err}>{error}</Text> : null}
        {trip ? (
          <View style={styles.editRow}>
            <TextInput style={styles.input} value={instruction} onChangeText={setInstruction} placeholder='Refine, e.g. "make day 2 relaxed"' />
            <Pressable style={[styles.apply, editing && { opacity: 0.6 }]} disabled={editing} onPress={applyEdit}>
              <Text style={styles.applyText}>{editing ? "…" : "Apply"}</Text>
            </Pressable>
          </View>
        ) : null}
        {trip ? <ItineraryView trip={trip} onReorder={reorder} /> : null}
        {trip ? <MapView trip={trip} /> : null}
        {trip && offer ? <OfferCard offer={offer} clickUrl={api.trackOfferClickUrl(offer.id, trip.id)} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  body: { padding: tokens.space.xl, gap: tokens.space.md },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  meta: { color: tokens.color.mid, fontSize: 12, flex: 1 },
  logout: { color: tokens.color.navy, fontSize: 12, fontWeight: "600" },
  h1: { color: tokens.color.navy, fontSize: tokens.font.h1, fontWeight: "700", marginBottom: tokens.space.sm },
  err: { color: "#C0392B", marginTop: tokens.space.md },
  editRow: { flexDirection: "row", gap: 8, marginTop: tokens.space.lg },
  input: { flex: 1, borderWidth: 1, borderColor: "#D5DEEC", borderRadius: tokens.radius.sm, padding: 10, fontSize: 15 },
  apply: { backgroundColor: tokens.color.navy, borderRadius: tokens.radius.sm, paddingHorizontal: 16, justifyContent: "center" },
  applyText: { color: "#fff", fontWeight: "700" },
});
