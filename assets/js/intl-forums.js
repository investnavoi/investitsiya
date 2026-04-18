/* ═══════════════════════════════════════
   XALQARO FORUMLAR 2026 - STATIC DATA
═══════════════════════════════════════ */
const INTL_REGIONS = [
  {key:"uz", flag:"\u{1F1FA}\u{1F1FF}", label:"O\u2018zbekiston"},
  {key:"eu", flag:"\u{1F1EA}\u{1F1FA}", label:"Yevropa"},
  {key:"us", flag:"\u{1F1FA}\u{1F1F8}", label:"Amerika"},
  {key:"ru", flag:"\u{1F1F7}\u{1F1FA}", label:"Rossiya"},
  {key:"cn", flag:"\u{1F1E8}\u{1F1F3}", label:"Xitoy"}
];

const INTL_FORUMS = {
  uz:[
    {nom:"CEVF 2026 — Central Eurasian Venture Forum",sana:"3 Aprel 2026",shahar:"Toshkent",turi:"Vencher / Startap",desc:"Markaziy Yevrosiyo vencher forumi. AI, fintech va deep tech. JW Marriott Hotel.",url:"https://ventureforum.asia",img:"https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#4361EE,#7209B7)",icon:"\u{1F680}"},
    {nom:"TIIF 2026 — 5-Toshkent Xalqaro Investitsiya Forumi",sana:"16\u201319 Iyun 2026",shahar:"Toshkent",turi:"Investitsiya",desc:"Markaziy Osiyoning eng yirik investitsiya platformasi. 97 mamlakatdan 8000+ ishtirokchi, $30.5 mlrd kelishuvlar.",url:"https://tiif.online",img:"https://images.unsplash.com/photo-1587825140708-dfaf18c91086?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#059669,#06D6A0)",icon:"\u{1F30D}"},
    {nom:"Investopia Global Talks Toshkent",sana:"Iyun 2026",shahar:"Toshkent",turi:"Investitsiya",desc:"BAA Investopia platformasi Markaziy Osiyoda birinchi marta. Qayta tiklanadigan energiya, raqamli texnologiyalar.",url:"https://tiif.online",img:"https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#d97706,#FFB703)",icon:"\u{1F91D}"},
    {nom:"OGU 2026 — Neft va Gaz",sana:"12\u201314 May 2026",shahar:"Toshkent",turi:"Energetika",desc:"Neft-gaz sanoatining eng yirik xalqaro ko\u2018rgazma va konferensiyasi. CAEx Uzbekistan.",url:"https://ogu-expo.com",img:"https://images.unsplash.com/photo-1513828583688-c52646db42da?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#1e3a5f,#2d6a9f)",icon:"\u{26FD}"},
    {nom:"INNOPROM. Central Asia 2026",sana:"Aprel 2026",shahar:"Toshkent",turi:"Sanoat",desc:"Sanoat modernizatsiyasi, raqamlashtirish, robotika va ishlab chiqarish texnologiyalari. Uzexpocentre.",url:"https://innoprom.com",img:"https://images.unsplash.com/photo-1565043666747-69f6646db940?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#dc2626,#EF233C)",icon:"\u{2699}\u{FE0F}"},
    {nom:"IFN Uzbekistan Forum — Islom Moliyasi",sana:"2026",shahar:"Toshkent",turi:"Moliya",desc:"Sukuk, islomiy banklar, Shariatga muvofiq moliyaviy instrumentlar forumi.",url:"https://redmoneyevents.com/event/ifnuzbekistan2026/",img:"https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#065f46,#047857)",icon:"\u{1F3E6}"},
    {nom:"Power Uzbekistan 2026",sana:"12\u201314 May 2026",shahar:"Toshkent",turi:"Energetika",desc:"Energetika, energiya tejash, atom energetikasi va muqobil manbalar bo\u2018yicha xalqaro ko\u2018rgazma.",url:"https://power-uzbekistan.uz",img:"https://images.unsplash.com/photo-1509391111822-f1f91e9f9572?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#b45309,#f59e0b)",icon:"\u{26A1}"},
    {nom:"UzBuild 2026 — Qurilish",sana:"10\u201312 Fevral 2026",shahar:"Toshkent",turi:"Qurilish",desc:"25 yillik tarixga ega qurilish sanoatining yetakchi xalqaro ko\u2018rgazmasi. UFI sertifikatlangan.",url:"https://www.uzbuild.uz",img:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#78350f,#a16207)",icon:"\u{1F3D7}\u{FE0F}"},
    {nom:"Markaziy Osiyo\u2013Ozarbayjon Investitsiya Forumi",sana:"2026",shahar:"Samarqand",turi:"Investitsiya",desc:"O\u2018zbekiston tashabbusi bilan Samarqandda xalqaro investitsiya forumi.",url:"https://invest.gov.uz",img:"https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#1e40af,#3b82f6)",icon:"\u{1F1FA}\u{1F1FF}"},
    {nom:"AgriTek Uzbekistan 2026",sana:"17\u201319 Fevral 2026",shahar:"Toshkent",turi:"Qishloq xo\u2018jaligi",desc:"Qishloq xo\u2018jaligi texnologiyalari, sug\u2018orish, urug\u2018chilik va agrosanoat xalqaro ko\u2018rgazmasi.",url:"https://agritek.uz",img:"https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#15803d,#22c55e)",icon:"\u{1F33E}"},
    {nom:"TextileExpo Uzbekistan 2026",sana:"May 2026",shahar:"Toshkent",turi:"To\u2018qimachilik",desc:"To\u2018qimachilik va tikuvchilik sanoati xalqaro ko\u2018rgazmasi. Ip-gazlama, mashina va texnologiyalar.",url:"https://textileexpo.uz",img:"https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#7c3aed,#a855f7)",icon:"\u{1F9F5}"},
    {nom:"MiningWorld Uzbekistan 2026",sana:"2\u20134 Aprel 2026",shahar:"Toshkent",turi:"Kon sanoati",desc:"Kon sanoati, burg\u2018ulash, qazib olish uskunalari va geotexnologiyalar xalqaro ko\u2018rgazmasi.",url:"https://miningworld.uz",img:"https://images.unsplash.com/photo-1578319439584-104c94d37305?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#44403c,#78716c)",icon:"\u{26CF}\u{FE0F}"},
    {nom:"UzMedExpo 2026",sana:"28\u201330 Aprel 2026",shahar:"Toshkent",turi:"Tibbiyot",desc:"Tibbiyot uskunalari, farmatsevtika va sog\u2018liqni saqlash xalqaro ko\u2018rgazmasi.",url:"https://uzmedexpo.uz",img:"https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#0e7490,#06b6d4)",icon:"\u{1FA7A}"},
    {nom:"ICT Week Uzbekistan 2026",sana:"Noyabr 2026",shahar:"Toshkent",turi:"IT / Raqamli",desc:"Axborot texnologiyalari, raqamlashtirish, startaplar va innovatsiyalar haftaligi. IT Park Uzbekistan.",url:"https://ictweek.uz",img:"https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#6d28d9,#8b5cf6)",icon:"\u{1F4BB}"}
  ],
  eu:[
    {nom:"EIB Group Forum 2026",sana:"3\u20135 Mart 2026",shahar:"Lyuksemburg",turi:"Investitsiya / Siyosat",desc:"Yevropa Investitsiya Banki forumi. Raqobatdorlik, xavfsizlik, energetika, savdo.",url:"https://www.eib.org/en/events/eib-group-forum",img:"https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#1e40af,#2563eb)",icon:"\u{1F3E6}"},
    {nom:"Invest Europe \u2014 Investors' Forum",sana:"18\u201319 Mart 2026",shahar:"Jeneva",turi:"Private Equity",desc:"Yetakchi LP va GP yig\u2018ilishi. 1000+ ishtirokchi, xususiy kapital va vencher.",url:"https://if.investeurope.eu",img:"https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#059669,#10b981)",icon:"\u{1F4B0}"},
    {nom:"Sustainable Investment Forum Europe",sana:"1 Aprel 2026",shahar:"Parij",turi:"ESG / Barqaror",desc:"UNEP FI hamkorligi. Iqlim, tabiiy kapital va mas\u2018uliyatli investitsiya.",url:"https://events.climateaction.org/sustainable-investment-forum-europe/",img:"https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#15803d,#4ade80)",icon:"\u{1F331}"},
    {nom:"World Investment Forum (BMT)",sana:"9\u201311 Iyun 2026",shahar:"Jeneva",turi:"BMT / Global",desc:"BMT global investitsiya forumi. Xalqaro siyosat va rivojlanish imkoniyatlari.",url:"https://indico.un.org/event/1021025/",img:"https://images.unsplash.com/photo-1524850011238-e3d235c7d4c9?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#0369a1,#38bdf8)",icon:"\u{1F1FA}\u{1F1F3}"},
    {nom:"IMpower FundForum",sana:"22\u201324 Iyun 2026",shahar:"Monako",turi:"Fond Boshqaruvi",desc:"Yevropaning eng yirik fond boshqaruvi konferensiyasi. 2000+ ishtirokchi.",url:"https://informaconnect.com/impower-fundforum/",img:"https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#7c3aed,#a78bfa)",icon:"\u{1F4CA}"},
    {nom:"Private Equity Europe Forum",sana:"15\u201316 Sentyabr 2026",shahar:"London",turi:"Private Equity",desc:"Soliq, bozor va exit strategiyalar. Buyuk Britaniya PE liderlari.",url:"https://www.marketsgroup.org/forums/private-equity-europe-forum",img:"https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#1e293b,#475569)",icon:"\u{1F4BC}"},
    {nom:"MIPIM 2026 \u2014 Ko\u2018chmas Mulk",sana:"9\u201313 Mart 2026",shahar:"Kann, Fransiya",turi:"Ko\u2018chmas mulk",desc:"Dunyoning eng yirik ko\u2018chmas mulk investitsiya yarmarkasi. 20,000+ ishtirokchi.",url:"https://www.mipim.com",img:"https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#9f1239,#e11d48)",icon:"\u{1F3E2}"},
    {nom:"Davos \u2014 World Economic Forum",sana:"Yanvar 2026",shahar:"Davos, Shveytsariya",turi:"Global Iqtisodiyot",desc:"Jahon iqtisodiy forumi. Davlat rahbarlari, CEO va global liderlar uchrashuvi.",url:"https://www.weforum.org",img:"https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#0c4a6e,#0284c7)",icon:"\u{1F3D4}\u{FE0F}"},
    {nom:"Web Summit 2026",sana:"Noyabr 2026",shahar:"Lissabon, Portugaliya",turi:"Texnologiya / Startap",desc:"Dunyoning eng yirik texnologiya konferensiyasi. 70,000+ ishtirokchi, startaplar va investorlar.",url:"https://websummit.com",img:"https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#18181b,#3f3f46)",icon:"\u{1F310}"},
    {nom:"Hannover Messe 2026",sana:"13\u201317 Aprel 2026",shahar:"Gannover, Germaniya",turi:"Sanoat",desc:"Dunyoning eng yirik sanoat ko\u2018rgazmasi. Avtomatlashtirish, energetika, raqamli ishlab chiqarish.",url:"https://www.hannovermesse.de",img:"https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#b91c1c,#ef4444)",icon:"\u{1F3ED}"},
    {nom:"Slush 2026",sana:"Noyabr 2026",shahar:"Xelsinki, Finlandiya",turi:"Startap / Vencher",desc:"Shimoliy Yevropa eng yirik startap va texnologiya tadbiri. 13,000+ ishtirokchi.",url:"https://slush.org",img:"https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#1e1b4b,#4338ca)",icon:"\u{1F525}"}
  ],
  us:[
    {nom:"SelectUSA Investment Summit 2026",sana:"3\u20136 May 2026",shahar:"Maryland, AQSh",turi:"FDI / Investitsiya",desc:"AQShdagi eng yirik FDI tadbiri. 5500+ ishtirokchi, 100+ mamlakat. Gaylord National Resort.",url:"https://www.selectusasummit.us",img:"https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#1e3a5f,#3b82f6)",icon:"\u{1F1FA}\u{1F1F8}"},
    {nom:"US SIF Forum 2026",sana:"2026",shahar:"Arlington, Virginia",turi:"ESG / Barqaror",desc:"AQSh barqaror investitsiya forumi. ESG tendensiyalari va siyosat yangiliklari.",url:"https://www.ussif.org/events-and-networking/conference",img:"https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#065f46,#10b981)",icon:"\u{1F331}"},
    {nom:"PDAC 2026 \u2014 Mining Convention",sana:"1\u20134 Mart 2026",shahar:"Toronto, Kanada",turi:"Kon sanoati",desc:"Dunyoning eng nufuzli kon va geologiya konvensiyasi. Uzbekistan Day o\u2018tkazildi.",url:"https://www.pdac.ca",img:"https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#78350f,#b45309)",icon:"\u{26CF}\u{FE0F}"},
    {nom:"J.P. Morgan Global Investment Forum",sana:"2026",shahar:"Nyu-York",turi:"Moliya",desc:"Institutsional investorlar, portfel strategiyalari, makroiqtisodiy tahlillar.",url:"https://www.jpmorgan.com",img:"https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#1e293b,#334155)",icon:"\u{1F4B5}"},
    {nom:"CES 2026 \u2014 Consumer Electronics Show",sana:"6\u20139 Yanvar 2026",shahar:"Las-Vegas",turi:"Texnologiya",desc:"Dunyoning eng yirik iste\u2018mol elektronikasi ko\u2018rgazmasi. 100,000+ ishtirokchi. AI, IoT, avtomobil.",url:"https://www.ces.tech",img:"https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#18181b,#71717a)",icon:"\u{1F4F1}"},
    {nom:"Bloomberg Invest 2026",sana:"Iyun 2026",shahar:"Nyu-York",turi:"Moliya / Investitsiya",desc:"Bloomberg tashkil etgan global investitsiya konferensiyasi. Bozor liderlari va fond menejerlari.",url:"https://www.bloomberglive.com",img:"https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#0c4a6e,#0ea5e9)",icon:"\u{1F4C8}"},
    {nom:"Milken Institute Global Conference",sana:"May 2026",shahar:"Los-Anjeles",turi:"Global Iqtisodiyot",desc:"4,000+ global lider. Kapital bozori, sog\u2018liq, texnologiya va geosiyosat.",url:"https://www.milkeninstitute.org",img:"https://images.unsplash.com/photo-1515896769750-31548aa180ed?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#4338ca,#818cf8)",icon:"\u{1F30E}"},
    {nom:"TechCrunch Disrupt 2026",sana:"Oktyabr 2026",shahar:"San-Fransisko",turi:"Startap / Vencher",desc:"Eng nufuzli startap konferensiyasi. Startup Battlefield, investorlar networking.",url:"https://techcrunch.com/events/disrupt/",img:"https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#15803d,#4ade80)",icon:"\u{1F680}"},
    {nom:"UN General Assembly Week",sana:"Sentyabr 2026",shahar:"Nyu-York",turi:"Diplomatiya / SDG",desc:"BMT Bosh Assambleyasi davomida investitsiya va barqaror rivojlanish tadbirlari.",url:"https://www.un.org/en/ga/",img:"https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#1e40af,#60a5fa)",icon:"\u{1F1FA}\u{1F1F3}"}
  ],
  ru:[
    {nom:"SPIEF 2026 \u2014 Sankt-Peterburg Iqtisodiy Forum",sana:"3\u20136 Iyun 2026",shahar:"Sankt-Peterburg",turi:"Iqtisodiy Forum",desc:"Rossiyaning eng yirik biznes tadbiri. 10,000+ ishtirokchi, 120+ mamlakat. Mehmon: Saudiya Arabistoni.",url:"https://forumspb.com",img:"https://images.unsplash.com/photo-1556610961-2fecc5927173?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#1e3a5f,#2563eb)",icon:"\u{1F1F7}\u{1F1FA}"},
    {nom:"INNOPROM 2026",sana:"Iyul 2026",shahar:"Yekaterinburg",turi:"Sanoat",desc:"Rossiyaning asosiy sanoat ko\u2018rgazmasi. Raqamli ishlab chiqarish, robotika.",url:"https://innoprom.com",img:"https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#dc2626,#f87171)",icon:"\u{2699}\u{FE0F}"},
    {nom:"KazanForum 2026",sana:"May 2026",shahar:"Qazon",turi:"Xalol Iqtisodiyot",desc:"Rossiya-OIC iqtisodiy hamkorlik forumi. Islom moliyasi va halol sanoat.",url:"https://kazanforum.com",img:"https://images.unsplash.com/photo-1547448415-e9f5b28e570d?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#065f46,#059669)",icon:"\u{1F54C}"},
    {nom:"Rossiya\u2013BAA Biznes Forumi",sana:"2026",shahar:"Moskva",turi:"Ikki tomonlama",desc:"Rossiya va BAA savdo-iqtisodiy hamkorlik. B2B uchrashuvlar.",url:"https://rc-international.org",img:"https://images.unsplash.com/photo-1513326738677-b964603b136d?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#7c2d12,#c2410c)",icon:"\u{1F91D}"},
    {nom:"ARMY 2026 \u2014 Xalqaro Harbiy Forum",sana:"Avgust 2026",shahar:"Moskva",turi:"Mudofaa / Sanoat",desc:"Xalqaro harbiy-texnik forumi. Mudofaa sanoati va xavfsizlik texnologiyalari.",url:"https://rusarmyexpo.ru",img:"https://images.unsplash.com/photo-1580752300992-559f8e44e549?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#1c1917,#44403c)",icon:"\u{1F6E1}\u{FE0F}"},
    {nom:"Transport va Logistika Forumi",sana:"17 Iyun 2026",shahar:"Moskva",turi:"Transport",desc:"Transport infratuzilmasi va logistika xizmatlari xalqaro forumi.",url:"https://transport-forum.ru",img:"https://images.unsplash.com/photo-1494412574643-ff11b0a5eb19?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#0369a1,#38bdf8)",icon:"\u{1F69A}"},
    {nom:"ATOMEXPO 2026",sana:"2026",shahar:"Sochi",turi:"Atom Energetika",desc:"Rosatom tashkil etgan atom energetikasi xalqaro forumi. Tinch atom texnologiyalari.",url:"https://atomexpo.com",img:"https://images.unsplash.com/photo-1591696205602-2f950c417cb9?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#4338ca,#818cf8)",icon:"\u{2622}\u{FE0F}"},
    {nom:"VEB.RF Development Forum",sana:"2026",shahar:"Moskva",turi:"Rivojlanish",desc:"VEB.RF rivojlanish banki forumi. Infratuzilma, ijtimoiy investitsiya loyihalari.",url:"https://veb.rf",img:"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#155e75,#22d3ee)",icon:"\u{1F3D7}\u{FE0F}"}
  ],
  cn:[
    {nom:"CIIE 2026 \u2014 Xitoy Import Expo",sana:"5\u201310 Noyabr 2026",shahar:"Shanxay",turi:"Import / Ko\u2018rgazma",desc:"Xitoyning eng yirik xalqaro import ko\u2018rgazmasi. 100+ mamlakatdan ishtirokchilar.",url:"https://www.ciie.org/zbh/en/",img:"https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#dc2626,#fbbf24)",icon:"\u{1F1E8}\u{1F1F3}"},
    {nom:"Greater China Investment Forum",sana:"2026",shahar:"Pekin / Gonkong",turi:"Institutsional",desc:"Xitoy pensiya, sug\u2018urta va davlat fondlari uchun investitsiya forumi.",url:"https://register.institutionalinvestor.com/2026-greater-china-global-investment-forum",img:"https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#7c2d12,#ea580c)",icon:"\u{1F4B0}"},
    {nom:"CIFIT 2026 \u2014 Investitsiya va Savdo Yarmarkasi",sana:"Sentyabr 2026",shahar:"Syamen",turi:"Investitsiya / Savdo",desc:"26-Xitoy xalqaro investitsiya yarmarkasi. Invest in China platformasi.",url:"https://www.chinafair.org.cn",img:"https://images.unsplash.com/photo-1474181628-2a9769538816?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#1e40af,#3b82f6)",icon:"\u{1F4BC}"},
    {nom:"Canton Fair 2026 (Bahor)",sana:"15 Aprel \u2013 5 May",shahar:"Guanchjou",turi:"Savdo",desc:"Dunyoning eng katta savdo yarmarkasi. 60,000+ stend, 200+ mamlakat.",url:"https://www.cantonfair.org.cn",img:"https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#b91c1c,#f59e0b)",icon:"\u{1F3EA}"},
    {nom:"Boao Forum for Asia 2026",sana:"Mart 2026",shahar:"Boao, Xaynan",turi:"Iqtisodiy Forum",desc:"Osiyo davoslari. Davlat rahbarlari va global CEO lar ishtiroki.",url:"https://www.boaoforum.org",img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#0e7490,#06b6d4)",icon:"\u{1F30F}"},
    {nom:"China Hi-Tech Fair 2026",sana:"Noyabr 2026",shahar:"Shenzhen",turi:"Texnologiya",desc:"Xitoyning eng yirik yuqori texnologiya ko\u2018rgazmasi. AI, 5G, IoT, kosmik texnologiyalar.",url:"https://www.chtf.com",img:"https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#4338ca,#7c3aed)",icon:"\u{1F916}"},
    {nom:"China Mining Congress & Expo",sana:"Oktyabr 2026",shahar:"Pekin",turi:"Kon sanoati",desc:"Xitoy kon sanoati kongressi. Mineral resurslar, qazib olish texnologiyalari.",url:"https://www.chinaminingtj.org",img:"https://images.unsplash.com/photo-1578319439584-104c94d37305?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#78350f,#a16207)",icon:"\u{26CF}\u{FE0F}"},
    {nom:"Shanghai Cooperation Organization Forum",sana:"2026",shahar:"Pekin",turi:"Geosiyosat",desc:"SHT doirasida iqtisodiy hamkorlik va investitsiya forumi. Markaziy Osiyo diqqat markazida.",url:"https://www.sectsco.org",img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#1e3a5f,#0369a1)",icon:"\u{1F3DB}\u{FE0F}"},
    {nom:"Belt and Road Forum 2026",sana:"2026",shahar:"Pekin",turi:"Infratuzilma",desc:"Bir kamar \u2014 Bir yo\u2018l tashabbusi forumi. Transport, energetika, savdo va investitsiya.",url:"https://www.beltandroad.news",img:"https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&h=300&fit=crop",grad:"linear-gradient(135deg,#92400e,#d97706)",icon:"\u{1F6E4}\u{FE0F}"}
  ]
};

let _intlActiveIdx = 0;

function renderIntlForums(){
  const tabsEl = document.getElementById('intl-region-tabs');
  const gridEl = document.getElementById('intl-forums-grid');
  const totalEl = document.getElementById('intl-total-count');
  if(!tabsEl) return;

  let total = 0;
  INTL_REGIONS.forEach(r => total += (INTL_FORUMS[r.key]||[]).length);
  totalEl.textContent = 'Jami: ' + total + ' ta forum / ko\u2018rgazma';

  tabsEl.innerHTML = INTL_REGIONS.map((r,i) => {
    const count = (INTL_FORUMS[r.key]||[]).length;
    const active = i === _intlActiveIdx ? ' active' : '';
    return '<button class="intl-region-btn'+active+'" onclick="setIntlRegion('+i+')">'+
      '<span class="region-flag">'+r.flag+'</span>'+
      '<span>'+r.label+'</span>'+
      '<span class="region-count">'+count+'</span>'+
    '</button>';
  }).join('');

  const reg = INTL_REGIONS[_intlActiveIdx];
  const forums = INTL_FORUMS[reg.key] || [];
  gridEl.innerHTML = forums.map(function(f){
    var imgHtml = f.img
      ? '<img class="intl-forum-img" src="'+f.img+'" alt="" onerror="var p=this.parentNode;var d=document.createElement(\'div\');d.className=\'intl-forum-img-fallback\';d.style.background=\''+f.grad+'\';d.innerHTML=\'<span style=&quot;font-size:3.5rem;filter:drop-shadow(0 2px 8px rgba(0,0,0,.3))&quot;>'+f.icon+'</span>\';p.replaceChild(d,this);">'
      : '<div class="intl-forum-img-fallback" style="background:'+f.grad+'"><span style="font-size:3.5rem;filter:drop-shadow(0 2px 8px rgba(0,0,0,.3))">'+f.icon+'</span></div>';
    return '<div class="intl-forum-card">'+
      imgHtml+
      '<div class="intl-forum-body">'+
        '<div class="intl-forum-name">'+f.nom+'</div>'+
        '<div class="intl-forum-meta">'+
          '<span class="intl-forum-tag date-tag">\u{1F4C5} '+f.sana+'</span>'+
          '<span class="intl-forum-tag loc-tag">\u{1F4CD} '+f.shahar+'</span>'+
          '<span class="intl-forum-tag type-tag">'+f.turi+'</span>'+
        '</div>'+
        '<div class="intl-forum-desc">'+f.desc+'</div>'+
        (f.url && f.url!=='#' ? '<a class="intl-forum-link" href="'+f.url+'" target="_blank" rel="noopener">\u{1F517} Rasmiy sayt \u2192</a>' : '')+
      '</div>'+
    '</div>';
  }).join('');
}

function setIntlRegion(i){
  _intlActiveIdx = i;
  renderIntlForums();
}
