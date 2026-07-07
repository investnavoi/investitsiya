/* ═══════════════════════════════════════
   DATA
═══════════════════════════════════════ */
const MONTHS_UZ = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"];
const MONTHS_SHORT = ["YAN","FEV","MAR","APR","MAY","IYN","IYL","AVG","SEN","OKT","NOY","DEK"];
const GMAIL_SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';
var _zmAdminMedia = [];
// Simple translation helper (falls back to uz hardcoded strings)
const TRANSLATIONS = {
  uz: {
    nav_overview:"Umumiy ma'lumotlar", nav_investors:"Investorlar Tashriflari",
    nav_local:"Mahalliy Tadbirkorlar", nav_zoom:"Zoom Uchrashuvlar",
    nav_forums:"Forumlar", nav_investorco:"Investorlar bazasi", nav_login:"Kirish",
    nav_admin:"Admin Panel",
    page_investors_title:"Tashrif Buyurgan Xorijiy Investorlar",
    page_investors_sub:"Navoiy viloyatiga tashrif buyurgan xorijiy investorlar ro'yxati",
    page_local_title:"Mahalliy Tadbirkorlar Ro'yxati",
    page_local_sub:"Xorijiy investitsiyaga muhtoj mahalliy kompaniyalar",
    page_zoom_title:"Zoom Uchrashuvlar", page_zoom_sub:"Xorijiy investorlar bilan o'tkazilgan onlayn uchrashuvlar",
    page_forums_title:"Forumlar & Xalqaro Ko'rgazmalar", page_forums_sub:"Rejalashtirilgan xalqaro tadbirlar va ishtirok rejasi",
    page_investor_title:"Investorlar — Kompaniyalar Ro'yxati", page_investor_sub:"Navoiy viloyati investitsiya loyihalari boshqaruvi",
    btn_add:"➕ Yangi qo'shish", btn_excel:"📥 Excel", btn_clearall:"🗑 Barchasini o'chirish",
    btn_print:"🖨 Chop etish", btn_logout:"🚪 Chiqish", btn_bulk_send:"📧 Tanlanganlarga yuborish",
    col_city:"Shahar/Tuman", col_date:"Sana", col_country:"Davlat", col_purpose:"Maqsad",
    col_company:"Kompaniya", col_company_location:"Kompaniya manzili", col_project:"Loyiha", col_value:"Qiymati", col_status:"Maqom",
    col_region:"Hudud", col_note:"Izoh", col_actions:"Amal", col_email:"Email",
    col_emailstatus:"Email holati", col_leader:"Rahbar", col_position:"Lavozim",
    col_field:"Soha", col_amount:"Summa", col_amount_usd:"Talab (USD)", col_tel:"Telefon",
    col_org:"Tashkilot", col_participants:"Ishtirokchi", col_result:"Natija",
    col_name:"Nomi", col_type:"Turi", col_project_disc:"Muhokama Loyiha",
    lbl_total:"Jami", lbl_positive:"Ijobiy Natija", lbl_countries:"Davlatlar",
    lbl_ready:"Tayyor", lbl_new:"Yangi", lbl_negotiating:"Muzokarada",
    lbl_active:"Faol", lbl_inprogress:"Jarayonda", lbl_confirmed:"Tasdiqlangan",
    lbl_registered:"Ro'yxatdan o'tilgan", lbl_international:"Xalqaro", lbl_abroad:"Chet elda",
    lbl_local:"Mahalliy", lbl_inuz:"O'zbekistonda", lbl_planned:"Rejalashtirilgan",
    lbl_foreign:"Chet ellik", lbl_covered:"Qamrab olingan", lbl_investment:"Investitsiya",
    lbl_company:"Kompaniya", lbl_projects:"Loyihalar", lbl_records:"Ta yozuv",
    lbl_total_records:"Jami Yozuv", lbl_replies:"Javoblar", lbl_email_replies:"Email javoblari",
    lbl_new_badge:"YANGI",
    inv_k1_lbl:"Jami Tashrif", inv_k2_lbl:"Kelishilgan", inv_k3_lbl:"Ko'rib Chiqilmoqda",
    inv_k4_lbl:"Umumiy Qiymati", inv_k4_trend:"Investitsiya",
    inv_table_title:"Xorijiy investorlar jadvali",
    loc_k1_lbl:"Jami Ro'yxatda", loc_k4_lbl:"Jami Talab", loc_k2_trend:"Investorni kutmoqda",
    loc_table_title:"Mahalliy tadbirkorlar jadvali",
    zm_k1_lbl:"Jami Uchrashuvlar", zm_k3_lbl:"Ishtirokchilar", zm_table_title:"Uchrashuvlar ro'yxati",
    fr_k1_lbl:"Jami Tadbirlar", fr_table_title:"Tadbirlar ro'yxati",
    ic_k3_trend:"Yuborildi/Mavjud", ic_k4_lbl:"Jami Talab", ic_table_title:"Kompaniyalar ro'yxati",
    no_data:"Ma'lumot topilmadi",
    toast_fill:"Majburiy maydonlarni to'ldiring!", toast_saved:"saqlandi!",
    toast_deleted:"o'chirildi.", toast_all_deleted:"Barcha ma'lumotlar o'chirildi.",
    delete_all_msg:"bo'limidagi BARCHA ma'lumotlarni o'chirishni tasdiqlaysizmi?",
    confirm_delete:"O'chirishni tasdiqlang", confirm_yes:"🗑 Ha, o'chirish", confirm_no:"Bekor qilish",
    monthly_report:"OYLIK HISOBOT", admin_panel:"⚙️ Admin Panel",
    admin_sub:"Ma'lumotlarni qo'shish, tahrirlash va o'chirish",
  },
  ru: {
    nav_overview:"Обзор", nav_investors:"Визиты инвесторов",
    nav_local:"Местные предприниматели", nav_zoom:"Zoom встречи",
    nav_forums:"Форумы", nav_investorco:"База инвесторов", nav_login:"Войти",
    nav_admin:"Админ панель",
    page_investors_title:"Иностранные инвесторы", page_investors_sub:"Список иностранных инвесторов, посетивших Навоийскую область",
    page_local_title:"Местные предприниматели", page_local_sub:"Местные компании, нуждающиеся в иностранных инвестициях",
    page_zoom_title:"Zoom встречи", page_zoom_sub:"Онлайн встречи с иностранными инвесторами",
    page_forums_title:"Форумы и выставки", page_forums_sub:"Запланированные международные мероприятия",
    page_investor_title:"База инвесторов", page_investor_sub:"Управление инвестиционными проектами Навоийской области",
    btn_add:"➕ Добавить", btn_excel:"📥 Excel", btn_clearall:"🗑 Очистить всё",
    btn_print:"🖨 Печать", btn_logout:"🚪 Выйти", btn_bulk_send:"📧 Отправить выбранным",
    col_city:"Город/Район", col_date:"Дата", col_country:"Страна", col_purpose:"Цель",
    col_company:"Компания", col_company_location:"Адрес компании", col_project:"Проект", col_value:"Стоимость", col_status:"Статус",
    col_region:"Регион", col_note:"Примечание", col_actions:"Действия", col_email:"Email",
    col_emailstatus:"Email статус", col_leader:"Руководитель", col_position:"Должность",
    col_field:"Отрасль", col_amount:"Сумма", col_amount_usd:"Запрос (USD)", col_tel:"Телефон",
    col_org:"Организация", col_participants:"Участники", col_result:"Результат",
    col_name:"Название", col_type:"Тип", col_project_disc:"Обсуждаемый проект",
    lbl_total:"Всего", lbl_positive:"Положительный", lbl_countries:"Страны",
    lbl_ready:"Готово", lbl_new:"Новый", lbl_negotiating:"Переговоры",
    lbl_active:"Активных", lbl_inprogress:"В процессе", lbl_confirmed:"Подтверждено",
    lbl_registered:"Зарегистрировано", lbl_international:"Международные", lbl_abroad:"За рубежом",
    lbl_local:"Местные", lbl_inuz:"В Узбекистане", lbl_planned:"Запланировано",
    lbl_foreign:"Иностранных", lbl_covered:"Охвачено", lbl_investment:"Инвестиции",
    lbl_company:"Компания", lbl_projects:"Проекты", lbl_records:"Записей",
    lbl_total_records:"Всего записей", lbl_replies:"Ответы", lbl_email_replies:"Email ответы",
    lbl_new_badge:"НОВЫЙ",
    inv_k1_lbl:"Всего визитов", inv_k2_lbl:"Согласовано", inv_k3_lbl:"На рассмотрении",
    inv_k4_lbl:"Общая стоимость", inv_k4_trend:"Инвестиции",
    inv_table_title:"Таблица иностранных инвесторов",
    loc_k1_lbl:"Всего в списке", loc_k4_lbl:"Общий запрос", loc_k2_trend:"Ждут инвестора",
    loc_table_title:"Таблица местных предпринимателей",
    zm_k1_lbl:"Всего встреч", zm_k3_lbl:"Участники", zm_table_title:"Список встреч",
    fr_k1_lbl:"Всего мероприятий", fr_table_title:"Список мероприятий",
    ic_k3_trend:"Отправлено/Доступно", ic_k4_lbl:"Общий запрос", ic_table_title:"Список компаний",
    no_data:"Данных не найдено",
    toast_fill:"Заполните обязательные поля!", toast_saved:"сохранено!",
    toast_deleted:"удалено.", toast_all_deleted:"Все данные удалены.",
    delete_all_msg:"Удалить ВСЕ данные в этом разделе?",
    confirm_delete:"Подтвердите удаление", confirm_yes:"🗑 Да, удалить", confirm_no:"Отмена",
    monthly_report:"ЕЖЕМЕСЯЧНЫЙ ОТЧЁТ", admin_panel:"⚙️ Админ панель",
    admin_sub:"Добавление, редактирование и удаление данных",
  },
  en: {
    nav_overview:"Overview", nav_investors:"Investor Visits",
    nav_local:"Local Entrepreneurs", nav_zoom:"Zoom Meetings",
    nav_forums:"Forums", nav_investorco:"Investor Database", nav_login:"Login",
    nav_admin:"Admin Panel",
    page_investors_title:"Foreign Investor Visits", page_investors_sub:"List of foreign investors who visited Navoiy region",
    page_local_title:"Local Entrepreneurs", page_local_sub:"Local companies seeking foreign investment",
    page_zoom_title:"Zoom Meetings", page_zoom_sub:"Online meetings with foreign investors",
    page_forums_title:"Forums & Exhibitions", page_forums_sub:"Planned international events and participation",
    page_investor_title:"Investor Database", page_investor_sub:"Navoiy region investment project management",
    btn_add:"➕ Add New", btn_excel:"📥 Excel", btn_clearall:"🗑 Clear All",
    btn_print:"🖨 Print", btn_logout:"🚪 Logout", btn_bulk_send:"📧 Send to Selected",
    col_city:"City/District", col_date:"Date", col_country:"Country", col_purpose:"Purpose",
    col_company:"Company", col_company_location:"Company location", col_project:"Project", col_value:"Value", col_status:"Status",
    col_region:"Region", col_note:"Note", col_actions:"Actions", col_email:"Email",
    col_emailstatus:"Email Status", col_leader:"Director", col_position:"Position",
    col_field:"Industry", col_amount:"Amount", col_amount_usd:"Request (USD)", col_tel:"Phone",
    col_org:"Organization", col_participants:"Participants", col_result:"Result",
    col_name:"Name", col_type:"Type", col_project_disc:"Project Discussion",
    lbl_total:"Total", lbl_positive:"Positive Outcome", lbl_countries:"Countries",
    lbl_ready:"Ready", lbl_new:"New", lbl_negotiating:"Negotiating",
    lbl_active:"Active", lbl_inprogress:"In Progress", lbl_confirmed:"Confirmed",
    lbl_registered:"Registered", lbl_international:"International", lbl_abroad:"Abroad",
    lbl_local:"Local", lbl_inuz:"In Uzbekistan", lbl_planned:"Planned",
    lbl_foreign:"Foreign", lbl_covered:"Covered", lbl_investment:"Investment",
    lbl_company:"Company", lbl_projects:"Projects", lbl_records:"Records",
    lbl_total_records:"Total Records", lbl_replies:"Replies", lbl_email_replies:"Email replies",
    lbl_new_badge:"NEW",
    inv_k1_lbl:"Total Visits", inv_k2_lbl:"Agreed", inv_k3_lbl:"Under Review",
    inv_k4_lbl:"Total Value", inv_k4_trend:"Investment",
    inv_table_title:"Foreign investors table",
    loc_k1_lbl:"Total Listed", loc_k4_lbl:"Total Request", loc_k2_trend:"Awaiting investor",
    loc_table_title:"Local entrepreneurs table",
    zm_k1_lbl:"Total Meetings", zm_k3_lbl:"Participants", zm_table_title:"Meetings list",
    fr_k1_lbl:"Total Events", fr_table_title:"Events list",
    ic_k3_trend:"Sent/Available", ic_k4_lbl:"Total Request", ic_table_title:"Companies list",
    no_data:"No data found",
    toast_fill:"Please fill in required fields!", toast_saved:"saved!",
    toast_deleted:"deleted.", toast_all_deleted:"All data cleared.",
    delete_all_msg:"Delete ALL data in this section?",
    confirm_delete:"Confirm deletion", confirm_yes:"🗑 Yes, delete", confirm_no:"Cancel",
    monthly_report:"MONTHLY REPORT", admin_panel:"⚙️ Admin Panel",
    admin_sub:"Add, edit and delete data",
  }
};

