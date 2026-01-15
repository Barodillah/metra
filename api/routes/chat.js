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
    const hours = String(wibTime.getUTCHours()).padStart(2, '0');
    const minutes = String(wibTime.getUTCMinutes()).padStart(2, '0');

    return {
        dayName,
        date,
        monthName,
        year,
        hours,
        minutes,
        fullDate: `${dayName}, ${date} ${monthName} ${year}`,
        fullTime: `${hours}:${minutes} WIB`,
        fullDateTime: `${dayName}, ${date} ${monthName} ${year} pukul ${hours}:${minutes} WIB`
    };
};

// System prompt for Metra AI
const buildSystemPrompt = () => {
    const timeInfo = getCurrentTimeInfo();

    return `
Anda adalah **Metra AI Advisor**, ahli spiritual yang hangat dan personal.

WAKTU SAAT INI: ${timeInfo.fullDateTime}

GAYA KOMUNIKASI:
- Panggil user dengan nama mereka jika tersedia
- Jawab **SINGKAT dan PERSONAL** (maksimal 3-4 paragraf pendek)
- Langsung ke inti jawaban, tidak bertele-tele
- Gunakan **bold** untuk kata kunci penting
- Jika user minta detail/penjelasan lebih, BARU berikan jawaban lengkap

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
