import express from 'express';
import pool from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

const OPENROUTER_API_KEY = process.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.VITE_OPENROUTER_MODEL || 'xiaomi/mimo-v2-flash:free';

// ==================== HELPER FUNCTIONS ====================

// Get current WIB time info
const getCurrentTimeInfo = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const now = new Date();
    const wibOffset = 7 * 60 * 60 * 1000;
    const wibTime = new Date(now.getTime() + wibOffset);

    return {
        dayName: days[wibTime.getUTCDay()],
        date: wibTime.getUTCDate(),
        month: wibTime.getUTCMonth() + 1,
        monthName: months[wibTime.getUTCMonth()],
        year: wibTime.getUTCFullYear(),
        hours: wibTime.getUTCHours(),
        minutes: wibTime.getUTCMinutes(),
        dayOfWeek: wibTime.getUTCDay(),
        dateString: `${wibTime.getUTCFullYear()}-${String(wibTime.getUTCMonth() + 1).padStart(2, '0')}-${String(wibTime.getUTCDate()).padStart(2, '0')}`
    };
};

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

// Get Shio with Chinese Element
const getShioWithElement = (year) => {
    const animals = ["Monyet", "Ayam", "Anjing", "Babi", "Tikus", "Kerbau", "Macan", "Kelinci", "Naga", "Ular", "Kuda", "Kambing"];
    const elements = ["Logam", "Logam", "Air", "Air", "Kayu", "Kayu", "Api", "Api", "Tanah", "Tanah"];

    const shio = animals[year % 12];
    const element = elements[year % 10];

    return { shio, element, full: `${shio} ${element}` };
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

// Get Moon Phase
const getMoonPhase = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    if (month < 3) { year--; month += 12; }
    ++month;
    let c = 365.25 * year;
    let e = 30.6 * month;
    let jd = c + e + day - 694039.09;
    jd /= 29.5305882;
    let b = parseInt(jd);
    jd -= b;
    b = Math.round(jd * 8);
    if (b >= 8) b = 0;

    const phases = ["Bulan Baru", "Bulan Sabit Awal", "Kuarter Pertama", "Bulan Cembung", "Bulan Purnama", "Bulan Susut", "Kuarter Akhir", "Bulan Sabit Akhir"];
    return phases[b] || "Tidak Diketahui";
};

// Calculate Energy Scores based on spiritual data
const calculateEnergyScores = (weton, zodiac, lifePath, moonPhase) => {
    // Base scores from neptu
    const neptu = weton?.neptu || 10;
    const baseScore = Math.min(100, Math.max(40, (neptu / 18) * 100));

    // Modifiers based on day and moon phase
    const dayModifiers = {
        "Senin": { karir: 10, asmara: 5, kesehatan: 0 },
        "Selasa": { karir: 5, asmara: -5, kesehatan: 10 },
        "Rabu": { karir: 15, asmara: 10, kesehatan: 5 },
        "Kamis": { karir: 10, asmara: 15, kesehatan: 10 },
        "Jumat": { karir: 5, asmara: 20, kesehatan: 15 },
        "Sabtu": { karir: -5, asmara: 10, kesehatan: 5 },
        "Minggu": { karir: -10, asmara: 15, kesehatan: 20 }
    };

    const moonModifiers = {
        "Bulan Purnama": { karir: 10, asmara: 15, kesehatan: 5 },
        "Bulan Baru": { karir: 5, asmara: -5, kesehatan: 10 },
        "Bulan Cembung": { karir: 8, asmara: 8, kesehatan: 8 }
    };

    const dayMod = dayModifiers[weton?.day] || { karir: 0, asmara: 0, kesehatan: 0 };
    const moonMod = moonModifiers[moonPhase] || { karir: 0, asmara: 0, kesehatan: 0 };

    // Life path influence
    const lifePathMod = {
        karir: lifePath % 3 === 0 ? 10 : 0,
        asmara: lifePath % 2 === 0 ? 10 : 0,
        kesehatan: lifePath > 5 ? 5 : 0
    };

    return {
        karir: Math.min(100, Math.max(30, Math.round(baseScore + dayMod.karir + moonMod.karir + lifePathMod.karir))),
        asmara: Math.min(100, Math.max(30, Math.round(baseScore + dayMod.asmara + moonMod.asmara + lifePathMod.asmara))),
        kesehatan: Math.min(100, Math.max(30, Math.round(baseScore + dayMod.kesehatan + moonMod.kesehatan + lifePathMod.kesehatan)))
    };
};

