import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { PlannerScreen } from "./src/screens/PlannerScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { loadToken, clearToken } from "./src/lib/auth";

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => { loadToken().then((t) => setAuthed(!!t)); }, []);

  if (authed === null) {
    return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator /></View>;
  }
  return (
    <>
      <StatusBar style="dark" />
      {authed
        ? <PlannerScreen onLogout={async () => { await clearToken(); setAuthed(false); }} />
        : <LoginScreen onAuthed={() => setAuthed(true)} />}
    </>
  );
}
