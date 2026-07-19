import { View, Text, StyleSheet } from "react-native";
import { tripMapPoints, type Trip } from "@trip-itinerary/core";
import { tokens } from "@trip-itinerary/ui";

// Uses the SAME shared `tripMapPoints` helper as the web map, so both clients plot
// identical points. This renders a lightweight stops preview that runs in Expo Go.
//
// To enable the full native Google map, install react-native-maps and use
// provider={PROVIDER_GOOGLE} (a native module; create an Expo dev build), then
// replace the list below with <MapView> + <Marker> per point. Configure the Google
// Maps API key in app.json and EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.
export function MapView({ trip }: { trip: Trip }) {
  const points = tripMapPoints(trip);
  if (points.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Map appears once items have coordinates (Foursquare grounding).</Text>
      </View>
    );
  }
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Map · {points.length} stops</Text>
      {points.map((p, i) => (
        <View key={p.id} style={styles.row}>
          <View style={styles.pin}><Text style={styles.pinText}>{i + 1}</Text></View>
          <Text style={styles.stop}>Day {p.day}: {p.title}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: tokens.space.lg, borderWidth: 1, borderColor: tokens.color.border, borderRadius: tokens.radius.md, padding: tokens.space.md },
  title: { fontWeight: "700", color: tokens.color.navy, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 5 },
  pin: { width: 22, height: 22, borderRadius: 11, backgroundColor: tokens.color.blue, alignItems: "center", justifyContent: "center" },
  pinText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  stop: { flex: 1, color: tokens.color.text, fontSize: 14 },
  empty: { marginTop: tokens.space.lg, padding: tokens.space.md, borderWidth: 1, borderColor: tokens.color.border, borderStyle: "dashed", borderRadius: tokens.radius.md },
  emptyText: { color: tokens.color.mid, fontSize: 14 },
});
