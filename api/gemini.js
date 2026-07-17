/* ═══════════════════════════════════════════════════════════════
   /api/gemini — Google Gemini proxy (Vercel serverless).

   MAQSAD: Gemini kaliti brauzerga tushmasin (OpenAI proxy bilan bir xil sabab).

   ENV (Vercel → Settings → Environment Variables):
     GEMINI_API_KEY        — AIzaSy...          (majburiy)
     GEMINI_API_KEY_2      — zaxira kalit       (ixtiyoriy — kvota tugasa avtomatik o'tadi)
     FIREBASE_WEB_API_KEY  — token tekshirish uchun (majburiy)

   Mijoz yuboradi:  { model, payload }
     model   — masalan 'gemini-2.0-flash'  (default)
     payload — Gemini generateContent body (contents, generationConfig ...)
═══════════════════════════════════════════════════════════════ */
import { requireUser, applyCors } from './_verify.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';
const DEFAULT_MODEL = 'gemini-2.0-flash';

async function callGemini(model, payload, key) {
  const url = BASE + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(key);
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 120000);
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal
    });
    clearTimeout(timeout);
    return { status: r.status, text: await r.text() };
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST kutilgan' }); return; }

  const user = await requireUser(req, res);
  if (!user) return;

  const key1 = process.env.GEMINI_API_KEY;
  const key2 = process.env.GEMINI_API_KEY_2;
  if (!key1) { res.status(500).json({ error: 'Serverda GEMINI_API_KEY sozlanmagan' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_e) { body = null; } }
  if (!body || !body.payload) { res.status(400).json({ error: 'body.payload kerak' }); return; }

  const model = body.model || DEFAULT_MODEL;
  try {
    let out = await callGemini(model, body.payload, key1);
    /* Asosiy kalit kvotasi tugasa (429) — zaxira kalitga o'tamiz */
    if (out.status === 429 && key2) {
      out = await callGemini(model, body.payload, key2);
    }
    res.status(out.status);
    res.setHeader('Content-Type', 'application/json');
    res.send(out.text);
  } catch (e) {
    const aborted = e && e.name === 'AbortError';
    res.status(aborted ? 504 : 502).json({
      error: aborted ? 'Gemini so\'rovi vaqtdan oshdi' : ('Gemini proxy xatosi: ' + (e && e.message))
    });
  }
}
