import React, { useState } from 'react';
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
    TrendingUp,
    User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import DatePicker from '../components/DatePicker';
import TimePicker from '../components/TimePicker';

// Helper functions (from original App.jsx)
const getWeton = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const pasarans = ["Legi", "Paing", "Pon", "Wage", "Kliwon"];
    const baseDate = new Date(1900, 0, 1);
    const diffDays = Math.floor((date - baseDate) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { day: days[date.getDay()], pasaran: "Kliwon", neptu: 15 };
    const dayIdx = date.getDay();
    const pasaranIdx = (diffDays + 1) % 5;
    const dayValues = { "Minggu": 5, "Senin": 4, "Selasa": 3, "Rabu": 7, "Kamis": 8, "Jumat": 6, "Sabtu": 9 };
    const pasaranValues = { "Legi": 5, "Paing": 9, "Pon": 7, "Wage": 4, "Kliwon": 8 };
    const d = days[dayIdx];
    const p = pasarans[pasaranIdx];
    return { day: d, pasaran: p, neptu: dayValues[d] + pasaranValues[p] };
};

const getZodiac = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
    return "Pisces";
};

const getLifePathNumber = (dateString) => {
    if (!dateString) return null;
    const digits = dateString.replace(/\D/g, '');
    let sum = digits.split('').reduce((acc, d) => acc + parseInt(d), 0);
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
        sum = sum.toString().split('').reduce((acc, d) => acc + parseInt(d), 0);
    }
    return sum;
};

const getShio = (dateString) => {
    if (!dateString) return null;
    const year = new Date(dateString).getFullYear();
    const animals = ["Monyet", "Ayam", "Anjing", "Babi", "Tikus", "Kerbau", "Macan", "Kelinci", "Naga", "Ular", "Kuda", "Kambing"];
    return animals[year % 12];
};

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
    const { user, logout, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [birthDate, setBirthDate] = useState(user?.birthDate || '');
    const [birthTime, setBirthTime] = useState(user?.birthTime || '');
    const [showBirthModal, setShowBirthModal] = useState(!user?.birthDate);

    // Calculate spiritual data
    const weton = getWeton(birthDate);
    const zodiac = getZodiac(birthDate);
    const lifePath = getLifePathNumber(birthDate);
    const shio = getShio(birthDate);

    // Generate hour options (00:00 - 23:00)
    const hourOptions = Array.from({ length: 24 }, (_, i) => {
        const hour = String(i).padStart(2, '0');
        return `${hour}:00`;
    });

    const handleSaveBirthDate = () => {
        if (birthDate) {
            updateProfile({ birthDate, birthTime });
            setShowBirthModal(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const todayInsight = [
        "Hari ini adalah momen yang tepat untuk refleksi diri dan perencanaan jangka panjang.",
        "Energi kosmik mendukung keputusan yang berhubungan dengan karir dan keuangan.",
        "Fokuslah pada komunikasi yang jelas dengan orang-orang terdekat.",
    ];

    const randomInsight = todayInsight[Math.floor(Math.random() * todayInsight.length)];

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
                        <div className="w-14 h-14 bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] rounded-2xl flex items-center justify-center shadow-lg shadow-[#6366F1]/20">
                            <User className="text-white" size={28} />
                        </div>
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

                            <button
                                onClick={handleSaveBirthDate}
                                disabled={!birthDate}
                                className="w-full bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-[#6366F1]/30 hover:brightness-110 disabled:opacity-50 uppercase tracking-widest text-xs"
                            >
                                Buka Peta Cahayaku
                            </button>
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
                            icon={Moon}
                            glowColor="#F43F5E"
                        />
                    </div>
                )}

                {/* Today's Insight */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    <div className="lg:col-span-2 bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl animate-slide-up">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-amber-500/10 rounded-xl">
                                <Zap className="text-amber-500" size={22} />
                            </div>
                            <h2 className="text-xl font-black text-white">Insight Hari Ini</h2>
                        </div>

                        <p className="text-slate-300 leading-relaxed mb-6 text-lg">
                            {randomInsight}
                        </p>

                        <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-2xl">
                            <div className="flex items-start gap-3">
                                <Sparkles className="text-indigo-400 shrink-0 mt-1" size={20} />
                                <div>
                                    <p className="text-white font-bold mb-2">Tip Harian</p>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        Gunakan waktu pagi untuk meditasi singkat dan set intention untuk hari ini.
                                        Energi terkuat ada di pukul 09:00 - 11:00.
                                    </p>
                                </div>
                            </div>
                        </div>
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
                                        <p className="text-[#06B6D4] text-sm font-medium">
                                            {new Date(birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            {birthTime && ` • ${birthTime}`}
                                        </p>
                                    ) : (
                                        <p className="text-slate-400 text-sm">Belum diatur</p>
                                    )}
                                </div>
                                <ChevronRight className="text-slate-500 group-hover:translate-x-1 transition-transform" size={20} />
                            </div>
                        </button>

                        <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                            <div className="flex items-center gap-3 mb-4">
                                <TrendingUp className="text-[#06B6D4]" size={20} />
                                <span className="text-sm font-bold text-slate-400">Status Akun</span>
                            </div>
                            <p className="text-white font-bold text-lg mb-1">Free Plan</p>
                            <p className="text-slate-500 text-sm mb-4">2 chat AI gratis per hari</p>
                            <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl text-white font-bold text-xs uppercase tracking-widest transition-all">
                                Upgrade ke Pro
                            </button>
                        </div>
                    </div>
                </div>

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
