"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@trip-itinerary/api-client";
import { tokens } from "@trip-itinerary/ui";
import { OPS_BY_DIMENSION, TARGETING_DIMENSIONS, isListOp, emptyTargetingRule, describeRule } from "@trip-itinerary/core";
import type { Offer, TargetingRule } from "@trip-itinerary/core";

declare const process: { env: Record<string, string | undefined> };
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const blank: Omit<Offer, "targeting"> = {
  id: "", partnerId: "viator", title: "", subtitle: "", body: "",
  ctaLabel: "See experiences", destinationUrl: "https://www.viator.com/",
  category: "tours", tags: [], priority: 50, surfaces: ["post_generation"], status: "draft",
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const client = useMemo(() => createClient(BASE, { authToken: token || undefined }), [token]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [form, setForm] = useState<Omit<Offer, "targeting">>(blank);
  const [rules, setRules] = useState<TargetingRule[]>([{ dimension: "interests", op: "contains_any", value: ["culture", "food"] }]);
  const [me, setMe] = useState<{ role: string; can: Record<string, boolean> } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      setOffers(await client.adminListOffers());
      setMe(await client.adminMe());
    } catch (e: any) {
      setError(e?.message?.includes("401") ? "Unauthorized — enter a valid API key." : "API not reachable. Run `pnpm --filter @trip-itinerary/api dev`.");
    }
  }
  useEffect(() => { load(); }, [token]);

  function setRule(i: number, patch: Partial<TargetingRule>) {
    setRules((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
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
    try {
      await client.adminSaveOffer(offer);
      setForm(blank); setRules([emptyTargetingRule()]); load();
    } catch (e: any) {
      setError(e?.message?.includes("403") ? "Forbidden — your role can't do that (publishing needs approver/admin)." : "Save failed.");
    }
  }
  function edit(o: Offer) { const { targeting, ...rest } = o; setForm(rest); setRules(targeting.length ? targeting : [emptyTargetingRule()]); }
  async function remove(id: string) { try { await client.adminDeleteOffer(id); load(); } catch { setError("Delete failed (role?)."); } }

  const input: React.CSSProperties = { padding: "8px 10px", border: "1px solid #D5DEEC", borderRadius: 6, fontSize: 14, width: "100%" };
  const label: React.CSSProperties = { fontSize: 13, color: tokens.color.mid, display: "block", marginBottom: 4 };

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: tokens.space.xl, fontFamily: tokens.font.family }}>
      <h1 style={{ color: tokens.color.navy, fontSize: tokens.font.h1, marginBottom: 4 }}>Offers CMS</h1>
      <p style={{ color: tokens.color.mid, marginTop: 0 }}>Manage the partner catalog and targeting — no code changes needed.</p>

      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: `${tokens.space.md}px 0` }}>
        <input style={{ ...input, maxWidth: 300 }} placeholder="API key (blank = dev mode)" value={token} onChange={(e) => setToken(e.target.value)} />
        <span style={{ fontSize: 13, color: tokens.color.mid }}>{me ? `Role: ${me.role}` : ""}</span>
      </div>
      {error && <p style={{ color: "#C0392B" }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: tokens.space.md, border: "1px solid #E2E8F2", borderRadius: tokens.radius.md }}>
        <div style={{ gridColumn: "1 / 3", fontWeight: 700, color: tokens.color.navy }}>{form.id ? `Edit: ${form.id}` : "New offer"}</div>
        <div><label style={label}>Title</label><input style={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div><label style={label}>Partner ID</label><input style={input} value={form.partnerId} onChange={(e) => setForm({ ...form, partnerId: e.target.value })} /></div>
        <div><label style={label}>CTA label</label><input style={input} value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} /></div>
        <div><label style={label}>Destination URL</label><input style={input} value={form.destinationUrl} onChange={(e) => setForm({ ...form, destinationUrl: e.target.value })} /></div>
        <div style={{ gridColumn: "1 / 3" }}><label style={label}>Body</label><input style={input} value={form.body ?? ""} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
        <div><label style={label}>Priority</label><input style={input} type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} /></div>
        <div><label style={label}>Status</label>
          <select style={input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Offer["status"] })}>
            <option value="draft">draft</option><option value="live">live (needs publish role)</option><option value="paused">paused</option>
          </select>
        </div>

        <div style={{ gridColumn: "1 / 3" }}>
          <label style={label}>Targeting rules (all must match)</label>
          {rules.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
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
              <button onClick={() => setRules((rs) => rs.filter((_, idx) => idx !== i))} style={{ cursor: "pointer", color: "#C0392B" }}>✕</button>
            </div>
          ))}
          <button onClick={() => setRules((rs) => [...rs, emptyTargetingRule()])} style={{ cursor: "pointer", fontSize: 13 }}>+ Add rule</button>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <button onClick={save} style={{ background: tokens.color.blue, color: "#fff", border: "none", padding: "9px 18px", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}>Save offer</button>
          {form.id && <button onClick={() => { setForm(blank); setRules([emptyTargetingRule()]); }} style={{ background: "#fff", border: "1px solid #D5DEEC", padding: "9px 14px", borderRadius: 6, cursor: "pointer" }}>Cancel</button>}
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: tokens.space.lg, fontSize: 14 }}>
        <thead><tr style={{ background: tokens.color.navy, color: "#fff", textAlign: "left" }}>
          <th style={{ padding: 8 }}>Title</th><th style={{ padding: 8 }}>Partner</th><th style={{ padding: 8 }}>Status</th><th style={{ padding: 8 }}>Targeting</th><th style={{ padding: 8 }}></th>
        </tr></thead>
        <tbody>
          {offers.map((o, i) => (
            <tr key={o.id} style={{ background: i % 2 ? "#F4F7FC" : "#fff" }}>
              <td style={{ padding: 8 }}>{o.title}</td>
              <td style={{ padding: 8 }}>{o.partnerId}</td>
              <td style={{ padding: 8, color: o.status === "live" ? tokens.color.blue : tokens.color.mid }}>{o.status}</td>
              <td style={{ padding: 8, color: tokens.color.mid, fontSize: 12 }}>{o.targeting.map(describeRule).join(" · ") || "—"}</td>
              <td style={{ padding: 8, textAlign: "right", whiteSpace: "nowrap" }}>
                <button onClick={() => edit(o)} style={{ marginRight: 6, cursor: "pointer" }}>Edit</button>
                <button onClick={() => remove(o.id)} style={{ color: "#C0392B", cursor: "pointer" }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
