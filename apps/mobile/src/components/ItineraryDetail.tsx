import { useMemo } from "react";
import { View, Text, Pressable, Linking, StyleSheet } from "react-native";
import { tokens } from "@trip-itinerary/ui";
import { assignOffersToDays, type Trip, type Offer } from "@trip-itinerary/core";
import { api } from "../lib/api";
import { MapView } from "./MapView";

// Detailed itinerary: map + day-by-day timeline with localized partner offers
// distributed by the shared cadence engine (0-2 per day). Mirrors the web view.
export function ItineraryDetail({ trip, offers }: { trip: Trip; offers: Offer[] }) {
  const days = [...trip.days].sort((a, b) => a.order - b.order);
  const dayOffers = useMemo(() => assignOffersToDays(trip, offers), [trip, offers]);
  const city = (trip.preferences.destinations[0] ?? "Your trip").split(",")[0].trim();
  const interests = trip.preferences.interests.slice(0, 2).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" & ");

  return (
    <View style={{ marginTop: tokens.space.md }}>
      <MapView trip={trip} />
      <Text style={styles.h1}>{city} Trip</Text>
      <Text style={styles.sub}>{days.length} {days.length === 1 ? "day" : "days"}{interests ? ` · ${interests} mix` : ""}</Text>

      {days.map((day) => {
        const dOffers = dayOffers.get(day.order) ?? [];
        return (
          <View key={day.id} style={styles.dayCard}>
            <Text style={styles.dayTitle}>Day {day.order}</Text>
            {day.items.map((it) => (
              <View key={it.id} style={styles.row}>
                <View style={[styles.dot, { backgroundColor: tokens.color.primary }]} />
                <Text style={styles.time}>{it.time ?? "—"}</Text>
                <Text style={styles.itemTitle}>{it.title}</Text>
              </View>
            ))}
            {dOffers.map((o) => (
              <Pressable key={o.id} style={styles.row} onPress={() => Linking.openURL(api.trackOfferClickUrl(o.id, trip.id))}>
                <View style={[styles.dot, { backgroundColor: tokens.color.accent }]} />
                <Text style={styles.time}>Offer</Text>
                <Text style={styles.offerTitle}>{o.title} <Text style={styles.partnerTag}>PARTNER</Text></Text>
              </Pressable>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: tokens.font.h1, fontWeight: "800", color: tokens.color.primaryDark, marginTop: tokens.space.lg },
  sub: { color: tokens.color.muted, marginTop: 2 },
  dayCard: { marginTop: tokens.space.md, borderWidth: 1, borderColor: tokens.color.border, borderRadius: tokens.radius.lg, padding: tokens.space.md },
  dayTitle: { fontWeight: "700", color: tokens.color.primaryDark, marginBottom: 8, fontSize: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  time: { color: tokens.color.muted, width: 48, fontSize: 12 },
  itemTitle: { flex: 1, color: tokens.color.ink, fontWeight: "600" },
  offerTitle: { flex: 1, color: tokens.color.primaryDark, fontWeight: "600" },
  partnerTag: { fontSize: 10, fontWeight: "700", color: tokens.color.primaryDark },
});