function tr(key){ return (TRANSLATIONS[currentLang]||TRANSLATIONS.uz)[key] || key; }

function t(key){
  return tr(key);
}

function applyTranslations(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    const val = tr(key);
    if(val) el.textContent = val;
  });
  // Update print button
  const printBtn = document.querySelector('.tn-btn.green');
  if(printBtn) printBtn.innerHTML = `🖨 ${tr('btn_print')}`;
  // Update admin tab if admin logged in
  if(isAdmin){
    const adminLbl = document.getElementById('adminTabLabel');
    if(adminLbl) adminLbl.textContent = tr('nav_admin');
  }
  if(typeof updateInvestAiI18n==='function') updateInvestAiI18n();
  if(typeof renderInvestAiHistory==='function') renderInvestAiHistory();
}

/* Default Data + DB init moved to assets/js/default-data.js */

/* STATE moved to assets/js/state.js */

/* utils + toast moved to assets/js/utils.js */
/* Navigation moved to assets/js/navigation.js */
/* Render Pages (Overview, Investors, Local, Zoom, Forums) moved to assets/js/render-pages.js */

/* International Forums moved to assets/js/intl-forums.js */

/* ═══════════════════════════════════════
   APOLLO.IO INTEGRATION
═══════════════════════════════════════ */
/* Apollo config moved to assets/js/apollo-config.js */

