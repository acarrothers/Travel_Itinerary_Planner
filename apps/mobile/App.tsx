import { useCallback, useEffect, useState } from "react";
import { SafeAreaView, View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { tokens } from "@trip-itinerary/ui";
import type { User } from "@trip-itinerary/core";
import { api } from "./src/lib/api";
import { loadToken, clearToken } from "./src/lib/auth";
import { FinderScreen } from "./src/screens/FinderScreen";
import { ItineraryScreen } from "./src/screens/ItineraryScreen";
import { DirectoryScreen } from "./src/screens/DirectoryScreen";
import { AccountScreen } from "./src/screens/AccountScreen";

type Tab = "offers" | "plan" | "directory" | "account";
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "offers", label: "Offers", icon: "🏷️" },
  { id: "plan", label: "Plan", icon: "🗺️" },
  { id: "directory", label: "Browse", icon: "🔎" },
  { id: "account", label: "Account", icon: "👤" },
];

export default function App() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>("offers");
  const [openTripId, setOpenTripId] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try { const m = await api.me(); setUser(m.user); } catch { setUser(null); }
  }, []);

  useEffect(() => { loadToken().then(refreshUser).finally(() => setReady(true)); }, [refreshUser]);

  async function onLogout() { await clearToken(); setUser(null); setTab("offers"); }
  function openTrip(id: string) { setOpenTripId(id); setTab("plan"); }

  if (!ready) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.screen}>
        {tab === "offers" ? <FinderScreen /> : null}
        {tab === "plan" ? <ItineraryScreen user={user} openTripId={openTripId} /> : null}
        {tab === "directory" ? <DirectoryScreen /> : null}
        {tab === "account" ? (
          <AccountScreen user={user} onAuthed={refreshUser} onLogout={onLogout} onOpenTrip={openTrip} />
        ) : null}
      </View>
      <View style={styles.tabbar}>
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <Pressable key={t.id} style={styles.tab} onPress={() => { if (t.id !== "plan") setOpenTripId(null); setTab(t.id); }}>
              <Text style={[styles.tabIcon, on && { opacity: 1 }]}>{t.icon}</Text>
              <Text style={[styles.tabLabel, on && styles.tabLabelOn]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: tokens.color.bg },
  screen: { flex: 1 },
  tabbar: { flexDirection: "row", borderTopWidth: 1, borderTopColor: tokens.color.border, backgroundColor: tokens.color.bg },
  tab: { flex: 1, alignItems: "center", paddingVertical: 8 },
  tabIcon: { fontSize: 20, opacity: 0.7 },
  tabLabel: { fontSize: 11, color: tokens.color.muted, marginTop: 2 },
  tabLabelOn: { color: tokens.color.primaryDark, fontWeight: "700" },
});
