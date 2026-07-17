/* ═══════════════════════════════════════════════════════════════
   Firebase ID token tekshiruvi (server tomonda).

   NEGA KERAK: /api/openai va /api/gemini internetda ochiq URL. Agar tekshiruv
   bo'lmasa, istalgan odam ularni chaqirib SIZNING OpenAI/Gemini kreditingizni
   sarflashi mumkin edi. Shuning uchun har so'rovda foydalanuvchi haqiqatan
   tizimga kirganini tekshiramiz.

   QANDAY: Firebase Identity Toolkit `accounts:lookup` endpointi tokenni
   imzosi va muddati bo'yicha tekshiradi. Bu faqat public web API key talab
   qiladi — hech qanday npm paket yoki service-account kerak emas.
═══════════════════════════════════════════════════════════════ */

const LOOKUP_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup';

/** Authorization: Bearer <firebase-id-token> sarlavhasidan tokenni oladi */
export function bearerToken(req) {
  const h = (req.headers && (req.headers.authorization || req.headers.Authorization)) || '';
  const m = /^Bearer\s+(.+)$/i.exec(String(h).trim());
  return m ? m[1] : '';
}

/**
 * Tokenni tekshiradi.
 * @returns {Promise<{uid:string,email:string,role:string}|null>} null = yaroqsiz
 */
export async function verifyFirebaseToken(idToken) {
  if (!idToken) return null;
  const key = process.env.FIREBASE_WEB_API_KEY;
  if (!key) {
    console.error('FIREBASE_WEB_API_KEY env o\'rnatilmagan — token tekshirib bo\'lmaydi');
    return null;
  }
  try {
    const r = await fetch(LOOKUP_URL + '?key=' + encodeURIComponent(key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });
    if (!r.ok) return null;
    const data = await r.json();
    const u = (data.users || [])[0];
    if (!u) return null;
    let role = '';
    try { role = JSON.parse(u.customAttributes || '{}').role || ''; } catch (_e) {}
    return { uid: u.localId, email: u.email || '', role };
  } catch (e) {
    console.error('Token verify error:', e && e.message);
    return null;
  }
}

/**
 * Handler'lar uchun qisqa yordamchi: tekshiradi, yaroqsiz bo'lsa 401 qaytaradi.
 * @returns {Promise<object|null>} user yoki null (javob allaqachon yuborilgan)
 */
export async function requireUser(req, res) {
  const user = await verifyFirebaseToken(bearerToken(req));
  if (!user) {
    res.status(401).json({ error: 'Unauthorized — tizimga kiring' });
    return null;
  }
  return user;
}

/** CORS — sayt boshqa domendan chaqirsa ham ishlashi uchun */
export function applyCors(req, res) {
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const origin = req.headers.origin || '';
  if (allowed.length === 0 || allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}
