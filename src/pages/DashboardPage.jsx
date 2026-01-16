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
    Scroll
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import DatePicker from '../components/DatePicker';
import TimePicker from '../components/TimePicker';
import AdSlot from '../components/AdSlot';
import InsightSection from '../components/InsightSection';

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

const DashboardPage = () => {
    const { user, logout, updateProfile, getBirthDateChangeInfo } = useAuth();
    const navigate = useNavigate();

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

                {/* Today's Insight */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    <div className="lg:col-span-2">
                        <InsightSection
                            insights={insights}
                            loading={loadingInsights}
                            planType={user?.plan_type || 'free'}
                            onUpgrade={() => navigate('/pricing')}
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

                                <div className="space-y-3 mb-6">
                                    {user?.plan_type === 'free' ? (
                                        <>
                                            <div className="flex items-center gap-3 text-sm text-slate-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]"></div>
                                                <span>2 chat AI gratis / hari</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                                                <span>Fitur Pro terkunci</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3 text-sm text-slate-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                <span>Unlimited AI Chat</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-slate-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                <span>Akses Penuh Fitur Spiritual</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {user?.plan_type === 'free' && (
                                    <button className="w-full bg-gradient-to-r from-[#6366F1] to-[#06B6D4] hover:brightness-110 py-3.5 rounded-xl text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#6366F1]/20 flex items-center justify-center gap-2 group-hover:-translate-y-0.5">
                                        <Zap size={16} className="fill-white/30" />
                                        Upgrade ke Pro
                                    </button>
                                )}
                                {user?.plan_type === 'pro' && (
                                    <button className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 py-3.5 rounded-xl text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 group-hover:-translate-y-0.5">
                                        <Crown size={16} className="fill-white/30" />
                                        Go Visionary
                                    </button>
                                )}
                            </div>
                        </div>
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
            </main>
        </div>
    );
};

export default DashboardPage;
