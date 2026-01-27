import express from 'express';
import pool from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// ==================== ADMIN MIDDLEWARE ====================
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Akses ditolak. Hanya untuk admin.' });
    }
    next();
};

// ==================== MAIN STATISTICS ====================
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Get current date info for WIB
        const now = new Date();
        const wibOffset = 7 * 60 * 60 * 1000;
        const wibTime = new Date(now.getTime() + wibOffset);
        const today = wibTime.toISOString().split('T')[0];

        // Calculate date ranges
        const weekAgo = new Date(wibTime);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(wibTime);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        // Total users
        const [totalUsers] = await pool.query('SELECT COUNT(*) as count FROM users');

        // New users today
        const [newUsersToday] = await pool.query(
            'SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = ?',
            [today]
        );

        // New users this week
        const [newUsersWeek] = await pool.query(
            'SELECT COUNT(*) as count FROM users WHERE created_at >= ?',
            [weekAgo.toISOString().split('T')[0]]
        );

        // New users this month
        const [newUsersMonth] = await pool.query(
            'SELECT COUNT(*) as count FROM users WHERE created_at >= ?',
            [monthAgo.toISOString().split('T')[0]]
        );

        // Plan distribution
        const [planDistribution] = await pool.query(`
            SELECT 
                COALESCE(p.plan_type, 'free') as plan_type,
                COUNT(*) as count
            FROM users u
            LEFT JOIN plans p ON u.id = p.user_id
            GROUP BY COALESCE(p.plan_type, 'free')
        `);

        // Total chat sessions
        const [totalSessions] = await pool.query('SELECT COUNT(*) as count FROM chat_sessions');

        // Total messages
        const [totalMessages] = await pool.query('SELECT COUNT(*) as count FROM chat_messages');

        // AI messages (assistant role)
        const [aiMessages] = await pool.query(
            "SELECT COUNT(*) as count FROM chat_messages WHERE role = 'assistant'"
        );

        // Average session duration (only for ended sessions)
        const [avgDuration] = await pool.query(`
            SELECT AVG(duration_seconds) as avg_duration 
            FROM chat_sessions 
            WHERE ended_at IS NOT NULL AND duration_seconds > 0
        `);

        // Active users today (users who chatted today)
        const [activeToday] = await pool.query(`
            SELECT COUNT(DISTINCT cs.user_id) as count 
            FROM chat_sessions cs 
            WHERE DATE(cs.created_at) = ?
        `, [today]);

        // Google vs Email users
        const [authMethods] = await pool.query(`
            SELECT 
                CASE WHEN google_id IS NOT NULL THEN 'google' ELSE 'email' END as method,
                COUNT(*) as count
            FROM users
            GROUP BY CASE WHEN google_id IS NOT NULL THEN 'google' ELSE 'email' END
        `);

        res.json({
            users: {
                total: totalUsers[0].count,
                new_today: newUsersToday[0].count,
                new_week: newUsersWeek[0].count,
                new_month: newUsersMonth[0].count,
                active_today: activeToday[0].count
            },
            plans: planDistribution.reduce((acc, p) => {
                acc[p.plan_type] = p.count;
                return acc;
            }, { free: 0, pro: 0, visionary: 0 }),
            chat: {
                total_sessions: totalSessions[0].count,
                total_messages: totalMessages[0].count,
                ai_messages: aiMessages[0].count,
                avg_duration_seconds: Math.round(avgDuration[0].avg_duration || 0)
            },
            auth_methods: authMethods.reduce((acc, m) => {
                acc[m.method] = m.count;
                return acc;
            }, { google: 0, email: 0 })
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: 'Gagal mengambil statistik' });
    }
});

