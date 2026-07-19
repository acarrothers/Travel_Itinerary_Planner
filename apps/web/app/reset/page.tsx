"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { tokens } from "@trip-itinerary/ui";
import { api } from "../../lib/api";

export default function ResetPage() {
  const router = useRouter();
  const [token, setTokenValue] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setTokenValue(new URLSearchParams(window.location.search).get("token")); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) { setError("Missing reset token."); return; }
    setBusy(true); setError(null);
    try { await api.resetPassword(token, password); setDone(true); setTimeout(() => router.push("/login"), 1500); }
    catch (err: any) { setError(err?.message ?? "Reset failed"); }
    finally { setBusy(false); }
  }

  const input: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #D5DEEC", borderRadius: 8, fontSize: 15, marginTop: 4 };
  return (
    <main style={{ maxWidth: 380, margin: "12vh auto", padding: tokens.space.xl, fontFamily: tokens.font.family }}>
      <h1 style={{ color: tokens.color.navy }}>Set a new password</h1>
      {done ? <p style={{ color: tokens.color.navy }}>✓ Password updated. Redirecting to login…</p> : (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: tokens.space.md }}>
          <label style={{ fontSize: 13, color: tokens.color.mid }}>New password (min 8 characters)
            <input style={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </label>
          {error && <p style={{ color: tokens.color.danger, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={busy}
            style={{ background: tokens.color.blue, color: "#fff", border: "none", padding: 12, borderRadius: 10, fontWeight: 700, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
            {busy ? "…" : "Update password"}
          </button>
        </form>
      )}
    </main>
  );
}
