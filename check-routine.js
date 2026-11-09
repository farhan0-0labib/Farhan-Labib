const fs = require('fs');
const path = require('path');

// বাংলাদেশের সময় বের করা
const dhakaTime = new Date().toLocaleString("en-US", {timeZone: "Asia/Dhaka"});
const now = new Date(dhakaTime);
const todayDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
const day = now.getDay(); // 0 = Sun, 1 = Mon ... 5 = Fri, 6 = Sat

async function checkRoutine() {
    const routinePath = path.join(__dirname, '_routine');
    
    // ফোল্ডার না থাকলে বের হয়ে যাও
    if (!fs.existsSync(routinePath)) return;

    const files = fs.readdirSync(routinePath);
    let message = "";

    // আপনার কাস্টম শিডিউল লজিক
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    let shouldSend = false;

    if (day !== 5) { // শুক্রবার ছাড়া অন্য দিন
        // দুপুর ৪:৩০ (16:30) এবং রাত ১২:০০ (00:00)
        if ((currentHour === 16 && currentMinute === 30) || (currentHour === 0 && currentMinute === 0)) {
            shouldSend = true;
        }
    } else { // শুক্রবার
        // শুক্রবার সকাল ৮:০০ (08:00)
        if (currentHour === 8 && currentMinute === 0) {
            shouldSend = true;
        }
    }

    // বৃহস্পতিবার রাত ৯:০০ (21:00) - শুক্রবারের রুটিনের জন্য
    let targetDate = todayDate;
    if (day === 4 && currentHour === 21 && currentMinute === 0) {
        shouldSend = true;
        // আগামীকালের তারিখ (শুক্রবার) সেট করা
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        targetDate = tomorrow.toISOString().split('T')[0];
    }

    if (shouldSend) {
        const targetFile = files.find(f => f.includes(targetDate));
        
        if (targetFile) {
            const content = fs.readFileSync(path.join(routinePath, targetFile), 'utf8');
            // Markdown frontmatter বাদ দিয়ে শুধু মূল লেখা নেওয়া
            const body = content.split('---')[2] || "কোনো বিস্তারিত নেই";
            message = `🔔 **Routine Reminder**\n\nআজকে তোমার এই প্রাইভেট রুটিন আছে:\n\n${body.trim()}`;
        }
    }

    if (message) {
        await sendTelegramMessage(message);
    }
}

async function sendTelegramMessage(text) {
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
        const response = await fetch(url, {
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
