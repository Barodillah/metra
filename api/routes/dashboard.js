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

// ==================== BAZI FUNCTIONS ====================

// Heavenly Stems (天干) - Tian Gan
const HEAVENLY_STEMS = [
    { name: '甲', pinyin: 'Jiǎ', element: 'Kayu', polarity: '+', indo: 'Kayu Yang' },
    { name: '乙', pinyin: 'Yǐ', element: 'Kayu', polarity: '-', indo: 'Kayu Yin' },
    { name: '丙', pinyin: 'Bǐng', element: 'Api', polarity: '+', indo: 'Api Yang' },
    { name: '丁', pinyin: 'Dīng', element: 'Api', polarity: '-', indo: 'Api Yin' },
    { name: '戊', pinyin: 'Wù', element: 'Tanah', polarity: '+', indo: 'Tanah Yang' },
    { name: '己', pinyin: 'Jǐ', element: 'Tanah', polarity: '-', indo: 'Tanah Yin' },
    { name: '庚', pinyin: 'Gēng', element: 'Logam', polarity: '+', indo: 'Logam Yang' },
    { name: '辛', pinyin: 'Xīn', element: 'Logam', polarity: '-', indo: 'Logam Yin' },
    { name: '壬', pinyin: 'Rén', element: 'Air', polarity: '+', indo: 'Air Yang' },
    { name: '癸', pinyin: 'Guǐ', element: 'Air', polarity: '-', indo: 'Air Yin' }
];

// Earthly Branches (地支) - Di Zhi
const EARTHLY_BRANCHES = [
    { name: '子', pinyin: 'Zǐ', animal: 'Tikus', element: 'Air', hours: '23-01' },
    { name: '丑', pinyin: 'Chǒu', animal: 'Kerbau', element: 'Tanah', hours: '01-03' },
    { name: '寅', pinyin: 'Yín', animal: 'Macan', element: 'Kayu', hours: '03-05' },
    { name: '卯', pinyin: 'Mǎo', animal: 'Kelinci', element: 'Kayu', hours: '05-07' },
    { name: '辰', pinyin: 'Chén', animal: 'Naga', element: 'Tanah', hours: '07-09' },
    { name: '巳', pinyin: 'Sì', animal: 'Ular', element: 'Api', hours: '09-11' },
    { name: '午', pinyin: 'Wǔ', animal: 'Kuda', element: 'Api', hours: '11-13' },
    { name: '未', pinyin: 'Wèi', animal: 'Kambing', element: 'Tanah', hours: '13-15' },
    { name: '申', pinyin: 'Shēn', animal: 'Monyet', element: 'Logam', hours: '15-17' },
    { name: '酉', pinyin: 'Yǒu', animal: 'Ayam', element: 'Logam', hours: '17-19' },
    { name: '戌', pinyin: 'Xū', animal: 'Anjing', element: 'Tanah', hours: '19-21' },
    { name: '亥', pinyin: 'Hài', animal: 'Babi', element: 'Air', hours: '21-23' }
];

// Calculate BaZi Four Pillars
const getBaZiPillars = (dateString, timeString) => {
    if (!dateString) return null;

    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Parse hour (default to 12 if not provided)
    let hour = 12;
    if (timeString) {
        const parts = timeString.split(':');
        hour = parseInt(parts[0]) || 12;
    }

    // Year Pillar
    const yearStemIdx = (year - 4) % 10;
    const yearBranchIdx = (year - 4) % 12;
    const yearStem = HEAVENLY_STEMS[yearStemIdx];
    const yearBranch = EARTHLY_BRANCHES[yearBranchIdx];

    // Month Pillar (simplified calculation - based on solar terms approximation)
    // Adjusted month based on solar calendar approximation
    let adjustedMonth = month;
    if (day < 6) adjustedMonth = month === 1 ? 12 : month - 1;

    const monthStemIdx = ((year - 4) % 5 * 2 + adjustedMonth - 1) % 10;
    const monthBranchIdx = (adjustedMonth + 1) % 12;
    const monthStem = HEAVENLY_STEMS[monthStemIdx];
    const monthBranch = EARTHLY_BRANCHES[monthBranchIdx];

    // Day Pillar (simplified Ganzhi calculation)
    const baseDate = new Date(1900, 0, 31); // Known day: 甲辰 (Jiǎ Chén)
    const diffDays = Math.floor((date - baseDate) / (1000 * 60 * 60 * 24));
    const dayStemIdx = (diffDays % 10 + 10) % 10;
    const dayBranchIdx = (diffDays % 12 + 12) % 12;
    const dayStem = HEAVENLY_STEMS[dayStemIdx];
    const dayBranch = EARTHLY_BRANCHES[dayBranchIdx];

    // Hour Pillar
    let hourBranchIdx;
    if (hour >= 23 || hour < 1) hourBranchIdx = 0;
    else hourBranchIdx = Math.floor((hour + 1) / 2);

    const hourStemIdx = (dayStemIdx % 5 * 2 + hourBranchIdx) % 10;
    const hourStem = HEAVENLY_STEMS[hourStemIdx];
    const hourBranch = EARTHLY_BRANCHES[hourBranchIdx];

    return {
        year: {
            stem: yearStem,
            branch: yearBranch,
            hanzi: `${yearStem.name}${yearBranch.name}`,
            display: `${yearBranch.animal} ${yearStem.element}`,
            element: yearStem.element
        },
        month: {
            stem: monthStem,
            branch: monthBranch,
            hanzi: `${monthStem.name}${monthBranch.name}`,
            display: `${monthBranch.animal} ${monthStem.element}`,
            element: monthStem.element
        },
        day: {
            stem: dayStem,
            branch: dayBranch,
            hanzi: `${dayStem.name}${dayBranch.name}`,
            display: `${dayBranch.animal} ${dayStem.element}`,
            element: dayStem.element
        },
        hour: {
            stem: hourStem,
            branch: hourBranch,
            hanzi: `${hourStem.name}${hourBranch.name}`,
            display: `${hourBranch.animal} ${hourStem.element}`,
            element: hourStem.element
        }
    };
};