// ==================== USER ENGAGEMENT METRICS ====================
router.get('/engagement', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Daily active users (last 7 days)
        const [dailyActive] = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(DISTINCT user_id) as active_users
            FROM chat_sessions
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        // Chat sessions per day (last 30 days)
        const [sessionsPerDay] = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as sessions
            FROM chat_sessions
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        // Messages per day (last 30 days)
        const [messagesPerDay] = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as messages,
                SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as user_messages,
                SUM(CASE WHEN role = 'assistant' THEN 1 ELSE 0 END) as ai_messages
            FROM chat_messages
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        // Peak usage hours (converted to WIB = UTC+7)
        const [peakHours] = await pool.query(`
            SELECT 
                MOD(HOUR(created_at) + 7, 24) as hour,
                COUNT(*) as message_count
            FROM chat_messages
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY MOD(HOUR(created_at) + 7, 24)
            ORDER BY hour ASC
        `);

        // User growth over time (last 30 days)
        const [userGrowth] = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as new_users
            FROM users
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        // Cumulative user count
        const [cumulativeUsers] = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                (SELECT COUNT(*) FROM users u2 WHERE DATE(u2.created_at) <= DATE(u1.created_at)) as total_users
            FROM users u1
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        res.json({
            daily_active_users: dailyActive,
            sessions_per_day: sessionsPerDay,
            messages_per_day: messagesPerDay,
            peak_hours: peakHours,
            user_growth: userGrowth,
            cumulative_users: cumulativeUsers
        });
    } catch (error) {
        console.error('Admin engagement error:', error);
        res.status(500).json({ error: 'Gagal mengambil data engagement' });
    }
});

// ==================== AI PERFORMANCE METRICS ====================
router.get('/ai-metrics', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Calculate average AI response time
        // We estimate this by looking at time between user message and AI response
        const [avgResponseTime] = await pool.query(`
            SELECT 
                AVG(TIMESTAMPDIFF(SECOND, user_msg.created_at, ai_msg.created_at)) as avg_seconds
            FROM chat_messages user_msg
            JOIN chat_messages ai_msg ON user_msg.session_id = ai_msg.session_id
                AND ai_msg.role = 'assistant'
                AND ai_msg.id = (
                    SELECT MIN(cm.id) FROM chat_messages cm 
                    WHERE cm.session_id = user_msg.session_id 
                    AND cm.role = 'assistant' 
                    AND cm.id > user_msg.id
                )
            WHERE user_msg.role = 'user'
        `);

        // AI response time distribution
        const [responseDistribution] = await pool.query(`
            SELECT 
                CASE 
                    WHEN TIMESTAMPDIFF(SECOND, user_msg.created_at, ai_msg.created_at) <= 2 THEN '0-2s'
                    WHEN TIMESTAMPDIFF(SECOND, user_msg.created_at, ai_msg.created_at) <= 5 THEN '2-5s'
                    WHEN TIMESTAMPDIFF(SECOND, user_msg.created_at, ai_msg.created_at) <= 10 THEN '5-10s'
                    ELSE '10s+'
                END as response_range,
                COUNT(*) as count
            FROM chat_messages user_msg
            JOIN chat_messages ai_msg ON user_msg.session_id = ai_msg.session_id
                AND ai_msg.role = 'assistant'
                AND ai_msg.id = (
                    SELECT MIN(cm.id) FROM chat_messages cm 
                    WHERE cm.session_id = user_msg.session_id 
                    AND cm.role = 'assistant' 
                    AND cm.id > user_msg.id
                )
            WHERE user_msg.role = 'user'
            GROUP BY response_range
        `);

        // Total AI interactions
        const [aiInteractions] = await pool.query(`
            SELECT COUNT(*) as count FROM chat_messages WHERE role = 'assistant'
        `);

        // Sessions with AI activity
        const [sessionsWithAI] = await pool.query(`
            SELECT COUNT(DISTINCT session_id) as count 
            FROM chat_messages 
            WHERE role = 'assistant'
        `);

        // Average messages per session
        const [avgMessagesPerSession] = await pool.query(`
            SELECT AVG(msg_count) as avg_messages
            FROM (
                SELECT session_id, COUNT(*) as msg_count
                FROM chat_messages
                GROUP BY session_id
            ) as session_counts
        `);

        // AI usage by hour (last 7 days, converted to WIB = UTC+7)
        const [aiByHour] = await pool.query(`
            SELECT 
                MOD(HOUR(created_at) + 7, 24) as hour,
                COUNT(*) as ai_responses
            FROM chat_messages
            WHERE role = 'assistant' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY MOD(HOUR(created_at) + 7, 24)
            ORDER BY hour ASC
        `);

        res.json({
            avg_response_time_seconds: Math.round(avgResponseTime[0].avg_seconds || 0),
            response_distribution: responseDistribution,
            total_ai_messages: aiInteractions[0].count,
            sessions_with_ai: sessionsWithAI[0].count,
            avg_messages_per_session: Math.round(avgMessagesPerSession[0].avg_messages || 0),
            ai_by_hour: aiByHour
        });
    } catch (error) {
        console.error('Admin AI metrics error:', error);
        res.status(500).json({ error: 'Gagal mengambil metrik AI' });
    }
});

