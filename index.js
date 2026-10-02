const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

/* =========================================================
   CONFIG
========================================================= */

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = Number(process.env.CHANNEL_ID || "-1003985236266");
const PORT = Number(process.env.PORT || 10000);
const DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || "SOHEL@12345";

if (!BOT_TOKEN) {
    console.error("❌ BOT_TOKEN missing");
    process.exit(1);
}

/* =========================================================
   EXPRESS
========================================================= */

const app = express();
app.use(express.json({ limit: "10mb" }));

// স্ট্যাটিক ফোল্ডার হিসেবে public ফোল্ডার যুক্ত করা যাতে admin.html সরাসরি লোড হয়
app.use(express.static(path.join(__dirname, "public")));

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }
});

/* =========================================================
   DATA
========================================================= */

const DATA_DIR = path.join(__dirname, "data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const PASSWORD_FILE = path.join(DATA_DIR, "admin-password.json");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

/* =========================================================
   DEFAULT SETTINGS
========================================================= */

const DEFAULT_SETTINGS = {
    welcome_enabled: true,
    profile_photo_enabled: true,
    message_order: "welcome_first", 
    channel_title: "SOHEL VAI OFFICIAL CHANNEL",
    welcome_text: `🎉 স্বাগতম {first_name} 👋 জয়েন 

প্রিয় সাবস্ক্রাইবার বন্ধু!
SOHEL VAI OFFICIAL CHANNEL JOIN করার জন্য ধন্যবাদ 🎁

⚠️⚠️ গুরুত্বপূর্ণ নির্দেশিকা ⚠️⚠️
আমাদের Official Channel-এ Join করার জন্য আপনাকে আন্তরিক অভিনন্দন🎉

প্রথমে গুরুত্বপূর্ণ আমাদের এই সাবস্ক্রাইবার প্রোফাইলটি পিন বা অন করে পিন্ট করে রাখুন 📌

📩 নিশ্চিত করুন আপনার এই আমাদের এই সাবস্ক্রাইবার প্রোফাইলটি পিনচোটার্ড যেন পাইপলাইনে না যায় পরবর্তীতে আপনার অ্যাকাউন্ট ইনফরমেশন সুরক্ষিত রাখতে সাহায্য করবে 🚀

ভুল করবেন না আমাদের এই চ্যানেলে প্রবেশ করে 
⭐ 👇 SOHEL VAI 👇 ⭐`,

    welcome_text_size: "bold", 
    duration: 30,
    duration_seconds: 30,
    video_file_id: "",
    video_filename: "",
    video_url: "",
    audio_file_id: "",
    audio_filename: "",
    audio_url: "",
    voice_text: "🔊 বিশেষ গুরুত্বপূর্ণ ভয়েস বার্তা 🔊ওডিও",
    voice_button_text: "🔊🔊 বিশেষ ভয়েস বার্তা ওডিও বার্তা 🔊ওডিও",

    main_buttons: [
        { enabled: true, text: "⭐ বিশেষ চ্যানেল লিংক ⭐", url: "https://t.me/+WZR7nsATt1szNmRh" },
        { enabled: true, text: "🔥 VIP HACK প্রিডিকশন চ্যানেল 🔥", url: "https://t.me/sohel_ai_prediction_bot" },
        { enabled: true, text: "🎯 ট্রেডিং চ্যানেলম টেলিগ্রাম সাপোর্ট 👑🎁", url: "https://t.me/TRADER_SOHEL_BDT_TOP" }
    ],

    video_buttons: [
        { enabled: true, text: "⭐ স্পেশাল চ্যানেল সাবস্ক্রাইব লিংক ⭐", url: "https://t.me/+gNZZwOIN72BjYzQ1" },
        { enabled: true, text: "📌 পিন টেলিগ্রাম চ্যানেল সাবস্ক্রাইবার", url: "https://t.me/EARNING_TEME_bd" }
    ]
};

/* =========================================================
   HELPERS
========================================================= */

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function normalizeSettings(value) {
    const source = value && typeof value === "object" ? value : {};
    const settings = { ...clone(DEFAULT_SETTINGS), ...source };

    settings.main_buttons = Array.isArray(settings.main_buttons) ? settings.main_buttons.slice(0, 3) : clone(DEFAULT_SETTINGS.main_buttons);
    settings.video_buttons = Array.isArray(settings.video_buttons) ? settings.video_buttons.slice(0, 2) : clone(DEFAULT_SETTINGS.video_buttons);

    while (settings.main_buttons.length < 3) settings.main_buttons.push({ enabled: false, text: "", url: "" });
    while (settings.video_buttons.length < 2) settings.video_buttons.push({ enabled: false, text: "", url: "" });

    let duration = Number(settings.duration || settings.duration_seconds || 30);
    if (!Number.isFinite(duration)) duration = 30;
    duration = Math.max(30, Math.min(900, duration));

    settings.duration = duration;
    settings.duration_seconds = duration;

    return settings;
}

function loadSettings() {
    try {
        if (!fs.existsSync(SETTINGS_FILE)) {
            saveSettings(DEFAULT_SETTINGS);
            return clone(DEFAULT_SETTINGS);
        }
        const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
        return normalizeSettings(JSON.parse(raw));
    } catch (error) {
        return clone(DEFAULT_SETTINGS);
    }
}

function saveSettings(value) {
    const settings = normalizeSettings(value);
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf8");
    return settings;
}

/* =========================================================
   PASSWORD
========================================================= */

function loadPassword() {
    try {
        if (!fs.existsSync(PASSWORD_FILE)) {
            fs.writeFileSync(PASSWORD_FILE, JSON.stringify({ password: DEFAULT_PASSWORD }), "utf8");
            return DEFAULT_PASSWORD;
        }
        const data = JSON.parse(fs.readFileSync(PASSWORD_FILE, "utf8"));
        return data.password || DEFAULT_PASSWORD;
    } catch (error) {
        return DEFAULT_PASSWORD;
    }
}

function savePassword(password) {
    fs.writeFileSync(PASSWORD_FILE, JSON.stringify({ password }), "utf8");
}

/* =========================================================
   ADMIN AUTH
========================================================= */

function checkAdmin(req, res, next) {
    const password = String(req.headers["x-admin-password"] || "");
    if (password !== loadPassword()) {
        return res.status(401).json({ ok: false, error: "Invalid admin password" });
    }
    next();
}

/* =========================================================
   TELEGRAM API
========================================================= */

const TELEGRAM_API = "https://api.telegram.org/bot" + BOT_TOKEN;

async function telegram(method, body) {
    const response = await fetch(TELEGRAM_API + "/" + method, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
        throw new Error(data.description || "Telegram API error");
    }
    return data.result;
}

/* =========================================================
   TELEGRAM MULTIPART UPLOAD
========================================================= */

async function uploadMediaToTelegram(file, type) {
    if (!file || !file.buffer) throw new Error("File missing");
    const form = new FormData();
    form.append("chat_id", String(CHANNEL_ID));
    const blob = new Blob([file.buffer], { type: file.mimetype || "application/octet-stream" });
    form.append(type === "video" ? "video" : "audio", blob, file.originalname);
    form.append("disable_notification", "true");

    const response = await fetch(TELEGRAM_API + (type === "video" ? "/sendVideo" : "/sendAudio"), {
        method: "POST",
        body: form
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
        throw new Error(data.description || "Telegram media upload failed");
    }
    const message = data.result;
    let fileId = type === "video" ? message?.video?.file_id : message?.audio?.file_id;

    if (!fileId) throw new Error("Telegram file_id পাওয়া যায়নি");

    try {
        await telegram("deleteMessage", { chat_id: CHANNEL_ID, message_id: message.message_id });
    } catch (error) {}

    return { file_id: fileId, filename: file.originalname };
}

/* =========================================================
   SETTINGS API
========================================================= */

app.get("/api/settings", checkAdmin, function(req, res) {
    res.json({ ok: true, settings: loadSettings() });
});

app.post("/api/settings", checkAdmin, function(req, res) {
    try {
        const incoming = req.body && req.body.settings ? req.body.settings : req.body;
        const current = loadSettings();
        
        // মার্জ করার সময় যেন আগের ফাইল আইডি বা URL মুছে না যায়
        const merged = { ...current, ...incoming };
        const settings = saveSettings(merged);
        
        res.json({ ok: true, settings });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

/* =========================================================
   MEDIA UPLOAD API (Separate for Video & Audio)
========================================================= */

app.post("/api/upload", checkAdmin, upload.single("file"), async function(req, res) {
    try {
        if (!req.file) return res.status(400).json({ ok: false, error: "ফাইল সিলেক্ট করুন" });
        const type = String(req.body.media_type || "").toLowerCase();
        if (type !== "video" && type !== "audio") {
            return res.status(400).json({ ok: false, error: "Invalid media type" });
        }
        const result = await uploadMediaToTelegram(req.file, type);
        const settings = loadSettings();
        if (type === "video") {
            settings.video_file_id = result.file_id;
            settings.video_filename = result.filename;
        } else if (type === "audio") {
            settings.audio_file_id = result.file_id;
            settings.audio_filename = result.filename;
        }
        const savedSettings = saveSettings(settings);
        res.json({ ok: true, file_id: result.file_id, filename: result.filename, settings: savedSettings });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

/* =========================================================
   REMOVE MEDIA
========================================================= */

app.post("/api/remove-media", checkAdmin, function(req, res) {
    try {
        const type = String(req.body.media_type || "");
        const settings = loadSettings();
        if (type === "video") {
            settings.video_file_id = "";
            settings.video_filename = "";
            settings.video_url = "";
        }
        if (type === "audio") {
            settings.audio_file_id = "";
            settings.audio_filename = "";
            settings.audio_url = "";
        }
        const saved = saveSettings(settings);
        res.json({ ok: true, settings: saved });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

/* =========================================================
   RESET
========================================================= */

app.post("/api/reset", checkAdmin, function(req, res) {
    const settings = saveSettings(DEFAULT_SETTINGS);
    res.json({ ok: true, settings });
});

/* =========================================================
   CHANGE PASSWORD
========================================================= */

app.post("/api/change-password", checkAdmin, function(req, res) {
    const oldPassword = String(req.body.old_password || "");
    const newPassword = String(req.body.new_password || "");
    if (oldPassword !== loadPassword()) {
        return res.status(401).json({ ok: false, error: "বর্তমান পাসওয়ার্ড ভুল" });
    }
    if (newPassword.length < 4) {
        return res.status(400).json({ ok: false, error: "নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষর হতে হবে" });
    }
    savePassword(newPassword);
    res.json({ ok: true, message: "Password changed successfully" });
});

/* =========================================================
   ADMIN HTML ROUTE
========================================================= */

const ADMIN_HTML = path.join(__dirname, "public", "admin.html");

app.get("/", function(res, resObj) {
    if (fs.existsSync(ADMIN_HTML)) return resObj.sendFile(ADMIN_HTML);
    resObj.send("admin.html not found in public folder");
});

app.get("/admin", function(req, resObj) {
    if (fs.existsSync(ADMIN_HTML)) return resObj.sendFile(ADMIN_HTML);
    resObj.send("admin.html not found in public folder");
});

/* =========================================================
   BOT FUNCTIONS & FORMATTING
========================================================= */

function mainKeyboard(settings) {
    const rows = [];
    for (const button of settings.main_buttons) {
        if (button && button.enabled && button.text && validUrl(button.url)) {
            rows.push([{ text: button.text, url: button.url }]);
        }
    }
    return rows.length ? { inline_keyboard: rows } : undefined;
}

function mediaKeyboard(settings) {
    const rows = [];
    for (const button of settings.video_buttons) {
        if (button && button.enabled && button.text && validUrl(button.url)) {
            rows.push([{ text: button.text, url: button.url }]);
        }
    }
    return rows.length ? { inline_keyboard: rows } : undefined;
}

function validUrl(url) {
    try {
        const parsed = new URL(String(url));
        return parsed.protocol === "https:" || parsed.protocol === "tg:";
    } catch (error) {
        return false;
    }
}

function formatWelcomeText(text, settings) {
    let replaced = String(text || "")
        .replaceAll("{channel_title}", settings.channel_title || "SOHEL VAI");

    if (settings.welcome_text_size === "bold") {
        return `<b>${replaced}</b>`;
    } else if (settings.welcome_text_size === "code") {
        return `<pre>${replaced}</pre>`;
    }
    return replaced;
}

async function getProfilePhotoFileId(userId) {
    try {
        const result = await telegram("getUserProfilePhotos", { user_id: Number(userId), offset: 0, limit: 1 });
        if (!result || !result.photos || !result.photos.length) return null;
        const photos = result.photos[0];
        if (!photos || !photos.length) return null;
        return photos[photos.length - 1].file_id;
    } catch (error) {
        return null;
    }
}

async function sendWelcomeText(text, keyboard, parseMode = "HTML") {
    const body = { chat_id: CHANNEL_ID, text, parse_mode: parseMode };
    if (keyboard) body.reply_markup = keyboard;
    return telegram("sendMessage", body);
}

async function sendWelcomePhoto(photo, caption, keyboard, parseMode = "HTML") {
    const body = { chat_id: CHANNEL_ID, photo, caption, parse_mode: parseMode };
    if (keyboard) body.reply_markup = keyboard;
    return telegram("sendPhoto", body);
}

async function sendWelcomeVideo(source, keyboard) {
    const body = { chat_id: CHANNEL_ID, video: source };
    if (keyboard) body.reply_markup = keyboard;
    return telegram("sendVideo", body);
}

async function sendWelcomeAudio(source, caption, keyboard) {
    const body = { chat_id: CHANNEL_ID, audio: source };
    if (caption) body.caption = caption;
    if (keyboard) body.reply_markup = keyboard;
    return telegram("sendAudio", body);
}

function scheduleDelete(messages, seconds) {
    const ids = messages.filter(Boolean).map(m => m && m.message_id).filter(Boolean);
    if (!ids.length) return;
    setTimeout(async function() {
        for (const id of ids) {
            try {
                await telegram("deleteMessage", { chat_id: CHANNEL_ID, message_id: Number(id) });
            } catch (e) {}
        }
    }, seconds * 1000);
}

function getVideoSource(settings) {
    if (settings.video_file_id) return settings.video_file_id;
    if (settings.video_url) return settings.video_url;
    return "";
}

function getAudioSource(settings) {
    if (settings.audio_file_id) return settings.audio_file_id;
    if (settings.audio_url) return settings.audio_url;
    return "";
}

async function sendWelcome(user) {
    const settings = loadSettings();
    if (!settings.welcome_enabled) return;
    const userId = Number(user.id);
    if (!userId) return;

    let text = formatWelcomeText(settings.welcome_text, settings);
    text = text.replaceAll("{first_name}", user.first_name || user.username || "User");

    const mainButtons = mainKeyboard(settings);
    const mediaButtons = mediaKeyboard(settings);
    const sent = [];

    const videoSource = getVideoSource(settings);
    const audioSource = getAudioSource(settings);
    const photoId = settings.profile_photo_enabled ? await getProfilePhotoFileId(userId) : null;

    try {
        if (settings.message_order === "media_first") {
            if (videoSource) {
                const vMsg = await sendWelcomeVideo(videoSource, mediaButtons);
                sent.push(vMsg);
            }
            if (audioSource) {
                const aMsg = await sendWelcomeAudio(audioSource, settings.voice_text, !videoSource ? mediaButtons : undefined);
                sent.push(aMsg);
            }
            let welcomeMsg = null;
            if (photoId) {
                welcomeMsg = await sendWelcomePhoto(photoId, text, mainButtons);
            } else {
                welcomeMsg = await sendWelcomeText(text, mainButtons);
            }
            if (welcomeMsg) sent.push(welcomeMsg);
        } else {
            let welcomeMsg = null;
            if (photoId) {
                welcomeMsg = await sendWelcomePhoto(photoId, text, mainButtons);
            } else {
                welcomeMsg = await sendWelcomeText(text, mainById = mainButtons);
            }
            if (welcomeMsg) sent.push(welcomeMsg);

            if (videoSource) {
                const vMsg = await sendWelcomeVideo(videoSource, mediaButtons);
                sent.push(vMsg);
            }
            if (audioSource) {
                const aMsg = await sendWelcomeAudio(audioSource, settings.voice_text, !videoSource ? mediaButtons : undefined);
                sent.push(aMsg);
            }
        }
    } catch (error) {
        console.error("Error sending welcome message:", error);
    }

    scheduleDelete(sent, settings.duration);
}

/* =========================================================
   WELCOME TEST ROUTE
========================================================= */

app.get("/welcome_test", checkAdmin, async function(req, res) {
    try {
        const userId = Number(req.query.user_id || "");
        if (!userId) {
            return res.status(400).json({ ok: `user_id দিন` });
        }
        const user = { id: userId, first_name: "Test User" };
        await sendWelcome(user);
        res.json({ ok: true, message: "Welcome test sent successfully" });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/health", function(req, res) {
    res.json({ ok: true, bot: true, channel_id: CHANNEL_ID });
});

/* =========================================================
   LONG POLLING
========================================================= */

let polling = true;
let offset = 0;

async function startPolling() {
    try {
        await telegram("deleteWebhook", { drop_pending_updates: false });
    } catch (error) {}

    while (polling) {
        try {
            const updates = await telegram("getUpdates", {
                offset,
                timeout: 30,
                allowed_updates: ["chat_member", "message"]
            });

            if (!Array.isArray(updates)) continue;

            for (const update of updates) {
                offset = update.update_id + 1;

                if (update.chat_member) {
                    const cm = update.chat_member;
                    if (Number(cm.chat.id) !== CHANNEL_ID) continue;

                    const oldStatus = cm.old_chat_member && cm.old_chat_member.status;
                    const newStatus = cm.new_chat_member && cm.new_chat_member.status;

                    if (
                        (oldStatus === "left" || oldStatus === "kicked") &&
                        (newStatus === "member" || newStatus === "administrator" || newStatus === "creator")
                    ) {
                        const user = cm.new_chat_member.user;
                        if (user && !user.is_bot) {
                            await sendWelcome(user);
                        }
                    }
                }

                if (update.message) {
                    const message = update.message;
                    if (message.text === "/welcome_test") {
                        await sendWelcome(message.from);
                    }
                }
            }
        } catch (error) {
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
}

/* =========================================================
   START SERVER
========================================================= */

app.listen(PORT, function() {
    console.log("🚀 SOHEL VAI SYSTEM STARTED ON PORT:", PORT);
    startPolling();
});

/* =========================================================
   SHUTDOWN
========================================================= */

process.on("SIGTERM", function() {
    polling = false;
    process.exit(0);
});

process.on("SIGINT", function() {
    polling = false;
    process.exit(0);
});
