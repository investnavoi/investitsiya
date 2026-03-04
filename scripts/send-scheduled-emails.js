const nodemailer = require('nodemailer');
const admin      = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId:   process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});
const db = admin.firestore();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
});

function getTashkentNow() {
  const now = new Date(Date.now() + 5 * 60 * 60 * 1000);
  const isoDate = now.toISOString().split("T")[0];
  return {
    isoDate,
    hours:   now.getUTCHours(),
    minutes: now.getUTCMinutes(),
    weekday: now.getUTCDay(),
    day:     now.getUTCDate(),
  };
}

function toISO(s) {
  if (!s) return "";
  s = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(s)) {
    const [d, m, y] = s.split(".");
    return y + "-" + m + "-" + d;
  }
  return s;
}

function isTimeMatch(schedTime, hours, minutes) {
  if (!schedTime) return true;
  let t = String(schedTime).trim();
  // AM/PM -> 24h
  const ampm = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (ampm) {
    let h = parseInt(ampm[1]), m2 = parseInt(ampm[2]);
    const p = ampm[3].toUpperCase();
    if (p === "PM" && h !== 12) h += 12;
    if (p === "AM" && h === 12) h = 0;
    t = String(h).padStart(2,"0") + ":" + String(m2).padStart(2,"0");
  }
  const parts = t.split(":");
  if (parts.length < 2) return true;
  const sh = parseInt(parts[0]), sm = parseInt(parts[1]);
  const schedMins   = sh * 60 + sm;
  const currentMins = hours * 60 + minutes;
  // YANGI MANTIQ: Rejalashtirilgan vaqt o'tgan bo'lsa → yuborish.
  // lastSent tekshiruvi main() da bor — bugun qayta yuborilmaydi.
  // Masalan: sched=09:30, hozir=10:04 → true (vaqti o'tgan, yuborish kerak)
  // Masalan: sched=15:00, hozir=10:04 → false (hali erta)
  return currentMins >= schedMins;
}

async function main() {
  const { isoDate, hours, minutes, weekday, day } = getTashkentNow();
  const hh = String(hours).padStart(2,"0"), mm = String(minutes).padStart(2,"0");
  console.log("Toshkent vaqti: " + isoDate + " " + hh + ":" + mm + " (weekday=" + weekday + ", day=" + day + ")");

  const snap = await db.collection("investorCompanies").get();
  const cos = [];
  snap.forEach(doc => cos.push(Object.assign({ _docId: doc.id }, doc.data())));
  console.log("Jami: " + cos.length + " ta kompaniya");

  const withS = cos.filter(c => c.emailSchedule);
  console.log("emailSchedule mavjud: " + withS.length + " ta");
  withS.forEach(c => {
    const s = c.emailSchedule;
    console.log("  - " + c.kompaniya + ": active=" + s.active + ", type=" + s.type + ", date=\"" + s.date + "\", time=\"" + s.time + "\"");
  });

  const toSend = cos.filter(c => {
    if (!c.emailSchedule || !c.emailSchedule.active || !c.email) return false;
    const s = c.emailSchedule;
    if (!isTimeMatch(s.time, hours, minutes)) {
      console.log("  [vaqt mos emas] " + c.kompaniya + ": " + s.time + " vs " + hh + ":" + mm);
      return false;
    }
    // Bugun allaqachon yuborilganmi?
    if (s.lastSent === isoDate) {
      console.log("  [bugun yuborilgan] " + c.kompaniya);
      return false;
    }
    if (s.type === "once") {
      const iso = toISO(s.date);
      const ok = iso === isoDate;
      console.log("  [once] " + c.kompaniya + ": \"" + s.date + "\"->\""  + iso + "\" vs \"" + isoDate + "\" -> " + (ok ? "OK" : "mos emas"));
      return ok;
    }
    if (s.type === "monthly") return parseInt(s.day) === day;
    if (s.type === "weekly")  return parseInt(s.weekday) === weekday;
    return false;
  });

  console.log("Yuborilishi kerak: " + toSend.length + " ta");
  if (!toSend.length) { console.log("Hozir yuborish kerak emas."); process.exit(0); }

  let sent = 0, failed = 0;
  for (const c of toSend) {
    try {
      const msg = (c.emailSchedule.message || "")
        .replace(/\{kompaniya\}/g, c.kompaniya || "")
        .replace(/\{rahbar\}/g,    c.rahbar    || "");
      await transporter.sendMail({
        from:    "\"Navoiy Investitsiya\" <" + process.env.GMAIL_USER + ">",
        to:      c.email,
        subject: c.emailSchedule.subject || "Investitsiya xabari",
        text:    msg,
        html:    "<div style=\"font-family:sans-serif;line-height:1.7\">" + msg.replace(/\n/g,"<br>") + "</div>",
      });
      const upd = { emailSent: true, emailSentDate: isoDate, "emailSchedule.lastSent": isoDate };
      if (c.emailSchedule.type === "once") upd["emailSchedule.active"] = false;
      await db.collection("investorCompanies").doc(c._docId).update(upd);
      console.log("  OK: " + c.kompaniya + " -> " + c.email);
      sent++;
    } catch(e) {
      console.error("  XATO (" + c.kompaniya + "):", e.message);
      failed++;
    }
  }
  console.log("Natija: " + sent + " yuborildi, " + failed + " xato");
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error("Kritik xato:", e); process.exit(1); });