// ==================== REVENUE ANALYTICS ====================
router.get('/revenue', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Plan upgrades over time (using created_at as proxy for upgrade date)
        const [upgrades] = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                plan_type,
                COUNT(*) as count
            FROM plans
            WHERE plan_type != 'free' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at), plan_type
            ORDER BY date ASC
        `);

        // Monthly revenue estimation (based on plan pricing)
        // Assuming: Pro = 49k/month, Visionary = 99k/month
        const [currentPlans] = await pool.query(`
            SELECT plan_type, COUNT(*) as count
            FROM plans
            WHERE plan_type != 'free'
            GROUP BY plan_type
        `);

        const pricing = { pro: 49000, visionary: 99000 };
        let monthlyRevenue = 0;
        currentPlans.forEach(p => {
            monthlyRevenue += (pricing[p.plan_type] || 0) * p.count;
        });

        // Conversion rate (free to paid)
        const [totalFree] = await pool.query(`
            SELECT COUNT(*) as count FROM plans WHERE plan_type = 'free'
        `);
        const [totalPaid] = await pool.query(`
            SELECT COUNT(*) as count FROM plans WHERE plan_type != 'free'
        `);

        const totalUsers = totalFree[0].count + totalPaid[0].count;
        const conversionRate = totalUsers > 0 ? (totalPaid[0].count / totalUsers * 100).toFixed(2) : 0;

        // Plan changes history (if we have birth_date_changes, we track upgrade patterns)
        const [planBreakdown] = await pool.query(`
            SELECT 
                COALESCE(p.plan_type, 'free') as plan_type,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM plans), 2) as percentage
            FROM plans p
            GROUP BY COALESCE(p.plan_type, 'free')
        `);

        res.json({
            monthly_recurring_revenue: monthlyRevenue,
            conversion_rate: parseFloat(conversionRate),
            paid_users: totalPaid[0].count,
            free_users: totalFree[0].count,
            upgrades_timeline: upgrades,
            plan_breakdown: planBreakdown
        });
    } catch (error) {
        console.error('Admin revenue error:', error);
        res.status(500).json({ error: 'Gagal mengambil data revenue' });
    }
});

// ==================== USER LIST ====================
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const planFilter = req.query.plan || '';
        const roleFilter = req.query.role || '';

        // Build WHERE conditions
        let conditions = [];
        let params = [];

        if (search) {
            conditions.push('(u.name LIKE ? OR u.email LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }
        if (planFilter) {
            conditions.push('COALESCE(p.plan_type, "free") = ?');
            params.push(planFilter);
        }
        if (roleFilter) {
            conditions.push('u.role = ?');
            params.push(roleFilter);
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        // Get total count
        const [countResult] = await pool.query(`
            SELECT COUNT(*) as total
            FROM users u
            LEFT JOIN plans p ON u.id = p.user_id
            ${whereClause}
        `, params);

        // Get users with pagination
        const [users] = await pool.query(`
            SELECT 
                u.id,
                u.email,
                u.name,
                u.avatar_url,
                u.role,
                u.email_verified,
                u.google_id IS NOT NULL as is_google_user,
                u.birth_datetime,
                u.created_at,
                COALESCE(p.plan_type, 'free') as plan_type,
                COALESCE(p.chat_count, 0) as chat_count,
                (SELECT COUNT(*) FROM chat_sessions cs WHERE cs.user_id = u.id) as total_sessions,
                (SELECT MAX(cs.created_at) FROM chat_sessions cs WHERE cs.user_id = u.id) as last_active
            FROM users u
            LEFT JOIN plans p ON u.id = p.user_id
            ${whereClause}
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        res.json({
            users,
            pagination: {
                page,
                limit,
                total: countResult[0].total,
                total_pages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({ error: 'Gagal mengambil daftar pengguna' });
    }
});

