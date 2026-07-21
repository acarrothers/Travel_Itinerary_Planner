"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { tokens } from "@trip-itinerary/ui";
import { cardContainer } from "../../lib/layout";
import { api } from "../../lib/api";

declare const process: { env: Record<string, string | undefined> };
const GOOGLE_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const APPLE_ID = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
const APPLE_REDIRECT = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const el = document.createElement("script");
    el.src = src; el.async = true; el.onload = () => resolve(); el.onerror = () => reject();
    document.head.appendChild(el);
  });
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleBtn = useRef<HTMLDivElement | null>(null);

  function finish() { router.push("/plan"); }
  async function ssoLogin(provider: "google" | "apple", idToken: string) {
    try { await api.oauthLogin(provider, idToken); finish(); }
    catch (e: any) { setError(e?.message ?? `${provider} sign-in failed`); }
  }

  // Google Identity Services button
  useEffect(() => {
    if (!GOOGLE_ID || !googleBtn.current) return;
    loadScript("https://accounts.google.com/gsi/client").then(() => {
      const g = (window as any).google;
      if (!g?.accounts?.id) return;
      g.accounts.id.initialize({ client_id: GOOGLE_ID, callback: (resp: any) => ssoLogin("google", resp.credential) });
      g.accounts.id.renderButton(googleBtn.current, { theme: "outline", size: "large", width: 320, text: "continue_with" });
    }).catch(() => {});
  }, []);

  // Apple JS SDK
  useEffect(() => {
    if (!APPLE_ID) return;
    loadScript("https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js").then(() => {
      (window as any).AppleID?.auth?.init({ clientId: APPLE_ID, scope: "email", redirectURI: APPLE_REDIRECT, usePopup: true });
    }).catch(() => {});
  }, []);

  async function appleSignIn() {
    try {
      const data = await (window as any).AppleID.auth.signIn();
      const idToken = data?.authorization?.id_token;
      if (idToken) ssoLogin("apple", idToken);
    } catch { /* user cancelled */ }
  }

  const [notice, setNotice] = useState<string | null>(null);
  async function forgot() {
    if (!email) { setError("Enter your email above, then click again."); return; }
    try { await api.forgotPassword(email); setNotice("If that email has an account, a reset link is on its way."); }
    catch { setNotice("If that email has an account, a reset link is on its way."); }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      if (mode === "signup") await api.register(email, password); else await api.login(email, password);
      finish();
    } catch (err: any) { setError(err?.message ?? "Something went wrong"); }
    finally { setBusy(false); }
  }

  const input: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #D5DEEC", borderRadius: 8, fontSize: 15, marginTop: 4 };
  const showSSO = !!(GOOGLE_ID || APPLE_ID);

  return (
    <main style={{ ...cardContainer, margin: "8vh auto" }}>
      <h1 style={{ color: tokens.color.navy, fontSize: 28 }}>
        Trip Itinerary <span style={{ color: tokens.color.blue }}>Planner</span>
      </h1>
      <p style={{ color: tokens.color.mid, marginTop: 0 }}>
        {mode === "signup" ? "Create an account to start planning." : "Log in to plan your trips."}
      </p>

      {showSSO && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: tokens.space.md, alignItems: "center" }}>
          {GOOGLE_ID && <div ref={googleBtn} />}
          {APPLE_ID && (
            <button onClick={appleSignIn} style={{ width: 320, height: 40, background: "#000", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
               Continue with Apple
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", color: tokens.color.mid, fontSize: 12, margin: "6px 0" }}>
            <div style={{ flex: 1, height: 1, background: tokens.color.border }} /> or <div style={{ flex: 1, height: 1, background: tokens.color.border }} />
          </div>
        </div>
      )}

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ fontSize: 13, color: tokens.color.mid }}>Email
          <input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label style={{ fontSize: 13, color: tokens.color.mid }}>Password {mode === "signup" && <span>(min 8 characters)</span>}
          <input style={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </label>
        {error && <p style={{ color: tokens.color.danger, margin: 0 }}>{error}</p>}
        {notice && <p style={{ color: tokens.color.mid, margin: 0, fontSize: 13 }}>{notice}</p>}
        {mode === "login" && (
          <button type="button" onClick={forgot} style={{ background: "none", border: "none", color: tokens.color.blue, cursor: "pointer", fontSize: 13, alignSelf: "flex-start", padding: 0 }}>
            Forgot password?
          </button>
        )}
        <button type="submit" disabled={busy}
          style={{ background: tokens.color.blue, color: "#fff", border: "none", padding: "12px", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? "…" : mode === "signup" ? "Create account" : "Log in"}
        </button>
      </form>
      <p style={{ color: tokens.color.mid, marginTop: tokens.space.md, fontSize: 14 }}>
        {mode === "signup" ? "Already have an account? " : "New here? "}
        <button onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(null); }}
          style={{ background: "none", border: "none", color: tokens.color.blue, cursor: "pointer", fontSize: 14, padding: 0 }}>
          {mode === "signup" ? "Log in" : "Create an account"}
        </button>
      </p>
    </main>
  );
}
