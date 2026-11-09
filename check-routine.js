const fs = require('fs');
const path = require('path');

// বাংলাদেশের সময় বের করা
const dhakaTime = new Date().toLocaleString("en-US", {timeZone: "Asia/Dhaka"});
const now = new Date(dhakaTime);

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const todayDayName = daysOfWeek[now.getDay()];

// বর্তমান সময় মিনিটে রূপান্তর (যেমন 10:15 = 615 মিনিট)
const currentMinutes = (now.getHours() * 60) + now.getMinutes();

async function checkRoutine() {
    const routinePath = path.join(__dirname, '_routine');
    
    if (!fs.existsSync(routinePath)) return;

    const files = fs.readdirSync(routinePath);
    
    // আজকের দিনের ফাইলটি খোঁজা
    const todayFile = files.find(f => f.toLowerCase().includes(todayDayName.toLowerCase()));

    if (todayFile) {
        const content = fs.readFileSync(path.join(routinePath, todayFile), 'utf8');
        
        const frontmatter = content.split('---')[1];
        if (!frontmatter) return;

        const notifyTimeMatch = frontmatter.match(/notify_time:\s*"?([^"\n]+)"?/);
        const subjectMatch = frontmatter.match(/subject:\s*"?([^"\n]+)"?/);
        const eventTimeMatch = frontmatter.match(/event_time:\s*"?([^"\n]+)"?/);

        if (notifyTimeMatch && subjectMatch && eventTimeMatch) {
            const notifyTime = notifyTimeMatch[1].trim();
            const subject = subjectMatch[1].trim();
            const eventTime = eventTimeMatch[1].trim();

            // নোটিফিকেশন টাইমকে মিনিটে রূপান্তর
            const timeParts = notifyTime.split(':');
            const notifyMinutes = (parseInt(timeParts[0]) * 60) + parseInt(timeParts[1]);

            // 🌟 আসল ম্যাজিক এখানে: বর্তমান সময় এবং নোটিফিকেশন টাইমের ব্যবধান ০ থেকে ১৫ মিনিটের মধ্যে হলে মেসেজ যাবে
            const timeDifference = currentMinutes - notifyMinutes;

            if (timeDifference >= 0 && timeDifference < 15) {
                const message = `🔔 **Routine Reminder**\n\nআজকে তোমার এই প্রাইভেট রুটিন আছে:\n**বিষয়:** ${subject}\n**সময়:** ${eventTime}`;
                await sendTelegramMessage(message);
            }
        }
    }
}

async function sendTelegramMessage(text) {
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' })
        });
        console.log("Message sent successfully!");
    } catch (error) {
        console.error("Failed to send message:", error);
    }
}

checkRoutine();
