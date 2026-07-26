"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@trip-itinerary/api-client";
import type { PartnerRow, PartnerSummary } from "@trip-itinerary/api-client";
import type { Partner } from "@trip-itinerary/core";
import { tokens } from "@trip-itinerary/ui";
import { AdminGuard } from "../../components/AdminGuard";
import { AdminNav } from "../../components/AdminNav";
import { describeApiError } from "../../../lib/apiError";
import { pageContainer } from "../../../lib/layout";

declare const process: { env: Record<string, string | undefined> };
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const blank: Partner = { id: "", name: "", category: "tours", status: "active" };

function PartnersInner() {
  const [token, setToken] = useState("");
  const client = useMemo(() => createClient(BASE, { authToken: token || undefined }), [token]);
  const [data, setData] = useState<PartnerSummary | null>(null);
  const [form, setForm] = useState<Partner>(blank);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try { setData(await client.adminPartnerSummary()); }
    catch (e: any) { setError(describeApiError(e)); }
  }
  useEffect(() => { load(); }, [token]);

  async function save() {
    if (!form.name.trim()) { setError("Partner name is required."); return; }
    const partner: Partner = { ...form, id: form.id || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) };
    try { await client.adminSavePartner(partner); setForm(blank); setEditing(false); load(); }
    catch (e: any) { setError(`Save failed: ${describeApiError(e)}`); }
  }
  async function toggleStatus(p: PartnerRow) {
    try { await client.adminSavePartner({ id: p.id, name: p.name, category: p.category, status: p.status === "active" ? "paused" : "active", logoUrl: p.logoUrl }); load(); }
    catch (e: any) { setError(`Update failed: ${describeApiError(e)}`); }
  }
  async function remove(p: PartnerRow) {
    try { await client.adminDeletePartner(p.id); load(); }
    catch (e: any) { setError(describeApiError(e)); }
  }
  function edit(p: PartnerRow) {
    setForm({ id: p.id, name: p.name, category: p.category, status: p.status, logoUrl: p.logoUrl });
    setEditing(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const input: React.CSSProperties = { padding: "8px 10px", border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.sm, fontSize: 14, width: "100%", boxSizing: "border-box" };
  const label: React.CSSProperties = { fontSize: 13, color: tokens.color.muted, display: "block", marginBottom: 4 };

  const stat = (labelText: string, value: number, accent?: boolean) => (
    <div style={{ background: tokens.color.bg, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, padding: tokens.space.md, minWidth: 150, flex: "1 1 150px" }}>
      <div style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.caps, letterSpacing: "0.05em", textTransform: "uppercase", color: tokens.color.muted }}>{labelText}</div>
      <div style={{ fontFamily: tokens.font.heading, fontSize: tokens.font.h1, fontWeight: 800, color: accent ? tokens.color.primary : tokens.color.primaryDark }}>{value}</div>
    </div>
  );

  return (
    <main style={pageContainer}>
      <AdminNav />
      <h1 style={{ color: tokens.color.primaryDark, fontSize: tokens.font.h1, marginBottom: 4 }}>Partner Management</h1>
      <p style={{ color: tokens.color.muted, marginTop: 0 }}>Oversee travel partners and their promotional inventory.</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", margin: `${tokens.space.md}px 0` }}>
        <input style={{ ...input, maxWidth: 300, flex: "1 1 180px" }} placeholder="API key (blank = dev mode)" value={token} onChange={(e) => setToken(e.target.value)} />
      </div>
      {error && <p style={{ color: tokens.color.danger }}>{error}</p>}

      {data && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: tokens.space.lg }}>
          {stat("Total Partners", data.stats.totalPartners)}
          {stat("Active Offers", data.stats.activeOffers)}
          {stat("Pending Approvals", data.stats.pendingApprovals, data.stats.pendingApprovals > 0)}
        </div>
      )}

      {/* Add / edit partner */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, padding: tokens.space.md, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, background: tokens.color.bg }}>
        <div style={{ gridColumn: "1 / -1", fontFamily: tokens.font.heading, fontWeight: 700, color: tokens.color.primaryDark }}>
          {editing ? `Edit partner: ${form.id}` : "Add partner"}
        </div>
        <div><label style={label}>Name</label><input style={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><label style={label}>Category</label><input style={input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="tours, insurance, esim…" /></div>
        <div><label style={label}>Status</label>
          <select style={input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Partner["status"] })}>
            <option value="active">active</option><option value="paused">paused</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <button onClick={save} style={{ background: tokens.color.accent, color: tokens.color.primaryDark, border: "none", padding: "9px 18px", borderRadius: tokens.radius.lg, fontFamily: tokens.font.heading, fontWeight: 700, cursor: "pointer" }}>
            {editing ? "Save changes" : "Add partner"}
          </button>
          {editing && <button onClick={() => { setForm(blank); setEditing(false); }} style={{ background: tokens.color.bg, border: `1px solid ${tokens.color.border}`, padding: "9px 14px", borderRadius: tokens.radius.lg, cursor: "pointer" }}>Cancel</button>}
        </div>
      </div>

      <div style={{ overflowX: "auto", marginTop: tokens.space.lg }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 620 }}>
          <thead><tr style={{ background: tokens.color.primaryDark, color: "#fff", textAlign: "left" }}>
            {["Partner", "Category", "Active / Total", "Status", ""].map((h) => <th key={h} style={{ padding: 10 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {data?.partners.length === 0 && <tr><td colSpan={5} style={{ padding: 16, color: tokens.color.muted }}>No partners yet — add one above.</td></tr>}
            {data?.partners.map((p, i) => (
              <tr key={p.id} style={{ background: i % 2 ? tokens.color.surface : "#fff" }}>
                <td style={{ padding: 10 }}>
                  <div style={{ fontWeight: 700, color: tokens.color.primaryDark }}>{p.name}</div>
                  <div style={{ fontFamily: tokens.font.mono, fontSize: 12, color: tokens.color.muted }}>ID: {p.id}</div>
                </td>
                <td style={{ padding: 10 }}>
                  <span style={{ textTransform: "capitalize", background: tokens.color.light, color: tokens.color.primaryDark, borderRadius: tokens.radius.full, padding: "2px 10px", fontSize: 13 }}>{p.category}</span>
                </td>
                <td style={{ padding: 10 }}>{p.activeOffers} / {p.totalOffers}</td>
                <td style={{ padding: 10, color: p.status === "active" ? tokens.color.teal : tokens.color.muted, fontWeight: 600 }}>
                  ● {p.status}
                </td>
                <td style={{ padding: 10, textAlign: "right", whiteSpace: "nowrap" }}>
                  <button onClick={() => edit(p)} style={{ marginRight: 8, cursor: "pointer", background: "none", border: "none", color: tokens.color.primary, fontSize: 14 }}>Edit</button>
                  <button onClick={() => toggleStatus(p)} style={{ marginRight: 8, cursor: "pointer", background: "none", border: "none", color: tokens.color.primary, fontSize: 14 }}>{p.status === "active" ? "Pause" : "Activate"}</button>
                  <button onClick={() => remove(p)} style={{ cursor: "pointer", background: "none", border: "none", color: tokens.color.danger, fontSize: 14 }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default function PartnersPage() {
  return (
    <AdminGuard>
      <PartnersInner />
    </AdminGuard>
  );
}
