"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@trip-itinerary/api-client";
import { tokens } from "@trip-itinerary/ui";
import { AdminGuard } from "../components/AdminGuard";
import { AdminNav } from "../components/AdminNav";
import { describeApiError } from "../../lib/apiError";
import { pageContainer } from "../../lib/layout";

declare const process: { env: Record<string, string | undefined> };
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

// Admin landing: at-a-glance stats + quick links into each management surface.
function DashboardInner() {
  const [token, setToken] = useState("");
  const client = useMemo(() => createClient(BASE, { authToken: token || undefined }), [token]);
  const [stats, setStats] = useState<{ offers: number; live: number; partners: number; pending: number; ctr: number | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const [offers, summary] = await Promise.all([client.adminListOffers(), client.adminPartnerSummary()]);
      let ctr: number | null = null;
      try {
        const rows = await client.adminReport();
        const imp = rows.reduce((a, r) => a + r.impressions, 0);
        const clk = rows.reduce((a, r) => a + r.clicks, 0);
        ctr = imp ? clk / imp : 0;
      } catch { /* metrics optional */ }
      setStats({
        offers: offers.length,
        live: offers.filter((o) => o.status === "live").length,
        partners: summary.stats.totalPartners,
        pending: summary.stats.pendingApprovals,
        ctr,
      });
    } catch (e: any) { setError(describeApiError(e)); }
  }
  useEffect(() => { load(); }, [token]);

  const statCard = (icon: string, label: string, value: string, caption?: string, captionColor = tokens.color.muted) => (
    <div style={{ flex: "1 1 200px", background: tokens.color.bg, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.lg, padding: tokens.space.md }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18, width: 34, height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", background: tokens.color.light, borderRadius: tokens.radius.md }}>{icon}</span>
        <span style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.caps, letterSpacing: "0.05em", textTransform: "uppercase", color: tokens.color.muted }}>{label}</span>
      </div>
      <div style={{ fontFamily: tokens.font.heading, fontSize: tokens.font.display, fontWeight: 800, color: tokens.color.primaryDark, lineHeight: 1.1, marginTop: 6 }}>{value}</div>
      {caption && <div style={{ fontSize: 13, color: captionColor, marginTop: 2 }}>{caption}</div>}
    </div>
  );

  const linkCard = (href: string, icon: string, title: string, desc: string) => (
    <Link href={href} style={{ textDecoration: "none", flex: "1 1 240px", background: tokens.color.bg, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.lg, padding: tokens.space.md }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontFamily: tokens.font.heading, fontWeight: 700, fontSize: tokens.font.h3, color: tokens.color.primaryDark, marginTop: 6 }}>{title}</div>
      <div style={{ color: tokens.color.muted, fontSize: tokens.font.small, marginTop: 2 }}>{desc}</div>
      <div style={{ color: tokens.color.primary, fontFamily: tokens.font.heading, fontWeight: 700, fontSize: 14, marginTop: tokens.space.sm }}>Open →</div>
    </Link>
  );

  return (
    <main style={pageContainer}>
      <AdminNav />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ color: tokens.color.primaryDark, fontSize: tokens.font.h1, margin: 0 }}>Admin Dashboard</h1>
          <p style={{ color: tokens.color.muted, marginTop: 4 }}>Offers, partners, and performance at a glance.</p>
        </div>
        <input style={{ padding: "8px 10px", border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.sm, fontSize: 14, width: 220, boxSizing: "border-box" }}
          placeholder="API key (blank = dev)" value={token} onChange={(e) => setToken(e.target.value)} />
      </div>
      {error && <p style={{ color: tokens.color.danger }}>{error}</p>}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: `${tokens.space.lg}px 0` }}>
        {statCard("🏷️", "Total Offers", stats ? String(stats.offers) : "—", stats ? `${stats.live} live` : undefined)}
        {statCard("🤝", "Partners", stats ? String(stats.partners) : "—")}
        {statCard("⏳", "Pending Approvals", stats ? String(stats.pending) : "—",
          stats && stats.pending > 0 ? "Requires attention" : "All clear",
          stats && stats.pending > 0 ? tokens.color.warnText : tokens.color.teal)}
        {statCard("📈", "Avg CTR", stats && stats.ctr !== null ? `${(stats.ctr * 100).toFixed(1)}%` : "—")}
      </div>

      <h2 style={{ fontFamily: tokens.font.heading, fontWeight: 700, fontSize: tokens.font.h3, color: tokens.color.ink, marginBottom: tokens.space.sm }}>Manage</h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {linkCard("/admin/offers", "🏷️", "Offers", "Create and target partner offers")}
        {linkCard("/admin/partners", "🤝", "Partners", "Onboard partners; import from CSV")}
        {linkCard("/admin/reports", "📊", "Reports", "Funnel per offer: clicks, conversions, revenue")}
      </div>
    </main>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <DashboardInner />
    </AdminGuard>
  );
}
