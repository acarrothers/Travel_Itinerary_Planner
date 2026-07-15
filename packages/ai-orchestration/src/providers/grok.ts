import type { ProviderAdapter, ModelRequest, ModelResponse } from "../types";

// Real adapter: xAI Grok exposes an OpenAI-compatible API at api.x.ai/v1.
export class GrokProvider implements ProviderAdapter {
  name = "grok";
  models: string[];
  constructor(private apiKey: string, private modelMap: Record<string, string>) {
    this.models = Object.keys(modelMap);
  }
  async complete(req: ModelRequest, model: string): Promise<ModelResponse> {
    const started = Date.now();
    const modelId = this.modelMap[model] ?? model;
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${this.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ model: modelId, messages: [{ role: "user", content: req.prompt }] }),
    });
    if (!res.ok) throw new Error(`Grok ${res.status}`);
    const data: any = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    return {
      text, provider: this.name, model: modelId, latencyMs: Date.now() - started,
      usage: { inputTokens: data?.usage?.prompt_tokens ?? 0, outputTokens: data?.usage?.completion_tokens ?? 0 },
    };
  }
}
