import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Moon, 
  Sun, 
  Send, 
  Lock, 
  ChevronRight, 
  Calendar, 
  Compass, 
  Star, 
  User,
  Zap,
  MessageSquare,
  LockKeyhole,
  CheckCircle2,
  Globe2,
  TrendingUp,
  ShieldCheck,
  Heart
} from 'lucide-react';

// --- Data Helper & Logic ---

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

// --- Custom Icons / Illustrations ---

const TraditionIcon = ({ type }) => {
  const styles = "w-14 h-14 mb-6 flex items-center justify-center rounded-2xl backdrop-blur-md border border-white/10 shadow-lg";
  switch(type) {
    case 'jawa': 
      return (
        <div className={`${styles} bg-amber-500/10 text-amber-500 shadow-amber-500/10`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
            <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 6V14" strokeLinecap="round"/>
          </svg>
        </div>
      );
    case 'china':
      return (
        <div className={`${styles} bg-rose-500/10 text-rose-500 shadow-rose-500/10`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2V22M2 12H22M7 7L17 17M17 7L7 17" strokeLinecap="round"/>
          </svg>
        </div>
      );
    case 'india':
      return (
        <div className={`${styles} bg-indigo-500/10 text-indigo-400 shadow-indigo-500/10`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
            <path d="M12 22C12 22 20 18 20 12C20 6 12 2 12 2C12 2 4 6 4 12C4 18 12 22 12 22Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
      );
    case 'indian':
      return (
        <div className={`${styles} bg-cyan-500/10 text-cyan-400 shadow-cyan-500/10`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
            <circle cx="12" cy="12" r="8" />
            <path d="M12 4V20M4 12H20" />
            <path d="M12 12L17.5 17.5M12 12L6.5 6.5M12 12L17.5 6.5M12 12L6.5 17.5" strokeLinecap="round"/>
          </svg>
        </div>
      );
    default: return null;
  }
};

// --- Components ---

const Card = ({ title, value, subValue, icon: Icon, glowColor }) => (
  <div className={`bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl hover:border-${glowColor}/40 transition-all group overflow-hidden relative hover:translate-y-[-4px]`}>
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-[40px] opacity-10 group-hover:opacity-20 transition-all bg-${glowColor}`}></div>
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`p-3 rounded-2xl bg-slate-800/80 border border-white/5 text-${glowColor}`}>
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

const ChatBubble = ({ message, isAI }) => (
  <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
    <div className={`max-w-[85%] p-4 rounded-2xl shadow-lg ${
      isAI 
        ? 'bg-[#1E293B] border border-white/5 text-slate-200 shadow-black/20' 
        : 'bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white shadow-[#6366F1]/20'
    }`}>
      <p className="text-sm leading-relaxed">{message}</p>
    </div>
  </div>
);

const PricingCard = ({ title, price, features, highlighted }) => (
  <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${highlighted ? 'bg-[#1E293B] border-[#6366F1] shadow-2xl shadow-[#6366F1]/20 scale-105 z-10' : 'bg-[#1E293B]/40 border-white/5'} group`}>
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <div className="flex items-baseline gap-1 mb-6">
      <span className="text-3xl font-black text-white tracking-tight">{price}</span>
      <span className="text-slate-500 text-sm">/bulan</span>
    </div>
    <ul className="space-y-4 mb-8">
      {features.map((f, i) => (
        <li key={i} className="flex items-center gap-3 text-sm text-slate-400 font-medium">
          <CheckCircle2 size={16} className="text-[#06B6D4] shrink-0" /> {f}
        </li>
      ))}
    </ul>
    <button className={`w-full py-4 rounded-2xl font-bold transition-all ${highlighted ? 'bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white shadow-lg shadow-[#6366F1]/30 hover:brightness-110' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}>
      Pilih Paket
    </button>
  </div>
);

export default function App() {
  const [formData, setFormData] = useState({ name: '', dob: '', time: '' });
  const [results, setResults] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Halo! Saya Metra AI Advisor. Gunakan data kelahiranmu untuk mendapatkan petunjuk hidup yang lebih jernih dan optimis hari ini.", isAI: true }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [chatCount, setChatCount] = useState(0);

  const resultRef = useRef(null);

  const handleCalculate = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.dob) return;

    const weton = getWeton(formData.dob);
    const zodiac = getZodiac(formData.dob);
    const lifePath = getLifePathNumber(formData.dob);
    const shio = getShio(formData.dob);

    setResults({ weton, zodiac, lifePath, shio });
    
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    setMessages(prev => [...prev, { 
      text: `Analisis getaran untuk ${formData.name}: Sebagai ${weton.day} ${weton.pasaran} dengan Life Path ${lifePath}, kamu membawa energi keberuntungan yang kuat hari ini. Secara astrologi ${shio}, kamu sedang berada di fase ekspansi. Apa yang ingin kamu optimalkan?`, 
      isAI: true 
    }]);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    if (chatCount >= 2) {
      setShowPaywall(true);
      return;
    }
    const newUserMsg = { text: inputMessage, isAI: false };
    setMessages(prev => [...prev, newUserMsg]);
    setInputMessage("");
    setChatCount(prev => prev + 1);
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        text: "Menarik sekali. Berdasarkan hitungan siklus harianmu, hari ini adalah momen pencerahan (Amber Gold Energy). Fokuslah pada keputusan karir sebelum jam 4 sore untuk hasil terbaik.", 
        isAI: true 
      }]);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-300 font-sans selection:bg-[#6366F1]/30">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6366F1]/10 blur-[160px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#06B6D4]/10 blur-[160px] rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] rounded-2xl flex items-center justify-center shadow-lg shadow-[#6366F1]/20">
              <Sparkles className="text-white" size={22} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white ml-2">METRA</span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-sm font-bold text-slate-400">
            <a href="#fitur" className="hover:text-white transition-colors uppercase tracking-widest text-[11px]">Metodologi</a>
            <a href="#pricing" className="hover:text-white transition-colors uppercase tracking-widest text-[11px]">Pricing</a>
            <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-2.5 rounded-full transition-all text-white font-bold text-xs uppercase tracking-widest">
              Masuk
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-44 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-2 rounded-full text-[#06B6D4] text-xs font-bold tracking-widest uppercase shadow-sm mb-10 animate-fade-in">
            <Heart size={14} className="text-rose-500 fill-rose-500" /> Positive Intuition & AI Data
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white mb-10 tracking-tight leading-[0.9]">
            Temukan <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366F1] to-[#06B6D4]">Cahaya</span> <br />
            Langkah Hidupmu.
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Metra menyinari peta nasibmu dengan data spiritual dunia dan AI untuk panduan hidup yang lebih presisi, optimis, dan terukur.
          </p>
        </div>

        {/* Interactive Widget with Glassmorphism */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#1E293B]/40 border border-white/10 p-5 rounded-[2.5rem] shadow-2xl shadow-black/50 backdrop-blur-2xl">
            <form onSubmit={handleCalculate} className="flex flex-col md:flex-row items-center gap-3">
              <div className="flex-1 w-full px-5 py-4 flex items-center gap-3 bg-slate-900/50 rounded-2xl border border-white/5 focus-within:border-[#6366F1]/50 transition-all group">
                <User className="text-slate-500 group-focus-within:text-[#6366F1]" size={20} />
                <input 
                  type="text" 
                  placeholder="Nama Lengkap"
                  required
                  className="bg-transparent border-none outline-none w-full text-white placeholder:text-slate-600 font-bold"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="flex-1 w-full px-5 py-4 flex items-center gap-3 bg-slate-900/50 rounded-2xl border border-white/5 focus-within:border-[#6366F1]/50 transition-all group">
                <Calendar className="text-slate-500 group-focus-within:text-[#6366F1]" size={20} />
                <input 
                  type="date" 
                  required
                  className="bg-transparent border-none outline-none w-full text-white font-bold [color-scheme:dark]"
                  value={formData.dob}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                />
              </div>
              <button 
                type="submit"
                className="w-full md:w-auto bg-gradient-to-r from-[#6366F1] to-[#06B6D4] hover:brightness-110 text-white font-black px-10 py-5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-[#6366F1]/20 uppercase tracking-widest text-xs"
              >
                Buka Peta Saya <ChevronRight size={20} />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Systems Showcase - THE "TECH" SPIRITUAL SECTION */}
      <section className="py-24 px-6 bg-slate-900/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="text-center md:text-left group">
              <TraditionIcon type="jawa" />
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-500 transition-colors">Primbon Jawa</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">Algoritma Weton dan Neptu untuk menyelaraskan ritme harian dengan harmoni alam.</p>
            </div>
            <div className="text-center md:text-left group">
              <TraditionIcon type="china" />
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-rose-500 transition-colors">Metafisika Cina</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">Analisis BaZi yang presisi untuk membaca potensi kekayaan dan energi elemen tahunan.</p>
            </div>
            <div className="text-center md:text-left group">
              <TraditionIcon type="india" />
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors">Jyotish India</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">Perhitungan posisi planet untuk memahami peta karma dan peluang pertumbuhan diri.</p>
            </div>
            <div className="text-center md:text-left group">
              <TraditionIcon type="indian" />
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">Universal Path</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">Integrasi kearifan lingkaran hidup untuk navigasi spiritual yang lebih modern.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {results && (
        <section ref={resultRef} className="py-24 px-6 max-w-7xl mx-auto scroll-mt-24">
          <div className="text-center mb-16">
            <div className="inline-block bg-[#F59E0B]/10 text-[#F59E0B] px-5 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border border-[#F59E0B]/20 mb-6">
              Insights & Guidance
            </div>
            <h2 className="text-5xl font-black text-white mb-4 tracking-tight">Peta Cahaya {formData.name}</h2>
            <p className="text-slate-500 font-medium">Titik terang yang menuntunmu ke arah yang lebih positif.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <Card 
              title="Weton Jawa" 
              value={`${results.weton.day} ${results.weton.pasaran}`} 
              subValue={`Neptu: ${results.weton.neptu} (Amber Glow)`}
              icon={Sun}
              glowColor="amber-500"
            />
            <Card 
              title="Zodiak Barat" 
              value={results.zodiac} 
              subValue="Elemen Udara (Indigo)"
              icon={Star}
              glowColor="indigo-500"
            />
            <Card 
              title="Life Path" 
              value={results.lifePath} 
              subValue="Takdir Utama (Teal)"
              icon={Compass}
              glowColor="cyan-500"
            />
            <Card 
              title="Shio Cina" 
              value={results.shio} 
              subValue="Energi Tahun Ini"
              icon={Moon}
              glowColor="rose-500"
            />
          </div>

          {/* AI Chat Advisor Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            <div className="lg:col-span-2 bg-[#1E293B]/40 border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col h-[600px] shadow-2xl shadow-black/40 backdrop-blur-xl">
              <div className="bg-slate-900/50 p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-[#6366F1]/20">
                    <Sparkles size={22} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white tracking-tight">Metra AI Advisor</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 bg-[#06B6D4] rounded-full animate-pulse"></div>
                      <p className="text-[10px] text-[#06B6D4] font-bold uppercase tracking-widest">Active Insight</p>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] bg-white/5 border border-white/10 px-4 py-2 rounded-full text-slate-400 font-bold uppercase tracking-tighter">
                  {2 - chatCount} free daily session
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-800">
                {messages.map((m, i) => (
                  <ChatBubble key={i} message={m.text} isAI={m.isAI} />
                ))}
                {showPaywall && (
                  <div className="flex justify-center my-8">
                    <div className="bg-[#0F172A]/80 border border-[#6366F1]/30 p-8 rounded-3xl max-w-md text-center shadow-2xl backdrop-blur-xl animate-in zoom-in-95">
                      <div className="w-16 h-16 bg-[#6366F1]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <LockKeyhole className="text-[#6366F1]" size={32} />
                      </div>
                      <h4 className="text-2xl font-black text-white mb-3">Ingin Panduan Lengkap?</h4>
                      <p className="text-sm text-slate-400 mb-8 font-medium leading-relaxed">
                        Buka pencerahan tak terbatas dari ribuan database spiritual dunia untuk membantumu mengambil keputusan terbaik setiap hari.
                      </p>
                      <button className="w-full bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-[#6366F1]/30 uppercase tracking-widest text-xs">
                        Buka Jawaban (Rp 29k)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-6 bg-slate-900/30 border-t border-white/5 flex gap-3">
                <input 
                  type="text" 
                  disabled={showPaywall}
                  placeholder={showPaywall ? "Daily session ended" : "Tanyakan tentang masa depanmu..."}
                  className="flex-1 bg-slate-900/50 border border-white/5 rounded-2xl px-6 text-sm font-medium text-white focus:border-[#6366F1]/50 outline-none disabled:opacity-50 transition-all"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                />
                <button 
                  disabled={showPaywall}
                  className="p-4 bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] rounded-2xl text-white shadow-lg shadow-[#6366F1]/20 disabled:opacity-50"
                >
                  <Send size={24} />
                </button>
              </form>
            </div>

            {/* Sidebar Benefits */}
            <div className="space-y-8">
              <div className="bg-[#F59E0B]/5 border border-[#F59E0B]/20 p-8 rounded-[2.5rem] backdrop-blur-md">
                <h3 className="font-bold text-[#F59E0B] mb-6 flex items-center gap-3 uppercase tracking-widest text-xs">
                  <TrendingUp size={20} /> Mengapa Metra?
                </h3>
                <ul className="space-y-6">
                  {[
                    "Data spiritual lintas benua.",
                    "Analisis AI yang logis & optimis.",
                    "Keamanan profil 100% terjaga.",
                    "Fokus pada solusi harian."
                  ].map((text, i) => (
                    <li key={i} className="flex gap-4 text-sm font-medium text-slate-400">
                      <CheckCircle2 size={18} className="text-[#F59E0B] shrink-0 mt-0.5" /> {text}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-[#6366F1] to-[#0F172A] p-8 rounded-[2.5rem] text-white relative overflow-hidden group border border-white/10 shadow-2xl">
                 <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-700">
                    <Sparkles size={140} />
                 </div>
                 <div className="relative z-10">
                   <h3 className="text-2xl font-black mb-3 tracking-tighter">Metra Pro</h3>
                   <p className="text-sm text-indigo-200 mb-8 leading-relaxed font-medium">Dapatkan Kalender Hari Baik dan insight eksklusif WhatsApp harian.</p>
                   <button className="flex items-center gap-3 text-[#06B6D4] text-xs font-black uppercase tracking-widest group-hover:gap-4 transition-all">
                     Upgrade Sekarang <ChevronRight size={18} />
                   </button>
                 </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-white mb-6 tracking-tight leading-none">Investasi Masa Depan</h2>
            <p className="text-slate-500 font-medium">Beralih ke pencerahan data untuk setiap keputusan hidupmu.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
            <PricingCard 
              title="Starter"
              price="Gratis"
              features={["Kalkulator Weton & Zodiak", "Basic Karakter Summary", "2 Chat AI harian", "Global Methodology"]}
            />
            <PricingCard 
              title="Personal Advisor"
              price="Rp 29.000"
              highlighted={true}
              features={["Semua fitur Starter", "Unlimited Metra AI Advisor", "Kalender Hari Baik", "Bimbingan Karakter BaZi", "Priority Insights"]}
            />
            <PricingCard 
              title="Visionary"
              price="Rp 99.000"
              features={["Semua fitur Personal", "Compatibility Profiles", "Business Strategy Advisor", "Personal Life-map Report", "Direct WA Support"]}
            />
          </div>
        </div>
      </section>

      {/* Trust & Modern Vision */}
      <section className="py-32 px-6 text-center border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <Globe2 className="mx-auto text-[#06B6D4]/30 mb-10" size={80} />
          <h2 className="text-4xl font-black text-white mb-8 tracking-tighter">Membawa Kearifan ke Era Digital</h2>
          <p className="text-lg text-slate-500 font-medium leading-relaxed mb-16 max-w-2xl mx-auto">
            Kami percaya data spiritual adalah kompas yang belum terjamah teknologi. Metra hadir untuk menyelaraskan kembali manusia dengan ritme semesta melalui sains data modern.
          </p>
          <div className="flex flex-wrap justify-center gap-16 opacity-30 grayscale group hover:grayscale-0 transition-all duration-700">
            <ShieldCheck size={48} className="text-indigo-500" />
            <Sparkles size={48} className="text-cyan-500" />
            <Compass size={48} className="text-amber-500" />
            <Star size={48} className="text-rose-500" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 border-t border-white/5 bg-[#0F172A] px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] rounded-xl flex items-center justify-center">
                <Sparkles className="text-white" size={22} />
              </div>
              <span className="text-2xl font-black text-white ml-2 tracking-tighter">METRA</span>
            </div>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Panduan hidup personal berbasis Spiritual Data Science untuk masa depan yang lebih terang dan terukur.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:col-span-3 gap-12">
            <div>
              <h4 className="font-bold text-white mb-8 text-[11px] uppercase tracking-widest">Aplikasi</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-medium">
                <li><a href="#" className="hover:text-[#06B6D4] transition-colors">Kalkulator</a></li>
                <li><a href="#" className="hover:text-[#06B6D4] transition-colors">AI Advisor</a></li>
                <li><a href="#" className="hover:text-[#06B6D4] transition-colors">Compatibility</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-8 text-[11px] uppercase tracking-widest">Sains</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-medium">
                <li><a href="#" className="hover:text-[#06B6D4] transition-colors">Metodologi</a></li>
                <li><a href="#" className="hover:text-[#06B6D4] transition-colors">Data Privacy</a></li>
                <li><a href="#" className="hover:text-[#06B6D4] transition-colors">Whitepaper</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-8 text-[11px] uppercase tracking-widest">Layanan</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-medium">
                <li><a href="#" className="hover:text-[#06B6D4] transition-colors">WhatsApp Bot</a></li>
                <li><a href="#" className="hover:text-[#06B6D4] transition-colors">Partnership</a></li>
                <li><a href="#" className="hover:text-[#06B6D4] transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-24 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">
            © 2026 METRA SPIRITUAL DATA SCIENCE. OPTIMISM THROUGH DATA.
          </p>
          <div className="flex gap-4">
             <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center text-slate-500 hover:text-[#06B6D4] transition-all cursor-pointer shadow-lg">
                <ShieldCheck size={20} />
             </div>
             <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center text-slate-500 hover:text-[#06B6D4] transition-all cursor-pointer shadow-lg">
                <Globe2 size={20} />
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
