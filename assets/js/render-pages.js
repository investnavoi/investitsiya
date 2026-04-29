/* ═══════════════════════════════════════
   RENDER OVERVIEW
═══════════════════════════════════════ */
function renderOverview(){
  const now=new Date();
  const curMonth=now.getMonth()+1;
  const curYear=now.getFullYear();
  const mk=`${curYear}-${String(curMonth).padStart(2,'0')}`;
  const mNames={
    uz:MONTHS_UZ,
    ru:["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"],
    en:["January","February","March","April","May","June","July","August","September","October","November","December"]
  };
  const cmn=mNames[currentLang][curMonth-1];
  const mInv=DB.investors.filter(r=>r.sana&&r.sana.startsWith(mk));
  const mZoom=DB.zoom.filter(r=>r.sana&&r.sana.startsWith(mk));
  const mFr=DB.forums.filter(r=>r.sana&&r.sana.startsWith(mk));
  const ijobiy=mZoom.filter(r=>r.natijaHolat==='Ijobiy').length;
  const totalLocal=DB.local.reduce((s,r)=>s+(parseFloat(r.summa)||0),0);

  let summary='';
  if(currentLang==='uz'){
    summary=`<strong>${cmn} ${curYear}-yil</strong> oy bo'yicha hisobot: bo'lim tomonidan <strong>${mInv.length} ta xorijiy investor</strong> tashrif buyurdi. <strong>${mZoom.length} ta Zoom uchrashuvi</strong> o'tkazildi${mZoom.length>0?`, shundan <strong>${ijobiy} tasida</strong> ijobiy natijaga erishildi.`:`.`} ${mFr.length>0?`<strong>${mFr.length} ta forum/ko'rgazma</strong> ushbu oyda rejalashtirilgan.`:''} Mahalliy tadbirkorlar bazasida jami <strong>$${Math.round(totalLocal/1e6)||0} million</strong> hajmida ${DB.local.length} ta loyiha ro\'yxatda.`;
  } else if(currentLang==='ru'){
    summary=`<strong>${cmn} ${curYear}</strong> — ежемесячный отчёт: в этом месяце <strong>${mInv.length} иностранных инвесторов</strong> посетило регион. Проведено <strong>${mZoom.length} Zoom встреч</strong>${mZoom.length>0?`, из которых <strong>${ijobiy} завершились</strong> успешно.`:`.`} ${mFr.length>0?`<strong>${mFr.length} форума/выставки</strong> запланировано.`:''} В базе местных предпринимателей — <strong>$${Math.round(totalLocal/1e6)||0} млн</strong> в ${DB.local.length} проектах.`;
  } else {
    summary=`<strong>${cmn} ${curYear}</strong> monthly report: <strong>${mInv.length} foreign investor(s)</strong> visited this month. <strong>${mZoom.length} Zoom meeting(s)</strong> held${mZoom.length>0?`, of which <strong>${ijobiy}</strong> had positive outcomes.`:`.`} ${mFr.length>0?`<strong>${mFr.length} forum/exhibition(s)</strong> planned.`:''} Local entrepreneur database: <strong>$${Math.round(totalLocal/1e6)||0}M</strong> across ${DB.local.length} projects.`;
  }

  document.getElementById('sumTag').textContent=`${cmn} ${curYear} — Oylik hisobot`;
  document.getElementById('sumTxt').innerHTML=summary;
  document.getElementById('ov-k1').textContent=mInv.length;
  document.getElementById('ov-k2').textContent=mZoom.length;
  document.getElementById('ov-k3').textContent=mFr.length;
  document.getElementById('ov-k4').textContent=DB.local.length;
  [document.getElementById('ov-t1'),document.getElementById('ov-t2'),document.getElementById('ov-t3')].forEach(el=>{if(el)el.textContent=cmn;});

  // Industry distribution - Donut chart + progress bars
  const sohalar={};
  DB.investors.forEach(r=>{if(r.loyiha){const k=r.loyiha.split(' ').slice(0,2).join(' ');sohalar[k]=(sohalar[k]||0)+1;}});
  const total=DB.investors.length||1;
  const entries=Object.entries(sohalar).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const progEl=document.getElementById('industryProg');
  const chartColors=['#3a57e8','#059669','#f97316','#8b5cf6','#ef4444','#06b6d4'];
  if(entries.length){
    progEl.innerHTML=entries.map(([k,val],i)=>`
      <div class="prog-item">
        <div class="prog-row"><span class="prog-name">${k}</span><span class="prog-pct">${Math.round(val/total*100)}%</span></div>
        <div class="prog-track"><div class="prog-bar" style="width:${Math.round(val/total*100)}%;background:${chartColors[i]||chartColors[0]}"></div></div>
      </div>`).join('');
    // Donut chart
    renderOverviewDonut(entries.map(e=>e[1]),entries.map(e=>e[0]),chartColors);
  } else {
    progEl.innerHTML='<div style="text-align:center;padding:1rem;color:var(--text3);font-size:.78rem;">Ma\'lumot kiritilgach ko\'rinadi</div>';
  }

  // Activity (premium style)
  const acts=[];
  const src=mInv.length||mZoom.length?{inv:mInv,zoom:mZoom}:{inv:DB.investors,zoom:DB.zoom};
  src.inv.slice(-4).forEach(r=>acts.push({cls:'blue',text:`<b>"${r.kompaniya}"</b> — ${r.davlat||'N/A'}`,time:fmtDate(r.sana)}));
  src.zoom.slice(-3).forEach(r=>acts.push({cls:'green',text:`<b>${r.ism}</b> Zoom uchrashuvi`,time:fmtDate(r.sana)}));
  const actEl=document.getElementById('recentActivity');
  if(acts.length){
    actEl.innerHTML='<ul class="activity-list">'+acts.slice(0,7).map(a=>`
      <li class="activity-item">
        <div class="activity-dot ${a.cls}"></div>
        <div><div class="activity-text">${a.text}</div><div class="activity-time">${a.time}</div></div>
      </li>`).join('')+'</ul>';
  } else {
    actEl.innerHTML='<div style="text-align:center;padding:2rem;"><div style="font-size:2rem;opacity:.25;margin-bottom:.5rem;">📝</div><p style="font-size:.78rem;color:var(--text3);">Hali faoliyat yo\'q</p></div>';
  }

  // Render charts
  renderOverviewCharts(curYear,curMonth);
}

