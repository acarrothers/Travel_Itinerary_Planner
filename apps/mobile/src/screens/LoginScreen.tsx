import { useEffect, useState } from "react";
import { SafeAreaView, View, Text, TextInput, Pressable, Platform, StyleSheet } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import { tokens } from "@trip-itinerary/ui";
import { api } from "../lib/api";
import { setToken } from "../lib/auth";

WebBrowser.maybeCompleteAuthSession();
declare const process: { env: Record<string, string | undefined> };
const GOOGLE_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

export function LoginScreen({ onAuthed }: { onAuthed: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => { if (Platform.OS === "ios") AppleAuthentication.isAvailableAsync().then(setAppleAvailable); }, []);
  useEffect(() => {
    if (response?.type === "success" && response.params?.id_token) sso("google", response.params.id_token);
  }, [response]);

  async function finish(token: string) { await setToken(token); onAuthed(); }
  async function sso(provider: "google" | "apple", idToken: string) {
    try { const r = await api.oauthLogin(provider, idToken); await finish(r.token); }
    catch (e: any) { setError(e?.message ?? `${provider} sign-in failed`); }
  }
  async function appleSignIn() {
    try {
      const cred = await AppleAuthentication.signInAsync({ requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL] });
      if (cred.identityToken) sso("apple", cred.identityToken);
    } catch { /* cancelled */ }
  }
  async function submit() {
    setBusy(true); setError(null);
    try { const r = mode === "signup" ? await api.register(email, password) : await api.login(email, password); await finish(r.token); }
    catch (e: any) { setError(e?.message ?? "Something went wrong"); }
    finally { setBusy(false); }
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.body}>
        <Text style={styles.h1}>Trip Itinerary <Text style={{ color: tokens.color.blue }}>Planner</Text></Text>
        <Text style={styles.sub}>{mode === "signup" ? "Create an account to start planning." : "Log in to plan your trips."}</Text>

        {GOOGLE_ID ? (
          <Pressable style={[styles.oauth, { borderColor: tokens.color.border }]} disabled={!request} onPress={() => promptAsync()}>
            <Text style={styles.oauthText}>Continue with Google</Text>
          </Pressable>
        ) : null}
        {appleAvailable ? (
          <Pressable style={[styles.oauth, { backgroundColor: "#000", borderColor: "#000" }]} onPress={appleSignIn}>
            <Text style={[styles.oauthText, { color: "#fff" }]}> Continue with Apple</Text>
          </Pressable>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Password{mode === "signup" ? " (min 8)" : ""}</Text>
          <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
        </View>
        {error ? <Text style={styles.err}>{error}</Text> : null}
        <Pressable style={[styles.btn, busy && { opacity: 0.6 }]} disabled={busy} onPress={submit}>
          <Text style={styles.btnText}>{busy ? "…" : mode === "signup" ? "Create account" : "Log in"}</Text>
        </Pressable>
        <Pressable onPress={() => { setMode(mode === "signup" ? "login" : "signup"); setError(null); }}>
          <Text style={styles.toggle}>{mode === "signup" ? "Already have an account? Log in" : "New here? Create an account"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  body: { padding: tokens.space.xl, gap: 12, justifyContent: "center", flex: 1 },
  h1: { color: tokens.color.navy, fontSize: 28, fontWeight: "700" },
  sub: { color: tokens.color.mid, marginBottom: 8 },
  oauth: { height: 44, borderWidth: 1, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  oauthText: { fontWeight: "600", color: tokens.color.navy },
  field: { gap: 4 },
  label: { fontSize: 13, color: tokens.color.mid },
  input: { borderWidth: 1, borderColor: tokens.color.border, borderRadius: 8, padding: 10, fontSize: 15 },
  err: { color: tokens.color.danger },
  btn: { backgroundColor: tokens.color.blue, borderRadius: 10, padding: 14, alignItems: "center", marginTop: 4 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  toggle: { color: tokens.color.blue, textAlign: "center", marginTop: 8 },
});