// Check Good Day for activities
const getGoodDayChecklist = (weton, moonPhase, zodiac) => {
    const neptu = weton?.neptu || 10;
    const pasaran = weton?.pasaran;
    const day = weton?.day;

    // Menikah: Good on Kliwon, Legi, high neptu, not on Selasa/Sabtu
    const menikah = (pasaran === 'Kliwon' || pasaran === 'Legi') &&
        neptu >= 12 &&
        day !== 'Selasa' && day !== 'Sabtu';

    // Bisnis: Good on Rabu, Kamis, Pon, Wage
    const bisnis = (day === 'Rabu' || day === 'Kamis') ||
        (pasaran === 'Pon' || pasaran === 'Wage');

    // Bepergian: Good on Kamis, Jumat, Minggu, not on Bulan Baru
    const bepergian = (day === 'Kamis' || day === 'Jumat' || day === 'Minggu') &&
        moonPhase !== 'Bulan Baru';

    return { menikah, bisnis, bepergian };
};

// Calculate Golden Hour
const getGoldenHour = (weton, zodiac, currentHour) => {
    const neptu = weton?.neptu || 10;

    // Calculate peak hours based on neptu and day
    const dayPeaks = {
        "Senin": [8, 14],
        "Selasa": [9, 15],
        "Rabu": [10, 16],
        "Kamis": [7, 13],
        "Jumat": [11, 17],
        "Sabtu": [9, 15],
        "Minggu": [10, 16]
    };

    const peaks = dayPeaks[weton?.day] || [9, 15];

    // Adjust based on neptu
    const adjustment = neptu > 14 ? -1 : neptu < 10 ? 1 : 0;

    const goldenHours = peaks.map(h => {
        const adjusted = h + adjustment;
        return `${String(adjusted).padStart(2, '0')}:00`;
    });

    // Find next golden hour
    const nextGolden = goldenHours.find(h => parseInt(h) > currentHour) || goldenHours[0];

    return {
        hours: goldenHours,
        next: nextGolden,
        description: `Waktu terbaik untuk keputusan penting: ${goldenHours.join(' & ')}`
    };
};

// Call AI for generating insights
const callAI = async (prompt, maxTokens = 500) => {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: OPENROUTER_MODEL,
                messages: [{ role: "user", content: prompt }],
                max_tokens: maxTokens
            })
        });

        if (!response.ok) throw new Error('AI request failed');

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('AI call error:', error);
        return null;
    }
};

// Generate Daily Tip (1 sentence)
const generateDailyTip = async (weton, zodiac, element, moonPhase) => {
    const prompt = `Berikan TIP HARIAN spiritual dalam SATU KALIMAT SINGKAT (maksimal 15 kata) berdasarkan:
- Hari: ${weton?.day} ${weton?.pasaran}
- Zodiak: ${zodiac}
- Fase Bulan: ${moonPhase}

Contoh format: "Hari ini cocok untuk memulai proyek baru dengan energi segar."

Langsung berikan tip tanpa pembuka:`;

    const tip = await callAI(prompt, 100);
    return tip || `Manfaatkan energi ${weton?.day} ${weton?.pasaran} untuk langkah positif hari ini.`;
};

// Generate Personalized Insight (2-3 paragraphs) for PRO
const generatePersonalizedInsight = async (userData, todayData) => {
    const prompt = `Kamu adalah ahli spiritual Indonesia. Berikan INSIGHT PERSONAL untuk hari ini dalam 2-3 paragraf pendek.

DATA PENGGUNA:
- Nama: ${userData.name}
- Weton Lahir: ${userData.birthWeton}
- Zodiak: ${userData.zodiac}
- Shio: ${userData.shio}
- Life Path: ${userData.lifePath}

DATA HARI INI:
- Tanggal: ${todayData.date}
- Weton: ${todayData.weton}
- Fase Bulan: ${todayData.moonPhase}
- Elemen Aktif: ${todayData.element}

Fokus pada:
1. Bagaimana energi hari ini berinteraksi dengan profil spiritual user
2. Area yang perlu perhatian (karir/asmara/kesehatan)
3. Saran konkret untuk hari ini

Gunakan gaya hangat dan personal. Langsung mulai tanpa salam pembuka:`;

    const insight = await callAI(prompt, 400);
    return insight || 'Energi hari ini mendukung refleksi diri. Gunakan waktu untuk mengevaluasi prioritas dan menetapkan niat positif.';
};

// Generate Visionary Forecast for VISIONARY tier
const generateVisionaryForecast = async (userData, todayData) => {
    const prompt = `Kamu adalah master spiritual. Berikan FORECAST VISIONARY singkat dalam format:

**Hari Ini:** [1-2 kalimat]
**Minggu Ini:** [1-2 kalimat]  
**Bulan Ini:** [1-2 kalimat]

DATA:
- Nama: ${userData.name}
- Weton: ${userData.birthWeton}
- Zodiak: ${userData.zodiac}
- Shio: ${userData.shio}
- Hari Ini: ${todayData.weton}
- Fase Bulan: ${todayData.moonPhase}

Langsung berikan forecast tanpa pembuka:`;

    const forecast = await callAI(prompt, 350);
    return forecast || null;
};

