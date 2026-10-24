export type ModelProvider =
  | { provider: 'gemini'; model: string; apiKey: string }
  | { provider: 'runpod'; model: string; apiKey: string; endpointId: string };

export class ModelProviderError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ModelProviderError';
  }
}

type Env = (name: string) => string | undefined;

export function resolveModelProvider(env: Env): ModelProvider {
  const provider = (env('AI_PROVIDER') || 'gemini').trim().toLowerCase();
  if (provider === 'runpod') {
    const apiKey = env('RUNPOD_API_KEY')?.trim();
    const endpointId = env('RUNPOD_ENDPOINT_ID')?.trim();
    const model = env('RUNPOD_MODEL')?.trim();
    if (!apiKey || !endpointId || !model || !/^[a-zA-Z0-9_-]{3,128}$/.test(endpointId) || /\\s/.test(model) || model.length > 200) {
      throw new Error('RunPod is selected but not configured. Add RUNPOD_API_KEY, RUNPOD_ENDPOINT_ID and RUNPOD_MODEL as Supabase Edge Function secrets.');
    }
    return { provider: 'runpod', apiKey, endpointId, model };
  }
  if (provider === 'gemini') {
    const apiKey = env('GEMINI_API_KEY')?.trim();
    const model = env('GEMINI_MODEL')?.trim();
    if (!apiKey || !model || !/^gemini-[a-z0-9.-]+$/.test(model)) {
      throw new Error('Gemini is selected but not configured. Set GEMINI_API_KEY and GEMINI_MODEL in Supabase Edge Function secrets.');
    }
    return { provider: 'gemini', apiKey, model };
  }
  throw new Error('AI_PROVIDER must be either "runpod" or "gemini".');
}

export function modelLabel(provider: ModelProvider): string {
  return provider.provider + '/' + provider.model;
}

export function generationSettings(model: string, schema: unknown) {
  const thinking = /^gemini-[34](?:[.-]|$)/.test(model)
    ? { thinkingLevel: model.includes('flash-lite') ? 'minimal' : 'low' }
    : /^gemini-2\\.5-flash/.test(model) ? { thinkingBudget: 0 } : undefined;
  return {
    temperature: /^gemini-[34](?:[.-]|$)/.test(model) ? 1 : 0.2,
    maxOutputTokens: 4096,
    responseMimeType: 'application/json',
    responseSchema: schema,
    ...(thinking ? { thinkingConfig: thinking } : {}),
  };
}

export function geminiFailure(status: number, model: string, value: unknown): string {
  const error = (value as any)?.error;
  const code = typeof error?.status === 'string' && /^[A-Z_]{1,50}$/.test(error.status) ? error.status : 'REJECTED';
  const message = String(error?.message || '').toLowerCase();
  const prefix = `Gemini ${model} returned HTTP ${status} (${code}). `;
  if (status === 404) return prefix + 'This model is not available for this API key/project or API version. Check the exact GEMINI_MODEL value and project model access.';
  if (/api.?key|api_key/.test(message)) return prefix + 'Google rejected the API key. Check GEMINI_API_KEY and its project restrictions.';
  if (/thinking|budget/.test(message)) return prefix + 'Google rejected the thinking settings. Deploy the latest function code for this model family.';
  if (/schema|responsemime|structured|generationconfig/.test(message)) return prefix + 'Google rejected the structured-output request settings.';
  if (/billing|free tier|country|region|location/.test(message)) return prefix + 'Google reports a project billing, free-tier eligibility or region restriction. Check the same project in AI Studio.';
  return prefix + 'Google rejected the request arguments. Check model access and deploy the latest function code.';
}

function toJsonSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toJsonSchema);
  if (!value || typeof value !== 'object') return value;
  const object = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(object)) {
    if (key === 'type' && typeof child === 'string') {
      const types: Record<string, string> = { OBJECT: 'object', ARRAY: 'array', STRING: 'string', NUMBER: 'number', INTEGER: 'integer', BOOLEAN: 'boolean' };
      result.type = types[child] ?? child.toLowerCase();
    } else {
      result[key] = toJsonSchema(child);
    }
  }
  return result;
}

