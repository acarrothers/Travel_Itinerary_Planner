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
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

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
  async function importCsv(file: File) {
    setError(null); setImportMsg(null);
    try {
      const text = await file.text();
      const res = await client.adminImportPartners(text);
      const parts = [`Imported ${res.imported} partner(s): ${res.created} created, ${res.updated} updated`];
      if (res.errors.length) parts.push(`${res.errors.length} row(s) skipped: ${res.errors.slice(0, 3).join(" ")}`);
      setImportMsg(parts.join(". "));
      load();
    } catch (e: any) { setError(`Import failed: ${describeApiError(e)}`); }
  }

  function edit(p: PartnerRow) {
    setForm({ id: p.id, name: p.name, category: p.category, status: p.status, logoUrl: p.logoUrl });
    setEditing(true); setShowForm(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openAdd() { setForm(blank); setEditing(false); setShowForm(true); }

  const input: React.CSSProperties = { padding: "8px 10px", border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.sm, fontSize: 14, width: "100%", boxSizing: "border-box" };
  const label: React.CSSProperties = { fontSize: 13, color: tokens.color.muted, display: "block", marginBottom: 4 };

  // Emoji avatar per partner category (no icon-font dependency).
  const emojiFor = (c: string) => {
    const k = c.toLowerCase();
    if (k.includes("air") || k.includes("flight")) return "✈️";
    if (k.includes("hotel") || k.includes("accommod") || k.includes("stay")) return "🏨";
    if (k.includes("tour") || k.includes("experience") || k.includes("activ")) return "🎟️";
    if (k.includes("insur")) return "🛡️";
    if (k.includes("esim") || k.includes("connect")) return "📶";
    if (k.includes("transfer") || k.includes("ride")) return "🚕";
    if (k.includes("car") || k.includes("rental")) return "🚗";
    if (k.includes("rail") || k.includes("train")) return "🚆";
    if (k.includes("lounge")) return "🛋️";
    return "🏷️";
  };

  const statCard = (icon: string, labelText: string, value: number, caption: string, captionColor = tokens.color.muted) => (
    <div style={{ flex: "1 1 200px", background: tokens.color.bg, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.lg, padding: tokens.space.md }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18, width: 34, height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", background: tokens.color.light, borderRadius: tokens.radius.md }}>{icon}</span>
        <span style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.caps, letterSpacing: "0.05em", textTransform: "uppercase", color: tokens.color.muted }}>{labelText}</span>
      </div>
      <div style={{ fontFamily: tokens.font.heading, fontSize: tokens.font.display, fontWeight: 800, color: tokens.color.primaryDark, lineHeight: 1.1, marginTop: 6 }}>{value}</div>
      <div style={{ fontSize: 13, color: captionColor, marginTop: 2 }}>{caption}</div>
    </div>
  );

  const categories = Array.from(new Set((data?.partners ?? []).map((p) => p.category))).sort();
  const q = query.trim().toLowerCase();
  const rows = (data?.partners ?? []).filter((p) => {
    if (catFilter && p.category !== catFilter) return false;
    if (!q) return true;
    return [p.name, p.id, p.category].some((f) => f.toLowerCase().includes(q));
  });

  const iconBtn = (text: string, onClick: () => void, color: string) => (
    <button onClick={onClick} style={{ cursor: "pointer", background: "none", border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.sm, color, fontSize: 13, padding: "4px 10px", fontWeight: 600 }}>{text}</button>
  );

  return (
    <main style={pageContainer}>
      <AdminNav />

      {/* Title + primary actions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ color: tokens.color.primaryDark, fontSize: tokens.font.h1, margin: 0 }}>Partner Management</h1>
          <p style={{ color: tokens.color.muted, marginTop: 4 }}>Oversee integrations, track active offers, and manage travel partner relationships.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <label style={{ background: tokens.color.bg, border: `1px solid ${tokens.color.border}`, padding: "10px 16px", borderRadius: tokens.radius.lg, cursor: "pointer", fontFamily: tokens.font.heading, fontWeight: 700, color: tokens.color.primaryDark, fontSize: 14 }}>
            Import CSV
            <input type="file" accept=".csv,text/csv" style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f); e.target.value = ""; }} />
          </label>
          <button onClick={openAdd} style={{ background: tokens.color.accent, color: tokens.color.primaryDark, border: "none", padding: "10px 18px", borderRadius: tokens.radius.lg, fontFamily: tokens.font.heading, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+ Add Partner</button>
        </div>
      </div>

      {importMsg && <p style={{ color: tokens.color.teal, fontSize: 14 }}>{importMsg}</p>}
      {error && <p style={{ color: tokens.color.danger }}>{error}</p>}

      {/* Stat cards */}
      {data && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: `${tokens.space.lg}px 0` }}>
          {statCard("🤝", "Total Partners", data.stats.totalPartners, "Across all categories")}
          {statCard("🏷️", "Active Offers", data.stats.activeOffers, "Live in the catalog")}
          {statCard("⏳", "Pending Approvals", data.stats.pendingApprovals,
            data.stats.pendingApprovals > 0 ? "Requires attention" : "All clear",
            data.stats.pendingApprovals > 0 ? tokens.color.warnText : tokens.color.teal)}
        </div>
      )}

      {/* Add / edit partner (revealed by Add Partner or Edit) */}
      {showForm && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, padding: tokens.space.md, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.lg, background: tokens.color.surface, marginBottom: tokens.space.lg }}>
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
            <button onClick={() => { setForm(blank); setEditing(false); setShowForm(false); }} style={{ background: tokens.color.bg, border: `1px solid ${tokens.color.border}`, padding: "9px 14px", borderRadius: tokens.radius.lg, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Toolbar: search + category filter + API key */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", padding: tokens.space.sm, background: tokens.color.bg, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.lg, marginBottom: tokens.space.md }}>
        <input style={{ ...input, flex: "2 1 220px", maxWidth: 360 }} placeholder="🔎  Search partners…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select style={{ ...input, flex: "1 1 140px", maxWidth: 200 }} value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input style={{ ...input, flex: "1 1 160px", maxWidth: 220 }} placeholder="API key (blank = dev)" value={token} onChange={(e) => setToken(e.target.value)} />
      </div>

      {/* Partners table */}
      <div style={{ overflowX: "auto", border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.lg }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 680 }}>
          <thead><tr style={{ background: tokens.color.surface, color: tokens.color.muted, textAlign: "left", fontFamily: tokens.font.mono, fontSize: tokens.font.caps, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <th style={{ padding: "12px 16px" }}>Partner</th><th style={{ padding: "12px 16px" }}>Category</th><th style={{ padding: "12px 16px" }}>Active offers</th><th style={{ padding: "12px 16px" }}>Status</th><th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} style={{ padding: 16, color: tokens.color.muted }}>{data ? "No partners match your filters." : "Loading…"}</td></tr>}
            {rows.map((p) => (
              <tr key={p.id} style={{ borderTop: `1px solid ${tokens.color.borderSoft}` }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18, width: 38, height: 38, display: "inline-flex", alignItems: "center", justifyContent: "center", background: tokens.color.light, borderRadius: tokens.radius.md }}>{emojiFor(p.category)}</span>
                    <div>
                      <div style={{ fontFamily: tokens.font.heading, fontWeight: 700, color: tokens.color.primaryDark }}>{p.name}</div>
                      <div style={{ fontFamily: tokens.font.mono, fontSize: 12, color: tokens.color.muted }}>ID: {p.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ textTransform: "capitalize", background: tokens.color.light, color: tokens.color.primaryDark, borderRadius: tokens.radius.full, padding: "3px 12px", fontSize: 13, fontWeight: 600 }}>{p.category}</span>
                </td>
                <td style={{ padding: "12px 16px", fontWeight: 700, color: tokens.color.ink }}>{p.activeOffers}<span style={{ color: tokens.color.muted, fontWeight: 400 }}> / {p.totalOffers}</span></td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: p.status === "active" ? tokens.color.teal : tokens.color.muted, fontWeight: 600, textTransform: "capitalize" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.status === "active" ? tokens.color.teal : tokens.color.muted }} />
                    {p.status}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                  <span style={{ display: "inline-flex", gap: 6, justifyContent: "flex-end" }}>
                    {iconBtn("Edit", () => edit(p), tokens.color.primary)}
                    {iconBtn(p.status === "active" ? "Pause" : "Activate", () => toggleStatus(p), tokens.color.primary)}
                    {iconBtn("Delete", () => remove(p), tokens.color.danger)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <p style={{ color: tokens.color.muted, fontSize: 13, marginTop: tokens.space.sm }}>Showing {rows.length} of {data.partners.length} partners</p>}
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
