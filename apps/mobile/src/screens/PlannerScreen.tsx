import { useState } from "react";
import { SafeAreaView, ScrollView, View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { tokens } from "@chatr/ui";
import type { Trip, Offer, TripPreferences, ReorderInput } from "@chatr/core";
import { api } from "../lib/api";
import { OnboardingForm } from "../components/OnboardingForm";
import { ItineraryView } from "../components/ItineraryView";
import { MapView } from "../components/MapView";
import { OfferCard } from "../components/OfferCard";

export function PlannerScreen() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refreshOffer(id: string) { setOffer(await api.matchOffer(id, "post_generation")); }

  async function generate(prefs: TripPreferences) {
    setLoading(true); setError(null); setOffer(null);
    try { const t = await api.createItinerary(prefs); setTrip(t); await refreshOffer(t.id); }
    catch { setError("Could not reach the API. Start it with `pnpm --filter @chatr/api dev`."); }
    finally { setLoading(false); }
  }

  async function reorder(mv: ReorderInput) {
    if (!trip) return;
    setTrip(await api.reorderItem(trip.id, mv));
  }

  async function applyEdit() {
    if (!trip || !instruction.trim()) return;
    setEditing(true); setError(null);
    try { const t = await api.editItinerary(trip.id, instruction.trim()); setTrip(t); setInstruction(""); await refreshOffer(t.id); }
    catch { setError("Edit failed — is the API running?"); }
    finally { setEditing(false); }
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.h1}>Chatr <Text style={{ color: tokens.color.blue }}>Trip Planner</Text></Text>
        <OnboardingForm onGenerate={generate} loading={loading} />
        {error ? <Text style={styles.err}>{error}</Text> : null}

        {trip ? (
          <View style={styles.editRow}>
            <TextInput style={styles.input} value={instruction} onChangeText={setInstruction}
              placeholder='Refine, e.g. "make day 2 relaxed"' />
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
  h1: { color: tokens.color.navy, fontSize: tokens.font.h1, fontWeight: "700", marginBottom: tokens.space.sm },
  err: { color: "#C0392B", marginTop: tokens.space.md },
  editRow: { flexDirection: "row", gap: 8, marginTop: tokens.space.lg },
  input: { flex: 1, borderWidth: 1, borderColor: "#D5DEEC", borderRadius: tokens.radius.sm, padding: 10, fontSize: 15 },
  apply: { backgroundColor: tokens.color.navy, borderRadius: tokens.radius.sm, paddingHorizontal: 16, justifyContent: "center" },
  applyText: { color: "#fff", fontWeight: "700" },
});