export function runpodChatRequest(model: string, system: string, data: unknown, schema: unknown, maxTokens: number) {
  const jsonSchema = toJsonSchema(schema);
  return {
    model,
    messages: [
      { role: 'system', content: system + '\\nReturn only JSON that matches the supplied output schema.' },
      { role: 'user', content: JSON.stringify(data) },
    ],
    temperature: 0.2,
    max_tokens: maxTokens,
    n: 1,
    stream: false,
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'faraway_ai_response', schema: jsonSchema },
    },
  };
}

export async function generateStructuredJson(
  fetcher: typeof fetch,
  provider: ModelProvider,
  input: { system: string; data: unknown; schema: unknown; maxTokens: number },
): Promise<any> {
  const timeout = AbortSignal.timeout(130000);
  let response: Response;
  try {
    if (provider.provider === 'runpod') {
      response = await fetcher(`https://api.runpod.ai/v2/${provider.endpointId}/openai/v1/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${provider.apiKey}` },
        body: JSON.stringify(runpodChatRequest(provider.model, input.system, input.data, input.schema, input.maxTokens)),
        signal: timeout,
      });
    } else {
      response = await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': provider.apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: input.system }] },
          contents: [{ role: 'user', parts: [{ text: JSON.stringify(input.data) }] }],
          generationConfig: { ...generationSettings(provider.model, input.schema), maxOutputTokens: input.maxTokens },
        }),
        signal: timeout,
      });
    }
  } catch (error) {
    if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) {
      throw new ModelProviderError(504, 'The AI request timed out. No automatic retry was made, to avoid duplicate GPU work.');
    }
    throw new ModelProviderError(502, 'The AI provider is unavailable. No automatic retry was made.');
  }

  if (!response.ok) {
    if (provider.provider === 'gemini') {
      const value = await response.json().catch(() => ({}));
      if (response.status === 429) throw new ModelProviderError(429, 'Gemini free-tier quota is exhausted. Try later; no demo response was substituted.');
      if (response.status === 400 || response.status === 404) throw new ModelProviderError(503, geminiFailure(response.status, provider.model, value));
      if (response.status === 401 || response.status === 403) throw new ModelProviderError(503, 'Gemini rejected the server API key. Check its project and API restrictions.');
      throw new ModelProviderError(502, 'Gemini is unavailable. Please try later.');
    }
    if (response.status === 401 || response.status === 403) throw new ModelProviderError(503, 'RunPod rejected the server API key. Check RUNPOD_API_KEY and endpoint access.');
    if (response.status === 400 || response.status === 404) throw new ModelProviderError(503, 'RunPod rejected the model or structured-output request. Check RUNPOD_MODEL matches the deployed vLLM model.');
    if (response.status === 429 || response.status === 503) throw new ModelProviderError(503, 'RunPod has no worker available yet or the endpoint is busy. Wait for its worker to become ready and retry once.');
    throw new ModelProviderError(502, 'RunPod is unavailable. No automatic retry was made.');
  }

  const output = await response.json().catch(() => null);
  if (provider.provider === 'gemini') {
    const candidate = output?.candidates?.[0];
    if (candidate?.finishReason !== 'STOP') throw new ModelProviderError(502, 'Gemini did not finish a usable response.');
    const text = candidate.content?.parts?.filter((part: any) => !part.thought).map((part: any) => part.text || '').join('');
    if (!text || text.length > 24000) throw new ModelProviderError(502, 'Gemini returned an empty or oversized response.');
    try { return JSON.parse(text); } catch { throw new ModelProviderError(502, 'Gemini returned invalid structured output.'); }
  }

  const choice = output?.choices?.[0];
  const content = choice?.message?.content;
  if (choice?.finish_reason !== 'stop') throw new ModelProviderError(502, 'RunPod did not finish a usable response. No automatic retry was made.');
  if (typeof content !== 'string' || !content || content.length > 24000) throw new ModelProviderError(502, 'RunPod returned an empty or oversized response.');
  try { return JSON.parse(content); } catch { throw new ModelProviderError(502, 'RunPod returned invalid structured output. No automatic retry was made.'); }
}
