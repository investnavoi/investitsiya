/* ═══════════════════════════════════════
   DEFAULT DATA (Firebase bo'sh bo\'lsa ishlatiladi)
   ─────────────────────────────────────────
   MUHIM: investors / zoom / forums uchun DEMO/soxta yozuvlar OLIB TASHLANDI.
   Bu kolleksiyalar endi bo'sh boshlanadi — real ma'lumot faqat Firestore'dan
   yoki admin qo'lda kiritishidan keladi. Soxta yozuvlar Firestore'ga seeding
   qilinishi ham to'xtatildi (getDefaultDB ham bo'sh qaytaradi).
═══════════════════════════════════════ */
function getDefaultDB(){
  return {
    investors: [],
    local: [],
    zoom: [],
    forums: [],
    investorCompanies: [],
    entrepreneurs: [
      {id:'ent_seed_1',name:'CHEN JIANVEI',phone:'+998931174527',sector:'Granit qazib olish va qayta ishlash',district:"G'ozg'on shahri",projectValue:'11.0',telegram:'',matchedForum:'Mining World Central Asia (2026-04-10)',tgSent:false,addedDate:'2026-03-18'},
      {id:'ent_seed_2',name:'ZHENG XIAODONG',phone:'+998997500508',sector:'Granit toshlarni qazib olish va qayta ishlash ishlab chiqarishni tashkil etish',district:'Nurota tumani',projectValue:'50.0',telegram:'',matchedForum:'Mining World Central Asia (2026-04-10)',tgSent:false,addedDate:'2026-03-18'},
      {id:'ent_seed_3',name:'Sun Szya',phone:'+998973204055',sector:'Paxta yetishtirish va qayta ishlashni tashkil etish',district:'Navbahor tumani',projectValue:'20.0',telegram:'',matchedForum:'Mining World Central Asia (2026-04-10)',tgSent:false,addedDate:'2026-03-18'},
      {id:'ent_seed_4',name:'Tyanjin Huaxushengtai Technology Co., Ltd.',phone:'+998993848085',sector:'Kaolin qazib olish va qayta ishlash',district:'Uchquduq tumani',projectValue:'15.0',telegram:'',matchedForum:'Mining World Central Asia (2026-04-10)',tgSent:false,addedDate:'2026-03-18'},
      {id:'ent_seed_5',name:'Sinoma Energy Conservation Co., Ltd.',phone:'+998997500508',sector:'Kvartsni qazib olish va qayta ishlashni tashkil etish',district:'Uchquduq tumani',projectValue:'20.0',telegram:'',matchedForum:'Mining World Central Asia (2026-04-10)',tgSent:false,addedDate:'2026-03-18'}
    ],
  };
}

const DB = {
  investors: [],
  local: [],
  zoom: [],
  forums: [],
  investorCompanies: [],
  finderResults: [],
  investAiHistory: [],
};
