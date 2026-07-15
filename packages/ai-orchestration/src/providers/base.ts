import type { ProviderAdapter, ModelRequest, ModelResponse } from "../types";

// Offline fallback. Always-available so local dev works with no API keys.
export class StubProvider implements ProviderAdapter {
  constructor(public name = "stub", public models: string[] = ["frontier", "mid", "small"]) {}
  async complete(req: ModelRequest, model: string): Promise<ModelResponse> {
    const started = Date.now();
    return { text: stubItineraryJson(), provider: this.name, model, latencyMs: Date.now() - started };
  }
}

// Returns minimal valid JSON so the parsing path is exercised even without a key.
function stubItineraryJson(): string {
  return JSON.stringify({ days: [{ items: [
    { type: "activity", title: "Old town walking tour", time: "09:30", categoryTags: ["culture"] },
    { type: "meal", title: "Lunch — local favorite", time: "13:00", categoryTags: ["food"] },
  ] }] });
}
