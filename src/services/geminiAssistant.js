// Grounded assistant backend (Phase 5). Every call sends a fixed system
// instruction plus a compact JSON snapshot of exactly what's already
// computed and on screen -- the model is never allowed to introduce a
// work ID, name, amount, or statistic that isn't already in that context.
// No key ever ships in this repo (see .env, gitignored); it is read at
// build time into the client bundle via Vite's import.meta.env, same as
// any other Vite app -- there is no server component here to keep it off
// the client entirely.

const MODEL = 'gemini-2.5-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export const SYSTEM_INSTRUCTION = `You are the FUND·IQ advisory assistant for MPLADS fund monitoring.

Answer only from the JSON context provided with each question. If the answer is not contained in that context, reply exactly: "That information is not available in the current dataset."

Never invent work IDs, MP names, amounts, dates, agencies, vendors, or statistics that are not present in the context. Do not attribute any finding to a named methodology, statistical test, or analytical technique (e.g. Benford's Law, SHAP, a confidence score, a model name) unless that exact term appears verbatim in the context -- if a work's "anomalyType" field is given, quote it as-is rather than reinterpreting or renaming it. Never state that fraud, corruption, or any offence has occurred -- describe risk signals and recommend review using language like "risk signal", "requires review", or "potential irregularity". You are advisory only: you do not make determinations, allegations, or issue instructions to officials.

Keep responses concise (2-4 sentences), in plain language, in the language requested.`;

// Real failure states only -- never a canned fallback presented as a
// model answer (Phase 5.3).
export async function askGeminiAssistant({ apiKey, context, question, language = 'English' }) {
  if (!apiKey) {
    return { ok: false, reason: 'no_key' };
  }

  let res;
  try {
    res = await fetch(`${API_BASE}/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [
          {
            role: 'user',
            parts: [{
              text: `CONTEXT (JSON, the only source of truth you may use):\n${JSON.stringify(context)}\n\nQUESTION: ${question}\n\nRespond in ${language}.`,
            }],
          },
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
      }),
    });
  } catch {
    return { ok: false, reason: 'offline' };
  }

  if (!res.ok) {
    if (res.status === 429) return { ok: false, reason: 'rate_limited' };
    if (res.status === 400 || res.status === 403) return { ok: false, reason: 'invalid_key' };
    return { ok: false, reason: 'error', status: res.status };
  }

  let data;
  try {
    data = await res.json();
  } catch {
    return { ok: false, reason: 'error' };
  }

  const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
  if (!text) return { ok: false, reason: 'empty' };
  return { ok: true, text };
}
