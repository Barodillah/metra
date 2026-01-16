import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send, ArrowLeft, LockKeyhole, ChevronRight } from 'lucide-react';
import ChatBubble from '../components/ChatBubble';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const GuestChatPage = () => {
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [chatCount, setChatCount] = useState(0);
    const [showPaywall, setShowPaywall] = useState(false);
    const [guestData, setGuestData] = useState(null);

    useEffect(() => {
        const data = localStorage.getItem('guestData');
        const sessionData = localStorage.getItem('guestSession');

        if (data) {
            const parsedData = JSON.parse(data);
            setGuestData(parsedData);

            // Check for existing session on the same day
            const today = new Date().toDateString();
            if (sessionData) {
                const parsedSession = JSON.parse(sessionData);
                if (parsedSession.date === today) {
                    setMessages(parsedSession.messages);
                    setChatCount(parsedSession.chatCount);
                    if (parsedSession.chatCount >= 1) {
                        setShowPaywall(true);
                    }
                    return; // Loaded existing session, skip default init
                } else {
                    // New day, clear old session
                    localStorage.removeItem('guestSession');
                }
            }

            // Construct initial analysis message similar to Landing Page
            const { formData, results } = parsedData;
            const initialMsg = {
                text: `Analisis getaran untuk ${formData.name}: Sebagai ${results.weton.day} ${results.weton.pasaran} dengan Life Path ${results.lifePath}, kamu membawa energi keberuntungan yang kuat hari ini. Secara astrologi ${results.shio}, kamu sedang berada di fase ekspansi. Apa yang ingin kamu optimalkan?`,
                isAI: true
            };
            setMessages([initialMsg]);
        } else {
            // If no data, redirect back to landing page
            navigate('/');
        }
    }, [navigate]);

    // Save session to localStorage
    useEffect(() => {
        if (messages.length > 0) {
            const session = {
                messages,
                chatCount,
                date: new Date().toDateString()
            };
            localStorage.setItem('guestSession', JSON.stringify(session));
        }
    }, [messages, chatCount]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, showPaywall]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        // If limit reached, show paywall (should block input before this, but safe check)
        if (chatCount >= 1) {
            setShowPaywall(true);
            return;
        }

        const userMsgText = inputMessage;
        const newUserMsg = { text: userMsgText, isAI: false };
        setMessages(prev => [...prev, newUserMsg]);
        setInputMessage('');
        setIsTyping(true);

        try {
            // Build context for AI from guestData
            let userContext = "";
            if (guestData) {
                const { formData, results } = guestData;
                userContext = `
Nama: ${formData.name}
Tanggal Lahir: ${new Date(formData.dob).toLocaleDateString('id-ID')}
Weton: ${results.weton.day} ${results.weton.pasaran} (Neptu ${results.weton.neptu})
Zodiak: ${results.zodiac}
Shio: ${results.shio}
Life Path Number: ${results.lifePath}
`;
            }

            // Use quick chat API
            const res = await fetch(`${API_URL}/chat/quick`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        ...messages.map(m => ({
                            role: m.isAI ? "assistant" : "user",
                            content: m.text
                        })),
                        {
                            role: "user",
                            content: `${userMsgText}\n\n[INSTRUCTION: Berikan jawaban yang sangat detail, panjang, mendalam, dan filosofis. Hubungkan dengan data spiritual saya (Weton, Zodiak, Life Path). Buat jawaban ini sangat menarik sehingga saya penasaran untuk bertanya lebih lanjut. Akhiri dengan pertanyaan yang memancing rasa ingin tahu terkait nasib saya di masa depan.]`
                        }
                    ],
                    userContext
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch');

            setMessages(prev => [...prev, { text: data.content, isAI: true }]);
            setChatCount(prev => prev + 1);

            // Show paywall after 1 response
            setShowPaywall(true);

        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { text: "Maaf, sistem sedang sibuk. Silakan coba lagi nanti.", isAI: true }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#0F172A] overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6366F1]/10 blur-[160px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#06B6D4]/10 blur-[160px] rounded-full"></div>
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/5 p-4 z-50 h-[72px]">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="text-slate-400" size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-[#6366F1]/20">
                            <Sparkles size={20} className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white tracking-tight">Metra AI Advisor</p>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-[#06B6D4] rounded-full animate-pulse"></div>
                                <p className="text-[10px] text-[#06B6D4] font-bold uppercase tracking-widest">Guest Session</p>
                            </div>
                        </div>
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
                                <h4 className="text-2xl font-black text-white mb-3">Sesi Gratis Berakhir</h4>
                                <p className="text-sm text-slate-400 mb-8 font-medium leading-relaxed">
                                    Daftar sekarang untuk melanjutkan percakapan dan mendapatkan panduan spiritual lengkap tanpa batas.
                                </p>
                                <button
                                    onClick={() => navigate('/register')}
                                    className="w-full bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-[#6366F1]/30 hover:brightness-110 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                                >
                                    Daftar Sekarang <ChevronRight size={16} />
                                </button>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="mt-4 text-slate-500 hover:text-slate-300 text-sm font-bold transition-colors"
                                >
                                    Sudah punya akun? Login
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
                        disabled={showPaywall || isTyping}
                        placeholder={showPaywall ? "Silakan daftar untuk melanjutkan" : "Balas pesan ini..."}
                        className="flex-1 bg-[#1E293B]/60 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium text-white focus:border-[#6366F1]/50 outline-none disabled:opacity-50 transition-all placeholder:text-slate-600"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={showPaywall || !inputMessage.trim() || isTyping}
                        className="p-4 bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] rounded-2xl text-white shadow-lg shadow-[#6366F1]/20 disabled:opacity-50 hover:brightness-110 transition-all"
                    >
                        <Send size={22} />
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default GuestChatPage;
