// Test Gemini API key on load
async function testGeminiKey(){
  var key = getGeminiKey();
  if(!key){ return false; }
  try {
    var r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + key);
    if(r.ok){ console.log('✅ Gemini API key ishlayapti'); return true; }
    var e = await r.json().catch(function(){return {};});
    console.error('❌ Gemini API xato:', r.status, e.error?.message||'');
    if(r.status===403) console.error('👉 API yoqish: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
    return false;
  } catch(err){ console.error('Gemini test xato:',err); return false; }
}
if(typeof getGeminiKey==='function') testGeminiKey();

var NAVOIY_CONTEXT = `Sen Navoiy viloyati investitsiya bo'limi AI yordamchisisan. Faqat O'zbek tilida javob ber (agar foydalanuvchi boshqa tilda yozsa, o'sha tilda javob ber).

Navoiy viloyati haqida asosiy ma'lumotlar:
- Joylashuvi: O'zbekiston markaziy qismida, 110,800 km² maydon
- Aholisi: ~1 million
- Viloyat markazi: Navoiy shahri
- Asosiy shaharlar: Navoiy, Zarafshon, Uchquduq, Nurota, Konimex
- Iqlimi: Qurg'oqchil, cho\'l iqlimi, yozda 45°C gacha

Asosiy sanoat va investitsiya imkoniyatlari:
1. KON SANOATI (eng muhim):
   - Oltin: Muruntov (dunyodagi eng katta ochiq oltin koni), Zarafshon
   - Uran: O'zbekiston dunyoda 5-o\'rinda uran qazib olishda
   - Mis, volfram, fosforitlar, marmar, granit
   - NMMC (Navoiy Kon-Metallurgiya Kombinati) — eng yirik korxona

2. ENERGETIKA:
   - Quyosh energiyasi potensiali juda yuqori (yiliga 300+ quyoshli kun)
   - Navoiy issiqlik elektr stansiyasi
   - Atom energetikasi rejasi (O'zbekiston-Rossiya hamkorligi)

3. SANOAT:
   - Kimyo sanoati (Navoiyazot)
   - Sement ishlab chiqarish
   - Qurilish materiallari
   - To'qimachilik

4. ERKIN IQTISODIY ZONA:
   - "Navoiy" erkin iqtisodiy zonasi — soliq imtiyozlari
   - Navoiy xalqaro aeroporti — logistika markazi
   - Navoiy-Buxoro transport koridori

5. QISHLOQ XO'JALIGI:
   - Paxta, bug'doy, sabzavotlar
   - Chorvachilik
   - Ipakchilik

6. TURIZM:
   - Nurota tog'lari — ekoturizm
   - Sarmishsoy toshyozuvlari (3000+ petrogliflar)
   - Qizilqum cho'li safari
   - Orol dengizi regioniga yaqinlik

Investitsiya afzalliklari:
- Soliq imtiyozlari erkin iqtisodiy zonada
- Arzon ishchi kuchi
- Boy foydali qazilma resurslari
- Strategik joylashuv (Markaziy Osiyo markazi)
- Rivojlangan transport infratuzilmasi
- Hukumat tomonidan investorlar himoyasi

Javob berishda:
- Qisqa va aniq javob ber
- Raqamlar va faktlar keltir
- Investorlarga foydali ma'lumot ber
- Agar bilmasang, "bu haqda aniq ma'lumotim yo'q" de`;

var chatHistory = [];

function toggleChat(){
  var panel = document.getElementById('chatPanel');
  panel.classList.toggle('open');
  if(panel.classList.contains('open')){
    document.getElementById('chatInput').focus();
    document.getElementById('chatDot').style.display = 'none';
  }
}

async function sendChat(){
  var input = document.getElementById('chatInput');
  var msg = input.value.trim();
  if(!msg) return;

  input.value = '';
  addChatMsg(msg, 'user');
  
  var sendBtn = document.getElementById('chatSendBtn');
  sendBtn.disabled = true;
  
  addChatMsg('Yozmoqda...', 'bot typing');

  chatHistory.push({role:'user', parts:[{text:msg}]});

  try {
    var body = {
      system_instruction: {parts:[{text: NAVOIY_CONTEXT}]},
      contents: chatHistory,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024
      }
    };

    var reply = '';
    var lastError = '';
    var success = false;

    // Try each model until one works
    for(var m = 0; m < GEMINI_MODELS.length; m++){
      try {
        var resp = await fetch(geminiUrl(GEMINI_MODELS[m]), {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(body)
        });

        if(resp.ok){
          var data = await resp.json();
          if(data.candidates && data.candidates[0] && data.candidates[0].content){
            reply = data.candidates[0].content.parts[0].text;
            success = true;
            break;
          }
        } else {
          var err = await resp.json().catch(function(){return {};});
          lastError = (err.error?.message || 'Status ' + resp.status);
          console.log('Gemini ' + GEMINI_MODELS[m] + ' xato:', lastError);
          // If 403 or API not enabled, try next model
          if(resp.status === 403 || resp.status === 429) continue;
          // Other errors - still try next
          continue;
        }
      } catch(fetchErr){
        lastError = fetchErr.message;
        continue;
      }
    }

    removeTyping();

    if(success){
      chatHistory.push({role:'model', parts:[{text:reply}]});
      if(chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
      addChatMsg(reply, 'bot');
    } else {
      chatHistory.pop(); // remove failed user msg from history
      if(lastError.indexOf('API_KEY') !== -1 || lastError.indexOf('API key') !== -1){
        addChatMsg('⚠️ API kalit noto\'g\'ri yoki Generative Language API yoqilmagan.\n\nTuzatish: aistudio.google.com → Get API Key → yangi kalit yarating.', 'bot');
      } else if(lastError.indexOf('quota') !== -1 || lastError.indexOf('429') !== -1 || lastError.indexOf('RESOURCE_EXHAUSTED') !== -1){
        addChatMsg('⚠️ Kunlik limit tugadi. Ertaga qayta urinib ko\'ring.', 'bot');
      } else if(lastError.indexOf('not found') !== -1 || lastError.indexOf('404') !== -1){
        addChatMsg('⚠️ Model topilmadi. Xato: ' + lastError, 'bot');
      } else {
        addChatMsg('⚠️ Xato: ' + lastError + '\n\nIltimos qaytadan urinib ko\'ring yoki admin bilan bog\'laning.', 'bot');
      }
    }

  } catch(e){
    removeTyping();
    chatHistory.pop();
    addChatMsg('⚠️ Tarmoq xatosi: ' + e.message, 'bot');
  }

  sendBtn.disabled = false;
}

function addChatMsg(text, type){
  var container = document.getElementById('chatMsgs');
  var div = document.createElement('div');
  div.className = 'chat-msg ' + type;
  
  // Simple markdown: **bold**, \n = <br>
  var html = text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.*?)\*\*/g,'<b>$1</b>')
    .replace(/\n/g,'<br>');
  div.innerHTML = html;
  
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function removeTyping(){
  var msgs = document.querySelectorAll('.chat-msg.typing');
  msgs.forEach(function(m){ m.remove(); });
}
