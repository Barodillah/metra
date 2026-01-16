import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Loader2, Calendar, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const HistoryPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const token = localStorage.getItem('metra_token');
                // Fetch up to 100 sessions for the full history page
                const response = await fetch(`${API_URL}/chat/sessions?limit=100`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setSessions(data.sessions);
                }
            } catch (error) {
                console.error("Failed to fetch chat history", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchSessions();
        }
    }, [user]);

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-300">
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
                        <h1 className="text-lg font-bold text-white">Semua Riwayat Percakapan</h1>
                        <p className="text-xs text-slate-500">
                            {user?.name || 'User'}
                        </p>
                    </div>
                </div>
            </header>

            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6366F1]/5 blur-[160px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#06B6D4]/5 blur-[160px] rounded-full"></div>
            </div>

            <main className="pt-24 pb-16 px-6 max-w-4xl mx-auto relative z-10 w-full">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-20 bg-[#1E293B]/40 rounded-3xl border border-white/5">
                        <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">Belum Ada Riwayat</h3>
                        <p className="text-slate-400 mb-6 text-sm">Mulai percakapan spiritual pertamamu sekarang.</p>
                        <Link
                            to="/chat"
                            className="bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-[#6366F1]/20 hover:brightness-110 transition-all inline-flex items-center gap-2"
                        >
                            <MessageSquare size={16} />
                            Mulai Chat Baru
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sessions.map((session) => (
                            <button
                                key={session.id}
                                onClick={() => navigate(`/history/${session.id}`)}
                                className="bg-[#1E293B]/60 hover:bg-[#1E293B] border border-white/5 hover:border-[#6366F1]/30 p-5 rounded-2xl transition-all text-left group flex flex-col h-full relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 flex items-center justify-center text-[#6366F1] group-hover:scale-110 transition-transform">
                                            <Calendar size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                {new Date(session.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric', month: 'long', year: 'numeric'
                                                })}
                                            </p>
                                            <p className="text-[10px] text-slate-600 flex items-center gap-1">
                                                <Clock size={10} />
                                                {new Date(session.created_at).toLocaleTimeString('id-ID', {
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    {session.ended_at && (
                                        <span className="bg-slate-800/80 border border-white/5 text-slate-400 text-[10px] px-2 py-0.5 rounded-full">
                                            Selesai
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-slate-200 font-medium text-sm line-clamp-2 leading-relaxed group-hover:text-white transition-colors">
                                        {session.summary || session.first_message || "Percakapan Baru"}
                                    </h3>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                                    <span className="text-[10px] text-slate-500">
                                        ID: {session.id}
                                    </span>
                                    <span className="text-xs text-[#6366F1] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                        Lihat Detail <ChevronRight size={12} />
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default HistoryPage;
