import type { ProviderAdapter, ModelRequest, ModelResponse } from "../types";

// Real adapter: calls Google's Gemini (Generative Language) API over fetch.
export class GeminiProvider implements ProviderAdapter {
  name = "gemini";
  models: string[];
  constructor(private apiKey: string, private modelMap: Record<string, string>) {
    this.models = Object.keys(modelMap);
  }
  async complete(req: ModelRequest, model: string): Promise<ModelResponse> {
    const started = Date.now();
    const modelId = this.modelMap[model] ?? model;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: req.prompt }] }] }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const data: any = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const u = data?.usageMetadata ?? {};
    return {
      text, provider: this.name, model: modelId, latencyMs: Date.now() - started,
      usage: { inputTokens: u.promptTokenCount ?? 0, outputTokens: u.candidatesTokenCount ?? 0 },
    };
  }
}
