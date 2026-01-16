import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
    Sparkles,
    Send,
    ArrowLeft,
    LockKeyhole,
    ChevronRight,
    Trash2,
    Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
import ChatBubble from '../components/ChatBubble';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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



const ChatbotPage = () => {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const sessionIdRef = useRef(null);
    const sessionStartTimeRef = useRef(null);

    // Get current date info
    const dateInfo = getCurrentDateInfo();

    const getInitialMessage = () => ({
        text: `Halo${user?.name ? ` ${user.name}` : ''}! 👋\n\nHari ini adalah ${dateInfo.fullDate}.\n\nSaya **Metra AI Advisor**, asisten spiritual digitalmu. Saya bisa membantu kamu memahami:\n\n• **Makna Weton & Neptu**\n• **Interpretasi Zodiak**\n• **Life Path Number**\n• **Waktu terbaik** untuk keputusan penting\n\nApa yang ingin kamu ketahui hari ini?`,
        isAI: true
    });

    const [messages, setMessages] = useState([getInitialMessage()]);
    const [inputMessage, setInputMessage] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [chatCount, setChatCount] = useState(0);
    const [aiResponseCount, setAiResponseCount] = useState(0);
    const [showPaywall, setShowPaywall] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isLoadingSession, setIsLoadingSession] = useState(true);
    const [isClearing, setIsClearing] = useState(false);

    // Check if user has paid plan
    const isPaidUser = user?.plan_type && user.plan_type !== 'free';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load or create session when page opens (for authenticated users)
    useEffect(() => {
        const loadOrCreateSession = async () => {
            if (!isAuthenticated) {
                setIsLoadingSession(false);
                return;
            }

            try {
                const token = localStorage.getItem('metra_token');

                // First, try to get the last active session
                const sessionsRes = await fetch(`${API_URL}/chat/sessions`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const sessionsData = await sessionsRes.json();

                // Find the last session that hasn't ended
                const lastActiveSession = sessionsData.sessions?.find(s => !s.ended_at);

                if (lastActiveSession) {
                    // Load messages from last active session
                    sessionIdRef.current = lastActiveSession.id;
                    setSessionId(lastActiveSession.id);
                    sessionStartTimeRef.current = new Date(lastActiveSession.created_at);

                    // Fetch messages for this session
                    const messagesRes = await fetch(`${API_URL}/chat/sessions/${lastActiveSession.id}/messages`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    const messagesData = await messagesRes.json();

                    if (messagesData.messages && messagesData.messages.length > 0) {
                        // Convert messages to our format
                        const loadedMessages = messagesData.messages.map(m => ({
                            text: m.content,
                            isAI: m.role === 'assistant'
                        }));

                        // Add initial greeting message at the beginning if not present
                        setMessages([getInitialMessage(), ...loadedMessages]);

                        // Count AI responses for paywall
                        const aiCount = loadedMessages.filter(m => m.isAI).length;
                        setAiResponseCount(aiCount);
                        setChatCount(loadedMessages.filter(m => !m.isAI).length);

                        // Check if free user reached limit
                        if (!isPaidUser && aiCount >= 2) {
                            setShowPaywall(true);
                        }
                    }
                } else {
                    // No active session, create a new one
                    const res = await fetch(`${API_URL}/chat/sessions`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    const data = await res.json();
                    if (data.session_id) {
                        sessionIdRef.current = data.session_id;
                        setSessionId(data.session_id);
                        sessionStartTimeRef.current = new Date();
                    }
                }
            } catch (error) {
                console.error('Failed to load/create session:', error);
            } finally {
                setIsLoadingSession(false);
            }
        };

        loadOrCreateSession();

        // Cleanup: Only end session for FREE users on unmount (paid users keep session active)
        // Paid users' sessions are only ended via clear chat or explicit back button
        return () => {
            // Don't end session for paid users - they should be able to continue later
            // Session will be ended only when they explicitly clear chat
        };
    }, [isAuthenticated]);

    // Build user context for AI
    const buildUserContext = () => {
        if (!user?.birth_datetime) return "";

        const birthDateTime = new Date(user.birth_datetime);
        // Use local date components instead of UTC to avoid timezone shift
        const year = birthDateTime.getFullYear();
        const month = String(birthDateTime.getMonth() + 1).padStart(2, '0');
        const day = String(birthDateTime.getDate()).padStart(2, '0');
        const birthDate = `${year}-${month}-${day}`;
        const birthTime = birthDateTime.toTimeString().slice(0, 5);

        const weton = getWeton(birthDate);
        const zodiac = getZodiac(birthDate);
        const shio = getShio(birthDate);
        const lifePath = getLifePathNumber(birthDate);
        const element = getElement(zodiac);
        const planet = getRulingPlanet(zodiac);
        const ascendant = getAscendant(zodiac, birthTime);
        const moon = getMoonPhase(birthDate);

        return `
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
    };

    // Handle back button click - update summary only (session stays active for paid users)
    const handleBackClick = async () => {
        if (sessionId && isAuthenticated) {
            try {
                const token = localStorage.getItem('metra_token');
                // Update summary only - don't end session so paid users can continue later
                await fetch(`${API_URL}/chat/sessions/${sessionId}/summary`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            } catch (error) {
                console.error('Failed to update summary:', error);
            }
        }
        navigate(isAuthenticated ? '/dashboard' : '/');
    };

    // Clear chat and start new session (only for paid users)
    const handleClearChat = async () => {
        if (!isPaidUser) return;

        setIsClearing(true);
        const toastId = toast.loading('Membersihkan chat...');

        try {
            const token = localStorage.getItem('metra_token');

            // End current session with summary generation
            if (sessionId) {
                await fetch(`${API_URL}/chat/sessions/${sessionId}/end`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }

            // Create new session
            const res = await fetch(`${API_URL}/chat/sessions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();

            if (data.session_id) {
                sessionIdRef.current = data.session_id;
                setSessionId(data.session_id);
                sessionStartTimeRef.current = new Date();
            }

            // Reset messages
            setMessages([getInitialMessage()]);
            setAiResponseCount(0);
            setChatCount(0);
            setShowPaywall(false);

            toast.success('Chat berhasil dibersihkan!', { id: toastId });
        } catch (error) {
            console.error('Failed to clear chat:', error);
            toast.error('Gagal membersihkan chat', { id: toastId });
        } finally {
            setIsClearing(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        // Limit check for free users
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
            const userContext = buildUserContext();
            let aiResponseText = '';

            if (isAuthenticated && sessionId) {
                // Use session-based chat API
                const token = localStorage.getItem('metra_token');
                const res = await fetch(`${API_URL}/chat/sessions/${sessionId}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        content: userMsgText,
                        userContext
                    })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                aiResponseText = data.ai_message.content;
            } else {
                // Use quick chat API for guests
                const res = await fetch(`${API_URL}/chat/quick`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [
                            ...messages.map(m => ({
                                role: m.isAI ? "assistant" : "user",
                                content: m.text
                            })),
                            { role: "user", content: userMsgText }
                        ],
                        userContext
                    })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                aiResponseText = data.content;
            }

            setChatCount(prev => prev + 1);
            setMessages(prev => [...prev, { text: aiResponseText, isAI: true }]);

            const newAiResponseCount = aiResponseCount + 1;
            setAiResponseCount(newAiResponseCount);

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

    // Loading state
    if (isLoadingSession && isAuthenticated) {
        return (
            <div className="fixed inset-0 bg-[#0F172A] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-[#6366F1] animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 text-sm">Memuat percakapan...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#0F172A] overflow-hidden">
            {/* Toast Container */}
            <Toaster
                position="top-center"
                toastOptions={{
                    style: {
                        background: '#1E293B',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                    },
                    success: {
                        iconTheme: { primary: '#06B6D4', secondary: '#fff' }
                    },
                    loading: {
                        iconTheme: { primary: '#6366F1', secondary: '#fff' }
                    }
                }}
            />

            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6366F1]/10 blur-[160px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#06B6D4]/10 blur-[160px] rounded-full"></div>
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/5 p-4 z-50 h-[72px]">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBackClick}
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
                                    <p className="text-[10px] text-[#06B6D4] font-bold uppercase tracking-widest">Active</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="hidden sm:block text-[10px] text-slate-500 font-medium">
                            {dateInfo.fullDate}
                        </div>

                        {isPaidUser && (
                            <button
                                onClick={handleClearChat}
                                disabled={isClearing}
                                className="p-2 hover:bg-white/5 rounded-xl transition-colors group disabled:opacity-50"
                                title="Bersihkan chat"
                            >
                                {isClearing ? (
                                    <Loader2 className="text-slate-500 animate-spin" size={18} />
                                ) : (
                                    <Trash2 className="text-slate-500 group-hover:text-red-400 transition-colors" size={18} />
                                )}
                            </button>
                        )}

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
