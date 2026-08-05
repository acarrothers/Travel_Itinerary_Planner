import { View, Text, Pressable, Linking, StyleSheet } from "react-native";
import { tokens } from "@trip-itinerary/ui";
import { isLocalizedOffer } from "@trip-itinerary/core";
import type { OfferFinderResult } from "@trip-itinerary/api-client";
import { api } from "../lib/api";

// Finder results grouped by inferred need — mirrors the web OfferResults, with the
// standing sponsored disclosure and a "Local" badge on destination-scoped offers.
export function OfferResults({ result }: { result: OfferFinderResult }) {
  return (
    <View style={{ marginTop: tokens.space.lg }}>
      {result.summary ? <Text style={styles.summary}>{result.summary}</Text> : null}
      <Text style={styles.disclosure}>
        All listings are from paid partners and we may earn a commission if you book.
      </Text>
      {result.groups.length === 0 ? (
        <Text style={styles.muted}>No partner offers match this trip yet. Try different preferences.</Text>
      ) : null}
      {result.groups.map(({ need, offers }) => (
        <View key={need.id} style={{ marginTop: tokens.space.lg }}>
          <Text style={styles.needTitle}>{need.label}</Text>
          <Text style={styles.needWhy}>{need.rationale}</Text>
          {offers.map((o) => (
            <View key={o.id} style={styles.card}>
              <Text style={styles.spons}>Sponsored{o.subtitle ? ` · ${o.subtitle}` : ""}</Text>
              {isLocalizedOffer(o) ? <Text style={styles.local}>★ Local experience</Text> : null}
              <Text style={styles.title}>{o.title}</Text>
              {o.body ? <Text style={styles.body}>{o.body}</Text> : null}
              <Pressable style={styles.cta} onPress={() => Linking.openURL(api.directoryClickUrl(o.id))}>
                <Text style={styles.ctaText}>{o.ctaLabel} →</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { fontSize: 16, color: tokens.color.ink, marginBottom: tokens.space.sm },
  disclosure: { fontSize: 12, color: tokens.color.muted, backgroundColor: tokens.color.surface, borderWidth: 1, borderColor: tokens.color.borderSoft, borderRadius: tokens.radius.sm, padding: 10 },
  muted: { color: tokens.color.muted, marginTop: tokens.space.md },
  needTitle: { fontSize: tokens.font.h3, fontWeight: "700", color: tokens.color.primaryDark },
  needWhy: { color: tokens.color.muted, fontSize: 14, marginTop: 2, marginBottom: tokens.space.sm },
  card: { backgroundColor: tokens.color.partnerBg, borderWidth: 2, borderColor: tokens.color.accent, borderRadius: tokens.radius.md, padding: tokens.space.md, marginBottom: tokens.space.md },
  spons: { fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: tokens.color.muted },
  local: { alignSelf: "flex-start", marginTop: 4, fontSize: 11, fontWeight: "700", color: tokens.color.teal, backgroundColor: "#E4F1F2", borderWidth: 1, borderColor: tokens.color.teal, borderRadius: 999, paddingVertical: 1, paddingHorizontal: 8, overflow: "hidden" },
  title: { fontWeight: "700", color: tokens.color.primaryDark, marginTop: 6, fontSize: 16 },
  body: { color: tokens.color.muted, fontSize: 14, marginTop: 4 },
  cta: { marginTop: 12, alignSelf: "flex-start", backgroundColor: tokens.color.accent, paddingVertical: 8, paddingHorizontal: 16, borderRadius: tokens.radius.lg },
  ctaText: { color: tokens.color.primaryDark, fontWeight: "700", fontSize: 14 },
});
