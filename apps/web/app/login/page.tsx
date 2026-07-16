"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { tokens } from "@trip-itinerary/ui";
import { api } from "../../lib/api";
import { setToken } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = mode === "signup" ? await api.register(email, password) : await api.login(email, password);
      setToken(res.token);
      router.push("/plan");
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally { setBusy(false); }
  }

  const input: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #D5DEEC", borderRadius: 8, fontSize: 15, marginTop: 4 };

  return (
    <main style={{ maxWidth: 380, margin: "8vh auto", padding: tokens.space.xl, fontFamily: tokens.font.family }}>
      <h1 style={{ color: tokens.color.navy, fontSize: 28 }}>
        Trip Itinerary <span style={{ color: tokens.color.blue }}>Planner</span>
      </h1>
      <p style={{ color: tokens.color.mid, marginTop: 0 }}>
        {mode === "signup" ? "Create an account to start planning." : "Log in to plan your trips."}
      </p>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: tokens.space.lg }}>
        <label style={{ fontSize: 13, color: tokens.color.mid }}>Email
          <input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label style={{ fontSize: 13, color: tokens.color.mid }}>Password {mode === "signup" && <span>(min 8 characters)</span>}
          <input style={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </label>
        {error && <p style={{ color: "#C0392B", margin: 0 }}>{error}</p>}
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
