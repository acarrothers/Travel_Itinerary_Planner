"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@trip-itinerary/api-client";
import { tokens } from "@trip-itinerary/ui";
import type { OfferReportRow } from "@trip-itinerary/core";
import { AdminGuard } from "../../components/AdminGuard";
import { describeApiError } from "../../../lib/apiError";

declare const process: { env: Record<string, string | undefined> };
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const usd = (n: number) => `$${n.toFixed(2)}`;

function ReportsPageInner() {
  const [token, setToken] = useState("");
  const client = useMemo(() => createClient(BASE, { authToken: token || undefined }), [token]);
  const [rows, setRows] = useState<OfferReportRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try { setRows(await client.adminReport()); }
    catch (e: any) { setError(describeApiError(e)); }
  }
  useEffect(() => { load(); }, [token]);

  async function seed() { try { await client.adminSeedEvents(); load(); } catch (e: any) { setError(`Seeding failed: ${describeApiError(e)}`); } }

  const totals = rows.reduce((t, r) => ({ impressions: t.impressions + r.impressions, clicks: t.clicks + r.clicks, conversions: t.conversions + r.conversions, revenue: t.revenue + r.revenueUsd }), { impressions: 0, clicks: 0, conversions: 0, revenue: 0 });
  const maxRev = Math.max(1, ...rows.map((r) => r.revenueUsd));

  const card = (label: string, value: string) => (
    <div style={{ border: "1px solid #E2E8F2", borderRadius: tokens.radius.md, padding: tokens.space.md, minWidth: 150 }}>
      <div style={{ color: tokens.color.mid, fontSize: 13 }}>{label}</div>
      <div style={{ color: tokens.color.navy, fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: tokens.space.xl, fontFamily: tokens.font.family }}>
      <h1 style={{ color: tokens.color.navy, fontSize: tokens.font.h1, marginBottom: 4 }}>Offer performance</h1>
      <p style={{ color: tokens.color.mid, marginTop: 0 }}>Funnel by offer — impressions → clicks → conversions → revenue (PRD §13).</p>

      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: `${tokens.space.md}px 0` }}>
        <input style={{ padding: "8px 10px", border: "1px solid #D5DEEC", borderRadius: 6, maxWidth: 280 }} placeholder="API key (blank = dev mode)" value={token} onChange={(e) => setToken(e.target.value)} />
        <button onClick={seed} style={{ background: tokens.color.blue, color: "#fff", border: "none", padding: "9px 16px", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}>Seed demo events</button>
        <button onClick={load} style={{ background: "#fff", border: "1px solid #D5DEEC", padding: "9px 14px", borderRadius: 6, cursor: "pointer" }}>Refresh</button>
      </div>
      {error && <p style={{ color: tokens.color.danger }}>{error}</p>}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: tokens.space.lg }}>
        {card("Impressions", String(totals.impressions))}
        {card("Clicks", String(totals.clicks))}
        {card("Conversions", String(totals.conversions))}
        {card("Revenue", usd(totals.revenue))}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead><tr style={{ background: tokens.color.navy, color: "#fff", textAlign: "left" }}>
          {["Offer", "Impr.", "Clicks", "CTR", "Conv.", "Conv. rate", "Revenue", "EPC", ""].map((h) => <th key={h} style={{ padding: 8 }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={9} style={{ padding: 16, color: tokens.color.mid }}>No events yet — click “Seed demo events”.</td></tr>}
          {rows.map((r, i) => (
            <tr key={r.offerId} style={{ background: i % 2 ? tokens.color.surface : "#fff" }}>
              <td style={{ padding: 8 }}>{r.offerId}</td>
              <td style={{ padding: 8 }}>{r.impressions}</td>
              <td style={{ padding: 8 }}>{r.clicks}</td>
              <td style={{ padding: 8 }}>{pct(r.ctr)}</td>
              <td style={{ padding: 8 }}>{r.conversions}</td>
              <td style={{ padding: 8 }}>{pct(r.conversionRate)}</td>
              <td style={{ padding: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ height: 8, width: 80, background: tokens.color.light, borderRadius: 4 }}>
                    <div style={{ height: 8, width: `${(r.revenueUsd / maxRev) * 80}px`, background: tokens.color.blue, borderRadius: 4 }} />
                  </div>
                  {usd(r.revenueUsd)}
                </div>
              </td>
              <td style={{ padding: 8 }}>{usd(r.epcUsd)}</td>
              <td style={{ padding: 8 }} />
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

export default function ReportsPage() {
  return (
    <AdminGuard>
      <ReportsPageInner />
    </AdminGuard>
  );
}
