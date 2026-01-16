import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChatBubble from '../components/ChatBubble';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const ChatHistoryPage = () => {
    const { sessionId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const token = localStorage.getItem('metra_token');
                const response = await fetch(`${API_URL}/chat/sessions/${sessionId}/messages`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Gagal memuat riwayat chat');
                }

                const data = await response.json();

                // If session is NOT ended, redirect to chat
                if (!data.session.ended_at) {
                    navigate('/chat');
                    return;
                }

                // Convert to format expected by ChatBubble
                const formattedMessages = data.messages.map(m => ({
                    text: m.content,
                    isAI: m.role === 'assistant',
                    timestamp: m.created_at
                }));

                setMessages(formattedMessages);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (sessionId && user) {
            fetchMessages();
        }
    }, [sessionId, user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#6366F1] animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-slate-400 p-6">
                <p className="mb-4">{error}</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="text-[#6366F1] hover:underline"
                >
                    Kembali ke Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F172A] flex flex-col">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/5 p-4 z-50 h-[72px]">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="text-slate-400" size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-white">Riwayat Percakapan</h1>
                        <p className="text-xs text-slate-500">
                            Session ID: {sessionId}
                        </p>
                    </div>
                </div>
            </header>

            {/* Messages */}
            <main className="flex-1 overflow-y-auto px-6 pt-[88px] pb-8">
                <div className="max-w-4xl mx-auto">
                    {messages.length === 0 ? (
                        <div className="text-center text-slate-500 mt-20">
                            Belum ada pesan dalam sesi ini.
                        </div>
                    ) : (
                        messages.map((m, i) => (
                            <ChatBubble key={i} message={m.text} isAI={m.isAI} />
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>
        </div>
    );
};

export default ChatHistoryPage;
