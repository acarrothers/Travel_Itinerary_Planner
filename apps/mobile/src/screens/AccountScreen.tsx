import { useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable, Alert, StyleSheet } from "react-native";
import { tokens } from "@trip-itinerary/ui";
import type { Trip, User } from "@trip-itinerary/core";
import { api } from "../lib/api";
import { LoginScreen } from "./LoginScreen";

// Guests see sign-in; members see their profile + saved trips (open / delete).
export function AccountScreen({ user, onAuthed, onLogout, onOpenTrip }: {
  user: User | null;
  onAuthed: () => void;
  onLogout: () => void;
  onOpenTrip: (id: string) => void;
}) {
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setTrips(null); return; }
    api.listItineraries().then(setTrips).catch((e) => setError(e?.message ?? "Couldn't load trips."));
  }, [user]);

  async function remove(id: string) {
    try { await api.deleteItinerary(id); setTrips((cur) => (cur ?? []).filter((t) => t.id !== id)); }
    catch (e: any) { Alert.alert("Delete failed", e?.message ?? "Try again."); }
  }
  const cityOf = (t: Trip) => (t.preferences.destinations[0] ?? "Trip").split(",")[0].trim();

  if (!user) return <LoginScreen onAuthed={onAuthed} />;

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <View style={styles.header}>
        <View>
          <Text style={styles.h1}>My Trips</Text>
          <Text style={styles.sub}>{user.email}</Text>
        </View>
        <Pressable onPress={onLogout}><Text style={styles.logout}>Log out</Text></Pressable>
      </View>
      {error ? <Text style={styles.err}>{error}</Text> : null}
      {!trips && !error ? <Text style={styles.muted}>Loading…</Text> : null}
      {trips && trips.length === 0 ? <Text style={styles.muted}>No saved itineraries yet — build one on the Plan tab.</Text> : null}
      {(trips ?? []).map((t) => (
        <View key={t.id} style={styles.card}>
          <Pressable onPress={() => onOpenTrip(t.id)} style={{ flex: 1 }}>
            <Text style={styles.title}>{cityOf(t)} Trip</Text>
            <Text style={styles.meta}>{t.days.length} {t.days.length === 1 ? "day" : "days"} · saved {new Date(t.createdAt).toLocaleDateString()}</Text>
          </Pressable>
          <Pressable onPress={() => remove(t.id)}><Text style={styles.del}>Delete</Text></Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: tokens.space.lg, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  h1: { color: tokens.color.primaryDark, fontSize: tokens.font.h1, fontWeight: "800" },
  sub: { color: tokens.color.muted, marginTop: 2 },
  logout: { color: tokens.color.primary, fontWeight: "700" },
  err: { color: tokens.color.danger, marginTop: tokens.space.md },
  muted: { color: tokens.color.muted, marginTop: tokens.space.md },
  card: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: tokens.space.md, borderWidth: 1, borderColor: tokens.color.border, borderRadius: tokens.radius.lg, padding: tokens.space.md },
  title: { fontWeight: "700", color: tokens.color.primaryDark, fontSize: 16 },
  meta: { color: tokens.color.muted, fontSize: 13, marginTop: 2 },
  del: { color: tokens.color.danger, fontWeight: "600", fontSize: 13 },
});
