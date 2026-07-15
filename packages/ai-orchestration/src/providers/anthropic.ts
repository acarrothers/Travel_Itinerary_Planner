import type { ProviderAdapter, ModelRequest, ModelResponse } from "../types";

// Real adapter: calls the Anthropic Messages API over fetch (no SDK dependency).
// `modelMap` maps our tiers (frontier/mid/small) to concrete model IDs (config).
export class AnthropicProvider implements ProviderAdapter {
  name = "anthropic";
  models: string[];
  constructor(private apiKey: string, private modelMap: Record<string, string>) {
    this.models = Object.keys(modelMap);
  }
  async complete(req: ModelRequest, model: string): Promise<ModelResponse> {
    const started = Date.now();
    const modelId = this.modelMap[model] ?? model;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: req.maxTokens ?? 2048,
        messages: [{ role: "user", content: req.prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}`);
    const data: any = await res.json();
    const text = data?.content?.[0]?.text ?? "";
    return {
      text, provider: this.name, model: modelId, latencyMs: Date.now() - started,
      usage: { inputTokens: data?.usage?.input_tokens ?? 0, outputTokens: data?.usage?.output_tokens ?? 0 },
    };
  }
}
