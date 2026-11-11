const fs = require('fs');
const path = require('path');

// নিখুঁতভাবে বাংলাদেশের সময় বের করা
const options = { timeZone: 'Asia/Dhaka', hour12: false, hour: '2-digit', minute: '2-digit', weekday: 'long' };
const formatter = new Intl.DateTimeFormat('en-US', options);
const parts = formatter.formatToParts(new Date());
const currentHour = parseInt(parts.find(p => p.type === 'hour').value);
const currentMinute = parseInt(parts.find(p => p.type === 'minute').value);
const todayDayName = parts.find(p => p.type === 'weekday').value;
const currentMinutes = (currentHour * 60) + currentMinute;

console.log(`Checking Routine for: ${todayDayName}, Time: ${currentHour}:${currentMinute}`);

async function checkRoutine() {
    const routinePath = path.join(__dirname, '_routine');
    
    if (!fs.existsSync(routinePath)) {
        console.log("Routine folder not found!");
        return;
    }

    const files = fs.readdirSync(routinePath);
    const todayFile = files.find(f => f.toLowerCase().includes(todayDayName.toLowerCase()));

    if (todayFile) {
        console.log(`Found file: ${todayFile}`);
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

            const timeParts = notifyTime.split(':');
            const notifyMinutes = (parseInt(timeParts[0]) * 60) + parseInt(timeParts[1]);

            const timeDifference = currentMinutes - notifyMinutes;

            console.log(`Notify Time: ${notifyTime} (${notifyMinutes} mins), Difference: ${timeDifference} mins`);

            // যদি বর্তমান সময় এবং নোটিফিকেশন টাইমের ব্যবধান ০ থেকে ১৫ মিনিটের মধ্যে হয়
            if (timeDifference >= 0 && timeDifference <= 15) {
                console.log("Time matched! Sending message...");
                const message = `🔔 **Routine Reminder**\n\nআজকে তোমার এই প্রাইভেট রুটিন আছে:\n**বিষয়:** ${subject}\n**সময়:** ${eventTime}`;
                await sendTelegramMessage(message);
            } else {
                console.log("Time did not match. No message sent.");
            }
        }
    } else {
        console.log(`No routine file found for ${todayDayName}`);
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
