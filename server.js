const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

// تحميل متغيرات البيئة
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- إعدادات تليجرام الآمنة ---
const token = process.env.TELEGRAM_TOKEN;
const myChatId = process.env.TELEGRAM_CHAT_ID;

if (!token || !myChatId) {
    console.error("❌ خطأ: لم يتم العثور على TELEGRAM_TOKEN أو TELEGRAM_CHAT_ID في ملف .env");
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: false });

// إنشاء مجلد uploads مؤقت
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, uploadsDir); },
    filename: (req, file, cb) => { 
        const suffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${suffix}.png`); 
    }
});

const upload = multer({ storage: storage });

app.use(express.static(__dirname));
app.use(express.json());

// مسار استقبال الصور المنفردة (إرسال فوري)
app.post('/upload-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'لم يتم استلام صورة' });
        }

        const imageType = req.body.type; // front, right, left
        const imagePath = req.file.path;

        let caption = '';
        if (imageType === 'front') caption = '📸 صورة أمامية جديدة';
        else if (imageType === 'right') caption = '📸 صورة جانب يمين جديدة';
        else if (imageType === 'left') caption = '📸 صورة جانب يسار جديدة';

        // إرسال الصورة فوراً لتليجرام
        await bot.sendPhoto(myChatId, imagePath, { caption: caption });

        // حذف الصورة من السيرفر بعد الإرسال
        fs.unlinkSync(imagePath);

        res.json({ success: true });
    } catch (error) {
        console.error("خطأ في إرسال الصورة:", error);
        res.status(500).json({ success: false });
    }
});

// مسار استقبال النص النهائي
app.post('/upload-request', async (req, res) => {
    try {
        const requestDescription = req.body.request;

        if (!requestDescription) {
            return res.status(400).json({ success: false, message: 'الوصف مطلوب' });
        }

        const messageText = `🚀 **طلب تصميم جديد**\n\n📝 **الوصف المطلوب:**\n${requestDescription}\n\n(تم إرسال الصور مسبقاً)`;
        
        await bot.sendMessage(myChatId, messageText, { parse_mode: 'Markdown' });

        res.json({ success: true });
    } catch (error) {
        console.error("خطأ في إرسال الطلب:", error);
        res.status(500).json({ success: false });
    }
});

app.listen(PORT, () => {
    console.log(`FaceMotion AI Server running on: http://localhost:${PORT}`);
});