// ==================== RECENT ACTIVITY ====================
router.get('/activity', authenticateToken, isAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;

        // Recent chat sessions
        const [recentSessions] = await pool.query(`
            SELECT 
                cs.id,
                cs.user_id,
                u.name as user_name,
                u.email as user_email,
                cs.summary,
                cs.duration_seconds,
                cs.created_at,
                cs.ended_at,
                (SELECT COUNT(*) FROM chat_messages cm WHERE cm.session_id = cs.id) as message_count
            FROM chat_sessions cs
            LEFT JOIN users u ON cs.user_id = u.id
            ORDER BY cs.created_at DESC
            LIMIT ?
        `, [limit]);

        // Recent registrations with session count and last active
        const [recentUsers] = await pool.query(`
            SELECT 
                u.id,
                u.name,
                u.email,
                u.avatar_url,
                u.created_at,
                u.google_id IS NOT NULL as is_google_user,
                COALESCE(p.plan_type, 'free') as plan_type,
                (SELECT COUNT(*) FROM chat_sessions cs WHERE cs.user_id = u.id) as session_count,
                (SELECT MAX(cs.created_at) FROM chat_sessions cs WHERE cs.user_id = u.id) as last_active
            FROM users u
            LEFT JOIN plans p ON u.id = p.user_id
            ORDER BY u.created_at DESC
            LIMIT ?
        `, [limit]);

        res.json({
            recent_sessions: recentSessions,
            recent_users: recentUsers
        });
    } catch (error) {
        console.error('Admin activity error:', error);
        res.status(500).json({ error: 'Gagal mengambil aktivitas terbaru' });
    }
});

// ==================== SESSION CHAT HISTORY (ADMIN VIEW) ====================
router.get('/session/:sessionId/messages', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { sessionId } = req.params;

        // Get session info
        const [sessions] = await pool.query(`
            SELECT 
                cs.id,
                cs.user_id,
                u.name as user_name,
                u.email as user_email,
                cs.guest_name,
                cs.summary,
                cs.duration_seconds,
                cs.created_at,
                cs.ended_at
            FROM chat_sessions cs
            LEFT JOIN users u ON cs.user_id = u.id
            WHERE cs.id = ?
        `, [sessionId]);

        if (sessions.length === 0) {
            return res.status(404).json({ error: 'Session tidak ditemukan' });
        }

        // Get all messages from this session
        const [messages] = await pool.query(
            'SELECT id, role, content, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
            [sessionId]
        );

        res.json({
            session: sessions[0],
            messages
        });
    } catch (error) {
        console.error('Get session messages error:', error);
        res.status(500).json({ error: 'Gagal mengambil riwayat chat' });
    }
});

// ==================== BRAINSTORM AI CHAT ====================
const OPENROUTER_API_KEY = process.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.VITE_OPENROUTER_MODEL || 'xiaomi/mimo-v2-flash:free';
const BRAINSTORM_SESSION_ID = 1; // Fixed session ID for admin brainstorm