// Calculate Element Dominance from BaZi Pillars
const getBaZiElements = (pillars) => {
    if (!pillars) return null;

    const counts = { Kayu: 0, Api: 0, Tanah: 0, Logam: 0, Air: 0 };

    // Count elements from stems and branches
    const allPillars = [pillars.year, pillars.month, pillars.day, pillars.hour];
    allPillars.forEach(pillar => {
        counts[pillar.stem.element]++;
        counts[pillar.branch.element]++;
    });

    // Determine strength levels
    const getStrength = (count) => {
        if (count >= 3) return { level: 'Kuat', score: count };
        if (count >= 2) return { level: 'Stabil', score: count };
        return { level: 'Lemah', score: count };
    };

    const elements = Object.entries(counts).map(([element, count]) => ({
        element,
        count,
        ...getStrength(count),
        percentage: Math.round((count / 8) * 100)
    }));

    // Sort by count descending
    elements.sort((a, b) => b.count - a.count);

    // Determine dominant and weak elements
    const dominant = elements.filter(e => e.count >= 2);
    const weak = elements.filter(e => e.count <= 1);

    return {
        breakdown: elements,
        dominant: dominant.map(e => e.element).join(' & '),
        weak: weak.map(e => e.element).join(' & '),
        summary: `${dominant.map(e => `${e.element} (${e.count})`).join(', ')} kuat; ${weak.map(e => `${e.element} (${e.count})`).join(', ')} lemah`
    };
};

// Calculate Shen Sha (Spiritual Stars)
const getBaZiShenSha = (pillars) => {
    if (!pillars) return [];

    const shenSha = [];
    const dayBranch = pillars.day.branch.animal;
    const yearBranch = pillars.year.branch.animal;

    // Tian Yi Gui Ren (天乙贵人) - Noble Person Star
    const tianYiMap = {
        'Tikus': ['Kerbau', 'Kambing'], 'Kerbau': ['Tikus', 'Monyet'],
        'Macan': ['Babi', 'Ayam'], 'Kelinci': ['Babi', 'Ayam'],
        'Naga': ['Kuda', 'Anjing'], 'Ular': ['Kuda', 'Tikus'],
        'Kuda': ['Kambing', 'Kerbau'], 'Kambing': ['Kuda', 'Monyet'],
        'Monyet': ['Kerbau', 'Kambing'], 'Ayam': ['Macan', 'Kuda'],
        'Anjing': ['Kelinci', 'Ular'], 'Babi': ['Macan', 'Kelinci']
    };

    if (tianYiMap[dayBranch] && (tianYiMap[dayBranch].includes(yearBranch) || tianYiMap[dayBranch].includes(pillars.hour.branch.animal))) {
        shenSha.push({
            name: 'Tian Yi Gui Ren',
            chinese: '天乙贵人',
            meaning: 'Bintang Penyembuh',
            description: 'Menandakan perlindungan dari kesulitan dan mendapat bantuan di saat kritis.',
            type: 'positive'
        });
    }

    // Tai Sui (太岁) - Grand Duke
    const currentYear = new Date().getFullYear();
    const currentYearBranchIdx = (currentYear - 4) % 12;
    const currentYearAnimal = EARTHLY_BRANCHES[currentYearBranchIdx].animal;

    if (yearBranch === currentYearAnimal) {
        shenSha.push({
            name: 'Tai Sui',
            chinese: '太岁',
            meaning: 'Grand Duke',
            description: 'Tahun ini membawa energi kuat yang perlu diarahkan dengan bijak.',
            type: 'neutral'
        });
    }

    // Wen Chang (文昌) - Academic Star
    const wenChangMap = {
        'Macan': 'Ular', 'Kelinci': 'Kuda', 'Monyet': 'Babi', 'Ayam': 'Tikus'
    };
    if (wenChangMap[dayBranch] && wenChangMap[dayBranch] === pillars.hour.branch.animal) {
        shenSha.push({
            name: 'Wen Chang',
            chinese: '文昌',
            meaning: 'Bintang Akademik',
            description: 'Membawa keberuntungan dalam pendidikan, pembelajaran, dan karir intelektual.',
            type: 'positive'
        });
    }

    // Yi Ma (驿马) - Traveling Horse Star
    const yiMaMap = {
        'Tikus': 'Macan', 'Kerbau': 'Babi', 'Macan': 'Monyet', 'Kelinci': 'Ular',
        'Naga': 'Macan', 'Ular': 'Babi', 'Kuda': 'Monyet', 'Kambing': 'Ular',
        'Monyet': 'Macan', 'Ayam': 'Babi', 'Anjing': 'Monyet', 'Babi': 'Ular'
    };
    if (yiMaMap[yearBranch] && yiMaMap[yearBranch] === pillars.day.branch.animal) {
        shenSha.push({
            name: 'Yi Ma',
            chinese: '驿马',
            meaning: 'Bintang Perjalanan',
            description: 'Menandakan pergerakan, perjalanan, dan perubahan dalam hidup.',
            type: 'positive'
        });
    }

    // Default if no special stars found
    if (shenSha.length === 0) {
        shenSha.push({
            name: 'Ping An',
            chinese: '平安',
            meaning: 'Bintang Kedamaian',
            description: 'Menandakan periode tenang dan stabil tanpa gejolak besar.',
            type: 'neutral'
        });
    }

    return shenSha;
};

