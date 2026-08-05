import { useEffect, useMemo, useState } from "react";
import { ScrollView, View, Text, TextInput, Pressable, Linking, StyleSheet } from "react-native";
import { tokens } from "@trip-itinerary/ui";
import type { DirectoryOffer } from "@trip-itinerary/api-client";
import { api } from "../lib/api";

// Browse the live partner catalog with search + category chips. Guest-accessible.
export function DirectoryScreen() {
  const [offers, setOffers] = useState<DirectoryOffer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("");

  useEffect(() => { api.listOfferDirectory().then(setOffers).catch((e) => setError(e?.message ?? "Couldn't load offers.")); }, []);

  const categories = useMemo(() => Array.from(new Set((offers ?? []).map((o) => o.category))).sort(), [offers]);
  const q = query.trim().toLowerCase();
  const rows = (offers ?? []).filter((o) => {
    if (cat && o.category !== cat) return false;
    if (!q) return true;
    return [o.title, o.subtitle, o.body, o.category, o.partnerName].some((f) => (f ?? "").toLowerCase().includes(q));
  });

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.h1}>Offer directory</Text>
      <Text style={styles.sub}>Curated partner deals — tours, stays, insurance and more.</Text>
      <TextInput style={styles.input} value={query} onChangeText={setQuery} placeholder="Search offers…" autoCorrect={false} />
      <View style={styles.chips}>
        <Pressable onPress={() => setCat("")} style={[styles.chip, !cat && styles.chipOn]}><Text style={[styles.chipText, !cat && styles.chipTextOn]}>All</Text></Pressable>
        {categories.map((c) => (
          <Pressable key={c} onPress={() => setCat(c)} style={[styles.chip, cat === c && styles.chipOn]}>
            <Text style={[styles.chipText, cat === c && styles.chipTextOn]}>{c}</Text>
          </Pressable>
        ))}
      </View>
      {error ? <Text style={styles.err}>{error}</Text> : null}
      {!offers && !error ? <Text style={styles.muted}>Loading…</Text> : null}
      {rows.map((o) => (
        <View key={o.id} style={styles.card}>
          <Text style={styles.spons}>Sponsored{o.subtitle ? ` · ${o.subtitle}` : ""}</Text>
          <Text style={styles.title}>{o.title}</Text>
          {o.body ? <Text style={styles.cbody}>{o.body}</Text> : null}
          <Pressable style={styles.cta} onPress={() => Linking.openURL(api.directoryClickUrl(o.id))}>
            <Text style={styles.ctaText}>{o.ctaLabel} →</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: tokens.space.lg, paddingBottom: 40 },
  h1: { color: tokens.color.primaryDark, fontSize: tokens.font.h1, fontWeight: "800" },
  sub: { color: tokens.color.muted, marginTop: 2, marginBottom: tokens.space.md },
  input: { borderWidth: 1, borderColor: tokens.color.border, borderRadius: tokens.radius.sm, padding: 10, fontSize: 15 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: tokens.space.sm, marginBottom: tokens.space.sm },
  chip: { borderWidth: 1, borderColor: tokens.color.border, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  chipOn: { borderColor: tokens.color.primary, backgroundColor: tokens.color.light },
  chipText: { color: tokens.color.muted, fontSize: 14, textTransform: "capitalize" },
  chipTextOn: { color: tokens.color.primaryDark, fontWeight: "700" },
  err: { color: tokens.color.danger },
  muted: { color: tokens.color.muted },
  card: { backgroundColor: tokens.color.partnerBg, borderWidth: 2, borderColor: tokens.color.accent, borderRadius: tokens.radius.md, padding: tokens.space.md, marginBottom: tokens.space.md },
  spons: { fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: tokens.color.muted },
  title: { fontWeight: "700", color: tokens.color.primaryDark, marginTop: 4, fontSize: 16 },
  cbody: { color: tokens.color.muted, fontSize: 14, marginTop: 4 },
  cta: { marginTop: 12, alignSelf: "flex-start", backgroundColor: tokens.color.accent, paddingVertical: 8, paddingHorizontal: 16, borderRadius: tokens.radius.lg },
  ctaText: { color: tokens.color.primaryDark, fontWeight: "700", fontSize: 14 },
});
