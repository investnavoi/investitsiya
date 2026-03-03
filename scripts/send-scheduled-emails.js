/**
 * Rejalashtirilgan Email Yuborish Skripti
 * Har 30 daqiqada GitHub Actions orqali ishga tushadi
 */

const nodemailer = require('nodemailer');
const admin      = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId:   process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});
const db = admin.firestore();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function getTashkentNow() {
  const now = new Date(Date.now() + 5 * 60 * 60 * 1000);
  const date    = now.toISOString().split('T')[0];
  const hours   = now.getUTCHours();
  const minutes = now.getUTCMinutes();
  const weekday = now.getUTCDay();
  const day     = now.getUTCDate();
  return { date, hours, minutes, weekday, day };
}

function isTimeMatch(schedTime, hours, minutes) {
  if (!schedTime) return true;
  const [h, m] = schedTime.split(':').map(Number);
  const currentSlot = minutes < 30 ? 0 : 30;
  const schedSlot   = m < 30 ? 0 : 30;
  return h === hours && schedSlot === currentSlot;
}

async function main() {
  const { date, hours, minutes, weekday, day } = getTashkentNow();
  const timeStr = `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`;
  console.log(`Toshkent vaqti: ${date} ${timeStr}`);

  const snapshot = await db.collection('investorCompanies').get();
  const companies = [];
  snapshot.forEach(doc => companies.push({ _docId: doc.id, ...doc.data() }));
  console.log(`Jami: ${companies.length} ta kompaniya`);

  const toSend = companies.filter(c => {
    if (!c.emailSchedule?.active || !c.email) return false;
    const s = c.emailSchedule;
    if (!isTimeMatch(s.time, hours, minutes)) return false;
    if (s.type === 'once')    return s.date === date;
    if (s.type === 'monthly') return parseInt(s.day) === day;
    if (s.type === 'weekly')  return parseInt(s.weekday) === weekday;
    return false;
  });

  console.log(`Yuborilishi kerak: ${toSend.length} ta`);
  if (!toSend.length) { console.log('Hozir yuborish kerak emas.'); process.exit(0); }

  let sent = 0, failed = 0;
  for (const c of toSend) {
    try {
      const msg = (c.emailSchedule.message || '')
        .replace(/\{kompaniya\}/g, c.kompaniya || '')
        .replace(/\{rahbar\}/g,    c.rahbar    || '');

      await transporter.sendMail({
        from:    `"Navoiy Investitsiya" <${process.env.GMAIL_USER}>`,
        to:      c.email,
        subject: c.emailSchedule.subject || 'Investitsiya xabari',
        text:    msg,
        html:    `<div style="font-family:sans-serif;line-height:1.7">${msg.replace(/\n/g,'<br>')}</div>`,
      });

      const upd = { emailSent: true, emailSentDate: date, 'emailSchedule.lastSent': date };
      if (c.emailSchedule.type === 'once') upd['emailSchedule.active'] = false;
      await db.collection('investorCompanies').doc(c._docId).update(upd);

      console.log(`  OK: ${c.kompaniya} -> ${c.email}`);
      sent++;
    } catch(e) {
      console.error(`  XATO (${c.kompaniya}):`, e.message);
      failed++;
    }
  }
  console.log(`Natija: ${sent} yuborildi, ${failed} xato`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
