import { useState } from "react";
import { ScrollView, Text, StyleSheet } from "react-native";
import { tokens } from "@trip-itinerary/ui";
import type { TripPreferences } from "@trip-itinerary/core";
import type { OfferFinderResult } from "@trip-itinerary/api-client";
import { api } from "../lib/api";
import { OnboardingForm } from "../components/OnboardingForm";
import { OfferResults } from "../components/OfferResults";

// Offers-first finder — guest accessible. No login required.
export function FinderScreen() {
  const [result, setResult] = useState<OfferFinderResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function find(p: TripPreferences) {
    setLoading(true); setError(null); setResult(null);
    try { setResult(await api.findOffers(p)); }
    catch (e: any) { setError(e?.message ?? "Couldn't reach the API."); }
    finally { setLoading(false); }
  }

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.h1}>Find travel offers</Text>
      <Text style={styles.sub}>Tell us about your trip and we'll surface partner deals that fit.</Text>
      <OnboardingForm onGenerate={find} loading={loading} submitLabel="See partner offers" loadingLabel="Finding offers…" />
      {error ? <Text style={styles.err}>{error}</Text> : null}
      {result ? <OfferResults result={result} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: tokens.space.lg, paddingBottom: 40 },
  h1: { color: tokens.color.primaryDark, fontSize: tokens.font.h1, fontWeight: "800" },
  sub: { color: tokens.color.muted, marginTop: 2, marginBottom: tokens.space.md },
  err: { color: tokens.color.danger, marginTop: tokens.space.md },
});
