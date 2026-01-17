import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    User,
    Crown,
    Zap,
    Calendar,
    Star,
    Sparkles,
    ArrowLeft,
    Settings,
    Edit3
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { censorName, getPlanBadgeColor } from '../utils/socialUtils';
import axios from 'axios';

const ProfilePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const token = localStorage.getItem('metra_token');
                const response = await axios.get('http://localhost:3001/api/dashboard/insights', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setInsights(response.data);
            } catch (error) {
                console.error("Failed to fetch insights", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchInsights();
        }
    }, [user]);

    if (!user) return null;

    const visibility = (user.visibility_settings || {});
    // Default to true if settings aren't set yet, or false depending on privacy preference.
    // Let's assume default is visible for now unless explicitly hidden.
    const showBio = visibility.showBio !== false;
    const showSpiritual = visibility.showSpiritual !== false;

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-300">
            <Navbar />

            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6366F1]/10 blur-[160px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#06B6D4]/10 blur-[160px] rounded-full"></div>
            </div>

            <main className="pt-28 pb-20 px-4 max-w-2xl mx-auto relative z-10">
                {/* Header Actions */}
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Kembali</span>
                    </button>
                    <Link
                        to="/profile/settings"
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl hover:bg-white/10"
                    >
                        <Settings size={18} />
                        <span>Pengaturan</span>
                    </Link>
                </div>

                {/* Profile Header */}
                <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-[#6366F1]/20 to-[#06B6D4]/20 blur-xl"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] p-[3px] relative shrink-0">
                            <div className="w-full h-full rounded-full bg-[#1E293B] flex items-center justify-center overflow-hidden">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={40} className="text-white" />
                                )}
                            </div>
                            <div className="absolute bottom-0 right-0 bg-[#1E293B] rounded-full p-1.5">
                                <Crown size={16} className={getPlanBadgeColor(user.plan_type)} fill="currentColor" />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left w-full">
                            <div className="flex flex-col md:flex-row items-center gap-3 mb-2 justify-between w-full">
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        {user.name}
                                    </h1>
                                    <p className="text-sm text-slate-500">{user.email}</p>
                                </div>
                                <Link
                                    to="/profile/settings"
                                    className="md:self-start flex items-center gap-1 text-xs font-bold text-[#6366F1] hover:text-[#4F46E5] bg-[#6366F1]/10 px-3 py-1.5 rounded-lg border border-[#6366F1]/20 mt-2 md:mt-0"
                                >
                                    <Edit3 size={14} />
                                    Edit Profil
                                </Link>
                            </div>

                            {user.bio && showBio && (
                                <p className="text-slate-400 text-sm mb-4 leading-relaxed max-w-md mx-auto md:mx-0 mt-4 md:mt-2">
                                    {user.bio}
                                </p>
                            )}

                            {!user.bio && (
                                <p className="text-slate-500 text-sm italic mb-4 mt-2">
                                    Belum ada bio. <Link to="/profile/settings" className="text-[#6366F1] hover:underline">Tambahkan sekarang</Link>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Spiritual Data */}
                {showSpiritual && insights && (
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <div className="w-1 h-6 bg-[#06B6D4] rounded-full"></div>
                            Data Spiritual
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center hover:border-[#6366F1]/30 transition-colors">
                                <div className="w-10 h-10 mx-auto rounded-full bg-[#6366F1]/10 flex items-center justify-center text-[#6366F1] mb-2">
                                    <Calendar size={20} />
                                </div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Weton</div>
                                <div className="text-white font-bold text-sm">{insights.todaySpiritual?.weton || '-'}</div>
                            </div>
                            <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center hover:border-[#6366F1]/30 transition-colors">
                                <div className="w-10 h-10 mx-auto rounded-full bg-[#06B6D4]/10 flex items-center justify-center text-[#06B6D4] mb-2">
                                    <Star size={20} />
                                </div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Zodiak</div>
                                <div className="text-white font-bold text-sm">{insights.todaySpiritual?.zodiac || '-'}</div>
                            </div>
                            <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center hover:border-[#6366F1]/30 transition-colors">
                                <div className="w-10 h-10 mx-auto rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 mb-2">
                                    <Sparkles size={20} />
                                </div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Shio</div>
                                <div className="text-white font-bold text-sm">{insights.todaySpiritual?.shio || '-'}</div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ProfilePage;