// ═══ OVERVIEW CHARTS ═══
function renderOverviewCharts(year,month){
  if(typeof ApexCharts==='undefined')return;

  // Sparkline helper — uses apexRender for cleanup
  function spark(el,data,color){
    var e=document.getElementById(el);
    if(!e)return;
    apexRender('spark-'+el, e, {
      chart:{type:'area',height:40,width:80,sparkline:{enabled:true},animations:{enabled:true,speed:1800,easing:'easeinout',dynamicAnimation:{enabled:true,speed:1500}}},
      series:[{data:data}],
      stroke:{width:2,curve:'smooth'},
      fill:{type:'gradient',gradient:{shadeIntensity:1,opacityFrom:.4,opacityTo:.05}},
      colors:[color],
      tooltip:{enabled:false}
    });
  }

  // Generate monthly data from DB
  var invByMonth=[],zoomByMonth=[],forumByMonth=[];
  for(var m=1;m<=12;m++){
    var mk=year+'-'+String(m).padStart(2,'0');
    invByMonth.push(DB.investors.filter(function(r){return r.sana&&r.sana.startsWith(mk)}).length);
    zoomByMonth.push(DB.zoom.filter(function(r){return r.sana&&r.sana.startsWith(mk)}).length);
    forumByMonth.push(DB.forums.filter(function(r){return r.sana&&r.sana.startsWith(mk)}).length);
  }

  // Sparklines
  spark('ov-spark1',invByMonth.slice(0,month),'#3a57e8');
  spark('ov-spark2',zoomByMonth.slice(0,month),'#059669');
  spark('ov-spark3',forumByMonth.slice(0,month),'#f97316');
  spark('ov-spark4',[DB.local.length],'#8b5cf6');

  // Main area chart
  var mainEl=document.getElementById('ov-main-chart');
  if(mainEl){
    var months=MONTHS_UZ.map(function(m){return m.slice(0,3)});
    apexRender('ov-main', mainEl, {
      chart:{type:'area',height:300,toolbar:{show:false},fontFamily:'Inter, sans-serif'},
      series:[
        {name:'Investorlar',data:invByMonth},
        {name:'Zoom',data:zoomByMonth},
        {name:'Forumlar',data:forumByMonth}
      ],
      colors:['#3a57e8','#059669','#f97316'],
      stroke:{width:2.5,curve:'smooth'},
      fill:{type:'gradient',gradient:{shadeIntensity:1,opacityFrom:.35,opacityTo:.05}},
      xaxis:{categories:months,labels:{style:{fontSize:'11px',colors:'#8A92A6'}},axisBorder:{show:false},axisTicks:{show:false}},
      yaxis:{labels:{style:{fontSize:'11px',colors:'#8A92A6'}},min:0},
      grid:{borderColor:'rgba(0,0,0,.06)',strokeDashArray:4,xaxis:{lines:{show:false}},yaxis:{lines:{show:true}}},
      dataLabels:{enabled:false},
      legend:{position:'top',horizontalAlign:'left',fontSize:'12px',fontWeight:600,labels:{colors:'#8A92A6'},markers:{width:8,height:8,radius:8}},
      tooltip:{theme:'light',y:{formatter:function(v){return v+' ta'}}}
    });
  }

  // Country bar chart
  var countryEl=document.getElementById('ov-country-chart');
  if(countryEl){
    var countries={};
    DB.investors.forEach(function(r){if(r.davlat){var d=r.davlat.replace(/[^a-zA-Zа-яА-ЯёЁ\s]/g,'').trim();if(d)countries[d]=(countries[d]||0)+1;}});
    var sorted=Object.entries(countries).sort(function(a,b){return b[1]-a[1]}).slice(0,8);
    if(sorted.length){
      apexRender('ov-country', countryEl, {
        chart:{type:'bar',height:250,toolbar:{show:false},fontFamily:'Inter, sans-serif'},
        series:[{name:'Investorlar',data:sorted.map(function(e){return e[1]})}],
        colors:['#3a57e8'],
        plotOptions:{bar:{borderRadius:6,horizontal:true,barHeight:'60%',distributed:true}},
        colors:['#3a57e8','#059669','#f97316','#8b5cf6','#06b6d4','#ef4444','#d946ef','#14b8a6'],
        xaxis:{categories:sorted.map(function(e){return e[0]}),labels:{style:{fontSize:'11px',colors:'#8A92A6'}}},
        yaxis:{labels:{style:{fontSize:'12px',fontWeight:600}}},
        grid:{borderColor:'rgba(0,0,0,.06)',xaxis:{lines:{show:true}},yaxis:{lines:{show:false}}},
        dataLabels:{enabled:true,style:{fontSize:'11px',fontWeight:700}},
        legend:{show:false},
        tooltip:{theme:'light'}
      });
    } else {
      countryEl.innerHTML='<div style="text-align:center;padding:2rem;color:var(--text3);font-size:.78rem;">Ma\'lumot kiritilgach ko\'rinadi</div>';
    }
  }
}

