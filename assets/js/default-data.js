/* ═══════════════════════════════════════
   DEFAULT DATA (Firebase bo'sh bo\'lsa ishlatiladi)
═══════════════════════════════════════ */
function getDefaultDB(){
  return {
    investors: [
      {id:1,shahar:"Navoiy shahri",sana:"2026-01-15",davlat:"Germaniya",flag:"🇩🇪",maqsad:"Individual",kompaniya:"K+S Minerals GmbH",loyiha:"Kaliy va magniy kon loyihasi",qiymat:"$120M",makom:"Kelishilgan",hudud:"Navoiy tumani",izoh:"LOI imzolash rejalashtirilgan"},
      {id:2,shahar:"Zarafshon shahri",sana:"2026-02-03",davlat:"Xitoy",flag:"🇨🇳",maqsad:"Forum doirasida",kompaniya:"LONGi Green Energy",loyiha:"Quyosh panellari zavodi",qiymat:"$85M",makom:"Ko'rib chiqilmoqda",hudud:"Navoiy SEZ",izoh:"TEA tayyorlanmoqda"},
      {id:3,shahar:"Navoiy shahri",sana:"2026-01-10",davlat:"Janubiy Koreya",flag:"🇰🇷",maqsad:"Individual",kompaniya:"Hyundai C&E",loyiha:"Smart City infratuzilmasi",qiymat:"$200M",makom:"Kelishilgan",hudud:"Navoiy shahri",izoh:"Loyiha hujjatlari tayyorlanmoqda"},
      {id:4,shahar:"Navoiy shahri",sana:"2026-02-20",davlat:"BAA",flag:"🇦🇪",maqsad:"Forum doirasida",kompaniya:"Dubai DMCC",loyiha:"Oltin eksporti savdo markazi",qiymat:"$50M",makom:"Yangi",hudud:"Navoiy SEZ",izoh:"Due diligence bosqichi"},
      {id:5,shahar:"Uchquduq tumani",sana:"2026-01-05",davlat:"Rossiya",flag:"🇷🇺",maqsad:"Individual",kompaniya:"ROSATOM",loyiha:"Uran konini qo'shma ishlab chiqarish",qiymat:"$350M",makom:"Kelishilgan",hudud:"Uchquduq tumani",izoh:"Shartnoma imzolash jarayonida"},
      {id:6,shahar:"Karmana tumani",sana:"2026-02-14",davlat:"Turkiya",flag:"🇹🇷",maqsad:"Forum doirasida",kompaniya:"Anadolu Group Agro",loyiha:"Zamonaviy issiqxona majmuasi",qiymat:"$40M",makom:"Ko'rib chiqilmoqda",hudud:"Karmana tumani",izoh:"Yer uchastkalari ko'rib chiqilmoqda"},
    ],
    local: [],
    zoom: [
      {id:1,ism:"Wang Lei",org:"LONGi Solar HQ",davlat:"Xitoy",sana:"2026-02-05",ishtirokchi:6,desc:"Quyosh panellari zavodi qurish imkoniyatlari muhokama qilindi.",natija:"LOI imzolash va TEA tayyorlash kelishildi",natijaHolat:"Ijobiy",media:[]},
      {id:2,ism:"Kim Jae-won",org:"Korea Trade Agency",davlat:"Janubiy Koreya",sana:"2026-01-28",ishtirokchi:4,desc:"KOTRA agentligi orqali Smart City qurish hamkorlik imkoniyatlari.",natija:"Keyingi bosqich uchun feasibility study",natijaHolat:"Ijobiy",media:[]},
      {id:3,ism:"Ahmed Al-Rashid",org:"Dubai Investment Authority",davlat:"BAA",sana:"2026-02-18",ishtirokchi:3,desc:"Navoiy SEZ da halol sertifikatlangan eksport hub yaratish imkoniyatlari.",natija:"Qo'shimcha hujjatlar talab qilindi",natijaHolat:"Davom etmoqda",media:[]},
    ],
    forums: [
      {id:1,nom:"Tashkent International Investment Forum 2026",sana:"2026-03-15",shahar:"Toshkent",davlat:"O'zbekiston",turi:"Xalqaro forum",holat:"✅ Ishtirok tasdiqlangan",desc:"O'zbekiston investitsiya salohiyatini namoyish etish va xorijiy sarmoyadorlar bilan muzokaralar.",izoh:"5 nafar delegatsiya"},
      {id:2,nom:"Mining World Central Asia",sana:"2026-04-10",shahar:"Almati",davlat:"Qozog'iston",turi:"Ko'rgazma / Yarmarka",holat:"⏳ Delegatsiya tuzilmoqda",desc:"Markaziy Osiyodagi tog'-kon sanoati bo'yicha yirik xalqaro ko'rgazma.",izoh:"NMMC bilan birgalikda"},
      {id:3,nom:"Dubai Expo Industry Summit",sana:"2026-05-20",shahar:"Dubai",davlat:"BAA",turi:"Xalqaro forum",holat:"🔧 Tayyorgarlik bosqichida",desc:"Sanoat va innovatsiya sohasida xalqaro hamkorlikni rivojlantirish.",izoh:""},
    ],
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
  investors: [
    {id:1,shahar:"Navoiy shahri",sana:"2026-01-15",davlat:"Germaniya",flag:"🇩🇪",maqsad:"Individual",kompaniya:"K+S Minerals GmbH",loyiha:"Kaliy va magniy kon loyihasi",qiymat:"$120M",makom:"Kelishilgan",hudud:"Navoiy tumani",izoh:"LOI imzolash rejalashtirilgan"},
    {id:2,shahar:"Zarafshon shahri",sana:"2026-02-03",davlat:"Xitoy",flag:"🇨🇳",maqsad:"Forum doirasida",kompaniya:"LONGi Green Energy",loyiha:"Quyosh panellari zavodi",qiymat:"$85M",makom:"Ko'rib chiqilmoqda",hudud:"Navoiy SEZ",izoh:"TEA tayyorlanmoqda"},
    {id:3,shahar:"Navoiy shahri",sana:"2026-01-10",davlat:"Janubiy Koreya",flag:"🇰🇷",maqsad:"Individual",kompaniya:"Hyundai C&E",loyiha:"Smart City infratuzilmasi",qiymat:"$200M",makom:"Kelishilgan",hudud:"Navoiy shahri",izoh:"Loyiha hujjatlari tayyorlanmoqda"},
    {id:4,shahar:"Navoiy shahri",sana:"2026-02-20",davlat:"BAA",flag:"🇦🇪",maqsad:"Forum doirasida",kompaniya:"Dubai DMCC",loyiha:"Oltin eksporti savdo markazi",qiymat:"$50M",makom:"Yangi",hudud:"Navoiy SEZ",izoh:"Due diligence bosqichi"},
    {id:5,shahar:"Uchquduq tumani",sana:"2026-01-05",davlat:"Rossiya",flag:"🇷🇺",maqsad:"Individual",kompaniya:"ROSATOM",loyiha:"Uran konini qo'shma ishlab chiqarish",qiymat:"$350M",makom:"Kelishilgan",hudud:"Uchquduq tumani",izoh:"Shartnoma imzolash jarayonida"},
    {id:6,shahar:"Karmana tumani",sana:"2026-02-14",davlat:"Turkiya",flag:"🇹🇷",maqsad:"Forum doirasida",kompaniya:"Anadolu Group Agro",loyiha:"Zamonaviy issiqxona majmuasi",qiymat:"$40M",makom:"Ko'rib chiqilmoqda",hudud:"Karmana tumani",izoh:"Yer uchastkalari ko'rib chiqilmoqda"},
  ],
  local: [],
  zoom: [
    {id:1,ism:"Wang Lei",org:"LONGi Solar HQ",davlat:"Xitoy",sana:"2026-02-05",ishtirokchi:6,desc:"Quyosh panellari zavodi qurish imkoniyatlari, hukumat subsidiyalari va eksport yo'nalishlari muhokama qilindi.",natija:"LOI imzolash va TEA tayyorlash kelishildi",natijaHolat:"Ijobiy",media:[]},
    {id:2,ism:"Kim Jae-won",org:"Korea Trade Agency",davlat:"Janubiy Koreya",sana:"2026-01-28",ishtirokchi:4,desc:"KOTRA agentligi orqali Smart City qurish va IT infratuzilmasi uchun hamkorlik imkoniyatlari.",natija:"Keyingi bosqich uchun feasibility study",natijaHolat:"Ijobiy",media:[]},
    {id:3,ism:"Ahmed Al-Rashid",org:"Dubai Investment Authority",davlat:"BAA",sana:"2026-02-18",ishtirokchi:3,desc:"Navoiy SEZ da halol sertifikatlangan eksport hub yaratish imkoniyatlari.",natija:"Qo'shimcha hujjatlar talab qilindi",natijaHolat:"Davom etmoqda",media:[]},
  ],
  forums: [
    {id:1,nom:"Tashkent International Investment Forum 2026",sana:"2026-03-15",shahar:"Toshkent",davlat:"O'zbekiston",turi:"Xalqaro forum",holat:"✅ Ishtirok tasdiqlangan",desc:"O'zbekiston investitsiya salohiyatini namoyish etish va xorijiy sarmoyadorlar bilan muzokaralar.",izoh:"5 nafar delegatsiya"},
    {id:2,nom:"Mining World Central Asia",sana:"2026-04-10",shahar:"Almati",davlat:"Qozog'iston",turi:"Ko'rgazma / Yarmarka",holat:"⏳ Delegatsiya tuzilmoqda",desc:"Markaziy Osiyodagi tog'-kon sanoati bo'yicha yirik xalqaro ko'rgazma.",izoh:"NMMC bilan birgalikda"},
    {id:3,nom:"Dubai Expo Industry Summit",sana:"2026-05-20",shahar:"Dubai",davlat:"BAA",turi:"Xalqaro forum",holat:"🔧 Tayyorgarlik bosqichida",desc:"Sanoat va innovatsiya sohasida xalqaro hamkorlikni rivojlantirish.",izoh:""},
  ],
  investorCompanies: [
  ],
};
