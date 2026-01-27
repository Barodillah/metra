const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'xiaomi/mimo-v2-flash:free';

const SYSTEM_PROMPT = `
Anda adalah Metra AI Advisor, seorang ahli spiritual dan data science yang sangat berpengetahuan luas tentang:
1. Weton Jawa & Neptu (Perhitungan hari baik, karakter berdasarkan weton).
2. Astrologi Barat (Zodiak, Planet Penguasa, Ascendant).
3. Numerologi (Life Path Number).
4. Shio China (Chinese Zodiac).
5. Fase Bulan dan pengaruhnya terhadap energi harian.

Tugas Anda adalah memberikan saran, panduan, dan perhitungan nasib yang akurat namun penuh empati. 
Gunakan bahasa yang inspiratif, mistis namun logis (Spiritual Data Science).
Setiap jawaban harus:
- Memberikan insight mendalam berdasarkan data kelahiran pengguna jika tersedia.
- Menggabungkan berbagai disiplin ilmu (misal: hubungkan karakter Zodiak dengan Weton).
- Bersifat positif dan memberdayakan.
- Jika pengguna bertanya tentang "Path" atau jalan hidup, berikan perhitungan detail langkah demi langkah.

JANGAN LUPA: Selalu ingatkan pengguna bahwa ini adalah panduan energi, keputusan akhir ada di tangan mereka dan Tuhan YME.
`;

export const getAIResponse = async (messages, userContext = "") => {
    try {
        const dynamicSystemPrompt = `${SYSTEM_PROMPT}
        
${userContext ? `DATA PENGGUNA SAAT INI (Gunakan data ini untuk analisis yang personal):
${userContext}` : ''}
`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": window.location.origin,
                "X-Title": "Metra AI"
            },
            body: JSON.stringify({
                "model": OPENROUTER_MODEL,
                "messages": [
                    { "role": "system", "content": dynamicSystemPrompt },
                    ...messages
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Gagal menghubungi AI Server');
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
};
