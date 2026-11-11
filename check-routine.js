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

// টাইমকে 24-ঘণ্টা ফরম্যাটে রূপান্তর করার ফাংশন (সেকেন্ড বা স্ট্রিং যাই হোক)
function parseTimeToMinutes(timeString) {
    timeString = timeString.toString().replace(/["']/g, '').trim();
    
    // যদি সময়টি সংখ্যা হয় (যেমন সেকেন্ডে সেভ হয়েছে: 54600)
    if (!isNaN(timeString) && timeString.length > 4) {
        let totalSeconds = parseInt(timeString);
        let h = Math.floor(totalSeconds / 3600);
        let m = Math.floor((totalSeconds % 3600) / 60);
        return (h * 60) + m;
    }
    // যদি সময়টি 15:10 বা 15.10 ফরম্যাটে থাকে
    else if (timeString.includes(':') || timeString.includes('.')) {
        const parts = timeString.split(/[:.]/);
        return (parseInt(parts[0]) * 60) + parseInt(parts[1]);
    }
    // সাধারণ সংখ্যা হলে (যেমন: 1510)
    else if (!isNaN(timeString)) {
        let str = timeString.padStart(4, '0');
        return (parseInt(str.substring(0, 2)) * 60) + parseInt(str.substring(2, 4));
    }
    return null;
}

async function checkRoutine() {
    const routinePath = path.join(__dirname, '_routine');
    
    if (!fs.existsSync(routinePath)) return;

    const files = fs.readdirSync(routinePath);
    const todayFile = files.find(f => f.toLowerCase().includes(todayDayName.toLowerCase()));

    if (todayFile) {
        const content = fs.readFileSync(path.join(routinePath, todayFile), 'utf8');
        
        const frontmatter = content.split('---')[1];
        if (!frontmatter) return;

        const notifyTimeMatch = frontmatter.match(/notify_time:\s*"?([^"\n]+)"?/);
        const subjectMatch = frontmatter.match(/subject:\s*"?([^"\n]+)"?/);
        const eventTimeMatch = frontmatter.match(/event_time:\s*"?([^"\n]+)"?/);

        if (notifyTimeMatch && subjectMatch && eventTimeMatch) {
            const subject = subjectMatch[1].trim();
            const rawEventTime = eventTimeMatch[1].trim();
            
            // টাইম পার্স করা
            const notifyMinutes = parseTimeToMinutes(notifyTimeMatch[1]);
            const eventMinutes = parseTimeToMinutes(rawEventTime);

            // ইভেন্ট টাইম সুন্দর করে দেখানোর জন্য
            let displayEventTime = rawEventTime;
            if (eventMinutes !== null) {
                let h = Math.floor(eventMinutes / 60).toString().padStart(2, '0');
                let m = (eventMinutes % 60).toString().padStart(2, '0');
                displayEventTime = `${h}:${m}`;
            }

            if (notifyMinutes !== null) {
                const timeDifference = currentMinutes - notifyMinutes;
                
                // 15 মিনিটের বাফার
                if (timeDifference >= 0 && timeDifference <= 15) {
                    const message = `🔔 **Routine Reminder**\n\nআজকে তোমার এই প্রাইভেট রুটিন আছে:\n**বিষয়:** ${subject}\n**সময়:** ${displayEventTime}`;
                    await sendTelegramMessage(message);
                }
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
