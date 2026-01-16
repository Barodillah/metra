export const getWeton = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const pasarans = ["Legi", "Paing", "Pon", "Wage", "Kliwon"];
    const baseDate = new Date(1900, 0, 1);
    const diffDays = Math.floor((date - baseDate) / (1000 * 60 * 60 * 24));

    // Handle diffDays < 0 if needed, though simple fallback here
    if (diffDays < 0) return { day: days[date.getDay()], pasaran: "Kliwon", neptu: 15 };

    const dayIdx = date.getDay();
    const pasaranIdx = (diffDays + 1) % 5;
    const dayValues = { "Minggu": 5, "Senin": 4, "Selasa": 3, "Rabu": 7, "Kamis": 8, "Jumat": 6, "Sabtu": 9 };
    const pasaranValues = { "Legi": 5, "Paing": 9, "Pon": 7, "Wage": 4, "Kliwon": 8 };
    const d = days[dayIdx];
    const p = pasarans[pasaranIdx];
    return { day: d, pasaran: p, neptu: dayValues[d] + pasaranValues[p] };
};

export const getZodiac = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
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

export const getLifePathNumber = (dateString) => {
    if (!dateString) return null;
    const digits = dateString.replace(/\D/g, '');
    let sum = digits.split('').reduce((acc, d) => acc + parseInt(d), 0);
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
        sum = sum.toString().split('').reduce((acc, d) => acc + parseInt(d), 0);
    }
    return sum;
};

export const getShio = (dateString) => {
    if (!dateString) return null;
    const year = new Date(dateString).getFullYear();
    const animals = ["Monyet", "Ayam", "Anjing", "Babi", "Tikus", "Kerbau", "Macan", "Kelinci", "Naga", "Ular", "Kuda", "Kambing"];
    return animals[year % 12];
};

// BaZi Constants and Helpers
const HEAVENLY_STEMS = [
    { name: '甲', element: 'Kayu' }, { name: '乙', element: 'Kayu' },
    { name: '丙', element: 'Api' }, { name: '丁', element: 'Api' },
    { name: '戊', element: 'Tanah' }, { name: '己', element: 'Tanah' },
    { name: '庚', element: 'Logam' }, { name: '辛', element: 'Logam' },
    { name: '壬', element: 'Air' }, { name: '癸', element: 'Air' }
];

const EARTHLY_BRANCHES = [
    { name: '子', animal: 'Tikus', element: 'Air' }, { name: '丑', animal: 'Kerbau', element: 'Tanah' },
    { name: '寅', animal: 'Macan', element: 'Kayu' }, { name: '卯', animal: 'Kelinci', element: 'Kayu' },
    { name: '辰', animal: 'Naga', element: 'Tanah' }, { name: '巳', animal: 'Ular', element: 'Api' },
    { name: '午', animal: 'Kuda', element: 'Api' }, { name: '未', animal: 'Kambing', element: 'Tanah' },
    { name: '申', animal: 'Monyet', element: 'Logam' }, { name: '酉', animal: 'Ayam', element: 'Logam' },
    { name: '戌', animal: 'Anjing', element: 'Tanah' }, { name: '亥', animal: 'Babi', element: 'Air' }
];

const getBaZiPillars = (dateString, timeString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Parse hour
    let hour = 12;
    if (timeString) {
        const parts = timeString.split(':');
        hour = parseInt(parts[0]) || 12;
    }

    // Year
    const yearStem = HEAVENLY_STEMS[(year - 4) % 10];
    const yearBranch = EARTHLY_BRANCHES[(year - 4) % 12];

    // Month (Simplified)
    let adjustedMonth = month;
    if (day < 6) adjustedMonth = month === 1 ? 12 : month - 1;
    const monthStem = HEAVENLY_STEMS[((year - 4) % 5 * 2 + adjustedMonth - 1) % 10];
    const monthBranch = EARTHLY_BRANCHES[(adjustedMonth + 1) % 12];

    // Day (Simplified)
    const baseDate = new Date(1900, 0, 31);
    const diffDays = Math.floor((date - baseDate) / (1000 * 60 * 60 * 24));
    const dayStem = HEAVENLY_STEMS[(diffDays % 10 + 10) % 10];
    const dayBranch = EARTHLY_BRANCHES[(diffDays % 12 + 12) % 12];

    // Hour
    let hourBranchIdx = (hour >= 23 || hour < 1) ? 0 : Math.floor((hour + 1) / 2);
    const hourStem = HEAVENLY_STEMS[(dayStem ? HEAVENLY_STEMS.indexOf(dayStem) % 5 * 2 + hourBranchIdx : 0) % 10];
    const hourBranch = EARTHLY_BRANCHES[hourBranchIdx];

    return {
        year: { stem: yearStem, branch: yearBranch },
        month: { stem: monthStem, branch: monthBranch },
        day: { stem: dayStem, branch: dayBranch },
        hour: { stem: hourStem, branch: hourBranch }
    };
};

export const getElement = (dateString, timeString = '12:00') => {
    if (!dateString) return null;

    const pillars = getBaZiPillars(dateString, timeString);
    if (!pillars) return "Misteri";

    const counts = { Kayu: 0, Api: 0, Tanah: 0, Logam: 0, Air: 0 };
    [pillars.year, pillars.month, pillars.day, pillars.hour].forEach(p => {
        if (p.stem) counts[p.stem.element]++;
        if (p.branch) counts[p.branch.element]++;
    });

    // Find strongest
    let maxCount = -1;
    let dominant = 'Misteri';

    Object.entries(counts).forEach(([el, count]) => {
        if (count > maxCount) {
            maxCount = count;
            dominant = el;
        }
    });

    return dominant;
};

export const getRulingPlanet = (zodiac) => {
    if (!zodiac) return null;
    const planets = {
        "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury", "Cancer": "Moon",
        "Leo": "Sun", "Virgo": "Mercury", "Libra": "Venus", "Scorpio": "Pluto",
        "Sagittarius": "Jupiter", "Capricorn": "Saturn", "Aquarius": "Uranus", "Pisces": "Neptune"
    };
    return planets[zodiac] || "Semesta";
};

export const getAscendant = (zodiac, time) => {
    if (!zodiac || !time) return null;
    const [hour] = time.split(':').map(Number);
    const zodiacs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
    const sunSignIdx = zodiacs.indexOf(zodiac);

    let offset = Math.floor((hour - 6) / 2);
    if (offset < 0) offset += 12;

    const risingIdx = (sunSignIdx + offset) % 12;
    return zodiacs[risingIdx];
};

export const getMoonPhase = (dateString) => {
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

    switch (b) {
        case 0: return "New Moon";
        case 1: return "Waxing Crescent";
        case 2: return "First Quarter";
        case 3: return "Waxing Gibbous";
        case 4: return "Full Moon";
        case 5: return "Waning Gibbous";
        case 6: return "Last Quarter";
        case 7: return "Waning Crescent";
        default: return "Unknown";
    }
};
