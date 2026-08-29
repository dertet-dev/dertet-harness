import { ApiStyle } from "../types";

async function fetchOpenAiStyle(baseUrl: string, apiKey: string): Promise<string[]> {
  if (!baseUrl) return [];
  const headers: Record<string, string> = {};
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/models`, { headers });
  if (!res.ok) return [];
  const json: any = await res.json();
  const list = json?.data;
  if (!Array.isArray(list)) return [];
  return list.map((m: any) => m.id).filter(Boolean).sort();
}

async function fetchAnthropic(baseUrl: string, apiKey: string): Promise<string[]> {
  if (!apiKey) return [];
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/models?limit=1000`, {
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" }
  });
  if (!res.ok) return [];
  const json: any = await res.json();
  const list = json?.data;
  if (!Array.isArray(list)) return [];
  return list.map((m: any) => m.id).filter(Boolean).sort();
}

async function fetchGemini(baseUrl: string, apiKey: string): Promise<string[]> {
  if (!apiKey) return [];
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/models?pageSize=1000`, {
    headers: { "x-goog-api-key": apiKey }
  });
  if (!res.ok) return [];
  const json: any = await res.json();
  const list = json?.models;
  if (!Array.isArray(list)) return [];
  return list
    .filter((m: any) => {
      const methods: string[] = m.supportedGenerationMethods ?? [];
      return methods.length === 0 || methods.includes("generateContent") || methods.includes("streamGenerateContent");
    })
    .map((m: any) => (typeof m.name === "string" ? m.name.replace(/^models\//, "") : null))
    .filter(Boolean)
    .sort();
}

export async function fetchAvailableModels(style: ApiStyle, baseUrl: string, apiKey: string): Promise<string[]> {
  try {
    switch (style) {
      case "openai":
        return await fetchOpenAiStyle(baseUrl, apiKey);
      case "anthropic":
        return await fetchAnthropic(baseUrl, apiKey);
      case "gemini":
        return await fetchGemini(baseUrl, apiKey);
    }
  } catch {
    return [];
  }
}