// Generate BaZi AI Insight
const generateBaZiInsight = async (pillars, elements, shenSha, userName) => {
    const prompt = `Kamu adalah master BaZi (Four Pillars of Destiny). Berikan insight PERSONAL dalam 1 paragraf sedang berdasarkan data berikut:

STRUKTUR BAZI:
- Tahun: ${pillars.year.display} (${pillars.year.hanzi})
- Bulan: ${pillars.month.display} (${pillars.month.hanzi})
- Hari: ${pillars.day.display} (${pillars.day.hanzi})
- Jam: ${pillars.hour.display} (${pillars.hour.hanzi})

DOMINASI ELEMEN:
${elements.summary}

SHEN SHA (BINTANG):
${shenSha.map(s => `- ${s.name} (${s.meaning})`).join('\n')}

Fokus pada:
1. Bagaimana struktur elemen mempengaruhi kepribadian dan potensi
2. Saran praktis berdasarkan Shen Sha yang aktif

Gunakan gaya hangat dan mistis. Langsung mulai tanpa salam:`;

    const insight = await callAI(prompt, 300);
    return insight || 'Struktur BaZi Anda menunjukkan keseimbangan unik yang mempengaruhi jalur hidup Anda. Perhatikan elemen dominan untuk memaksimalkan potensi.';
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

            // BaZi calculation for non-free users
            if (user.birth_datetime) {
                const birthDate = new Date(user.birth_datetime);
                const birthDateStr = birthDate.toISOString().split('T')[0];
                const birthTimeStr = birthDate.toTimeString().slice(0, 5);

                const baziPillars = getBaZiPillars(birthDateStr, birthTimeStr);
                const baziElements = getBaZiElements(baziPillars);
                const baziShenSha = getBaZiShenSha(baziPillars);
                const baziInsight = await generateBaZiInsight(baziPillars, baziElements, baziShenSha, user.name);

                response.bazi = {
                    pillars: {
                        year: {
                            label: 'Tahun',
                            display: baziPillars.year.display,
                            hanzi: baziPillars.year.hanzi,
                            element: `${baziPillars.year.stem.element} (${baziPillars.year.stem.polarity})`
                        },
                        month: {
                            label: 'Bulan',
                            display: baziPillars.month.display,
                            hanzi: baziPillars.month.hanzi,
                            element: `${baziPillars.month.stem.element} (${baziPillars.month.stem.polarity})`
                        },
                        day: {
                            label: 'Hari',
                            display: baziPillars.day.display,
                            hanzi: baziPillars.day.hanzi,
                            element: `${baziPillars.day.stem.element} (${baziPillars.day.stem.polarity})`
                        },
                        hour: {
                            label: 'Jam',
                            display: baziPillars.hour.display,
                            hanzi: baziPillars.hour.hanzi,
                            element: `${baziPillars.hour.stem.element} (${baziPillars.hour.stem.polarity})`
                        }
                    },
                    elements: baziElements,
                    shenSha: baziShenSha,
                    insight: baziInsight
                };
            }
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
