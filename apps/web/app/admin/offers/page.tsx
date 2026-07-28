"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@trip-itinerary/api-client";
import { tokens } from "@trip-itinerary/ui";
import { OPS_BY_DIMENSION, TARGETING_DIMENSIONS, isListOp, emptyTargetingRule, describeRule } from "@trip-itinerary/core";
import type { Offer, TargetingRule } from "@trip-itinerary/core";
import { AdminGuard } from "../../components/AdminGuard";
import { AdminNav } from "../../components/AdminNav";
import { describeApiError } from "../../../lib/apiError";
import { pageContainer } from "../../../lib/layout";

declare const process: { env: Record<string, string | undefined> };
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const blank: Omit<Offer, "targeting"> = {
  id: "", partnerId: "viator", title: "", subtitle: "", body: "",
  ctaLabel: "See experiences", destinationUrl: "https://www.viator.com/",
  category: "tours", tags: [], priority: 50, surfaces: ["post_generation"], status: "draft",
};

const emojiFor = (c: string) => {
  const k = (c || "").toLowerCase();
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
const statusColor = (s: Offer["status"]) => s === "live" ? tokens.color.teal : s === "paused" ? tokens.color.warnText : tokens.color.muted;

function OffersInner() {
  const [token, setToken] = useState("");
  const client = useMemo(() => createClient(BASE, { authToken: token || undefined }), [token]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [form, setForm] = useState<Omit<Offer, "targeting">>(blank);
  const [rules, setRules] = useState<TargetingRule[]>([{ dimension: "interests", op: "contains_any", value: ["culture", "food"] }]);
  const [me, setMe] = useState<{ role: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [avgCtr, setAvgCtr] = useState<number | null>(null);

  async function load() {
    setError(null);
    try { setOffers(await client.adminListOffers()); }
    catch (e: any) { setError(describeApiError(e)); return; }
    try { setMe(await client.adminMe()); } catch { /* role optional */ }
    try {
      const rows = await client.adminReport();
      const imp = rows.reduce((a, r) => a + r.impressions, 0);
      const clk = rows.reduce((a, r) => a + r.clicks, 0);
      setAvgCtr(imp ? clk / imp : 0);
    } catch { /* metrics optional */ }
  }
  useEffect(() => { load(); }, [token]);

  function setRule(i: number, patch: Partial<TargetingRule>) { setRules((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r))); }
  function parseValue(op: TargetingRule["op"], raw: string): TargetingRule["value"] {
    if (isListOp(op)) return raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (op === "gte" || op === "lte") return Number(raw) || 0;
    return raw;
  }
  async function save() {
    const cleanRules = rules.filter((r) => (Array.isArray(r.value) ? r.value.length : r.value !== ""));
    const offer: Offer = {
      ...form,
      id: form.id || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || `offer-${Date.now()}`,
      tags: cleanRules.flatMap((r) => (Array.isArray(r.value) ? (r.value as string[]) : [])),
      targeting: cleanRules,
    };
    try { await client.adminSaveOffer(offer); setForm(blank); setRules([emptyTargetingRule()]); setShowForm(false); load(); }
    catch (e: any) { setError(`Save failed: ${describeApiError(e)}`); }
  }
  function edit(o: Offer) { const { targeting, ...rest } = o; setForm(rest); setRules(targeting.length ? targeting : [emptyTargetingRule()]); setShowForm(true); if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); }
  function openAdd() { setForm(blank); setRules([emptyTargetingRule()]); setShowForm(true); }
  async function remove(id: string) { try { await client.adminDeleteOffer(id); load(); } catch (e: any) { setError(`Delete failed: ${describeApiError(e)}`); } }

  const input: React.CSSProperties = { padding: "8px 10px", border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.sm, fontSize: 14, width: "100%", boxSizing: "border-box" };
  const label: React.CSSProperties = { fontSize: 13, color: tokens.color.muted, display: "block", marginBottom: 4 };

  const statCard = (icon: string, labelText: string, value: string) => (
    <div style={{ flex: "1 1 200px", background: tokens.color.bg, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.lg, padding: tokens.space.md }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18, width: 34, height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", background: tokens.color.light, borderRadius: tokens.radius.md }}>{icon}</span>
        <span style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.caps, letterSpacing: "0.05em", textTransform: "uppercase", color: tokens.color.muted }}>{labelText}</span>
      </div>
      <div style={{ fontFamily: tokens.font.heading, fontSize: tokens.font.display, fontWeight: 800, color: tokens.color.primaryDark, lineHeight: 1.1, marginTop: 6 }}>{value}</div>
    </div>
  );

  const categories = Array.from(new Set(offers.map((o) => o.category))).sort();
  const partners = new Set(offers.filter((o) => o.status === "live").map((o) => o.partnerId));
  const q = query.trim().toLowerCase();
  const rows = offers.filter((o) => {
    if (catFilter && o.category !== catFilter) return false;
    if (!q) return true;
    return [o.title, o.partnerId, o.category, o.subtitle ?? ""].some((f) => f.toLowerCase().includes(q));
  });
  const actionBtn = (text: string, onClick: () => void, color: string) => (
    <button onClick={onClick} style={{ cursor: "pointer", background: "none", border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.sm, color, fontSize: 13, padding: "4px 10px", fontWeight: 600 }}>{text}</button>
  );

  return (
    <main style={pageContainer}>
      <AdminNav />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ color: tokens.color.primaryDark, fontSize: tokens.font.h1, margin: 0 }}>Manage Offers</h1>
          <p style={{ color: tokens.color.muted, marginTop: 4 }}>Review and manage partner promotional inventory.</p>
        </div>
        <button onClick={openAdd} style={{ background: tokens.color.accent, color: tokens.color.primaryDark, border: "none", padding: "10px 18px", borderRadius: tokens.radius.lg, fontFamily: tokens.font.heading, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+ Add New Offer</button>
      </div>
      {error && <p style={{ color: tokens.color.danger }}>{error}</p>}

      {/* Stat cards */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: `${tokens.space.lg}px 0` }}>
        {statCard("🏷️", "Total Offers", String(offers.length))}
        {statCard("🤝", "Active Partners", String(partners.size))}
        {statCard("📈", "Avg CTR", avgCtr === null ? "—" : `${(avgCtr * 100).toFixed(1)}%`)}
      </div>

      {/* Add / edit form (revealed on demand) */}
      {showForm && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, padding: tokens.space.md, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.lg, background: tokens.color.surface, marginBottom: tokens.space.lg }}>
          <div style={{ gridColumn: "1 / -1", fontFamily: tokens.font.heading, fontWeight: 700, color: tokens.color.primaryDark }}>{form.id ? `Edit offer: ${form.id}` : "New offer"}</div>
          <div><label style={label}>Title</label><input style={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label style={label}>Partner ID</label><input style={input} value={form.partnerId} onChange={(e) => setForm({ ...form, partnerId: e.target.value })} /></div>
          <div><label style={label}>CTA label</label><input style={input} value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} /></div>
          <div><label style={label}>Destination URL</label><input style={input} value={form.destinationUrl} onChange={(e) => setForm({ ...form, destinationUrl: e.target.value })} /></div>
          <div style={{ gridColumn: "1 / -1" }}><label style={label}>Body</label><input style={input} value={form.body ?? ""} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
          <div><label style={label}>Category</label><input style={input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          <div><label style={label}>Priority</label><input style={input} type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} /></div>
          <div><label style={label}>Status</label>
            <select style={input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Offer["status"] })}>
              <option value="draft">draft</option><option value="live">live (needs publish role)</option><option value="paused">paused</option>
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>Targeting rules (all must match)</label>
            {rules.map((r, i) => (
              <div key={i} style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6, alignItems: "center" }}>
                <select style={{ ...input, width: 130 }} value={r.dimension}
                  onChange={(e) => { const dim = e.target.value as TargetingRule["dimension"]; setRule(i, { dimension: dim, op: OPS_BY_DIMENSION[dim as keyof typeof OPS_BY_DIMENSION][0], value: isListOp(OPS_BY_DIMENSION[dim as keyof typeof OPS_BY_DIMENSION][0]) ? [] : "" }); }}>
                  {TARGETING_DIMENSIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select style={{ ...input, width: 130 }} value={r.op} onChange={(e) => setRule(i, { op: e.target.value as TargetingRule["op"] })}>
                  {(OPS_BY_DIMENSION[r.dimension as keyof typeof OPS_BY_DIMENSION] ?? ["is"]).map((op) => <option key={op} value={op}>{op}</option>)}
                </select>
                <input style={input} placeholder={isListOp(r.op) ? "comma,separated" : "value"}
                  value={Array.isArray(r.value) ? r.value.join(", ") : String(r.value ?? "")}
                  onChange={(e) => setRule(i, { value: parseValue(r.op, e.target.value) })} />
                <button onClick={() => setRules((rs) => rs.filter((_, idx) => idx !== i))} style={{ cursor: "pointer", color: tokens.color.danger }}>✕</button>
              </div>
            ))}
            <button onClick={() => setRules((rs) => [...rs, emptyTargetingRule()])} style={{ cursor: "pointer", fontSize: 13 }}>+ Add rule</button>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <button onClick={save} style={{ background: tokens.color.accent, color: tokens.color.primaryDark, border: "none", padding: "9px 18px", borderRadius: tokens.radius.lg, fontFamily: tokens.font.heading, fontWeight: 700, cursor: "pointer" }}>{form.id ? "Save changes" : "Add offer"}</button>
            <button onClick={() => { setForm(blank); setRules([emptyTargetingRule()]); setShowForm(false); }} style={{ background: tokens.color.bg, border: `1px solid ${tokens.color.border}`, padding: "9px 14px", borderRadius: tokens.radius.lg, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", padding: tokens.space.sm, background: tokens.color.bg, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.lg, marginBottom: tokens.space.md }}>
        <input style={{ ...input, flex: "2 1 220px", maxWidth: 360 }} placeholder="🔎  Search offers or partners…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select style={{ ...input, flex: "1 1 140px", maxWidth: 200 }} value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input style={{ ...input, flex: "1 1 160px", maxWidth: 220 }} placeholder="API key (blank = dev)" value={token} onChange={(e) => setToken(e.target.value)} />
        {me && <span style={{ fontSize: 12, color: tokens.color.muted }}>Role: {me.role}</span>}
      </div>

      {/* Offers table */}
      <div style={{ overflowX: "auto", border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.lg }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 720 }}>
          <thead><tr style={{ background: tokens.color.surface, color: tokens.color.muted, textAlign: "left", fontFamily: tokens.font.mono, fontSize: tokens.font.caps, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <th style={{ padding: "12px 16px" }}>Partner / Offer</th><th style={{ padding: "12px 16px" }}>Category</th><th style={{ padding: "12px 16px" }}>Targeting</th><th style={{ padding: "12px 16px" }}>Status</th><th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} style={{ padding: 16, color: tokens.color.muted }}>{offers.length ? "No offers match your filters." : "No offers yet — add one."}</td></tr>}
            {rows.map((o) => (
              <tr key={o.id} style={{ borderTop: `1px solid ${tokens.color.borderSoft}` }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18, width: 38, height: 38, display: "inline-flex", alignItems: "center", justifyContent: "center", background: tokens.color.light, borderRadius: tokens.radius.md }}>{emojiFor(o.category)}</span>
                    <div>
                      <div style={{ fontFamily: tokens.font.heading, fontWeight: 700, color: tokens.color.primaryDark }}>{o.title || "(untitled)"}</div>
                      <div style={{ fontFamily: tokens.font.mono, fontSize: 12, color: tokens.color.muted }}>{o.partnerId}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 16px" }}><span style={{ textTransform: "capitalize", background: tokens.color.light, color: tokens.color.primaryDark, borderRadius: tokens.radius.full, padding: "3px 12px", fontSize: 13, fontWeight: 600 }}>{o.category}</span></td>
                <td style={{ padding: "12px 16px", color: tokens.color.muted, fontSize: 12, maxWidth: 260 }}>{o.targeting.map(describeRule).join(" · ") || "—"}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: statusColor(o.status), fontWeight: 600, textTransform: "capitalize" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor(o.status) }} />{o.status}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                  <span style={{ display: "inline-flex", gap: 6, justifyContent: "flex-end" }}>
                    {actionBtn("Edit", () => edit(o), tokens.color.primary)}
                    {actionBtn("Delete", () => remove(o.id), tokens.color.danger)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ color: tokens.color.muted, fontSize: 13, marginTop: tokens.space.sm }}>Showing {rows.length} of {offers.length} offers</p>
    </main>
  );
}

export default function OffersPage() {
  return (
    <AdminGuard>
      <OffersInner />
    </AdminGuard>
  );
}
