import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Sparkles,
    Sun,
    Moon,
    Star,
    Compass,
    Calendar,
    MessageSquare,
    LogOut,
    ChevronRight,
    Zap,
    User,
    Crown,
    Orbit,
    Globe,
    Sunrise,
    Scroll,
    X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import DatePicker from '../components/DatePicker';
import TimePicker from '../components/TimePicker';
import AdSlot from '../components/AdSlot';
import InsightSection from '../components/InsightSection';
import PaymentModal from '../components/PaymentModal';


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

const Card = ({ title, value, subValue, icon: Icon, glowColor }) => (
    <div className={`bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl hover:border-white/20 transition-all group overflow-hidden relative hover:translate-y-[-4px]`}>
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-[40px] opacity-10 group-hover:opacity-20 transition-all`} style={{ backgroundColor: glowColor }}></div>
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-white/5" style={{ color: glowColor }}>
                <Icon size={22} />
            </div>
        </div>
        <h3 className="text-slate-400 text-sm font-semibold mb-1 relative z-10">{title}</h3>
        <div className="flex flex-col relative z-10">
            <span className="text-2xl font-bold text-white tracking-tight">
                {value}
            </span>
            {subValue && <span className="text-xs text-slate-500 mt-1 font-medium">{subValue}</span>}
        </div>
    </div>
);

const ChatHistoryList = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const token = localStorage.getItem('metra_token');
                const response = await fetch(`${import.meta.env.VITE_API_URL}/chat/sessions`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    // Take only the last 3 sessions
                    setSessions(data.sessions.slice(0, 3));
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

    if (loading) {
        return <div className="text-slate-500 text-sm py-4">Memuat riwayat...</div>;
    }

    if (sessions.length === 0) {
        return (
            <div className="bg-[#1E293B]/60 border border-white/5 rounded-2xl p-6 text-center">
                <p className="text-slate-400 text-sm">Belum ada riwayat percakapan.</p>
                <Link to="/chat" className="text-[#6366F1] text-sm font-bold mt-2 inline-block hover:underline">
                    Mulai Chat Baru
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {sessions.map((session) => (
                <button
                    key={session.id}
                    onClick={() => navigate(`/history/${session.id}`)}
                    className="w-full bg-[#1E293B]/60 hover:bg-[#1E293B] border border-white/5 hover:border-[#6366F1]/30 p-4 rounded-2xl transition-all text-left group"
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                            {new Date(session.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                        </span>
                        {session.ended_at && (
                            <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full">
                                Selesai
                            </span>
                        )}
                    </div>
                    <p className="text-slate-300 text-sm line-clamp-2 leading-relaxed group-hover:text-white transition-colors">
                        {session.summary || session.first_message || "Percakapan Baru"}
                    </p>
                </button>
            ))}

            <Link
                to="/history"
                className="block text-center text-slate-500 text-xs font-bold hover:text-white transition-colors mt-2"
            >
                Lihat Semua Riwayat
            </Link>
        </div>
    );
};

const DashboardPage = () => {
    const { user, logout, updateProfile, getBirthDateChangeInfo } = useAuth();
    const navigate = useNavigate();

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [upgradeTargetPlan, setUpgradeTargetPlan] = useState('pro');
    const [showBaZiModal, setShowBaZiModal] = useState(false);

    const handleUpgradeClick = (targetPlan) => {
        setUpgradeTargetPlan(targetPlan);
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = async () => {
        try {
            // Update user plan locally for immediate feedback (in real app, this would be handled by backend webhook/response)
            await updateProfile({ plan_type: upgradeTargetPlan });
            setShowPaymentModal(false);
            // Optional: Show success toast/alert
        } catch (error) {
            console.error("Failed to upgrade locally", error);
        }
    };


    // Parse birth_datetime into date and time parts for display (using local timezone)
    const parseBirthDateTime = (dateTime) => {
        if (!dateTime) return { date: '', time: '' };
        const dt = new Date(dateTime);
        // Use local date components instead of UTC to avoid timezone shift
        const year = dt.getFullYear();
        const month = String(dt.getMonth() + 1).padStart(2, '0');
        const day = String(dt.getDate()).padStart(2, '0');
        const date = `${year}-${month}-${day}`;
        const time = dt.toTimeString().slice(0, 5);
        return { date, time };
    };

    const { date: initialDate, time: initialTime } = parseBirthDateTime(user?.birth_datetime);

    const [birthDate, setBirthDate] = useState(initialDate);
    const [birthTime, setBirthTime] = useState(initialTime);
    const [showBirthModal, setShowBirthModal] = useState(!user?.birth_datetime);
    const [birthDateChangeInfo, setBirthDateChangeInfo] = useState(null);
    const [savingBirthDate, setSavingBirthDate] = useState(false);
    const [insights, setInsights] = useState(null);
    const [loadingInsights, setLoadingInsights] = useState(true);

    // Sync birthDate and birthTime when user data changes (e.g., after relogin)
    useEffect(() => {
        const { date, time } = parseBirthDateTime(user?.birth_datetime);
        setBirthDate(date);
        setBirthTime(time);
    }, [user?.birth_datetime]);

    // Fetch birth date change info on mount
    useEffect(() => {
        const fetchBirthDateChangeInfo = async () => {
            try {
                const info = await getBirthDateChangeInfo();
                setBirthDateChangeInfo(info);
            } catch (error) {
                console.error('Failed to fetch birth date change info:', error);
            }
        };
        if (user?.birth_datetime) {
            fetchBirthDateChangeInfo();
        }
    }, [user?.birth_datetime]);

    // Calculate spiritual data
    const weton = getWeton(birthDate);
    const zodiac = getZodiac(birthDate);
    const lifePath = getLifePathNumber(birthDate);
    const shio = getShio(birthDate);

    // Additional spiritual data
    const element = getElement(zodiac);
    const rulingPlanet = getRulingPlanet(zodiac);
    const ascendant = getAscendant(zodiac, birthTime);
    const moonPhase = getMoonPhase(birthDate);

    // Generate hour options (00:00 - 23:00)
    const hourOptions = Array.from({ length: 24 }, (_, i) => {
        const hour = String(i).padStart(2, '0');
        return `${hour}:00`;
    });

    const handleSaveBirthDate = async () => {
        if (birthDate) {
            setSavingBirthDate(true);
            try {
                // Combine date and time into birth_datetime
                const timeStr = birthTime || '00:00';
                const birth_datetime = `${birthDate}T${timeStr}:00`;

                await updateProfile({ birth_datetime });

                // Refresh birth date change info
                const info = await getBirthDateChangeInfo();
                setBirthDateChangeInfo(info);

                setShowBirthModal(false);
            } catch (error) {
                console.error("Failed to update birth date", error);
                // Check if it's a limit error
                if (error.message?.includes('Batas perubahan')) {
                    alert(error.message);
                } else {
                    alert("Gagal menyimpan data. Silakan coba lagi.");
                }
            } finally {
                setSavingBirthDate(false);
            }
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const todayInsight = [
        "Hari ini adalah momen yang tepat untuk refleksi diri dan perencanaan jangka panjang.",
        "Energi kosmik mendukung keputusan yang berhubungan dengan karir dan keuangan.",
        "Fokuslah pada komunikasi yang jelas dengan orang-orang terdekat.",
    ];

    const randomInsight = todayInsight[Math.floor(Math.random() * todayInsight.length)];

    // Fetch AI insights on mount
    useEffect(() => {
        const fetchInsights = async () => {
            try {
                setLoadingInsights(true);
                const token = localStorage.getItem('metra_token');
                const response = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/insights`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setInsights(data);
                }
            } catch (error) {
                console.error('Failed to fetch insights:', error);
            } finally {
                setLoadingInsights(false);
            }
        };

        if (user) {
            fetchInsights();
        }
    }, [user]);

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-300">
            <Navbar />

            {/* Payment Modal */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                planType={upgradeTargetPlan}
                onConfirm={handlePaymentSuccess}
                userEmail={user?.email}
            />

            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6366F1]/10 blur-[160px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#06B6D4]/10 blur-[160px] rounded-full"></div>
            </div>

            <main className="pt-28 pb-16 px-6 max-w-7xl mx-auto relative z-10">
                {/* Welcome Header */}
                <div className="mb-12 animate-fade-in">
                    <div className="flex items-center gap-4 mb-4">
                        {user?.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt={user.name}
                                className="w-14 h-14 rounded-2xl object-cover shadow-lg shadow-[#6366F1]/20"
                            />
                        ) : (
                            <div className="w-14 h-14 bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] rounded-2xl flex items-center justify-center shadow-lg shadow-[#6366F1]/20">
                                <User className="text-white" size={28} />
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight">
                                Selamat Datang, {user?.name || 'Penjelajah'}!
                            </h1>
                            <p className="text-slate-400 text-sm mt-1">
                                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Top Banner Ad */}


                {/* Birth Date Modal */}
                {showBirthModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                        <div className="bg-[#1E293B] border border-white/10 p-8 rounded-3xl max-w-md w-full animate-slide-up shadow-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] rounded-xl flex items-center justify-center">
                                    <Calendar className="text-white" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white">Waktu Kelahiranmu</h2>
                                    <p className="text-slate-400 text-sm">Tanggal & jam untuk peta spiritual akurat</p>
                                </div>
                            </div>

                            {/* Date Picker */}
                            <div className="mb-4">
                                <label className="block text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Tanggal Lahir</label>
                                <DatePicker
                                    value={birthDate}
                                    onChange={(value) => setBirthDate(value)}
                                    placeholder="Pilih Tanggal Lahir"
                                />
                            </div>

                            {/* Time Picker */}
                            <div className="mb-6">
                                <label className="block text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Jam Lahir (Opsional)</label>
                                <TimePicker
                                    value={birthTime}
                                    onChange={(value) => setBirthTime(value)}
                                    placeholder="Pilih Jam Lahir"
                                />
                                <p className="text-[10px] text-slate-600 mt-2">Jam lahir membantu menghitung posisi planet & ascendant</p>
                            </div>

                            {/* Limit Info - only show if user already has birth date */}
                            {user?.birth_datetime && birthDateChangeInfo && (
                                <div className={`mb-4 p-3 rounded-xl border ${birthDateChangeInfo.can_change ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                    <div className="flex items-center gap-2">
                                        <Zap size={14} className={birthDateChangeInfo.can_change ? 'text-indigo-400' : 'text-red-400'} />
                                        <span className={`text-xs font-medium ${birthDateChangeInfo.can_change ? 'text-indigo-300' : 'text-red-300'}`}>
                                            {birthDateChangeInfo.remaining === -1
                                                ? 'Unlimited perubahan (Visionary)'
                                                : birthDateChangeInfo.can_change
                                                    ? `Sisa ${birthDateChangeInfo.remaining}x perubahan (${birthDateChangeInfo.plan_type} plan)`
                                                    : `Limit tercapai (${birthDateChangeInfo.limit}x untuk ${birthDateChangeInfo.plan_type} plan)`
                                            }
                                        </span>
                                    </div>
                                    {!birthDateChangeInfo.can_change && (
                                        <p className="text-[10px] text-slate-500 mt-1">Upgrade plan untuk lebih banyak perubahan</p>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleSaveBirthDate}
                                disabled={!birthDate || savingBirthDate || (user?.birth_datetime && birthDateChangeInfo && !birthDateChangeInfo.can_change)}
                                className="w-full bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-[#6366F1]/30 hover:brightness-110 disabled:opacity-50 uppercase tracking-widest text-xs"
                            >
                                {savingBirthDate ? 'Menyimpan...' : user?.birth_datetime ? 'Simpan Perubahan' : 'Buka Peta Cahayaku'}
                            </button>

                            {/* Close button for existing users */}
                            {user?.birth_datetime && (
                                <button
                                    onClick={() => setShowBirthModal(false)}
                                    className="w-full mt-3 text-slate-400 hover:text-white text-xs font-medium py-2 transition-colors"
                                >
                                    Batal
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Profile Cards */}
                {birthDate && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-fade-in">
                        <Card
                            title="Weton Jawa"
                            value={weton ? `${weton.day} ${weton.pasaran}` : '-'}
                            subValue={weton ? `Neptu: ${weton.neptu}` : ''}
                            icon={Sun}
                            glowColor="#F59E0B"
                        />
                        <Card
                            title="Zodiak Barat"
                            value={zodiac || '-'}
                            subValue="Star Sign"
                            icon={Star}
                            glowColor="#6366F1"
                        />
                        <Card
                            title="Life Path"
                            value={lifePath || '-'}
                            subValue="Numerology"
                            icon={Compass}
                            glowColor="#06B6D4"
                        />
                        <Card
                            title="Shio Cina"
                            value={shio || '-'}
                            subValue="Chinese Zodiac"
                            icon={Scroll}
                            glowColor="#F43F5E"
                        />

                        {/* Middle Banner Ad */}
                        <div className="col-span-1 sm:col-span-2 lg:col-span-4">
                            <AdSlot className="w-full h-32" adFormat="banner" />
                        </div>

                        <Card
                            title="Elemen Dominan"
                            value={element || '-'}
                            subValue="Unsur Alam"
                            icon={Globe}
                            glowColor="#10B981"
                        />
                        <Card
                            title="Planet Penguasa"
                            value={rulingPlanet || '-'}
                            subValue="Ruling Planet"
                            icon={Orbit}
                            glowColor="#8B5CF6"
                        />
                        <Card
                            title="Ascendant"
                            value={ascendant || (birthTime ? '?' : 'Butuh Jam')}
                            subValue={birthTime ? "Rising Sign" : "Set Jam Lahir"}
                            icon={Sunrise}
                            glowColor="#FDBA74"
                        />
                        <Card
                            title="Fase Bulan"
                            value={moonPhase || '-'}
                            subValue="Moon Phase"
                            icon={Moon}
                            glowColor="#E2E8F0"
                        />
                    </div>
                )}

                {/* BaZi Section - Only for Paid Plans */}
                {user?.plan_type !== 'free' && birthDate && insights?.bazi && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12 animate-fade-in">
                        {/* Structure Card */}
                        <div className="col-span-1 md:col-span-8 bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl hover:border-white/20 transition-all relative overflow-hidden group">
                            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full blur-[60px] opacity-10 bg-red-500 group-hover:opacity-20 transition-opacity"></div>

                            <div className="flex items-center gap-4 mb-6 relative z-10">
                                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
                                    <Scroll size={22} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg">Struktur BaZi (Empat Pilar)</h3>
                                    <p className="text-slate-400 text-xs">Peta nasib berdasarkan elemen waktu</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 relative z-10">
                                {[
                                    { label: 'Tahun', ...insights.bazi.pillars.year },
                                    { label: 'Bulan', ...insights.bazi.pillars.month },
                                    { label: 'Hari', ...insights.bazi.pillars.day },
                                    { label: 'Jam', ...insights.bazi.pillars.hour }
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-slate-800/50 rounded-xl p-4 border border-white/5 text-center hover:bg-slate-800 transition-colors">
                                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">{item.label}</p>
                                        <p className="text-white font-bold text-sm mb-1">{item.display}</p>
                                        <p className="text-amber-500 text-lg font-serif mb-1">{item.hanzi}</p>
                                        <p className="text-xs text-slate-400">{item.element}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                <div>
                                    <h4 className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-3">Dominasi Elemen</h4>
                                    <div className="space-y-2">
                                        {insights.bazi.elements.breakdown.slice(0, 3).map((el, idx) => (
                                            <div key={idx}>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-400">{el.element}</span>
                                                    <span className="text-white font-bold">{el.level} ({el.count})</span>
                                                </div>
                                                <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-1">
                                                    <div className={`h-1.5 rounded-full ${el.element === 'Api' ? 'bg-red-500' :
                                                        el.element === 'Kayu' ? 'bg-green-500' :
                                                            el.element === 'Tanah' ? 'bg-amber-600' :
                                                                el.element === 'Logam' ? 'bg-slate-400' :
                                                                    'bg-blue-400'}`} style={{ width: `${Math.max(10, el.percentage)}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2 italic">{insights.bazi.elements.summary}</p>
                                </div>
                                <div>
                                    <h4 className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-3">Nasib Utama (Shen Sha)</h4>
                                    <div className="space-y-3">
                                        {insights.bazi.shenSha.slice(0, 2).map((star, idx) => (
                                            <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border ${star.type === 'positive' ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-slate-500/10 border-slate-500/20'}`}>
                                                <div className={`mt-0.5 ${star.type === 'positive' ? 'text-indigo-400' : 'text-slate-400'}`}>
                                                    <Star size={14} />
                                                </div>
                                                <div>
                                                    <p className={`${star.type === 'positive' ? 'text-indigo-300' : 'text-slate-300'} font-bold text-xs mb-0.5`}>{star.name} ({star.meaning})</p>
                                                    <p className="text-slate-400 text-[10px] leading-relaxed">{star.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Insight Card */}
                        <div className="col-span-1 md:col-span-4 bg-gradient-to-br from-[#1E293B]/60 to-[#0F172A]/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl hover:border-white/20 transition-all relative overflow-hidden">
                            <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full blur-[60px] opacity-10 bg-indigo-500 text-indigo-500"></div>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                    <Sparkles size={18} />
                                </div>
                                <h3 className="text-white font-bold text-sm">Insight BaZi AI</h3>
                            </div>

                            <div className="prose prose-invert prose-xs max-w-none">
                                <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                                    {insights.bazi.insight.length > 350
                                        ? `${insights.bazi.insight.substring(0, 350)}...`
                                        : insights.bazi.insight}
                                </p>
                                {insights.bazi.insight.length > 350 && (
                                    <button
                                        onClick={() => setShowBaZiModal(true)}
                                        className="text-indigo-400 text-xs font-bold hover:text-indigo-300 mt-2 flex items-center gap-1 transition-colors"
                                    >
                                        Lihat Selengkapnya <ChevronRight size={12} />
                                    </button>
                                )}
                            </div>

                            <div className="mt-6 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                                <p className="text-[10px] text-slate-400 italic mb-2">Punya pertanyaan spesifik tentang BaZi Anda?</p>
                                <button
                                    onClick={() => navigate('/chat', { state: { focus: 'BaZi' } })}
                                    className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 hover:text-indigo-200 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <MessageSquare size={14} />
                                    Tanya AI Advisor
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Today's Insight */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    <div className="lg:col-span-2">
                        <InsightSection
                            insights={insights}
                            loading={loadingInsights}
                            planType={user?.plan_type || 'free'}
                            onUpgrade={(plan) => handleUpgradeClick(plan || 'pro')}
                        />
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-4">
                        <Link
                            to="/chat"
                            className="block bg-gradient-to-r from-[#6366F1] to-[#06B6D4] p-6 rounded-3xl hover:brightness-110 transition-all shadow-lg shadow-[#6366F1]/20 group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <MessageSquare className="text-white" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-bold">Metra AI Advisor</h3>
                                    <p className="text-white/70 text-sm">Tanyakan apa saja</p>
                                </div>
                                <ChevronRight className="text-white/70 group-hover:translate-x-1 transition-transform" size={20} />
                            </div>
                        </Link>

                        <button
                            onClick={() => setShowBirthModal(true)}
                            className="w-full bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl hover:border-white/20 transition-all text-left group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                                    <Calendar className="text-amber-500" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-bold">Update Tanggal Lahir</h3>
                                    {birthDate ? (
                                        <>
                                            <p className="text-[#06B6D4] text-sm font-medium">
                                                {new Date(birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                {birthTime && ` • ${birthTime}`}
                                            </p>
                                            {birthDateChangeInfo && (
                                                <p className={`text-[10px] mt-1 ${birthDateChangeInfo.can_change ? 'text-slate-500' : 'text-red-400'}`}>
                                                    {birthDateChangeInfo.remaining === -1
                                                        ? '∞ perubahan tersisa'
                                                        : birthDateChangeInfo.can_change
                                                            ? `${birthDateChangeInfo.remaining}x perubahan tersisa`
                                                            : 'Limit tercapai'
                                                    }
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-slate-400 text-sm">Belum diatur</p>
                                    )}
                                </div>
                                <ChevronRight className="text-slate-500 group-hover:translate-x-1 transition-transform" size={20} />
                            </div>
                        </button>

                        <AdSlot className="w-full h-40" adFormat="rectangle" />

                        <div className="relative group">
                            <div className={`absolute inset-0 bg-gradient-to-r ${user?.plan_type === 'visionary' ? 'from-amber-400 to-orange-500' :
                                user?.plan_type === 'pro' ? 'from-[#6366F1] to-[#06B6D4]' :
                                    'from-slate-700 to-slate-600'
                                } rounded-3xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-500`}></div>

                            <div className="bg-[#1E293B]/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl relative">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${user?.plan_type === 'visionary' ? 'from-amber-400/20 to-orange-500/20' :
                                        user?.plan_type === 'pro' ? 'from-[#6366F1]/20 to-[#06B6D4]/20' :
                                            'from-slate-700/20 to-slate-600/20'
                                        } flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-300`}>
                                        <Crown className={
                                            user?.plan_type === 'visionary' ? 'text-amber-400' :
                                                user?.plan_type === 'pro' ? 'text-[#06B6D4]' :
                                                    'text-slate-400'
                                        } size={24} />
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">Status Akun</p>
                                        <h3 className="text-white font-bold text-lg capitalize">{user?.plan_type || 'Free'} Plan</h3>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6">
                                    {user?.plan_type === 'free' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <p className="text-white font-medium text-sm border-b border-white/10 pb-2">Paket Free Kamu:</p>
                                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]"></div>
                                                    <span>2 Chat AI / hari</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]"></div>
                                                    <span>Insight Harian Basic</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]"></div>
                                                    <span>Maaf Ada Iklan</span>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <p className="text-indigo-400 font-medium text-sm border-b border-indigo-500/20 pb-2">Benefit PRO:</p>
                                                <div className="flex items-center gap-3 text-sm text-slate-300 opacity-80">
                                                    <Crown size={14} className="text-amber-400" />
                                                    <span>Unlimited AI Chat</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-slate-300 opacity-80">
                                                    <Crown size={14} className="text-amber-400" />
                                                    <span>Analisis Weton & Zodiak Detail</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-slate-300 opacity-80">
                                                    <Crown size={14} className="text-amber-400" />
                                                    <span>Akses Penuh Fitur Spiritual</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : user?.plan_type === 'pro' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <p className="text-[#06B6D4] font-medium text-sm border-b border-[#06B6D4]/20 pb-2">Paket Member PRO:</p>
                                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]"></div>
                                                    <span>Unlimited AI Chat</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]"></div>
                                                    <span>Akses Penuh Fitur Spiritual</span>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <p className="text-amber-400 font-medium text-sm border-b border-amber-500/20 pb-2">Go VISIONARY:</p>
                                                <div className="flex items-center gap-3 text-sm text-slate-300 opacity-80">
                                                    <Star size={14} className="text-amber-400" />
                                                    <span>Akses Model AI Terbaru (GPT-4o)</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-slate-300 opacity-80">
                                                    <Star size={14} className="text-amber-400" />
                                                    <span>Unlimited Ganti Tanggal Lahir</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-slate-300 opacity-80">
                                                    <Star size={14} className="text-amber-400" />
                                                    <span>Fitur Eksklusif Mendatang</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        // Visionary View
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                                                    <span>Unlimited AI Chat & Features</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                                                    <span>Prioritas Akses Server & Support</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                                                    <span>Unlimited Perubahan Data Kelahiran</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {user?.plan_type === 'free' && (
                                    <button
                                        onClick={() => handleUpgradeClick('pro')}
                                        className="w-full bg-gradient-to-r from-[#6366F1] to-[#06B6D4] hover:brightness-110 py-3.5 rounded-xl text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#6366F1]/20 flex items-center justify-center gap-2 group-hover:-translate-y-0.5"
                                    >
                                        <Zap size={16} className="fill-white/30" />
                                        Upgrade ke Pro - Rp 29.000/bln
                                    </button>
                                )}
                                {user?.plan_type === 'pro' && (
                                    <button
                                        onClick={() => handleUpgradeClick('visionary')}
                                        className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 py-3.5 rounded-xl text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 group-hover:-translate-y-0.5"
                                    >
                                        <Crown size={16} className="fill-white/30" />
                                        Upgrade ke Visionary - Rp 99.000/bln
                                    </button>
                                )}
                                {user?.plan_type === 'visionary' && (
                                    <div className="w-full bg-white/5 py-3.5 rounded-xl text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-default">
                                        <Crown size={16} className="text-amber-500" />
                                        Member Visionary Aktif
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Chat History - Only for Paid Plans */}
                        {user?.plan_type !== 'free' && (
                            <div className="mt-6 animate-fade-in">
                                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                                    <MessageSquare size={20} className="text-[#6366F1]" />
                                    Riwayat Percakapan
                                </h3>

                                <ChatHistoryList />
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Banner Ad */}
                <AdSlot className="mb-12 w-full h-32" adFormat="banner" />

                {/* Logout Button */}
                <div className="flex justify-center">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
                    >
                        <LogOut size={16} />
                        Keluar dari Akun
                    </button>
                </div>
                {/* BaZi Insight Modal */}
                {showBaZiModal && insights?.bazi && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowBaZiModal(false)}></div>
                        <div className="relative bg-[#0F172A] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-y-auto animate-fade-in shadow-2xl">
                            <div className="sticky top-0 bg-[#0F172A]/90 backdrop-blur-md p-6 border-b border-white/5 flex items-center justify-between z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                        <Sparkles size={20} />
                                    </div>
                                    <h3 className="text-white font-bold text-lg">Analisis Lengkap BaZi</h3>
                                </div>
                                <button
                                    onClick={() => setShowBaZiModal(false)}
                                    className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="prose prose-invert max-w-none">
                                    <p className="text-slate-300 leading-relaxed whitespace-pre-line text-base">
                                        {insights.bazi.insight}
                                    </p>
                                </div>

                                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-slate-800/50 rounded-2xl p-5 border border-white/5">
                                        <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                            <Scroll size={16} className="text-amber-500" />
                                            Struktur Pilar
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm py-2 border-b border-white/5">
                                                <span className="text-slate-400">Tahun</span>
                                                <span className="text-white font-mono">{insights.bazi.pillars.year.hanzi} ({insights.bazi.pillars.year.display})</span>
                                            </div>
                                            <div className="flex justify-between text-sm py-2 border-b border-white/5">
                                                <span className="text-slate-400">Bulan</span>
                                                <span className="text-white font-mono">{insights.bazi.pillars.month.hanzi} ({insights.bazi.pillars.month.display})</span>
                                            </div>
                                            <div className="flex justify-between text-sm py-2 border-b border-white/5">
                                                <span className="text-slate-400">Hari</span>
                                                <span className="text-white font-mono">{insights.bazi.pillars.day.hanzi} ({insights.bazi.pillars.day.display})</span>
                                            </div>
                                            <div className="flex justify-between text-sm py-2 border-b border-white/5">
                                                <span className="text-slate-400">Jam</span>
                                                <span className="text-white font-mono">{insights.bazi.pillars.hour.hanzi} ({insights.bazi.pillars.hour.display})</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-800/50 rounded-2xl p-5 border border-white/5">
                                        <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                            <Star size={16} className="text-indigo-500" />
                                            Shen Sha Aktif
                                        </h4>
                                        <div className="space-y-3">
                                            {insights.bazi.shenSha.map((star, idx) => (
                                                <div key={idx} className="bg-black/20 p-3 rounded-lg">
                                                    <p className="text-indigo-300 font-bold text-sm">{star.name}</p>
                                                    <p className="text-slate-400 text-xs mt-1">{star.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DashboardPage;
