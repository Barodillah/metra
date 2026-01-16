import express from 'express';
import pool from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

const OPENROUTER_API_KEY = process.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.VITE_OPENROUTER_MODEL || 'xiaomi/mimo-v2-flash:free';

// Helper: Get current date/time info in Indonesian
const getCurrentTimeInfo = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const now = new Date();
    // Adjust to WIB (UTC+7)
    const wibOffset = 7 * 60 * 60 * 1000;
    const wibTime = new Date(now.getTime() + wibOffset);

    const dayName = days[wibTime.getUTCDay()];
    const date = wibTime.getUTCDate();
    const monthName = months[wibTime.getUTCMonth()];
    const year = wibTime.getUTCFullYear();
    const month = wibTime.getUTCMonth() + 1;
    const hours = String(wibTime.getUTCHours()).padStart(2, '0');
    const minutes = String(wibTime.getUTCMinutes()).padStart(2, '0');

    return {
        dayName,
        date,
        month,
        monthName,
        year,
        hours,
        minutes,
        dayOfWeek: wibTime.getUTCDay(),
        fullDate: `${dayName}, ${date} ${monthName} ${year}`,
        fullTime: `${hours}:${minutes} WIB`,
        fullDateTime: `${dayName}, ${date} ${monthName} ${year} pukul ${hours}:${minutes} WIB`,
        dateString: `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
    };
};

// ==================== SPIRITUAL CALCULATION FUNCTIONS ====================

// Get Weton (Javanese Calendar)
const getWeton = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const pasarans = ["Legi", "Paing", "Pon", "Wage", "Kliwon"];
    const baseDate = new Date(1900, 0, 1);
    const diffDays = Math.floor((date - baseDate) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { day: days[date.getDay()], pasaran: "Kliwon", neptu: 15 };

    const dayIdx = date.getDay();
    const pasaranIdx = (diffDays + 1) % 5;
    const dayValues = { "Minggu": 5, "Senin": 4, "Selasa": 3, "Rabu": 7, "Kamis": 8, "Jumat": 6, "Sabtu": 9 };
    const pasaranValues = { "Legi": 5, "Paing": 9, "Pon": 7, "Wage": 4, "Kliwon": 8 };
    const d = days[dayIdx];
    const p = pasarans[pasaranIdx];
    return { day: d, pasaran: p, neptu: dayValues[d] + pasaranValues[p] };
};

// Get Zodiac
const getZodiac = (month, day) => {
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
    return "Pisces";
};

// Get Life Path Number
const getLifePathNumber = (dateString) => {
    if (!dateString) return null;
    const digits = dateString.replace(/\D/g, '');
    let sum = digits.split('').reduce((acc, d) => acc + parseInt(d), 0);
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
        sum = sum.toString().split('').reduce((acc, d) => acc + parseInt(d), 0);
    }
    return sum;
};

// Get Element from Zodiac
const getElement = (zodiac) => {
    const elements = {
        "Aries": "Api", "Leo": "Api", "Sagittarius": "Api",
        "Taurus": "Tanah", "Virgo": "Tanah", "Capricorn": "Tanah",
        "Gemini": "Udara", "Libra": "Udara", "Aquarius": "Udara",
        "Cancer": "Air", "Scorpio": "Air", "Pisces": "Air"
    };
    return elements[zodiac] || "Misteri";
};

// Get Ruling Planet
const getRulingPlanet = (zodiac) => {
    const planets = {
        "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury", "Cancer": "Bulan",
        "Leo": "Matahari", "Virgo": "Mercury", "Libra": "Venus", "Scorpio": "Pluto",
        "Sagittarius": "Jupiter", "Capricorn": "Saturnus", "Aquarius": "Uranus", "Pisces": "Neptunus"
    };
    return planets[zodiac] || "Semesta";
};

// Get Moon Phase
const getMoonPhase = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    if (month < 3) {
        year--;
        month += 12;
    }

    ++month;
    let c = 365.25 * year;
    let e = 30.6 * month;
    let jd = c + e + day - 694039.09;
    jd /= 29.5305882;
    let b = parseInt(jd);
    jd -= b;
    b = Math.round(jd * 8);

    if (b >= 8) b = 0;

    const phases = {
        0: "Bulan Baru (New Moon)",
        1: "Bulan Sabit Awal (Waxing Crescent)",
        2: "Kuarter Pertama (First Quarter)",
        3: "Bulan Cembung Awal (Waxing Gibbous)",
        4: "Bulan Purnama (Full Moon)",
        5: "Bulan Cembung Akhir (Waning Gibbous)",
        6: "Kuarter Akhir (Last Quarter)",
        7: "Bulan Sabit Akhir (Waning Crescent)"
    };
    return phases[b] || "Tidak Diketahui";
};

// Get Today's Spiritual Data
const getTodaySpiritualInfo = () => {
    const timeInfo = getCurrentTimeInfo();
    const weton = getWeton(timeInfo.dateString);
    const zodiac = getZodiac(timeInfo.month, timeInfo.date);
    const element = getElement(zodiac);
    const planet = getRulingPlanet(zodiac);
    const moonPhase = getMoonPhase(timeInfo.dateString);
    const lifePath = getLifePathNumber(timeInfo.dateString);

    return {
        weton,
        zodiac,
        element,
        planet,
        moonPhase,
        lifePath
    };
};

// System prompt for Metra AI
const buildSystemPrompt = () => {
    const timeInfo = getCurrentTimeInfo();
    const todaySpiritual = getTodaySpiritualInfo();

    return `
Anda adalah **Metra AI Advisor**, ahli spiritual yang hangat dan personal.

WAKTU SAAT INI: ${timeInfo.fullDateTime}

DATA SPIRITUAL HARI INI (${timeInfo.fullDate}):
- Weton: ${todaySpiritual.weton.day} ${todaySpiritual.weton.pasaran} (Neptu ${todaySpiritual.weton.neptu})
- Zodiak yang Aktif: ${todaySpiritual.zodiac}
- Elemen Hari Ini: ${todaySpiritual.element}
- Planet Penguasa: ${todaySpiritual.planet}
- Fase Bulan: ${todaySpiritual.moonPhase}
- Life Path Hari: ${todaySpiritual.lifePath}

GAYA KOMUNIKASI:
- Panggil user dengan nama mereka jika tersedia
- Jawab **SINGKAT dan PERSONAL** (maksimal 3-4 paragraf pendek)
- Langsung ke inti jawaban, tidak bertele-tele
- Gunakan **bold** untuk kata kunci penting
- Jika user minta detail/penjelasan lebih, BARU berikan jawaban lengkap
- Gunakan data spiritual hari ini untuk memberikan insight yang akurat

FORMAT JAWABAN DEFAULT:
1. Sapa singkat atau langsung jawab
2. Insight utama (1-2 kalimat)
3. Saran konkret (1-2 poin)
4. Penutup inspiratif singkat

KEAHLIAN: Weton Jawa, Neptu, Zodiak, Numerologi, Shio, Fase Bulan.

PENTING: Ini panduan energi, keputusan akhir di tangan user dan Tuhan YME.
`;
};


// ==================== CREATE SESSION ====================
router.post('/sessions', authenticateToken, async (req, res) => {
    try {
        // Get user name for guest_name
        const [users] = await pool.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
        const userName = users.length > 0 ? users[0].name : null;

        const [result] = await pool.query(
            'INSERT INTO chat_sessions (user_id, guest_name) VALUES (?, ?)',
            [req.user.id, userName]
        );

        res.status(201).json({
            session_id: result.insertId
        });
    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({ error: 'Gagal membuat sesi chat' });
    }
});

// ==================== GET USER SESSIONS ====================
router.get('/sessions', authenticateToken, async (req, res) => {
    try {
        const [sessions] = await pool.query(
            `SELECT cs.*, 
                (SELECT content FROM chat_messages WHERE session_id = cs.id AND role = 'user' ORDER BY created_at ASC LIMIT 1) as first_message
            FROM chat_sessions cs 
            WHERE cs.user_id = ? 
            ORDER BY cs.created_at DESC 
            LIMIT 20`,
            [req.user.id]
        );

        res.json({ sessions });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ error: 'Gagal mengambil sesi chat' });
    }
});

// ==================== GET SESSION MESSAGES ====================
router.get('/sessions/:sessionId/messages', authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;

        // Verify session belongs to user
        const [sessions] = await pool.query(
            'SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?',
            [sessionId, req.user.id]
        );

        if (sessions.length === 0) {
            return res.status(404).json({ error: 'Sesi tidak ditemukan' });
        }

        const [messages] = await pool.query(
            'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
            [sessionId]
        );

        res.json({ messages });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Gagal mengambil pesan' });
    }
});

// ==================== SEND MESSAGE (with AI response) ====================
router.post('/sessions/:sessionId/messages', authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { content, userContext } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
        }

        // Verify session belongs to user
        const [sessions] = await pool.query(
            'SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?',
            [sessionId, req.user.id]
        );

        if (sessions.length === 0) {
            return res.status(404).json({ error: 'Sesi tidak ditemukan' });
        }

        // Save user message
        await pool.query(
            'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)',
            [sessionId, 'user', content]
        );

        // Get chat history for context
        const [history] = await pool.query(
            'SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
            [sessionId]
        );

        // Build messages for AI
        const aiMessages = history.map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
        }));

        // Build dynamic system prompt with current time
        const systemPrompt = buildSystemPrompt();
        const dynamicSystemPrompt = `${systemPrompt}
        
${userContext ? `DATA PENGGUNA SAAT INI (Gunakan data ini untuk analisis yang personal):
${userContext}` : ''}
`;

        // Call OpenRouter AI
        const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: OPENROUTER_MODEL,
                messages: [
                    { role: "system", content: dynamicSystemPrompt },
                    ...aiMessages
                ]
            })
        });

        if (!aiResponse.ok) {
            const errorData = await aiResponse.json();
            throw new Error(errorData.error?.message || 'Gagal menghubungi AI Server');
        }

        const aiData = await aiResponse.json();
        const aiContent = aiData.choices[0].message.content;

        // Save AI response
        const [aiResult] = await pool.query(
            'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)',
            [sessionId, 'assistant', aiContent]
        );

        res.json({
            user_message: { id: null, role: 'user', content },
            ai_message: { id: aiResult.insertId, role: 'assistant', content: aiContent }
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: error.message || 'Gagal mengirim pesan' });
    }
});

// ==================== QUICK CHAT (No session, for guests) ====================
router.post('/quick', async (req, res) => {
    try {
        const { messages, userContext } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Format pesan tidak valid' });
        }

        // Build dynamic system prompt with current time
        const systemPrompt = buildSystemPrompt();
        const dynamicSystemPrompt = `${systemPrompt}
        
${userContext ? `DATA PENGGUNA SAAT INI (Gunakan data ini untuk analisis yang personal):
${userContext}` : ''}
`;

        // Call OpenRouter AI
        const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: OPENROUTER_MODEL,
                messages: [
                    { role: "system", content: dynamicSystemPrompt },
                    ...messages
                ]
            })
        });

        if (!aiResponse.ok) {
            const errorData = await aiResponse.json();
            throw new Error(errorData.error?.message || 'Gagal menghubungi AI Server');
        }

        const aiData = await aiResponse.json();
        const aiContent = aiData.choices[0].message.content;

        res.json({ content: aiContent });
    } catch (error) {
        console.error('Quick chat error:', error);
        res.status(500).json({ error: error.message || 'Gagal mendapatkan respons AI' });
    }
});

// ==================== END SESSION ====================
router.put('/sessions/:sessionId/end', authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;

        // Verify session belongs to user
        const [sessions] = await pool.query(
            'SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?',
            [sessionId, req.user.id]
        );

        if (sessions.length === 0) {
            return res.status(404).json({ error: 'Sesi tidak ditemukan' });
        }

        const session = sessions[0];

        // Check if there are any messages in this session
        const [messages] = await pool.query(
            'SELECT COUNT(*) as count FROM chat_messages WHERE session_id = ?',
            [sessionId]
        );

        const messageCount = messages[0].count;

        if (messageCount === 0) {
            // No messages - delete the session
            await pool.query('DELETE FROM chat_sessions WHERE id = ?', [sessionId]);
            return res.json({ message: 'Sesi kosong dihapus', deleted: true });
        }

        // Has messages - calculate duration and generate summary
        const startTime = new Date(session.created_at);
        const endTime = new Date();
        const durationSeconds = Math.floor((endTime - startTime) / 1000);

        // Get messages for summary
        const [chatMessages] = await pool.query(
            'SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT 10',
            [sessionId]
        );

        // Generate summary using AI
        let summary = null;
        try {
            const summaryMessages = chatMessages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content.substring(0, 200)}`).join('\n');

            const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: OPENROUTER_MODEL,
                    messages: [
                        {
                            role: "system",
                            content: "Buat ringkasan 1 kalimat singkat dalam Bahasa Indonesia untuk percakapan berikut. Fokus pada topik utama yang dibahas. Maksimal 100 karakter."
                        },
                        { role: "user", content: summaryMessages }
                    ]
                })
            });

            if (aiResponse.ok) {
                const aiData = await aiResponse.json();
                summary = aiData.choices[0].message.content.substring(0, 255);
            }
        } catch (err) {
            console.error('Failed to generate summary:', err);
            // Use first user message as fallback summary
            const firstUserMsg = chatMessages.find(m => m.role === 'user');
            summary = firstUserMsg ? firstUserMsg.content.substring(0, 100) + '...' : null;
        }

        await pool.query(
            'UPDATE chat_sessions SET ended_at = NOW(), duration_seconds = ?, summary = ? WHERE id = ?',
            [durationSeconds, summary, sessionId]
        );

        res.json({ message: 'Sesi berhasil diakhiri', duration_seconds: durationSeconds, summary });
    } catch (error) {
        console.error('End session error:', error);
        res.status(500).json({ error: 'Gagal mengakhiri sesi' });
    }
});

export default router;
