/* ═══════════════════════════════════════════════════════════════
   /api/openai — OpenAI proxy (Vercel serverless).

   MAQSAD: OpenAI kaliti BRAUZERGA UMUMAN TUSHMASIN. Avval har bir jamoa a'zosi
   kalitni Firestore'dan o'qib olardi va u localStorage'da yotardi (audit: High).
   Endi kalit faqat serverda (Vercel env) turadi.

   Xavfsizlik: har so'rovda Firebase ID token tekshiriladi — aks holda bu ochiq
   URL bo'lib, istalgan odam sizning kreditingizni sarflagan bo'lardi.

   ENV (Vercel → Settings → Environment Variables):
     OPENAI_API_KEY        — sk-...            (majburiy)
     FIREBASE_WEB_API_KEY  — Firebase web key  (majburiy, token tekshirish uchun)
     ALLOWED_ORIGINS       — ixtiyoriy, vergul bilan (masalan https://x.vercel.app)

   Mijoz body'ni o'zgarishsiz yuboradi (model, messages, temperature ...) —
   biz faqat kalitni qo'shib OpenAI'ga uzatamiz.
═══════════════════════════════════════════════════════════════ */
import { requireUser, applyCors } from './_verify.js';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST kutilgan' }); return; }

  const user = await requireUser(req, res);
  if (!user) return; // 401 allaqachon yuborilgan

  const key = process.env.OPENAI_API_KEY;
  if (!key) { res.status(500).json({ error: 'Serverda OPENAI_API_KEY sozlanmagan' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_e) { body = null; } }
  if (!body || !Array.isArray(body.messages)) {
    res.status(400).json({ error: 'body.messages massiv bo\'lishi kerak' });
    return;
  }

  /* Streaming hozircha qo'llab-quvvatlanmaydi — mijoz stream:false bilan yuboradi */
  if (body.stream) delete body.stream;

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 120000);
  try {
    const r = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
    clearTimeout(timeout);
    const text = await r.text();
    res.status(r.status);
    res.setHeader('Content-Type', 'application/json');
    res.send(text); // OpenAI javobini o'zgarishsiz uzatamiz
  } catch (e) {
    clearTimeout(timeout);
    const aborted = e && e.name === 'AbortError';
    res.status(aborted ? 504 : 502).json({
      error: aborted ? 'OpenAI so\'rovi vaqtdan oshdi' : ('OpenAI proxy xatosi: ' + (e && e.message))
    });
  }
}