// ==================== MAIN ENDPOINT ====================

router.get('/insights', authenticateToken, async (req, res) => {
    try {
        // Get user data with plan
        const [users] = await pool.query(
            `SELECT u.*, p.plan_type 
             FROM users u 
             LEFT JOIN plans p ON u.id = p.user_id 
             WHERE u.id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }

        const user = users[0];
        const planType = user.plan_type || 'free';
        const timeInfo = getCurrentTimeInfo();

        // Calculate today's spiritual data
        const todayWeton = getWeton(timeInfo.dateString);
        const todayZodiac = getZodiac(timeInfo.month, timeInfo.date);
        const todayMoonPhase = getMoonPhase(timeInfo.dateString);
        const todayShioData = getShioWithElement(timeInfo.year);
        const todayLifePath = getLifePathNumber(timeInfo.dateString);

        // User's birth spiritual data (if available)
        let userBirthData = null;
        if (user.birth_datetime) {
            const birthDate = new Date(user.birth_datetime);
            const birthDateStr = birthDate.toISOString().split('T')[0];
            const birthMonth = birthDate.getMonth() + 1;
            const birthDay = birthDate.getDate();
            const birthYear = birthDate.getFullYear();

            userBirthData = {
                weton: getWeton(birthDateStr),
                zodiac: getZodiac(birthMonth, birthDay),
                shio: getShioWithElement(birthYear),
                lifePath: getLifePathNumber(birthDateStr)
            };
        }

        // Base response (FREE tier)
        const wetonShio = `${todayWeton.day} ${todayWeton.pasaran} - ${todayShioData.full}`;
        const dailyTip = await generateDailyTip(todayWeton, todayZodiac, todayShioData.element, todayMoonPhase);

        const response = {
            tier: planType,
            dailyTip,
            wetonShio,
            neptu: todayWeton.neptu,
            todaySpiritual: {
                weton: `${todayWeton.day} ${todayWeton.pasaran}`,
                neptu: todayWeton.neptu,
                zodiac: todayZodiac,
                moonPhase: todayMoonPhase,
                shio: todayShioData.full
            }
        };

        // PRO tier additions
        if (planType === 'pro' || planType === 'visionary') {
            const birthWeton = userBirthData?.weton;
            const userZodiac = userBirthData?.zodiac || todayZodiac;
            const userLifePath = userBirthData?.lifePath || todayLifePath;

            response.energyScores = calculateEnergyScores(todayWeton, userZodiac, userLifePath, todayMoonPhase);
            response.goodDayChecklist = getGoodDayChecklist(todayWeton, todayMoonPhase, userZodiac);

            response.personalizedInsight = await generatePersonalizedInsight(
                {
                    name: user.name || 'Penjelajah',
                    birthWeton: birthWeton ? `${birthWeton.day} ${birthWeton.pasaran}` : 'Tidak diketahui',
                    zodiac: userZodiac,
                    shio: userBirthData?.shio?.full || todayShioData.full,
                    lifePath: userLifePath
                },
                {
                    date: `${timeInfo.dayName}, ${timeInfo.date} ${timeInfo.monthName} ${timeInfo.year}`,
                    weton: `${todayWeton.day} ${todayWeton.pasaran}`,
                    moonPhase: todayMoonPhase,
                    element: todayShioData.element
                }
            );
        }

        // VISIONARY tier additions
        if (planType === 'visionary') {
            response.goldenHour = getGoldenHour(todayWeton, userBirthData?.zodiac || todayZodiac, timeInfo.hours);

            response.forecast = await generateVisionaryForecast(
                {
                    name: user.name || 'Penjelajah',
                    birthWeton: userBirthData?.weton ? `${userBirthData.weton.day} ${userBirthData.weton.pasaran}` : 'Tidak diketahui',
                    zodiac: userBirthData?.zodiac || todayZodiac,
                    shio: userBirthData?.shio?.full || todayShioData.full
                },
                {
                    weton: `${todayWeton.day} ${todayWeton.pasaran}`,
                    moonPhase: todayMoonPhase
                }
            );

            // Multi-profile placeholder
            response.multiProfile = {
                available: false,
                message: 'Fitur Multi-Profile akan segera hadir. Anda dapat menambahkan profil keluarga/partner.'
            };
        }

        res.json(response);

    } catch (error) {
        console.error('Dashboard insights error:', error);
        res.status(500).json({ error: 'Gagal mengambil insights' });
    }
});

export default router;
