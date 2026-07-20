// Destination suggestion matching. Pure + testable; used for the offline/curated
// fallback when a live autocomplete provider isn't configured.
export function filterDestinations(list: string[], query: string, limit = 8): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts: string[] = [];
  const contains: string[] = [];
  for (const d of list) {
    const l = d.toLowerCase();
    if (l.startsWith(q)) starts.push(d);
    else if (l.includes(q)) contains.push(d);
  }
  return [...starts, ...contains].slice(0, limit);
}
