/* ═══ AI PROXY (OpenAI / Gemini) ═══
   Maqsad: AI kalitlari BRAUZERGA TUSHMASIN — ular Vercel env'da (server) turadi.
   Vercel'da deploy qilinganda /api/openai va /api/gemini mavjud bo'ladi.
   GitHub Pages'da serverless funksiya yo'q → mijoz avtomatik eski usulga
   (Sozlamalardagi kalit bilan to'g'ridan-to'g'ri chaqiruv) qaytadi.
   Ya'ni ikkala hostingda ham ishlaydi, ko'chish xavfsiz. */
var AI_PROXY_BASE = '/api';

/* Firebase ID token — AI proxy uni tekshiradi (aks holda proxy ochiq bo'lib,
   istalgan odam bizning kreditimizni sarflagan bo'lardi). */
async function getFirebaseIdToken(){
  try {
    if(window._fbAuth && window._fbAuth.currentUser){
      return await window._fbAuth.currentUser.getIdToken();
    }
  } catch(e){}
  return '';
}

/* ═══ API PROXY ENDPOINTS ═══ */
var COMTRADE_PROXY = 'https://navoiy-api-proxy.vercel.app/api/comtrade';
var TRADEATLAS_PROXY = 'https://navoiy-api-proxy.vercel.app/api/tradeatlas';
var TG_API_BASE = 'https://navoiy-api-proxy.vercel.app/api';
var WORLDBANK_PROXY = TG_API_BASE + '/worldbank';

/* Country code mapping for Comtrade */
var COUNTRY_COMTRADE = {UZ:'860',TM:'795',TJ:'762',KG:'417',KZ:'398',MN:'496',RU:'643',AZ:'031',GE:'268',AM:'051',IR:'364',AF:'004',PK:'586'};
