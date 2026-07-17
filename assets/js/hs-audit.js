/* ═══════════════════════════════════════════════════════════════
   HS AUDIT — mahsulotlarning HS kodlarini RASMIY lug'at bilan solishtiradi.

   NEGA: tashqi savdo ma'lumoti (UN Comtrade, TradeAtlas, Apollo) aynan HS kod
   bo'yicha tortiladi. Kod noto'g'ri bo'lsa — ma'lumot ham noto'g'ri keladi yoki
   umuman kelmaydi. Shuning uchun har bir kod rasmiy ro'yxatda borligini va
   mahsulot nomiga mos kelishini tekshiramiz.

   MANBA: assets/data/hs-reference.json — UN Comtrade rasmiy HS klassifikatsiyasi
   (Combined HS: 98 bob, 1266 sarlavha, 6897 ta HS6 kod). Aynan Comtrade ishlatadigan
   ro'yxat — ya'ni kod unga mos bo'lsa, savdo ma'lumoti ham to'g'ri keladi.

   MUHIM: bu vosita HECH NARSANI o'zi o'zgartirmaydi. U faqat ko'rsatadi va
   taklif qiladi — qaror sizniki (superadmin tasdiqlaydi).
═══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var HS_REF = null;          // lazy — 863KB, faqat audit ishga tushganda yuklanadi
  var LAST_AUDIT = null;

  async function loadHsReference(){
    if(HS_REF) return HS_REF;
    var r = await fetch('assets/data/hs-reference.json');
    if(!r.ok) throw new Error('HS lug\'ati yuklanmadi (' + r.status + ')');
    HS_REF = await r.json();
    return HS_REF;
  }
  window.loadHsReference = loadHsReference;

  /* Nomdan ma'noli kalit so'zlarni ajratamiz. Rasmiy tavsiflarda tez-tez
     uchraydigan umumiy so'zlar hisobga olinmaydi. */
  var STOP = ('and or the of for a an in on to with other others nec from into not whether than all any kind used type made article articles product products ' +
              'crude roughly trimmed merely cut sawing otherwise blocks slabs rectangular including square shape form forms n e c heading no').split(' ');
  function keywords(s){
    var stop = STOP;
    return String(s||'').toLowerCase()
      .replace(/[^a-z0-9 ]+/g,' ')
      .split(/\s+/)
      .filter(function(w){ return w.length > 3 && stop.indexOf(w) === -1; });
  }

  /* Bitta mahsulotni tekshirish */
  function auditProduct(p, ref){
    var hs = String(p.hs_code||'').replace(/\D/g,'');
    var name = String(p.name_uz || p.name_en || '').trim();
    var res = { id:p.id, name:name, hs:hs, raw_id:p.raw_id, name_en:p.name_en||'', name_uz:p.name_uz||'' };

    if(!hs){ res.status='no_hs'; res.msg='HS kod yo\'q'; return res; }
    if(hs.length !== 6){ res.status='bad_len'; res.msg='HS 6 xonali emas (' + hs.length + ' xona)'; return res; }

    var official = ref.hs6[hs];
    if(!official){
      res.status='invalid';
      res.msg='Bu kod rasmiy HS ro\'yxatida YO\'Q — Comtrade bo\'yicha ma\'lumot kelmaydi';
      // HS4 darajada bormi? (yaqin taklif)
      var h4 = ref.hs4[hs.slice(0,4)];
      if(h4) res.hint = 'HS4 ' + hs.slice(0,4) + ' mavjud: ' + h4;
      return res;
    }
    res.official = official;
    res.chapter = ref.hs2[hs.slice(0,2)] || '';
    res.heading = ref.hs4[hs.slice(0,4)] || '';

    if(!name){ res.status='no_name'; res.msg='Mahsulot nomi yo\'q'; return res; }

    /* Nom rasmiy tavsifga mos keladimi?
       MUHIM: faqat AYNAN SHU HS6 kodning rasmiy tavsifi bilan solishtiramiz.
       HS4 sarlavhasini tekshiruvga QO'SHMAYMIZ — u juda keng va xatoni yashiradi.
       Masalan 2516 sarlavhasi = "Granite, porphyry, basalt, sandstone..." — unda
       "basalt" bor. Agar HS4 ni hisobga olsak, "Basalt" nomli mahsulot GRANIT
       uchun mo'ljallangan 251611 kodida turgani "to'g'ri" ko'rinib qolardi.
       Shuning uchun HS4 faqat KO'RSATMA (hint) sifatida ko'rsatiladi. */
    var kw = keywords(name);
    if(!kw.length){ res.status='ok'; res.msg='Nom umumiy — tekshirib bo\'lmadi'; return res; }
    var haystack = String(official).toLowerCase();
    var matched = kw.filter(function(w){ return haystack.indexOf(w) !== -1; });
    res.kw = kw; res.matched = matched;

    if(matched.indexOf(kw[0]) === -1){
      res.status = 'mismatch';
      res.msg = '"' + kw[0] + '" bu HS6 kodning rasmiy tavsifida YO\'Q';
      /* HS4 sarlavhasida bor bo'lsa — demak to'g'ri kod shu sarlavha ichida,
         lekin boshqa HS6 farzandida. Reviewer uchun kuchli ko'rsatma. */
      if(res.heading && res.heading.toLowerCase().indexOf(kw[0]) !== -1){
        res.hint = 'Lekin "' + kw[0] + '" HS4 ' + hs.slice(0,4) + ' sarlavhasida bor — to\'g\'ri kod shu sarlavhaning boshqa farzandida bo\'lishi ehtimoli katta.';
      }
      return res;
    }
    res.status = 'ok';
    return res;
  }

  /* Butun katalogni tekshirish */
  async function runHsAudit(){
    var ref = await loadHsReference();
    var list = (typeof DB !== 'undefined' && Array.isArray(DB.products)) ? DB.products : [];
    var rows = list.map(function(p){ return auditProduct(p, ref); });

    // Dublikat HS kodlar
    var byHs = Object.create(null);
    rows.forEach(function(r){ if(r.hs) (byHs[r.hs] = byHs[r.hs] || []).push(r); });
    Object.keys(byHs).forEach(function(h){
      if(byHs[h].length > 1) byHs[h].forEach(function(r){ r.dupCount = byHs[h].length; });
    });

    var sum = { total:rows.length, ok:0, mismatch:0, invalid:0, no_hs:0, bad_len:0, no_name:0, dup:0 };
    rows.forEach(function(r){
      if(sum[r.status] !== undefined) sum[r.status]++;
      if(r.dupCount) sum.dup++;
    });
    sum.noyob_hs = Object.keys(byHs).length;
    LAST_AUDIT = { rows:rows, sum:sum, byHs:byHs };
    return LAST_AUDIT;
  }
  window.runHsAudit = runHsAudit;
  window.getLastHsAudit = function(){ return LAST_AUDIT; };

  /* Rasmiy ro'yxatdan kod qidirish — to'g'ri kodni TOPISH uchun.
     Masalan "basalt" -> 2516 sarlavhasi ("Granite, porphyry, basalt...") va uning
     HS6 farzandlari chiqadi. */
  function searchHs(q, limit){
    if(!HS_REF) return [];
    q = String(q||'').toLowerCase().trim();
    if(q.length < 2) return [];
    var digits = q.replace(/\D/g,'');
    var out = [];
    var h6 = HS_REF.hs6;
    for(var code in h6){
      var txt = h6[code];
      var hit = (digits && digits.length>=2 && code.indexOf(digits)===0) || txt.toLowerCase().indexOf(q) !== -1;
      if(!hit){
        // HS4 sarlavhasida ham qidiramiz (masalan "basalt" 2516 da)
        var h4 = HS_REF.hs4[code.slice(0,4)];
        if(h4 && h4.toLowerCase().indexOf(q) !== -1) hit = true;
      }
      if(hit){
        out.push({ code:code, text:txt, heading:HS_REF.hs4[code.slice(0,4)]||'' });
        if(out.length >= (limit||40)) break;
      }
    }
    return out;
  }
  window.searchHs = searchHs;

  /* Bitta mahsulotning HS kodini to'g'rilash (superadmin) */
  window.fixProductHs = async function(productId, newHs){
    if(typeof canEditGlobal === 'function' && !canEditGlobal()){
      if(typeof toast==='function') toast('⛔ Faqat superadmin','error'); return false;
    }
    var hs = String(newHs||'').replace(/\D/g,'');
    if(hs.length !== 6){ if(typeof toast==='function') toast('❌ HS 6 xonali bo\'lishi kerak','error'); return false; }
    var ref = await loadHsReference();
    if(!ref.hs6[hs]){ if(typeof toast==='function') toast('❌ Bu kod rasmiy ro\'yxatda yo\'q','error'); return false; }
    var p = (DB.products||[]).find(function(x){ return String(x.id)===String(productId); });
    if(!p) return false;
    var old = p.hs_code;
    p.hs_code = hs;
    p.hs_official = ref.hs6[hs];
    p.hs_verified = true;
    p.hs_verified_at = new Date().toISOString();
    if(typeof fbSave === 'function') await fbSave('products', p);
    if(typeof toast==='function') toast('✅ HS: ' + old + ' → ' + hs);
    return true;
  };

  /* Rasmiy tavsifni mahsulot nomi sifatida qo'llash (superadmin) */
  window.applyOfficialHsName = async function(productId){
    if(typeof canEditGlobal === 'function' && !canEditGlobal()){
      if(typeof toast==='function') toast('⛔ Faqat superadmin','error'); return false;
    }
    var ref = await loadHsReference();
    var p = (DB.products||[]).find(function(x){ return String(x.id)===String(productId); });
    if(!p) return false;
    var hs = String(p.hs_code||'').replace(/\D/g,'');
    var official = ref.hs6[hs];
    if(!official){ if(typeof toast==='function') toast('❌ Rasmiy tavsif topilmadi','error'); return false; }
    p.name_en = official;
    p.hs_official = official;
    p.hs_verified = true;
    p.hs_verified_at = new Date().toISOString();
    if(typeof fbSave === 'function') await fbSave('products', p);
    if(typeof toast==='function') toast('✅ Rasmiy nom qo\'llandi');
    return true;
  };

})();
