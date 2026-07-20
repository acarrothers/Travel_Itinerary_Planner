import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { tokens } from "@trip-itinerary/ui";
import { api } from "../lib/api";
import type { TripPreferences, BudgetBand, PartyType } from "@trip-itinerary/core";

const INTERESTS = ["food", "culture", "adventure", "nature", "history", "nightlife"];
const BUDGETS: BudgetBand[] = ["budget", "mid", "luxury"];
const PARTIES: PartyType[] = ["solo", "couple", "family", "friends"];

function Chips<T extends string>({ options, value, onChange }: { options: T[]; value: T[]; onChange: (v: T[]) => void }) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <Pressable key={o} onPress={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            style={[styles.chip, on && styles.chipOn]}>
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function OnboardingForm({ onGenerate, loading }: { onGenerate: (p: TripPreferences) => void; loading: boolean }) {
  const [destination, setDestination] = useState("Lisbon");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const skipFetch = useRef(false); // don't re-query right after picking a suggestion

  useEffect(() => {
    if (skipFetch.current) { skipFetch.current = false; return; }
    const q = destination.trim();
    if (q.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try { setSuggestions(await api.suggestDestinations(q)); } catch { setSuggestions([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [destination]);

  function chooseDestination(v: string) { skipFetch.current = true; setDestination(v); setSuggestions([]); }
  const [nights, setNights] = useState("4");
  const [party, setParty] = useState<PartyType>("couple");
  const [budget, setBudget] = useState<BudgetBand>("mid");
  const [interests, setInterests] = useState<string[]>(["food", "culture"]);

  function submit() {
    onGenerate({
      destinations: [destination], nights: Number(nights) || 1, party, adults: 2, children: 0,
      budget, interests, pace: "balanced",
    });
  }

  return (
    <View style={{ gap: tokens.space.md }}>
      <View>
        <Text style={styles.lbl}>Destination</Text>
        <TextInput style={styles.input} value={destination} onChangeText={setDestination}
          autoCapitalize="words" autoCorrect={false} placeholder="Start typing a city…" />
        {suggestions.length > 0 ? (
          <View style={styles.suggestBox}>
            {suggestions.map((s) => (
              <Pressable key={s} onPress={() => chooseDestination(s)} style={styles.suggestItem}>
                <Text style={styles.suggestText}>{s}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
      <View style={{ flexDirection: "row", gap: tokens.space.md }}>
        <View style={{ width: 90 }}>
          <Text style={styles.lbl}>Nights</Text>
          <TextInput style={styles.input} value={nights} onChangeText={setNights} keyboardType="number-pad" />
        </View>
      </View>
      <Text style={styles.lbl}>Party</Text>
      <Chips options={PARTIES} value={[party]} onChange={(v) => setParty(v[v.length - 1] ?? party)} />
      <Text style={styles.lbl}>Budget</Text>
      <Chips options={BUDGETS} value={[budget]} onChange={(v) => setBudget(v[v.length - 1] ?? budget)} />
      <Text style={styles.lbl}>Interests</Text>
      <Chips options={INTERESTS} value={interests} onChange={setInterests} />
      <Pressable style={[styles.btn, loading && { opacity: 0.6 }]} disabled={loading} onPress={submit}>
        <Text style={styles.btnText}>{loading ? "Generating…" : "Generate itinerary"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  lbl: { fontSize: 13, color: tokens.color.mid, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: tokens.color.border, borderRadius: tokens.radius.sm, padding: 10, fontSize: 15 },
  suggestBox: { marginTop: 4, borderWidth: 1, borderColor: tokens.color.border, borderRadius: tokens.radius.sm, backgroundColor: tokens.color.bg, overflow: "hidden" },
  suggestItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: tokens.color.borderSoft },
  suggestText: { fontSize: 15, color: tokens.color.ink },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: tokens.color.border, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  chipOn: { borderColor: tokens.color.blue, backgroundColor: tokens.color.light },
  chipText: { color: tokens.color.mid, fontSize: 14 },
  chipTextOn: { color: tokens.color.navy },
  btn: { backgroundColor: tokens.color.accent, borderRadius: tokens.radius.md, padding: 14, alignItems: "center" },
  btnText: { color: tokens.color.ink, fontWeight: "700", fontSize: 15 },
});
