import { View, Text, Pressable, Linking, StyleSheet } from "react-native";
import { tokens } from "@trip-itinerary/ui";
import type { Offer } from "@trip-itinerary/core";

export function OfferCard({ offer, clickUrl }: { offer: Offer; clickUrl: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Sponsored · {offer.subtitle}</Text>
      <Text style={styles.title}>{offer.title}</Text>
      {offer.body ? <Text style={styles.body}>{offer.body}</Text> : null}
      <Pressable style={styles.cta} onPress={() => Linking.openURL(clickUrl)}>
        <Text style={styles.ctaText}>{offer.ctaLabel} →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: tokens.space.lg, borderWidth: 1, borderColor: tokens.color.blue,
    backgroundColor: tokens.color.light, borderRadius: tokens.radius.md, padding: tokens.space.md },
  label: { fontSize: 11, color: tokens.color.mid, letterSpacing: 1 },
  title: { fontWeight: "700", color: tokens.color.navy, marginTop: 4 },
  body: { color: tokens.color.mid, fontSize: 14, marginTop: 4 },
  cta: { marginTop: 10, alignSelf: "flex-start", backgroundColor: tokens.color.blue,
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: tokens.radius.sm },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
