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
  const styles = "w-12 h-12 mb-4 flex items-center justify-center rounded-2xl";
  switch(type) {
    case 'jawa': 
      return (
        <div className={`${styles} bg-orange-100 text-orange-600`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
            <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 6V14" strokeLinecap="round"/>
          </svg>
        </div>
      );
    case 'china':
      return (
        <div className={`${styles} bg-red-100 text-red-600`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2V22M2 12H22M7 7L17 17M17 7L7 17" strokeLinecap="round"/>
          </svg>
        </div>
      );
    case 'india':
      return (
        <div className={`${styles} bg-purple-100 text-purple-600`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
            <path d="M12 22C12 22 20 18 20 12C20 6 12 2 12 2C12 2 4 6 4 12C4 18 12 22 12 22Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
      );
    case 'indian':
      return (
        <div className={`${styles} bg-teal-100 text-teal-600`}>
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

const Card = ({ title, value, subValue, icon: Icon, colorClass }) => (
  <div className="bg-white border border-slate-200 p-6 rounded-3xl hover:shadow-xl hover:shadow-teal-500/10 transition-all group overflow-hidden relative">
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-all ${colorClass}`}></div>
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`p-3 rounded-2xl bg-slate-50 border border-slate-100 ${colorClass.replace('bg-', 'text-')}`}>
        <Icon size={22} />
      </div>
    </div>
    <h3 className="text-slate-500 text-sm font-semibold mb-1 relative z-10">{title}</h3>
    <div className="flex flex-col relative z-10">
      <span className="text-2xl font-bold text-slate-800">
        {value}
      </span>
      {subValue && <span className="text-xs text-slate-400 mt-1 font-medium">{subValue}</span>}
    </div>
  </div>
);

const ChatBubble = ({ message, isAI }) => (
  <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
    <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
      isAI 
        ? 'bg-white border border-slate-200 text-slate-700' 
        : 'bg-teal-600 text-white shadow-teal-200'
    }`}>
      <p className="text-sm leading-relaxed">{message}</p>
    </div>
  </div>
);

const PricingCard = ({ title, price, features, highlighted }) => (
  <div className={`p-8 rounded-3xl border ${highlighted ? 'bg-white border-teal-500 shadow-2xl shadow-teal-500/10 scale-105 z-10' : 'bg-slate-50 border-slate-200'} transition-all`}>
    <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
    <div className="flex items-baseline gap-1 mb-6">
      <span className="text-3xl font-black text-slate-900">{price}</span>
      <span className="text-slate-500 text-sm">/bulan</span>
    </div>
    <ul className="space-y-4 mb-8">
      {features.map((f, i) => (
        <li key={i} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
          <CheckCircle2 size={16} className="text-teal-500 shrink-0" /> {f}
        </li>
      ))}
    </ul>
    <button className={`w-full py-4 rounded-2xl font-bold transition-all ${highlighted ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50'}`}>
      Pilih Paket
    </button>
  </div>
);

export default function App() {
  const [formData, setFormData] = useState({ name: '', dob: '', time: '' });
  const [results, setResults] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Halo! Saya Metra AI Advisor. Isilah data kelahiranmu di atas, lalu tanyakan apa saja tentang potensi, karir, atau kebahagiaanmu hari ini.", isAI: true }
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
      text: `Analisis energi untuk ${formData.name}: Sebagai ${weton.day} ${weton.pasaran} (Neptu ${weton.neptu}), kamu membawa getaran harmoni. Dengan Life Path ${lifePath}, tujuan hidupmu sangat selaras dengan elemen ${shio} tahun ini. Bagaimana perasaanmu hari ini?`, 
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
        text: "Menarik sekali. Berdasarkan hitungan siklus harianmu, hari ini adalah fase 'Pancawara' yang mendatangkan keberuntungan di sisi sosial. Ini saat yang tepat untuk menjalin koneksi baru yang positif.", 
        isAI: true 
      }]);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 font-sans selection:bg-teal-100">
      {/* Background Ornaments */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-200/40 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-100/40 blur-[150px] rounded-full"></div>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 transform rotate-3">
              <Sparkles className="text-white" size={22} />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900 ml-1">METRA</span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-sm font-bold text-slate-600">
            <a href="#fitur" className="hover:text-teal-600 transition-colors">Metodologi</a>
            <a href="#pricing" className="hover:text-teal-600 transition-colors">Pricing</a>
            <button className="bg-slate-900 hover:bg-slate-800 px-6 py-2.5 rounded-full transition-all text-white shadow-lg shadow-slate-200">
              Masuk
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-5 py-2 rounded-full text-slate-600 text-xs font-bold tracking-wide shadow-sm mb-8">
            <Heart size={14} className="text-rose-500 fill-rose-500" /> Dirancang untuk Kesejahteraan Mental
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tight leading-[1.1]">
            Temukan <span className="text-teal-600">Ritme</span> Hidupmu <br />
            Dalam Satu Hitungan.
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
            Metra menyelaraskan data spiritual dunia dengan AI untuk membantumu berfikir positif dan mengambil langkah hidup yang lebih bermakna.
          </p>
        </div>

        {/* Interactive Widget */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-slate-200 p-4 rounded-[2rem] shadow-2xl shadow-slate-200/50">
            <form onSubmit={handleCalculate} className="flex flex-col md:flex-row items-center gap-3">
              <div className="flex-1 w-full px-5 py-4 flex items-center gap-3 bg-slate-50 rounded-2xl border border-slate-100 focus-within:bg-white focus-within:border-teal-300 transition-all">
                <User className="text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Nama Anda"
                  required
                  className="bg-transparent border-none outline-none w-full text-slate-800 placeholder:text-slate-400 font-semibold"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="flex-1 w-full px-5 py-4 flex items-center gap-3 bg-slate-50 rounded-2xl border border-slate-100 focus-within:bg-white focus-within:border-teal-300 transition-all">
                <Calendar className="text-slate-400" size={20} />
                <input 
                  type="date" 
                  required
                  className="bg-transparent border-none outline-none w-full text-slate-800 font-semibold"
                  value={formData.dob}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                />
              </div>
              <button 
                type="submit"
                className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold px-10 py-5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-teal-500/20"
              >
                Buka Peta Saya <ChevronRight size={20} />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Systems Showcase - THE "FEEL" SECTION */}
      <section className="py-24 px-6 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="text-center md:text-left">
              <TraditionIcon type="jawa" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Primbon Jawa</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">Menggunakan siklus Weton dan Neptu untuk menjaga keharmonisan batin dan alam semesta.</p>
            </div>
            <div className="text-center md:text-left">
              <TraditionIcon type="china" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Metafisika Cina</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">Analisis BaZi dan elemen Feng Shui untuk melihat keseimbangan energi dalam perjalanan karir.</p>
            </div>
            <div className="text-center md:text-left">
              <TraditionIcon type="india" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Jyotish India</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">Membaca posisi planet untuk memahami karma dan cara menghadapinya dengan fikiran tenang.</p>
            </div>
            <div className="text-center md:text-left">
              <TraditionIcon type="indian" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Native Wisdom</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">Filosofi lingkaran hidup untuk menghubungkan kembali diri Anda dengan ritme bumi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {results && (
        <section ref={resultRef} className="py-24 px-6 max-w-7xl mx-auto scroll-mt-24">
          <div className="text-center mb-16">
            <div className="inline-block bg-orange-100 text-orange-700 px-4 py-1 rounded-full text-xs font-bold mb-4">
              PERSONAL INSIGHT
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-4">Peta Energi {formData.name}</h2>
            <p className="text-slate-500 font-medium">Sinergi antara data lahirmu dengan semesta hari ini.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <Card 
              title="Weton Jawa" 
              value={`${results.weton.day} ${results.weton.pasaran}`} 
              subValue={`Total Neptu: ${results.weton.neptu}`}
              icon={Sun}
              colorClass="bg-orange-500"
            />
            <Card 
              title="Zodiak Barat" 
              value={results.zodiac} 
              subValue="Elemen Utama: Udara"
              icon={Star}
              colorClass="bg-teal-500"
            />
            <Card 
              title="Life Path" 
              value={results.lifePath} 
              subValue="Nomor Takdir Utama"
              icon={Compass}
              colorClass="bg-indigo-500"
            />
            <Card 
              title="Shio Cina" 
              value={results.shio} 
              subValue="Tahun Kelahiran"
              icon={Moon}
              colorClass="bg-rose-500"
            />
          </div>

          {/* AI Chat Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden flex flex-col h-[550px] shadow-xl shadow-slate-200/50">
              <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center shadow-md">
                    <Sparkles size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-none tracking-tight">Metra AI Advisor</p>
                    <p className="text-[11px] text-teal-600 mt-1 font-bold">● Active Analysis</p>
                  </div>
                </div>
                <div className="text-[11px] bg-white border border-slate-200 px-3 py-1.5 rounded-full text-slate-500 font-bold">
                  {2 - chatCount} kuota konsultasi gratis
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
                {messages.map((m, i) => (
                  <ChatBubble key={i} message={m.text} isAI={m.isAI} />
                ))}
                {showPaywall && (
                  <div className="flex justify-center my-8">
                    <div className="bg-white border border-teal-100 p-8 rounded-3xl max-w-md text-center shadow-2xl shadow-teal-500/10 animate-in zoom-in-95">
                      <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <LockKeyhole className="text-teal-600" size={28} />
                      </div>
                      <h4 className="text-xl font-bold text-slate-900 mb-3">Siap Menggali Lebih Dalam?</h4>
                      <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">
                        Buka analisis lengkap dari ribuan teks Primbon, BaZi, dan Jyotish secara tidak terbatas untuk membantumu melangkah hari ini.
                      </p>
                      <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-slate-200">
                        Buka Jawaban Lengkap (Rp 29k)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-slate-100 flex gap-3">
                <input 
                  type="text" 
                  disabled={showPaywall}
                  placeholder={showPaywall ? "Konsultasi harian selesai" : "Apa yang ingin kamu ketahui tentang masa depanmu?"}
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 text-sm font-medium focus:border-teal-400 focus:bg-white outline-none disabled:opacity-50 transition-all"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                />
                <button 
                  disabled={showPaywall}
                  className="p-4 bg-teal-600 rounded-2xl text-white hover:bg-teal-700 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
                >
                  <Send size={22} />
                </button>
              </form>
            </div>

            {/* Side Benefits */}
            <div className="space-y-8">
              <div className="bg-orange-50/50 border border-orange-200 p-8 rounded-[2rem]">
                <h3 className="font-bold text-orange-900 mb-4 flex items-center gap-2">
                  <TrendingUp size={20} /> Mengapa Metra?
                </h3>
                <ul className="space-y-5">
                  {[
                    "Akurasi berbasis ribuan data historis.",
                    "Fokus pada perspektif positif & solusi.",
                    "Personalisasi harian sesuai energi lahir.",
                    "Keamanan data profil pribadi terjamin."
                  ].map((text, i) => (
                    <li key={i} className="flex gap-3 text-sm font-medium text-orange-800">
                      <CheckCircle2 size={16} className="text-orange-500 shrink-0 mt-0.5" /> {text}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-slate-900 p-8 rounded-[2rem] text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-6 opacity-20 transform translate-x-4 -translate-y-4">
                    <Sparkles size={120} />
                 </div>
                 <h3 className="text-xl font-bold mb-3 relative z-10">Metra Plus</h3>
                 <p className="text-sm text-slate-400 mb-6 relative z-10 leading-relaxed font-medium">Akses kalender personal 'Hari Baik' untuk rencana bisnis dan hubungan Anda.</p>
                 <button className="flex items-center gap-2 text-teal-400 text-sm font-bold hover:gap-3 transition-all">
                   Upgrade Sekarang <ChevronRight size={18} />
                 </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">Investasi Untuk Kedamaianmu</h2>
            <p className="text-slate-500 font-medium">Pilih paket yang paling sesuai dengan kebutuhan spiritualmu.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
            <PricingCard 
              title="Dasar"
              price="Gratis"
              features={["Kalkulator Weton & Zodiak", "Summary Karakter Dasar", "2 Chat AI per hari", "Akses Komunitas"]}
            />
            <PricingCard 
              title="Personal"
              price="Rp 29.000"
              highlighted={true}
              features={["Semua Fitur Dasar", "Analisis BaZi & Jyotish", "Unlimited Chat AI Advisor", "Kalender Hari Baik Pribadi", "Insight Harian via WhatsApp"]}
            />
            <PricingCard 
              title="Bisnis"
              price="Rp 99.000"
              features={["Semua Fitur Personal", "Profil Compatibility (3 Slot)", "Saran Strategi Bisnis Metafisika", "Konsultasi Prioritas", "Report Bulanan Elemen"]}
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 px-6 text-center bg-white">
        <div className="max-w-4xl mx-auto">
          <Globe2 className="mx-auto text-teal-200 mb-8" size={60} />
          <h2 className="text-3xl font-black text-slate-900 mb-6">Membawa Tradisi ke Masa Depan</h2>
          <p className="text-lg text-slate-500 font-medium leading-relaxed mb-12">
            Kami percaya bahwa kearifan lokal jika dipadukan dengan teknologi modern dapat menjadi kompas yang sangat berharga bagi manusia di era digital.
          </p>
          <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale group hover:grayscale-0 transition-all">
            <ShieldCheck size={40} />
            <Sparkles size={40} />
            <Compass size={40} />
            <Star size={40} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-200 bg-white px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-teal-600 rounded-2xl flex items-center justify-center">
                <Sparkles className="text-white" size={22} />
              </div>
              <span className="text-2xl font-black text-slate-900">METRA</span>
            </div>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Panduan hidup personal yang menggabungkan metafisika kuno dan kecerdasan buatan untuk masa depan yang lebih terang.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Produk</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-medium">
                <li><a href="#" className="hover:text-teal-600">Kalkulator</a></li>
                <li><a href="#" className="hover:text-teal-600">Metra AI</a></li>
                <li><a href="#" className="hover:text-teal-600">Compatibility</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Tradisi</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-medium">
                <li><a href="#" className="hover:text-teal-600">Jawa</a></li>
                <li><a href="#" className="hover:text-teal-600">Cina</a></li>
                <li><a href="#" className="hover:text-teal-600">India</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Bantuan</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-medium">
                <li><a href="#" className="hover:text-teal-600">Kebijakan Privasi</a></li>
                <li><a href="#" className="hover:text-teal-600">Kontak Kami</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            © 2026 Metra Spiritual Data Science. Build for Positive Humanity.
          </p>
          <div className="flex gap-4">
             <div className="w-10 h-10 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-teal-600 transition-colors cursor-pointer">
                <ShieldCheck size={18} />
             </div>
             <div className="w-10 h-10 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-teal-600 transition-colors cursor-pointer">
                <Globe2 size={18} />
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
