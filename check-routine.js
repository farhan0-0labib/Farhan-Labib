const fs = require('fs');
const path = require('path');

const WINDOW_MINUTES = 60;          // how late (after notify_time) a run may still send (safe: duplicates are blocked below)
const SENT_DIR = path.join(__dirname, '.sent');   // markers of already-sent reminders (kept between runs via Actions cache)
const FORCE_TEST = process.env.FORCE_TEST === 'true';

// Current time in Bangladesh
const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Dhaka', hourCycle: 'h23', hour: '2-digit', minute: '2-digit', weekday: 'long'
});
const parts = formatter.formatToParts(new Date());
const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date()); // YYYY-MM-DD
const currentHour = parseInt(parts.find(p => p.type === 'hour').value, 10) % 24;
const currentMinute = parseInt(parts.find(p => p.type === 'minute').value, 10);
const todayDayName = parts.find(p => p.type === 'weekday').value;
const currentMinutes = currentHour * 60 + currentMinute;

function parseTimeToMinutes(value) {
  const s = String(value).replace(/["']/g, '').trim();
  if (/^\d{5,}$/.test(s)) {                       // seconds, e.g. 54600
    const t = parseInt(s, 10);
    return Math.floor(t / 3600) * 60 + Math.floor((t % 3600) / 60);
  }
  if (/[:.]/.test(s)) {                           // 15:10 or 15.10
    const [h, m] = s.split(/[:.]/);
    return parseInt(h, 10) * 60 + parseInt(m, 10);
  }
  if (/^\d+$/.test(s)) {                          // 1510
    const p = s.padStart(4, '0');
    return parseInt(p.slice(0, 2), 10) * 60 + parseInt(p.slice(2), 10);
  }
  return null;
}

async function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error('Missing TELEGRAM_TOKEN or TELEGRAM_CHAT_ID (check repo Settings > Secrets and variables > Actions).');
    process.exit(1);
  }
  // Plain text on purpose: no parse_mode, so special characters can't break delivery.
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
  const body = await res.text();
  if (!res.ok) {
    console.error(`Telegram rejected the message (HTTP ${res.status}): ${body}`);
    process.exit(1);
  }
  console.log('Message sent successfully!', body);
}

async function checkRoutine() {
  console.log(`Dhaka time now: ${todayDayName} ${currentHour}:${String(currentMinute).padStart(2, '0')}`);

  if (FORCE_TEST) {
    await sendTelegramMessage('✅ Test from GitHub Actions: secrets and workflow are working.');
    return;
  }

  fs.mkdirSync(SENT_DIR, { recursive: true });
  for (const m of fs.readdirSync(SENT_DIR)) {      // drop markers from previous days
    if (!m.startsWith(dateStr)) fs.unlinkSync(path.join(SENT_DIR, m));
  }

  const routinePath = path.join(__dirname, '_routine');
  if (!fs.existsSync(routinePath)) { console.log('No _routine folder.'); return; }

  const files = fs.readdirSync(routinePath).filter(f => f.toLowerCase().includes(todayDayName.toLowerCase()));
  if (!files.length) { console.log(`No routine file for ${todayDayName}.`); return; }

  for (const file of files) {                       // every file for today, e.g. wednesday.md AND wednesday-1.md
    console.log(`--- ${file}`);
    const content = fs.readFileSync(path.join(routinePath, file), 'utf8').replace(/\r/g, '');
    const frontmatter = content.split('---')[1];
    if (!frontmatter) { console.log('No frontmatter found.'); continue; }

    const get = key => (frontmatter.match(new RegExp(`${key}:\\s*"?([^"\\n]+)"?`)) || [])[1];
    const subject = get('subject'), rawEvent = get('event_time'), rawNotify = get('notify_time');
    if (!subject || !rawEvent || !rawNotify) { console.log('Missing subject/event_time/notify_time.'); continue; }

    const notifyMinutes = parseTimeToMinutes(rawNotify);
    const eventMinutes = parseTimeToMinutes(rawEvent);
    if (notifyMinutes === null) { console.log(`Could not parse notify_time: ${rawNotify}`); continue; }

    const diff = currentMinutes - notifyMinutes;
    console.log(`notify_time=${rawNotify} (${notifyMinutes} min), now=${currentMinutes} min, diff=${diff}`);

    const marker = path.join(SENT_DIR, `${dateStr}__${file}__${rawNotify.trim()}`.replace(/[^\w.-]/g, '_'));
    if (fs.existsSync(marker)) { console.log('Already sent today, skipping.'); continue; }

    if (diff >= 0 && diff <= WINDOW_MINUTES) {
      const pad = n => String(n).padStart(2, '0');
      const shown = eventMinutes === null ? rawEvent.trim()
        : `${pad(Math.floor(eventMinutes / 60))}:${pad(eventMinutes % 60)}`;
      await sendTelegramMessage(`🔔 Routine Reminder\n\nআজকে তোমার এই প্রাইভেট রুটিন আছে:\nবিষয়: ${subject.trim()}\nসময়: ${shown}`);
      fs.writeFileSync(marker, new Date().toISOString());
      if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, 'sent=true\n');
    } else {
      console.log('Outside notification window, nothing to send.');
    }
  }
}

checkRoutine();
