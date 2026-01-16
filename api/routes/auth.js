import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import pool from '../db.js';
import { sendOtpEmail } from '../email.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'metra-secret-key-2026-change-in-production';
const JWT_EXPIRES = '7d';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate 6-digit OTP
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate JWT Token
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
    );
};

// Middleware to verify JWT
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token tidak ditemukan' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token tidak valid atau sudah expired' });
        }
        req.user = user;
        next();
    });
};

// ==================== REGISTER ====================
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Semua field wajib diisi' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password minimal 6 karakter' });
        }

        // Check if email already exists
        const [existing] = await pool.query('SELECT id, email_verified FROM users WHERE email = ?', [email]);

        if (existing.length > 0) {
            if (existing[0].email_verified) {
                return res.status(400).json({ error: 'Email sudah terdaftar. Silakan login.' });
            }
            // Delete unverified user to allow re-registration
            await pool.query('DELETE FROM users WHERE id = ?', [existing[0].id]);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate OTP
        const otp = generateOtp();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Insert user
        const [result] = await pool.query(
            `INSERT INTO users (name, email, password, otp_code, otp_expires_at) VALUES (?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, otp, otpExpires]
        );

        // Send OTP email
        await sendOtpEmail(email, otp, name);

        res.status(201).json({
            message: 'Registrasi berhasil! Cek email untuk kode OTP.',
            email: email
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// ==================== VERIFY OTP ====================
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email dan OTP wajib diisi' });
        }

        // Find user
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ? AND otp_code = ?',
            [email, otp]
        );

        if (users.length === 0) {
            return res.status(400).json({ error: 'Kode OTP tidak valid' });
        }

        const user = users[0];

        // Check if OTP expired
        if (new Date() > new Date(user.otp_expires_at)) {
            return res.status(400).json({ error: 'Kode OTP sudah expired. Silakan minta kode baru.' });
        }

        // Update user as verified
        await pool.query(
            'UPDATE users SET email_verified = TRUE, otp_code = NULL, otp_expires_at = NULL WHERE id = ?',
            [user.id]
        );

        // Create plan for user
        await pool.query('INSERT INTO plans (user_id) VALUES (?)', [user.id]);

        // Generate token
        const token = generateToken(user);

        res.json({
            message: 'Email berhasil diverifikasi!',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar_url: user.avatar_url
            }
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// ==================== RESEND OTP ====================
router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email wajib diisi' });
        }

        // Find user
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(404).json({ error: 'Email tidak ditemukan' });
        }

        const user = users[0];

        if (user.email_verified) {
            return res.status(400).json({ error: 'Email sudah terverifikasi' });
        }

        // Generate new OTP
        const otp = generateOtp();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        // Update OTP in database
        await pool.query(
            'UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?',
            [otp, otpExpires, user.id]
        );

        // Send OTP email
        await sendOtpEmail(email, otp, user.name);

        res.json({ message: 'Kode OTP baru telah dikirim ke email' });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email dan password wajib diisi' });
        }

        // Find user
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ error: 'Email atau password salah' });
        }

        const user = users[0];

        // Check if user registered with Google
        if (!user.password && user.google_id) {
            return res.status(400).json({ error: 'Akun ini terdaftar dengan Google. Gunakan Login dengan Google.' });
        }

        // Check if email is verified
        if (!user.email_verified) {
            return res.status(403).json({
                error: 'Email belum diverifikasi',
                needsVerification: true,
                email: user.email
            });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Email atau password salah' });
        }

        // Get plan info
        const [plans] = await pool.query('SELECT plan_type FROM plans WHERE user_id = ?', [user.id]);
        const planType = plans.length > 0 ? plans[0].plan_type : 'free';

        // Generate token
        const token = generateToken(user);

        res.json({
            message: 'Login berhasil!',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar_url: user.avatar_url,
                birth_datetime: user.birth_datetime,
                plan_type: planType
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// ==================== GOOGLE AUTH ====================
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ error: 'Google credential tidak ditemukan' });
        }

        // Verify Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        // Check if user exists
        let [users] = await pool.query('SELECT * FROM users WHERE email = ? OR google_id = ?', [email, googleId]);

        let user;
        let isNewUser = false;

        if (users.length === 0) {
            // Create new user
            const [result] = await pool.query(
                `INSERT INTO users (email, name, avatar_url, google_id, email_verified) VALUES (?, ?, ?, ?, TRUE)`,
                [email, name, picture, googleId]
            );

            // Create plan for new user
            await pool.query('INSERT INTO plans (user_id) VALUES (?)', [result.insertId]);

            [users] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
            user = users[0];
            isNewUser = true;
        } else {
            user = users[0];

            // Update user with Google info if not already linked
            if (!user.google_id) {
                await pool.query(
                    'UPDATE users SET google_id = ?, avatar_url = COALESCE(avatar_url, ?), email_verified = TRUE WHERE id = ?',
                    [googleId, picture, user.id]
                );
            }
        }

        // Get plan info
        const [plans] = await pool.query('SELECT plan_type FROM plans WHERE user_id = ?', [user.id]);
        const planType = plans.length > 0 ? plans[0].plan_type : 'free';

        // Generate token
        const token = generateToken(user);

        res.json({
            message: isNewUser ? 'Akun berhasil dibuat!' : 'Login berhasil!',
            token,
            user: {
                id: user.id,
                name: user.name || name,
                email: user.email,
                role: user.role,
                avatar_url: user.avatar_url || picture,
                birth_datetime: user.birth_datetime,
                plan_type: planType
            }
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ error: 'Gagal memverifikasi akun Google' });
    }
});

// ==================== GOOGLE AUTH (UserInfo) ====================
router.post('/google-userinfo', async (req, res) => {
    try {
        const { userInfo, accessToken } = req.body;

        if (!userInfo || !userInfo.email) {
            return res.status(400).json({ error: 'Data Google tidak valid' });
        }

        const { sub: googleId, email, name, picture } = userInfo;

        // Check if user exists
        let [users] = await pool.query('SELECT * FROM users WHERE email = ? OR google_id = ?', [email, googleId]);

        let user;
        let isNewUser = false;

        if (users.length === 0) {
            // Create new user
            const [result] = await pool.query(
                `INSERT INTO users (email, name, avatar_url, google_id, email_verified) VALUES (?, ?, ?, ?, TRUE)`,
                [email, name, picture, googleId]
            );

            // Create plan for new user
            await pool.query('INSERT INTO plans (user_id) VALUES (?)', [result.insertId]);

            [users] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
            user = users[0];
            isNewUser = true;
        } else {
            user = users[0];

            // Update user with Google info if not already linked
            if (!user.google_id) {
                await pool.query(
                    'UPDATE users SET google_id = ?, avatar_url = COALESCE(avatar_url, ?), email_verified = TRUE WHERE id = ?',
                    [googleId, picture, user.id]
                );
            }
        }

        // Get plan info
        const [plans] = await pool.query('SELECT plan_type FROM plans WHERE user_id = ?', [user.id]);
        const planType = plans.length > 0 ? plans[0].plan_type : 'free';

        // Generate token
        const token = generateToken(user);

        res.json({
            message: isNewUser ? 'Akun berhasil dibuat!' : 'Login berhasil!',
            token,
            user: {
                id: user.id,
                name: user.name || name,
                email: user.email,
                role: user.role,
                avatar_url: user.avatar_url || picture,
                birth_datetime: user.birth_datetime,
                plan_type: planType
            }
        });
    } catch (error) {
        console.error('Google userinfo auth error:', error);
        res.status(500).json({ error: 'Gagal login dengan Google' });
    }
});

// ==================== GET CURRENT USER ====================
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);

        if (users.length === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }

        const user = users[0];

        // Get plan info
        const [plans] = await pool.query('SELECT plan_type FROM plans WHERE user_id = ?', [user.id]);
        const planType = plans.length > 0 ? plans[0].plan_type : 'free';

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar_url: user.avatar_url,
                birth_datetime: user.birth_datetime,
                plan_type: planType
            }
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// ==================== GET BIRTH DATE CHANGE INFO ====================
router.get('/birth-date-changes', authenticateToken, async (req, res) => {
    try {
        // Get plan info
        const [plans] = await pool.query('SELECT plan_type FROM plans WHERE user_id = ?', [req.user.id]);
        const planType = plans.length > 0 ? plans[0].plan_type : 'free';

        // Get change count
        const [changes] = await pool.query(
            'SELECT COUNT(*) as count FROM birth_date_changes WHERE user_id = ?',
            [req.user.id]
        );
        const changeCount = changes[0].count;

        // Determine limit based on plan
        const limits = {
            'free': 1,
            'pro': 5,
            'visionary': -1 // -1 means unlimited
        };
        const limit = limits[planType] || 1;
        const remaining = limit === -1 ? -1 : Math.max(0, limit - changeCount);

        res.json({
            plan_type: planType,
            change_count: changeCount,
            limit: limit,
            remaining: remaining,
            can_change: limit === -1 || changeCount < limit
        });
    } catch (error) {
        console.error('Get birth date changes error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// ==================== UPDATE PROFILE ====================
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { name, avatar_url, birth_datetime } = req.body;

        // If birth_datetime is being updated, check limits
        if (birth_datetime) {
            // Get current user's birth_datetime
            const [currentUser] = await pool.query('SELECT birth_datetime FROM users WHERE id = ?', [req.user.id]);
            const currentBirthDatetime = currentUser[0]?.birth_datetime;

            // Only check limits if birth_datetime is actually changing
            if (currentBirthDatetime !== null && birth_datetime !== currentBirthDatetime?.toISOString?.()) {
                // Get plan info
                const [plans] = await pool.query('SELECT plan_type FROM plans WHERE user_id = ?', [req.user.id]);
                const planType = plans.length > 0 ? plans[0].plan_type : 'free';

                // Get change count
                const [changes] = await pool.query(
                    'SELECT COUNT(*) as count FROM birth_date_changes WHERE user_id = ?',
                    [req.user.id]
                );
                const changeCount = changes[0].count;

                // Check limits based on plan
                const limits = { 'free': 1, 'pro': 5, 'visionary': -1 };
                const limit = limits[planType] || 1;

                if (limit !== -1 && changeCount >= limit) {
                    const planName = planType === 'free' ? 'Free' : planType === 'pro' ? 'Pro' : 'Visionary';
                    return res.status(403).json({
                        error: `Batas perubahan tanggal lahir sudah tercapai (${limit}x untuk ${planName} Plan). Upgrade plan untuk lebih banyak perubahan.`,
                        limit_reached: true,
                        plan_type: planType,
                        change_count: changeCount,
                        limit: limit
                    });
                }

                // Record the change
                await pool.query(
                    'INSERT INTO birth_date_changes (user_id, old_birth_datetime, new_birth_datetime) VALUES (?, ?, ?)',
                    [req.user.id, currentBirthDatetime, birth_datetime]
                );
            } else if (currentBirthDatetime === null) {
                // First time setting birth_datetime (not counted as a change)
                // No limit check needed for initial setup
            }
        }

        await pool.query(
            'UPDATE users SET name = COALESCE(?, name), avatar_url = COALESCE(?, avatar_url), birth_datetime = COALESCE(?, birth_datetime) WHERE id = ?',
            [name, avatar_url, birth_datetime, req.user.id]
        );

        // Get updated user with plan info
        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
        const user = users[0];

        const [plans] = await pool.query('SELECT plan_type FROM plans WHERE user_id = ?', [req.user.id]);
        const planType = plans.length > 0 ? plans[0].plan_type : 'free';

        res.json({
            message: 'Profil berhasil diperbarui',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar_url: user.avatar_url,
                birth_datetime: user.birth_datetime,
                plan_type: planType
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

export default router;