/* Apollo functions moved to assets/js/apollo.js */
/* CSV Import moved to assets/js/csv-import.js */
/* Render Admin Lists moved to assets/js/admin-lists.js */

/* ═══════════════════════════════════════
   ZOOM DETAIL MODAL
═══════════════════════════════════════ */
function closeZoomDetail(){document.getElementById('zoomDetailModal').classList.remove('open');}


/* Email Modal + Schedule Modal moved to assets/js/email-modal.js */

/* ═══════════════════════════════════════
   IJRO INTIZOMI WIDGET
═══════════════════════════════════════ */
const IJ_BAR_COLORS={prez:'#EF233C',pa:'#7209B7',vm:'#4361EE',komissiya:'#059669',yuqari:'#d97706'};

function toggleIjWidget(){
  ijOpen=!ijOpen;
  document.getElementById('ijPanel').classList.toggle('open',ijOpen);
  document.getElementById('ijArrow').textContent=ijOpen?'›':'‹';
}
function ijChange(key,delta){
  if(!isAdmin){toast('🔐 Avval admin sifatida kiring!','error');return;}
  const el=document.getElementById('ij-'+key);
  if(el)el.value=Math.max(0,(parseInt(el.value)||0)+delta);
  ijUpdate();
}
function ijUpdate(){
  const vals={};
  IJ_KEYS.forEach(k=>{vals[k]=parseInt(document.getElementById('ij-'+k)?.value)||0;});
  const total=Object.values(vals).reduce((s,v)=>s+v,0);
  document.getElementById('ijTotal').textContent=total;
  document.getElementById('ijTotalBadge').textContent=total;
  const max=Math.max(...Object.values(vals),1);
  const labels={prez:'PREZ',pa:'PA',vm:'VM',komissiya:'HK',yuqari:'YTT'};
  document.getElementById('ijBars').innerHTML=IJ_KEYS.map(k=>{
    const val=vals[k]||0;
    const pct=Math.round(val/max*100);
    return`<div class="ij-bar-wrap">
      <div class="ij-bar-val">${val}</div>
      <div class="ij-bar-track"><div class="ij-bar-fill" style="height:${Math.max(pct,3)}%;background:${IJ_BAR_COLORS[k]}"></div></div>
      <div class="ij-bar-label">${labels[k]}</div>
    </div>`;
  }).join('');
}
function ijSave(){
  if(!isAdmin){toast('🔐 Avval admin sifatida kiring!','error');return;}
  var vals={};
  IJ_KEYS.forEach(function(k){ vals[k]=parseInt((document.getElementById('ij-'+k)||{}).value)||0; });
  var payload={ id:'ijroIntizomi', values:vals, updatedAt:new Date().toISOString() };
  // 1. localStorage — darhol, offline'da ham ishlaydi, reload'da tiklanadi
  try{ localStorage.setItem('_ijIntizomi', JSON.stringify(payload)); }catch(e){}
  // 2. Firestore — cross-device (best-effort; xato bo'lsa localStorage baribir saqlaydi)
  if(typeof window.fbSetDoc==='function') window.fbSetDoc('appMeta','ijroIntizomi',payload);
  toast('💾 Ijro intizomi ma\'lumotlari saqlandi!');
}
// Boot'da saqlangan Ijro Intizomi qiymatlarini tiklaydi
function ijLoad(){
  try{
    var raw=localStorage.getItem('_ijIntizomi');
    if(raw){
      var p=JSON.parse(raw);
      if(p && p.values){
        IJ_KEYS.forEach(function(k){
          var el=document.getElementById('ij-'+k);
          if(el && p.values[k]!=null) el.value=p.values[k];
        });
      }
    }
  }catch(e){}
  try{ if(typeof ijUpdate==='function') ijUpdate(); }catch(e){}
  // Cross-device: Firestore'dan eng yangisini olib qo'llaymiz (best-effort, auth kerak)
  if(typeof window.fbGetDoc==='function' && window._currentUser){
    window.fbGetDoc('appMeta','ijroIntizomi').then(function(remote){
      if(!remote || !remote.values) return;
      var localTs=0;
      try{ localTs=Date.parse((JSON.parse(localStorage.getItem('_ijIntizomi')||'{}')||{}).updatedAt)||0; }catch(e){}
      var remoteTs=Date.parse(remote.updatedAt)||0;
      if(remoteTs>=localTs){
        IJ_KEYS.forEach(function(k){
          var el=document.getElementById('ij-'+k);
          if(el && remote.values[k]!=null) el.value=remote.values[k];
        });
        try{ localStorage.setItem('_ijIntizomi', JSON.stringify(remote)); }catch(e){}
        try{ if(typeof ijUpdate==='function') ijUpdate(); }catch(e){}
      }
    }).catch(function(){});
  }
}
window.ijLoad = ijLoad;
function ijReset(){
  if(!isAdmin){toast('🔐 Avval admin sifatida kiring!','error');return;}
  IJ_KEYS.forEach(k=>{const el=document.getElementById('ij-'+k);if(el)el.value=0;});
  ijUpdate();
}

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
function _bootApp(){
  const now=new Date();
  document.getElementById('tnDate').textContent=`📅 ${now.getDate()} ${MONTHS_UZ[now.getMonth()]} ${now.getFullYear()}`;
  const dateStr=`${now.getDate()} ${MONTHS_UZ[now.getMonth()]} ${now.getFullYear()}`;
  document.getElementById('ijDate').textContent=`${dateStr} — kunlik hisobot`;
  document.getElementById('ijDateSmall').textContent=dateStr;
  if(typeof ijLoad === 'function') ijLoad();
  if(typeof applyFinderUiDefaults === 'function') applyFinderUiDefaults();

  // Close modals on overlay click
  document.getElementById('zoomDetailModal').addEventListener('click',function(e){if(e.target===this)closeZoomDetail();});
  document.getElementById('deleteModal').addEventListener('click',function(e){if(e.target===this)closeDeleteModal();});
  document.getElementById('loginOverlay').addEventListener('click',function(e){if(e.target===this)closeLogin();});
  document.getElementById('emailModal').addEventListener('click',function(e){if(e.target===this)closeEmailModal();});
  document.getElementById('bulkEmailModal').addEventListener('click',function(e){if(e.target===this)closeBulkEmailModal();});
  // repliesModal and gmailSetupModal are defined after this script — attach listeners on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function(){
    var rm = document.getElementById('repliesModal');
    var gm = document.getElementById('gmailSetupModal');
    if(rm) rm.addEventListener('click',function(e){if(e.target===this)closeRepliesModal();});
    if(gm) gm.addEventListener('click',function(e){if(e.target===this)closeGmailSetup();});
  });

  // Close notif panel when clicking outside
  document.addEventListener('click', function(e){
    const wrap = document.getElementById('notifWrap');
    var notifP = document.getElementById('notifPanel');
    if(wrap && notifP && !wrap.contains(e.target)) notifP.classList.remove('open');
  });

  // Initial render
  renderAll();
  renderOverview();
  ijUpdate();
}
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', _bootApp);
} else {
  _bootApp();
}
