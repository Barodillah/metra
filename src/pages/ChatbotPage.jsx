import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Sparkles,
    Send,
    ArrowLeft,
    LockKeyhole,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

    const [messages, setMessages] = useState([
        {
            text: `Halo${user?.name ? ` ${user.name}` : ''}! 👋\n\nSaya Metra AI Advisor, asisten spiritual digitalmu. Saya bisa membantu kamu memahami:\n\n• Makna Weton & Neptu\n• Interpretasi Zodiak\n• Life Path Number\n• Waktu terbaik untuk keputusan penting\n\nApa yang ingin kamu ketahui hari ini?`,
            isAI: true
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [chatCount, setChatCount] = useState(0);
    const [showPaywall, setShowPaywall] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const aiResponses = [
        "Berdasarkan analisis energi kosmik, hari ini adalah waktu yang tepat untuk memulai proyek baru. Weton kamu menunjukkan kekuatan pada aspek kreativitas dan komunikasi.",
        "Menarik sekali! Dari perspektif numerologi, angka Life Path-mu mengindikasikan kemampuan kepemimpinan yang kuat. Gunakan ini untuk mengambil inisiatif dalam pekerjaanmu.",
        "Kombinasi Shio dan Zodiak-mu menciptakan sinergi unik. Bulan ini, fokuskan energimu pada hubungan interpersonal - ada kesempatan besar untuk kolaborasi yang menguntungkan.",
        "Sesuai dengan siklus Neptu, minggu depan akan menjadi periode refleksi yang baik. Gunakan waktu ini untuk merenungkan tujuan jangka panjangmu.",
        "Dari pembacaan energi harianmu, saya merekomendasikan untuk mengambil keputusan penting di pagi hari antara jam 9-11. Ini adalah periode dengan energi paling optimal untukmu.",
    ];

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        if (chatCount >= 2) {
            setShowPaywall(true);
            return;
        }

        const newUserMsg = { text: inputMessage, isAI: false };
        setMessages(prev => [...prev, newUserMsg]);
        setInputMessage('');
        setChatCount(prev => prev + 1);
        setIsTyping(true);

        // Simulate AI response
        setTimeout(() => {
            const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
            setMessages(prev => [...prev, { text: randomResponse, isAI: true }]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#0F172A] flex flex-col">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6366F1]/10 blur-[160px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#06B6D4]/10 blur-[160px] rounded-full"></div>
            </div>

            {/* Header */}
            <header className="bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/5 p-4 relative z-20">
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

                    <div className="text-[10px] bg-white/5 border border-white/10 px-4 py-2 rounded-full text-slate-400 font-bold uppercase tracking-tighter">
                        {2 - chatCount} free chat
                    </div>
                </div>
            </header>

            {/* Messages Container */}
            <main className="flex-1 overflow-y-auto p-6 relative z-10">
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
            <footer className="bg-[#0F172A]/80 backdrop-blur-xl border-t border-white/5 p-4 relative z-20">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3">
                    <input
                        type="text"
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