// Get brainstorm history
router.get('/brainstorm', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Check if session 1 exists, create if not
        const [sessions] = await pool.query(
            'SELECT id FROM chat_sessions WHERE id = ?',
            [BRAINSTORM_SESSION_ID]
        );

        if (sessions.length === 0) {
            // Create session 1 for admin brainstorm
            await pool.query(
                'INSERT INTO chat_sessions (id, user_id, guest_name, summary) VALUES (?, ?, ?, ?)',
                [BRAINSTORM_SESSION_ID, req.user.id, 'Admin Brainstorm', 'Admin brainstorm session for app development discussions']
            );
        }

        // Get all messages from session 1
        const [messages] = await pool.query(
            'SELECT id, role, content, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
            [BRAINSTORM_SESSION_ID]
        );

        res.json({ messages });
    } catch (error) {
        console.error('Get brainstorm history error:', error);
        res.status(500).json({ error: 'Gagal mengambil riwayat brainstorm' });
    }
});

router.post('/brainstorm', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { message, context, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message tidak boleh kosong' });
        }

        // Ensure session 1 exists
        const [sessions] = await pool.query(
            'SELECT id FROM chat_sessions WHERE id = ?',
            [BRAINSTORM_SESSION_ID]
        );

        if (sessions.length === 0) {
            await pool.query(
                'INSERT INTO chat_sessions (id, user_id, guest_name, summary) VALUES (?, ?, ?, ?)',
                [BRAINSTORM_SESSION_ID, req.user.id, 'Admin Brainstorm', 'Admin brainstorm session for app development discussions']
            );
        }

        // Save user message to database
        await pool.query(
            'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)',
            [BRAINSTORM_SESSION_ID, 'user', message]
        );

        // Build conversation history
        const messages = [
            {
                role: 'system',
                content: `Kamu adalah AI Product Advisor untuk aplikasi METRA.

TENTANG METRA:
METRA adalah aplikasi AI Spiritual Advisor yang menggabungkan wisdom tradisional (Weton Jawa, Zodiak Barat, Numerologi, Shio Cina, BaZi) dengan teknologi AI untuk memberikan insight personal harian.

FITUR UTAMA:
1. AI Chat dengan konteks spiritual personal
2. Dashboard dengan kalkulasi Weton, Zodiak, Life Path, Shio
3. BaZi (Four Pillars) analysis untuk paid users
4. Personalized daily insights
5. Sistem tier: Free (2 chat/hari), Pro (unlimited + BaZi), Visionary (GPT-4o + priority)

TUGASMU:
- Bantu admin/developer brainstorm ide pengembangan
- Analisis data dan berikan insight actionable
- Suggest fitur baru berdasarkan trend
- Berikan strategi untuk meningkatkan engagement & conversion
- Diskusikan technical improvements
- Berikan feedback konstruktif

GAYA KOMUNIKASI:
- Professional tapi friendly
- Gunakan data dari context yang diberikan
- Berikan jawaban terstruktur dengan bullet points
- Fokus pada actionable insights
- Gunakan emoji untuk membuat lebih engaging

${context || ''}
`
            }
        ];

        // Add conversation history
        if (history && Array.isArray(history)) {
            history.forEach(msg => {
                messages.push({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                });
            });
        }

        // Add current message
        messages.push({ role: 'user', content: message });

        // Call OpenRouter AI
        const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": process.env.APP_URL || 'http://localhost:5173',
                "X-Title": "Metra Admin"
            },
            body: JSON.stringify({
                model: OPENROUTER_MODEL,
                messages
            })
        });

        if (!aiResponse.ok) {
            const errorData = await aiResponse.json();
            throw new Error(errorData.error?.message || 'Gagal menghubungi AI Server');
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices[0].message.content;

        // Save AI response to database
        await pool.query(
            'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)',
            [BRAINSTORM_SESSION_ID, 'assistant', content]
        );

        res.json({ content });
    } catch (error) {
        console.error('Brainstorm error:', error);
        res.status(500).json({ error: error.message || 'Gagal mendapatkan respons AI' });
    }
});

// Clear brainstorm history
router.delete('/brainstorm', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM chat_messages WHERE session_id = ?',
            [BRAINSTORM_SESSION_ID]
        );
        res.json({ message: 'Riwayat brainstorm berhasil dihapus' });
    } catch (error) {
        console.error('Clear brainstorm error:', error);
        res.status(500).json({ error: 'Gagal menghapus riwayat' });
    }
});

export default router;