function renderOverviewDonut(vals,labels,colors){
  if(typeof ApexCharts==='undefined')return;
  var el=document.getElementById('ov-donut-chart');
  if(!el)return;
  apexRender('ov-donut', el, {
    chart:{type:'donut',height:240,fontFamily:'Inter, sans-serif',dropShadow:{enabled:true,top:2,left:0,blur:8,color:'#4361EE',opacity:.18}},
    series:vals,
    labels:labels,
    colors:colors,
    fill:{
      type:'gradient',
      gradient:{shade:'dark',type:'diagonal2',shadeIntensity:.35,inverseColors:false,opacityFrom:1,opacityTo:1,stops:[0,100]}
    },
    plotOptions:{pie:{donut:{size:'65%',labels:{show:true,name:{fontSize:'13px',fontWeight:700},value:{fontSize:'18px',fontWeight:800},total:{show:true,label:'Jami',fontSize:'12px',fontWeight:600,formatter:function(w){return w.globals.seriesTotals.reduce(function(a,b){return a+b},0)}}}}}},
    dataLabels:{enabled:false},
    legend:{position:'bottom',fontSize:'11px',fontWeight:600,labels:{colors:'#8A92A6'},markers:{width:8,height:8,radius:8}},
    stroke:{width:2,colors:['#fff']},
    tooltip:{theme:'light'}
  });
}

/* ═══════════════════════════════════════
   RENDER INVESTORS
═══════════════════════════════════════ */
var _invPage = 1;
var INV_PER_PAGE = 15;

