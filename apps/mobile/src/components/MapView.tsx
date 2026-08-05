import { View, Text, StyleSheet } from "react-native";
import { tripMapPoints, type Trip, type MapPoint } from "@trip-itinerary/core";
import { tokens } from "@trip-itinerary/ui";

declare const require: (m: string) => any;

// Load react-native-maps only if the native module is present in this build.
// Guarded so the app still runs in Expo Go / a build without the module — it
// falls back to a lightweight stops list. The full Google map needs a dev build
// plus EXPO_PUBLIC_GOOGLE_MAPS_API_KEY (see app.config.js).
let RNMaps: any = null;
try { RNMaps = require("react-native-maps"); } catch { RNMaps = null; }

// Region that comfortably frames all stops (center + padded deltas).
function regionFor(points: MapPoint[]) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.05, (maxLat - minLat) * 1.5),
    longitudeDelta: Math.max(0.05, (maxLng - minLng) * 1.5),
  };
}

export function MapView({ trip }: { trip: Trip }) {
  const points = tripMapPoints(trip);

  // Native Google map when the module is available and we have coordinates.
  if (RNMaps && points.length > 0) {
    const Map = RNMaps.default;
    const Marker = RNMaps.Marker;
    const PROVIDER_GOOGLE = RNMaps.PROVIDER_GOOGLE;
    return (
      <View style={styles.mapWrap}>
        <Map provider={PROVIDER_GOOGLE} style={styles.map} initialRegion={regionFor(points)}>
          {points.map((p) => (
            <Marker key={p.id} coordinate={{ latitude: p.lat, longitude: p.lng }} title={p.title} description={`Day ${p.day}`} />
          ))}
        </Map>
      </View>
    );
  }

  // Fallback: no coordinates yet (Foursquare grounding off) or no native module.
  if (points.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Map appears once itinerary items have coordinates (Foursquare grounding).</Text>
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
  mapWrap: { marginTop: tokens.space.lg, height: 300, borderRadius: tokens.radius.lg, overflow: "hidden", borderWidth: 1, borderColor: tokens.color.border },
  map: { flex: 1 },
  card: { marginTop: tokens.space.lg, borderWidth: 1, borderColor: tokens.color.border, borderRadius: tokens.radius.md, padding: tokens.space.md },
  title: { fontWeight: "700", color: tokens.color.navy, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 5 },
  pin: { width: 22, height: 22, borderRadius: 11, backgroundColor: tokens.color.blue, alignItems: "center", justifyContent: "center" },
  pinText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  stop: { flex: 1, color: tokens.color.text, fontSize: 14 },
  empty: { marginTop: tokens.space.lg, padding: tokens.space.md, borderWidth: 1, borderColor: tokens.color.border, borderStyle: "dashed", borderRadius: tokens.radius.md },
  emptyText: { color: tokens.color.mid, fontSize: 14 },
});
