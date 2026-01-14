import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Sparkles,
    Send,
    ArrowLeft,
    LockKeyhole,
    ChevronRight,
    Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAIResponse } from '../services/ai';
import { supabase } from '../lib/supabase';

import {
    getWeton,
    getZodiac,
    getLifePathNumber,
    getShio,
    getElement,
    getRulingPlanet,
    getAscendant,
    getMoonPhase
} from '../utils/spiritual';

// Helper function untuk mendapatkan hari dan tanggal dalam Bahasa Indonesia
const getCurrentDateInfo = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const now = new Date();
    const dayName = days[now.getDay()];
    const date = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();

    return {
        dayName,
        date,
        monthName,
        year,
        fullDate: `${dayName}, ${date} ${monthName} ${year}`
    };
};

const ChatBubble = ({ message, isAI }) => (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4 animate-fade-in`}>
        <div className={`max-w-[85%] p-4 rounded-2xl shadow-lg ${isAI
            ? 'bg-[#1E293B] border border-white/5 text-slate-200 shadow-black/20'
            : 'bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white shadow-[#6366F1]/20'
            }`}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>
    </div>
);

const ChatbotPage = () => {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    // Get current date info
    const dateInfo = getCurrentDateInfo();

    const [messages, setMessages] = useState([
        {
            text: `Halo${user?.name ? ` ${user.name}` : ''}! 👋\n\nHari ini adalah ${dateInfo.fullDate}.\n\nSaya Metra AI Advisor, asisten spiritual digitalmu. Saya bisa membantu kamu memahami:\n\n• Makna Weton & Neptu\n• Interpretasi Zodiak\n• Life Path Number\n• Waktu terbaik untuk keputusan penting\n\nApa yang ingin kamu ketahui hari ini?`,
            isAI: true
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [chatCount, setChatCount] = useState(0);
    const [aiResponseCount, setAiResponseCount] = useState(0); // Track AI responses for free plan
    const [showPaywall, setShowPaywall] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Clear chat function - hanya clear tampilan, data tetap di DB
    const handleClearChat = () => {
        const initialMessage = {
            text: `Halo${user?.name ? ` ${user.name}` : ''}! 👋\n\nHari ini adalah ${dateInfo.fullDate}.\n\nSaya Metra AI Advisor, asisten spiritual digitalmu. Saya bisa membantu kamu memahami:\n\n• Makna Weton & Neptu\n• Interpretasi Zodiak\n• Life Path Number\n• Waktu terbaik untuk keputusan penting\n\nApa yang ingin kamu ketahui hari ini?`,
            isAI: true
        };
        setMessages([initialMessage]);
        setAiResponseCount(0);
        setShowPaywall(false);
    };

    // Check if user has paid plan (pro or visionary)
    const isPaidUser = user?.plan_type && user.plan_type !== 'free';

    const aiResponses = [
        "Berdasarkan analisis energi kosmik, hari ini adalah waktu yang tepat untuk memulai proyek baru. Weton kamu menunjukkan kekuatan pada aspek kreativitas dan komunikasi.",
        "Menarik sekali! Dari perspektif numerologi, angka Life Path-mu mengindikasikan kemampuan kepemimpinan yang kuat. Gunakan ini untuk mengambil inisiatif dalam pekerjaanmu.",
        "Kombinasi Shio dan Zodiak-mu menciptakan sinergi unik. Bulan ini, fokuskan energimu pada hubungan interpersonal - ada kesempatan besar untuk kolaborasi yang menguntungkan.",
        "Sesuai dengan siklus Neptu, minggu depan akan menjadi periode refleksi yang baik. Gunakan waktu ini untuk merenungkan tujuan jangka panjangmu.",
        "Dari pembacaan energi harianmu, saya merekomendasikan untuk mengambil keputusan penting di pagi hari antara jam 9-11. Ini adalah periode dengan energi paling optimal untukmu.",
    ];

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        // Limit check: Only for 'free' plan
        // 'pro' and 'visionary' have unlimited chats
        if (chatCount >= 2 && (!user?.plan_type || user?.plan_type === 'free')) {
            setShowPaywall(true);
            return;
        }

        const userMsgText = inputMessage;
        const newUserMsg = { text: userMsgText, isAI: false };
        setMessages(prev => [...prev, newUserMsg]);
        setInputMessage('');
        setIsTyping(true);

        try {
            // Save user message
            if (user) {
                await supabase.from('chats').insert({
                    user_id: user.id,
                    message: userMsgText,
                    is_ai: false
                });
            }

            // Dictionary for better readable context
            let userContext = "";
            if (user?.birth_date) {
                const birthDate = user.birth_date;
                const birthTime = user.birth_time;

                const weton = getWeton(birthDate);
                const zodiac = getZodiac(birthDate);
                const shio = getShio(birthDate);
                const lifePath = getLifePathNumber(birthDate);
                const element = getElement(zodiac);
                const planet = getRulingPlanet(zodiac);
                const ascendant = getAscendant(zodiac, birthTime);
                const moon = getMoonPhase(birthDate);

                userContext = `
Nama: ${user.name}
Tanggal Lahir: ${new Date(birthDate).toLocaleDateString('id-ID')}
Waktu Lahir: ${birthTime || "Tidak diketahui"}
Weton: ${weton ? `${weton.day} ${weton.pasaran} (Neptu ${weton.neptu})` : '-'}
Zodiak: ${zodiac}
Shio: ${shio}
Life Path Number: ${lifePath}
Elemen Dominan: ${element}
Planet Penguasa: ${planet}
Ascendant: ${ascendant || '-'}
Fase Bulan saat lahir: ${moon}
`;
            }

            // Get AI Response
            const aiResponseText = await getAIResponse([
                ...messages.map(m => ({
                    role: m.isAI ? "assistant" : "user",
                    content: m.text
                })),
                { role: "user", content: userMsgText }
            ], userContext);

            // Save AI message
            if (user) {
                await supabase.from('chats').insert({
                    user_id: user.id,
                    message: aiResponseText,
                    is_ai: true
                });

                // Update local chat count
                setChatCount(prev => prev + 1);
            }

            setMessages(prev => [...prev, { text: aiResponseText, isAI: true }]);

            // Increment AI response count for free plan paywall trigger
            const newAiResponseCount = aiResponseCount + 1;
            setAiResponseCount(newAiResponseCount);

            // Show paywall after AI has responded 2 times for free users
            if (!isPaidUser && newAiResponseCount >= 2) {
                setShowPaywall(true);
            }
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { text: "Maaf, sistem sedang sibuk. Coba lagi nanti.", isAI: true }]);
        } finally {
            setIsTyping(false);
        }
    };

    useEffect(() => {
        const loadChats = async () => {
            if (!user) return;

            const { data, error } = await supabase
                .from('chats')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (data && data.length > 0) {
                setMessages(prev => [
                    prev[0], // Keep the welcome message
                    ...data.map(chat => ({
                        text: chat.message,
                        isAI: chat.is_ai
                    }))
                ]);

                // Simple logic to set initial chat count for today (could be improved)
                const today = new Date().toISOString().split('T')[0];
                const todayChats = data.filter(c => c.created_at.startsWith(today) && !c.is_ai).length;
                const todayAiChats = data.filter(c => c.created_at.startsWith(today) && c.is_ai).length;
                setChatCount(todayChats);
                setAiResponseCount(todayAiChats);

                // Check if free user already hit limit
                if ((!user?.plan_type || user?.plan_type === 'free') && todayAiChats >= 2) {
                    setShowPaywall(true);
                }
            }
        };

        loadChats();
    }, [user]);

    return (
        <div className="fixed inset-0 bg-[#0F172A] overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6366F1]/10 blur-[160px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#06B6D4]/10 blur-[160px] rounded-full"></div>
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/5 p-4 z-50 h-[72px]">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            to={isAuthenticated ? '/dashboard' : '/'}
                            className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                        >
                            <ArrowLeft className="text-slate-400" size={20} />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-[#6366F1]/20">
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white tracking-tight">Metra AI Advisor</p>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-[#06B6D4] rounded-full animate-pulse"></div>
                                    <p className="text-[10px] text-[#06B6D4] font-bold uppercase tracking-widest">Active</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Show date info */}
                        <div className="hidden sm:block text-[10px] text-slate-500 font-medium">
                            {dateInfo.fullDate}
                        </div>

                        {/* Clear chat button - only for paid users */}
                        {isPaidUser && (
                            <button
                                onClick={handleClearChat}
                                className="p-2 hover:bg-white/5 rounded-xl transition-colors group"
                                title="Clear chat"
                            >
                                <Trash2 className="text-slate-500 group-hover:text-red-400 transition-colors" size={18} />
                            </button>
                        )}

                        {/* Free chat counter - only for free users */}
                        {!isPaidUser && (
                            <div className="text-[10px] bg-white/5 border border-white/10 px-4 py-2 rounded-full text-slate-400 font-bold uppercase tracking-tighter">
                                {Math.max(0, 2 - aiResponseCount)} free chat
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Messages Container */}
            <main className="absolute inset-0 overflow-y-auto px-6 pt-[88px] pb-[100px] z-10 scroll-smooth">
                <div className="max-w-4xl mx-auto">
                    {messages.map((m, i) => (
                        <ChatBubble key={i} message={m.text} isAI={m.isAI} />
                    ))}

                    {isTyping && (
                        <div className="flex justify-start mb-4">
                            <div className="bg-[#1E293B] border border-white/5 px-4 py-3 rounded-2xl">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {showPaywall && (
                        <div className="flex justify-center my-8 animate-fade-in">
                            <div className="bg-[#0F172A]/80 border border-[#6366F1]/30 p-8 rounded-3xl max-w-md text-center shadow-2xl backdrop-blur-xl">
                                <div className="w-16 h-16 bg-[#6366F1]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <LockKeyhole className="text-[#6366F1]" size={32} />
                                </div>
                                <h4 className="text-2xl font-black text-white mb-3">Sesi Gratis Habis</h4>
                                <p className="text-sm text-slate-400 mb-8 font-medium leading-relaxed">
                                    Buka akses unlimited ke Metra AI Advisor untuk panduan spiritual yang lebih mendalam setiap hari.
                                </p>
                                <button className="w-full bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-[#6366F1]/30 hover:brightness-110 uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                                    Upgrade ke Pro <ChevronRight size={16} />
                                </button>
                                <button
                                    onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
                                    className="mt-4 text-slate-500 hover:text-slate-300 text-sm font-bold transition-colors"
                                >
                                    Kembali ke {isAuthenticated ? 'Dashboard' : 'Beranda'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* Input Area */}
            <footer className="fixed bottom-0 left-0 right-0 bg-[#0F172A]/80 backdrop-blur-xl border-t border-white/5 p-4 z-50">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3">
                    <input
                        type="text"
                        autoFocus
                        disabled={showPaywall}
                        placeholder={showPaywall ? "Sesi gratis telah berakhir" : "Tanyakan tentang nasib dan masa depanmu..."}
                        className="flex-1 bg-[#1E293B]/60 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium text-white focus:border-[#6366F1]/50 outline-none disabled:opacity-50 transition-all placeholder:text-slate-600"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={showPaywall || !inputMessage.trim()}
                        className="p-4 bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] rounded-2xl text-white shadow-lg shadow-[#6366F1]/20 disabled:opacity-50 hover:brightness-110 transition-all"
                    >
                        <Send size={22} />
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default ChatbotPage;