function renderInvestors(page){
  if(page) _invPage = page;
  const inv=DB.investors;
  document.getElementById('inv-k1').textContent=inv.length;
  document.getElementById('inv-k2').textContent=inv.filter(r=>r.makom&&r.makom.toLowerCase().replace(/'/g,"'").includes('kelishilgan')).length;
  document.getElementById('inv-k3').textContent=inv.filter(r=>r.makom&&r.makom.toLowerCase().includes("ko'rib")).length;
  const totalVal = inv.reduce((sum,r)=>{
    if(!r.qiymat) return sum;
    const num = parseFloat(r.qiymat.replace(/[^0-9.]/g,''))||0;
    const isB = /B/i.test(r.qiymat);
    const isM = /M/i.test(r.qiymat);
    return sum + (isB ? num*1000 : isM ? num : num/1e6);
  }, 0);
  const dispVal = totalVal>=1000
    ? '$'+(totalVal/1000).toFixed(3).replace(/\.?0+$/,'')+'B'
    : '$'+totalVal.toFixed(2).replace(/\.?0+$/,'')+'M';
  document.getElementById('inv-k4').textContent = dispVal;
  document.getElementById('badge-investors').textContent=inv.length;

  const tb=document.getElementById('inv-tbody');
  if(!inv.length){
    tb.innerHTML=`<tr><td colspan="12"><div class="tc-empty"><div class="tc-empty-icon">🌍</div><p>Hali ma'lumot kiritilmagan</p></div></td></tr>`;
    renderInvPager(0,0);
    return;
  }

  const totalPages = Math.ceil(inv.length / INV_PER_PAGE);
  if(_invPage > totalPages) _invPage = totalPages;
  const start = (_invPage-1)*INV_PER_PAGE;
  const pageData = inv.slice(start, start+INV_PER_PAGE);

  tb.innerHTML=pageData.map((r,i)=>`
    <tr>
      <td>${start+i+1}</td><td>${r.shahar||'—'}</td><td>${fmtDate(r.sana)}</td>
      <td>${r.flag||'🌐'} ${r.davlat||'—'}</td>
      <td>${r.maqsad||'—'}</td>
      <td><b>${r.kompaniya||'—'}</b></td>
      <td>${r.loyiha||'—'}</td>
      <td class="td-num" style="color:#4361EE">${r.qiymat||'—'}</td>
      <td>${makomBadge(r.makom)}</td>
      <td>${r.hudud||'—'}</td>
      <td style="font-size:.69rem">${r.izoh||'—'}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteRecord('investors',${r.id})">🗑</button></td>
    </tr>`).join('');

  renderInvPager(totalPages, inv.length);
  renderInvCharts(inv);
}

function renderInvCharts(inv){
  // Monthly chart
  var months=['Yan','Fev','Mar','Apr','May','Iyu','Iyu','Avg','Sen','Okt','Noy','Dek'];
  var monthlyCounts=new Array(12).fill(0);
  inv.forEach(function(r){
    if(!r.sana)return;
    var parts=r.sana.split(/[.\-\/]/);
    var m=parseInt(parts[1]||parts[0])-1;
    if(m>=0&&m<12)monthlyCounts[m]++;
  });
  var el1=document.getElementById('inv-monthly-chart');
  if(el1&&typeof ApexCharts!=='undefined'){
    apexRender('inv-monthly', el1, {
      chart:{type:'area',height:280,toolbar:{show:false},fontFamily:'Inter,sans-serif',animations:{enabled:true,speed:1800,easing:'easeinout',dynamicAnimation:{enabled:true,speed:1500}}},
      series:[{name:'Investorlar',data:monthlyCounts}],
      xaxis:{categories:months},
      colors:['#4361EE'],
      fill:{type:'gradient',gradient:{shadeIntensity:1,opacityFrom:.4,opacityTo:.05}},
      stroke:{curve:'smooth',width:2.5},
      dataLabels:{enabled:false},
      grid:{borderColor:'var(--border)',strokeDashArray:4},
      tooltip:{theme:'dark'}
    });
  }
  // Country donut
  var countryCounts={};
  inv.forEach(function(r){if(r.davlat)countryCounts[r.davlat]=(countryCounts[r.davlat]||0)+1;});
  var cLabels=Object.keys(countryCounts).slice(0,8);
  var cVals=cLabels.map(function(k){return countryCounts[k];});
  var el2=document.getElementById('inv-country-donut');
  if(el2&&typeof ApexCharts!=='undefined'&&cLabels.length){
    apexRender('inv-country-donut', el2, {
      chart:{type:'donut',height:260,fontFamily:'Inter,sans-serif',animations:{enabled:true,speed:1800,easing:'easeinout',dynamicAnimation:{enabled:true,speed:1500}},dropShadow:{enabled:true,top:2,left:0,blur:8,color:'#4361EE',opacity:.18}},
      series:cVals,labels:cLabels,
      colors:['#4361EE','#059669','#f97316','#8b5cf6','#ef4444','#06b6d4','#d946ef','#eab308'],
      fill:{type:'gradient',gradient:{shade:'dark',type:'diagonal2',shadeIntensity:.35,inverseColors:false,opacityFrom:1,opacityTo:1,stops:[0,100]}},
      stroke:{width:2,colors:['#fff']},
      legend:{position:'bottom',fontSize:'11px'},
      dataLabels:{enabled:false},
      plotOptions:{pie:{donut:{size:'65%',labels:{show:true,total:{show:true,label:'Jami',fontSize:'13px',fontWeight:700}}}}}
    });
  }
}

function renderIcCharts(companies){
  // Monthly chart for investor base — count UNIQUE companies per month (not contacts)
  var months=['Yan','Fev','Mar','Apr','May','Iyu','Iyu','Avg','Sen','Okt','Noy','Dek'];
  var monthlyGroups=new Array(12).fill(null).map(function(){return {};});
  companies.forEach(function(r){
    var d = r.sana || r.date || r.createdAt || '';
    if(!d) return;
    var parts = String(d).split(/[.\-\/]/);
    var m = parseInt(parts[1]||parts[0])-1;
    if(m>=0&&m<12){
      var k = (typeof getInvestorCompanyGroupKey === 'function') ? getInvestorCompanyGroupKey(r) : String(r.kompaniya||r.id||'').toLowerCase();
      monthlyGroups[m][k] = true;
    }
  });
  var monthlyCounts = monthlyGroups.map(function(s){return Object.keys(s).length;});
  var el1=document.getElementById('ic-monthly-chart');
  if(el1&&typeof ApexCharts!=='undefined'){
    apexRender('ic-monthly', el1, {
      chart:{type:'area',height:180,toolbar:{show:false},fontFamily:'Inter,sans-serif',animations:{enabled:true,speed:1800,easing:'easeinout',dynamicAnimation:{enabled:true,speed:1500}}},
      series:[{name:'Kompaniyalar',data:monthlyCounts}],
      xaxis:{categories:months},
      colors:['#059669'],
      fill:{type:'gradient',gradient:{shadeIntensity:1,opacityFrom:.4,opacityTo:.05}},
      stroke:{curve:'smooth',width:2.5},
      dataLabels:{enabled:false},
      grid:{borderColor:'var(--border)',strokeDashArray:4},
      tooltip:{theme:'dark'}
    });
  }
  // Extract country name helper
  var extractCountry = function(r){
    var c = r.davlat || r.country || '';
    if(!c) return "Noma'lum";
    var parts = c.split(',');
    var name = parts.length > 1 ? parts[parts.length - 1].trim() : c.trim();
    return name || "Noma'lum";
  };
  var COLORS = ['#4361EE','#059669','#f97316','#8b5cf6','#ef4444','#06b6d4','#d946ef','#eab308'];
  var donutOpts = function(vals, labels, totalLabel){
    return {
      chart:{type:'donut',height:180,fontFamily:'Inter,sans-serif',animations:{enabled:true,speed:1500},dropShadow:{enabled:true,top:2,left:0,blur:8,color:'#4361EE',opacity:.18}},
      series:vals,labels:labels,
      colors:COLORS,
      fill:{
        type:'gradient',
        gradient:{
          shade:'dark',
          type:'diagonal2',
          shadeIntensity:.35,
          gradientToColors:['#1e3a8a','#065f46','#c2410c','#6b21a8','#991b1b','#0e7490','#a21caf','#854d0e'],
          inverseColors:false,
          opacityFrom:1,
          opacityTo:1,
          stops:[0,100]
        }
      },
      stroke:{width:2,colors:['#fff']},
      legend:{position:'right',fontSize:'10px',offsetX:-10,offsetY:0,height:160,itemMargin:{vertical:2}},
      dataLabels:{enabled:false},
      plotOptions:{pie:{customScale:1,offsetX:-20,donut:{size:'62%',labels:{show:true,total:{show:true,label:totalLabel||'Jami',fontSize:'12px',fontWeight:700},value:{fontSize:'16px',fontWeight:700}}}}}
    };
  };

  // Period filter from selector
  var periodSel = document.getElementById('ic-period-select');
  var periodVal = periodSel ? periodSel.value : 'month';
  var periodLabels = {all:'Barchasi', today:'Bugun', week:'Shu hafta', month:'Shu oy', quarter:'Shu chorak', year:'Shu yil'};
  var periodLabel = periodLabels[periodVal] || 'Shu oy';
  var range = (typeof getCrmPeriodRange==='function') ? (function(){
    var dummy = document.getElementById('crm-period-select');
    var origVal = dummy ? dummy.value : null;
    if(dummy) dummy.value = periodVal;
    var r = getCrmPeriodRange();
    if(dummy && origVal !== null) dummy.value = origVal;
    return r;
  })() : null;
  var thisPeriod = (range && typeof inRange==='function') ? companies.filter(function(c){return inRange(c, range);}) : companies;

  var tallyCountries = function(arr){
    // Unique kompaniyalar bo'yicha sanaymiz (har kompaniyani 1 marta) — KPI bilan mos
    var seenGroups = {};
    var map = {};
    arr.forEach(function(r){
      var groupKey = (typeof getInvestorCompanyGroupKey === 'function')
        ? getInvestorCompanyGroupKey(r)
        : String(r.kompaniya || r.id || '').toLowerCase();
      if(seenGroups[groupKey]) return; // bu kompaniya allaqachon hisoblangan
      seenGroups[groupKey] = true;
      var k = extractCountry(r);
      map[k] = (map[k]||0)+1;
    });
    // Barcha davlatlar — top 7 + 1 "Boshqalar" slice (qolgan davlatlar yig'indisi)
    // KPI bilan mos: total = barcha unique kompaniyalar (303 = 303)
    var sorted = Object.keys(map).sort(function(a,b){return map[b]-map[a];});
    var TOP_N = 7;
    if(sorted.length <= TOP_N + 1){
      // Hammasi sig'adi — slice qilmaymiz
      return { labels: sorted, vals: sorted.map(function(k){return map[k];}) };
    }
    var topLabels = sorted.slice(0, TOP_N);
    var topVals = topLabels.map(function(k){return map[k];});
    var othersTotal = 0;
    for(var i = TOP_N; i < sorted.length; i++){
      othersTotal += map[sorted[i]];
    }
    if(othersTotal > 0){
      topLabels.push('Boshqalar');
      topVals.push(othersTotal);
    }
    return { labels: topLabels, vals: topVals };
  };

  var monthTally = tallyCountries(thisPeriod);
  var el2 = document.getElementById('ic-country-donut');
  if(el2 && typeof ApexCharts!=='undefined'){
    if(monthTally.labels.length){
      apexRender('ic-country-donut', el2, donutOpts(monthTally.vals, monthTally.labels, periodLabel));
    } else {
      el2.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:180px;color:var(--text3);font-size:.75rem">'+periodLabel+' davrida kompaniya yo\'q</div>';
    }
  }
  // Update donut card title
  var titleEl = document.querySelector('#ic-country-donut').closest('.chart-card');
  if(titleEl){
    var titleHEl = titleEl.querySelector('.chart-card-title');
    if(titleHEl) titleHEl.textContent = 'Davlatlar — '+periodLabel.toLowerCase();
  }

  var totalTally = tallyCountries(companies);
  var el3 = document.getElementById('ic-country-donut-total');
  if(el3 && typeof ApexCharts!=='undefined' && totalTally.labels.length){
    apexRender('ic-country-donut-total', el3, donutOpts(totalTally.vals, totalTally.labels, 'Jami'));
  }
}

function renderInvPager(totalPages, total){
  let pager = document.getElementById('inv-pager');
  if(!pager){
    pager = document.createElement('div');
    pager.id = 'inv-pager';
    const tcard = document.querySelector('#page-investors .tcard');
    if(tcard) tcard.appendChild(pager);
  }
  if(totalPages <= 1){ pager.innerHTML=''; return; }
  const start = (_invPage-1)*INV_PER_PAGE+1;
  const end = Math.min(_invPage*INV_PER_PAGE, total);
  let btns = '';
  for(let p=1;p<=totalPages;p++){
    btns += `<button onclick="renderInvestors(${p})" style="min-width:32px;height:32px;border-radius:8px;border:1px solid ${p===_invPage?'#4361EE':'var(--border)'};background:${p===_invPage?'#4361EE':'var(--card)'};color:${p===_invPage?'#fff':'var(--text)'};font-size:.72rem;font-weight:600;cursor:pointer;transition:all .15s">${p}</button>`;
  }
  pager.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;padding:.85rem 1.3rem;border-top:1px solid var(--border);flex-wrap:wrap;gap:.5rem">
    <span style="font-size:.72rem;color:var(--text3)">${start}–${end} / ${total} ta yozuv</span>
    <div style="display:flex;gap:.35rem;align-items:center">
      <button onclick="renderInvestors(${_invPage-1})" ${_invPage<=1?'disabled':''} style="min-width:32px;height:32px;border-radius:8px;border:1px solid var(--border);background:var(--card);color:var(--text);font-size:.8rem;cursor:pointer;opacity:${_invPage<=1?0.3:1}">&#8249;</button>
      ${btns}
      <button onclick="renderInvestors(${_invPage+1})" ${_invPage>=totalPages?'disabled':''} style="min-width:32px;height:32px;border-radius:8px;border:1px solid var(--border);background:var(--card);color:var(--text);font-size:.8rem;cursor:pointer;opacity:${_invPage>=totalPages?0.3:1}">&#8250;</button>
    </div>
  </div>`;
}

/* ═══════════════════════════════════════
   RENDER LOCAL
═══════════════════════════════════════ */
function renderLocal(){
  const loc=DB.local;
  document.getElementById('loc-k1').textContent=loc.length;
  document.getElementById('loc-k2').textContent=loc.filter(r=>r.holat==='Tayyor').length;
  document.getElementById('loc-k3').textContent=loc.filter(r=>r.holat==='Muzokarada').length;
  const total=loc.reduce((s,r)=>s+(parseFloat(r.summa)||0),0);
  document.getElementById('loc-k4').textContent=total>0?'$'+Math.round(total/1e6)+'M':'$0';
  document.getElementById('badge-local').textContent=loc.length;

  const tb=document.getElementById('loc-tbody');
  if(!loc.length){
    tb.innerHTML='<tr><td colspan="9"><div class="tc-empty"><div class="tc-empty-icon">🏢</div><p>Hali ma\'lumot kiritilmagan</p></div></td></tr>';
    return;
  }
  tb.innerHTML=loc.map((r,i)=>`
    <tr>
      <td>${i+1}</td>
      <td><b>${r.kompaniya||'—'}</b></td>
      <td>${r.rahbar||'—'}<br><span style="font-size:.64rem;color:var(--text3)">${r.lavozim||''}</span></td>
      <td>${r.soha||'—'}</td>
      <td class="td-num" style="color:#059669">${fmtMoney(r.summa)}</td>
      <td>${holatBadge(r.holat)}</td>
      <td>${r.tel||'—'}</td>
      <td style="font-size:.69rem">${r.izoh||'—'}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteRecord('local',${r.id})">🗑</button></td>
    </tr>`).join('');
  renderLocCharts(loc);
}

function renderLocCharts(loc){
  // Status donut
  var statusMap={};
  loc.forEach(function(r){var h=r.holat||'Noma\'lum';statusMap[h]=(statusMap[h]||0)+1;});
  var sLabels=Object.keys(statusMap);
  var sVals=sLabels.map(function(k){return statusMap[k];});
  var el1=document.getElementById('loc-status-chart');
  if(el1&&typeof ApexCharts!=='undefined'&&sLabels.length){
    apexRender('loc-status', el1, {
      chart:{type:'donut',height:260,fontFamily:'Inter,sans-serif',animations:{enabled:true,speed:1800,easing:'easeinout',dynamicAnimation:{enabled:true,speed:1500}},dropShadow:{enabled:true,top:2,left:0,blur:8,color:'#4361EE',opacity:.18}},
      series:sVals,labels:sLabels,
      colors:['#059669','#f97316','#4361EE','#ef4444','#8b5cf6'],
      fill:{type:'gradient',gradient:{shade:'dark',type:'diagonal2',shadeIntensity:.35,inverseColors:false,opacityFrom:1,opacityTo:1,stops:[0,100]}},
      stroke:{width:2,colors:['#fff']},
      legend:{position:'bottom',fontSize:'11px'},
      dataLabels:{enabled:false},
      plotOptions:{pie:{donut:{size:'65%',labels:{show:true,total:{show:true,label:'Jami',fontSize:'13px',fontWeight:700}}}}}
    });
  }
  // Sector bar chart
  var sectorMap={};
  loc.forEach(function(r){
    var s=r.soha||'Boshqa';
    var val=parseFloat(r.summa)||0;
    sectorMap[s]=(sectorMap[s]||0)+val;
  });
  var secLabels=Object.keys(sectorMap).slice(0,8);
  var secVals=secLabels.map(function(k){return Math.round(sectorMap[k]/1e6);});
  var el2=document.getElementById('loc-sector-chart');
  if(el2&&typeof ApexCharts!=='undefined'&&secLabels.length){
    apexRender('loc-sector', el2, {
      chart:{type:'bar',height:260,toolbar:{show:false},fontFamily:'Inter,sans-serif',animations:{enabled:true,speed:1800,easing:'easeinout',dynamicAnimation:{enabled:true,speed:1500}}},
      series:[{name:'Investitsiya ($M)',data:secVals}],
      xaxis:{categories:secLabels,labels:{style:{fontSize:'10px'}}},
      colors:['#059669'],
      plotOptions:{bar:{borderRadius:6,horizontal:true}},
      dataLabels:{enabled:true,formatter:function(v){return v>0?'$'+v+'M':'';},style:{fontSize:'10px'}},
      grid:{borderColor:'var(--border)',strokeDashArray:4},
      tooltip:{theme:'dark'}
    });
  }
}

/* ═══════════════════════════════════════
   RENDER ZOOM
═══════════════════════════════════════ */
function renderZoom(){
  const zm=DB.zoom;
  document.getElementById('zm-k1').textContent=zm.length;
  document.getElementById('zm-k2').textContent=zm.filter(r=>r.natijaHolat==='Ijobiy').length;
  document.getElementById('zm-k3').textContent=zm.reduce((s,r)=>s+(parseInt(r.ishtirokchi)||1),0);
  document.getElementById('zm-k4').textContent=new Set(zm.map(r=>r.davlat).filter(Boolean)).size;
  document.getElementById('badge-zoom').textContent=zm.length;

  const c=document.getElementById('zoom-cards');
  if(!zm.length){
    c.innerHTML='<div style="grid-column:1/-1"><div class="tc-empty" style="background:var(--card);border-radius:var(--radius);border:1px solid var(--border)"><div class="tc-empty-icon">💻</div><p>Hali uchrashuv kiritilmagan</p></div></div>';
    return;
  }
  c.innerHTML=zm.map(r=>`
    <div class="data-card" onclick="openZoomDetail(${r.id})">
      <div class="dc-top">
        <div><div class="dc-name">${r.ism||'—'}</div><div class="dc-org">${r.org||''}</div></div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px">
          <span class="dc-date-pill">${fmtDate(r.sana)}</span>
          <span style="font-size:.61rem;color:rgba(180,210,255,.7)">${r.davlat||''}</span>
        </div>
      </div>
      <div class="dc-body">
        <div class="dc-desc">${r.desc||'—'}</div>
        <div class="dc-result"><b>Natija:</b> ${r.natija||'—'}</div>
      </div>
      <div class="dc-actions">
        ${natijaHolatBadge(r.natijaHolat)}
        <span style="font-size:.63rem;color:var(--text3);margin-left:4px">👥 ${r.ishtirokchi||1}</span>
        <button class="btn btn-danger btn-sm" style="margin-left:auto" onclick="event.stopPropagation();deleteRecord('zoom',${r.id})">🗑</button>
      </div>
    </div>`).join('');
}

/* ═══════════════════════════════════════
   RENDER FORUMS
═══════════════════════════════════════ */
function renderForums(){
  const fr=DB.forums;
  // Count international forums
  let intlTotal=0, intlAbroad=0, intlUz=0;
  INTL_REGIONS.forEach(function(r){
    var arr = INTL_FORUMS[r.key]||[];
    intlTotal += arr.length;
    if(r.key==='uz') intlUz += arr.length; else intlAbroad += arr.length;
  });
  document.getElementById('fr-k1').textContent=fr.length + intlTotal;
  document.getElementById('fr-k2').textContent=fr.filter(r=>r.holat&&r.holat.includes('tasdiqlangan')).length;
  document.getElementById('fr-k3').textContent=fr.filter(r=>r.davlat&&r.davlat!=="O'zbekiston").length + intlAbroad;
  document.getElementById('fr-k4').textContent=fr.filter(r=>r.davlat==="O'zbekiston").length + intlUz;
  document.getElementById('badge-forums').textContent=fr.length + intlTotal;

  const c=document.getElementById('forum-cards');
  if(!fr.length){
    c.innerHTML='<div style="grid-column:1/-1"><div class="tc-empty" style="background:var(--card);border-radius:var(--radius);border:1px solid var(--border)"><div class="tc-empty-icon">🗓</div><p>Hali forum kiritilmagan</p></div></div>';
    return;
  }
  c.innerHTML=fr.map(r=>{
    const d=r.sana?r.sana.split('-'):['','',''];
    const mi=parseInt(d[1])-1;
    const docCount = (r.docs||[]).length;
    return`
    <div class="forum-card" onclick="openForumDetail(${r.id})" style="cursor:pointer">
      <div class="fc-top">
        <div class="fc-title">${r.nom||'—'}</div>
        <div style="text-align:right">
          <div class="fc-month">${MONTHS_SHORT[mi]||''}</div>
          <div class="fc-day">${parseInt(d[2])||'?'}</div>
        </div>
      </div>
      <div class="fc-body">
        <div class="fc-loc">📍 ${r.shahar||''}, ${r.davlat||''}</div>
        <div class="fc-desc">${r.desc||'—'}</div>
        <div class="fc-foot">
          <div style="font-size:.67rem;font-weight:600;color:var(--text)">${r.holat||'—'}</div>
          <div style="display:flex;align-items:center;gap:4px">
            <span class="badge bdg-blue">${r.turi||'Forum'}</span>
            ${docCount?`<span style="font-size:.6rem;background:rgba(67,97,238,.15);color:#4361EE;padding:2px 6px;border-radius:10px">📎${docCount}</span>`:''}
            <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteRecord('forums',${r.id})">🗑</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}
