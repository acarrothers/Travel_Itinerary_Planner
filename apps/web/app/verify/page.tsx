"use client";
import { useEffect, useState } from "react";
import { tokens } from "@trip-itinerary/ui";
import { api } from "../../lib/api";

export default function VerifyPage() {
  const [status, setStatus] = useState<"working" | "ok" | "error">("working");
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) { setStatus("error"); return; }
    api.verifyEmail(token).then(() => setStatus("ok")).catch(() => setStatus("error"));
  }, []);
  return (
    <main style={{ maxWidth: 420, margin: "12vh auto", padding: tokens.space.xl, fontFamily: tokens.font.family, textAlign: "center" }}>
      <h1 style={{ color: tokens.color.navy }}>Email verification</h1>
      {status === "working" && <p style={{ color: tokens.color.mid }}>Verifying…</p>}
      {status === "ok" && <p style={{ color: tokens.color.navy }}>✓ Your email is verified. <a href="/plan" style={{ color: tokens.color.blue }}>Go to the planner →</a></p>}
      {status === "error" && <p style={{ color: tokens.color.danger }}>This link is invalid or expired. Log in and resend the verification email.</p>}
    </main>
  );
}
