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
  LockKeyhole
} from 'lucide-react';

// --- Data Helper & Logic ---

const getWeton = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const pasarans = ["Legi", "Paing", "Pon", "Wage", "Kliwon"];
  
  // Base reference: 1 Jan 1900 was Monday Pahing
  const baseDate = new Date(1900, 0, 1);
  const diffDays = Math.floor((date - baseDate) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { day: days[date.getDay()], pasaran: "Kliwon", neptu: 15 }; // Fallback

  const dayIdx = date.getDay();
  const pasaranIdx = (diffDays + 1) % 5; // +1 because Jan 1 1900 was Pahing (index 1)
  
  const dayValues = { "Minggu": 5, "Senin": 4, "Selasa": 3, "Rabu": 7, "Kamis": 8, "Jumat": 6, "Sabtu": 9 };
  const pasaranValues = { "Legi": 5, "Paing": 9, "Pon": 7, "Wage": 4, "Kliwon": 8 };
  
  const d = days[dayIdx];
  const p = pasarans[pasaranIdx];
  
  return {
    day: d,
    pasaran: p,
    neptu: dayValues[d] + pasaranValues[p]
  };
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

// --- Components ---

const Card = ({ title, value, subValue, icon: Icon, color }) => (
  <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-6 rounded-2xl hover:border-teal-500/50 transition-all group overflow-hidden relative">
    <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${color}-500/10 blur-3xl group-hover:bg-${color}-500/20 transition-all rounded-full`}></div>
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`p-3 rounded-xl bg-slate-800 border border-white/5 text-${color}-400`}>
        <Icon size={20} />
      </div>
    </div>
    <h3 className="text-slate-400 text-sm font-medium mb-1 relative z-10">{title}</h3>
    <div className="flex flex-col relative z-10">
      <span className="text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-teal-400 transition-all">
        {value}
      </span>
      {subValue && <span className="text-xs text-slate-500 mt-1">{subValue}</span>}
    </div>
  </div>
);

const ChatBubble = ({ message, isAI }) => (
  <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
    <div className={`max-w-[80%] p-4 rounded-2xl ${
      isAI 
        ? 'bg-slate-800 border border-white/10 text-slate-200' 
        : 'bg-gradient-to-r from-teal-600 to-blue-600 text-white'
    }`}>
      <p className="text-sm leading-relaxed">{message}</p>
    </div>
  </div>
);

export default function App() {
  const [formData, setFormData] = useState({ name: '', dob: '', time: '' });
  const [results, setResults] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Halo! Saya Metra AI. Setelah mengisi data kelahiranmu, tanyakan apa saja tentang potensi diri, karir, atau asmaramu.", isAI: true }
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
    
    // Auto-scroll to result
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    // Dynamic AI response
    setMessages(prev => [...prev, { 
      text: `Analisis singkat untuk ${formData.name}: Sebagai ${weton.day} ${weton.pasaran} dengan Life Path ${lifePath}, kamu memiliki energi ${shio}. Hari ini adalah waktu yang sangat baik untuk memulai hal baru. Ada yang ingin kamu tanyakan lebih dalam?`, 
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

    // Mock AI reply
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        text: "Berdasarkan hitungan BaZi dan elemen harimu, transisi ini sangat dipengaruhi oleh energi Logam. Sebaiknya fokus pada komunikasi internal sebelum mengekspansi bisnis.", 
        isAI: true 
      }]);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-teal-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-900/20 blur-[120px] rounded-full"></div>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/50 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-tr from-teal-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Sparkles className="text-white" size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">METRA</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-teal-400 transition-colors">Fitur</a>
            <a href="#" className="hover:text-teal-400 transition-colors">Metodologi</a>
            <a href="#" className="hover:text-teal-400 transition-colors">Pricing</a>
            <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 rounded-full transition-all text-white">
              Masuk
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 px-4 py-1.5 rounded-full text-teal-400 text-xs font-bold tracking-widest uppercase mb-6 animate-bounce">
            <Zap size={14} /> Spiritual Data Science
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
            Temukan Ritme Hidupmu <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500">
              Dalam Satu Hitungan.
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Metra menggabungkan ribuan tahun ilmu metafisika dunia (Weton, BaZi, Numerologi) dengan kecerdasan buatan untuk membaca peta jalan hidup Anda secara presisi.
          </p>
        </div>

        {/* Interactive Widget */}
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleCalculate} className="bg-slate-900/80 border border-white/10 p-2 rounded-3xl backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row items-center gap-2">
            <div className="flex-1 w-full px-4 py-3 flex items-center gap-3 bg-slate-800/50 rounded-2xl border border-white/5 focus-within:border-teal-500/50 transition-all">
              <User className="text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Nama Anda"
                required
                className="bg-transparent border-none outline-none w-full text-white placeholder:text-slate-600"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="flex-1 w-full px-4 py-3 flex items-center gap-3 bg-slate-800/50 rounded-2xl border border-white/5 focus-within:border-teal-500/50 transition-all">
              <Calendar className="text-slate-500" size={18} />
              <input 
                type="date" 
                required
                className="bg-transparent border-none outline-none w-full text-white placeholder:text-slate-600 [color-scheme:dark]"
                value={formData.dob}
                onChange={(e) => setFormData({...formData, dob: e.target.value})}
              />
            </div>
            <button 
              type="submit"
              className="w-full md:w-auto bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-teal-500/20"
            >
              Buka Peta Saya <ChevronRight size={20} />
            </button>
          </form>
        </div>
      </section>

      {/* Results Section */}
      {results && (
        <section ref={resultRef} className="py-20 px-6 max-w-7xl mx-auto scroll-mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-2">The Instant Insight</h2>
            <p className="text-slate-500">Berdasarkan getaran energi kelahiran {formData.name}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card 
              title="Weton" 
              value={`${results.weton.day} ${results.weton.pasaran}`} 
              subValue={`Neptu: ${results.weton.neptu}`}
              icon={Sun}
              color="orange"
            />
            <Card 
              title="Western Zodiac" 
              value={results.zodiac} 
              subValue="Elemen Utama"
              icon={Star}
              color="teal"
            />
            <Card 
              title="Life Path" 
              value={results.lifePath} 
              subValue="Numerology Number"
              icon={Compass}
              color="purple"
            />
            <Card 
              title="Chinese Zodiac" 
              value={results.shio} 
              subValue="Shio Kelahiran"
              icon={Moon}
              color="blue"
            />
          </div>

          {/* AI Chat Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 bg-slate-900/50 border border-white/10 rounded-3xl overflow-hidden flex flex-col h-[500px] backdrop-blur-md">
              <div className="bg-slate-800/50 p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
                    <Sparkles size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-none">Metra AI Advisor</p>
                    <p className="text-[10px] text-teal-400 mt-1">Online & Analyzing</p>
                  </div>
                </div>
                <div className="text-[10px] bg-white/5 px-2 py-1 rounded text-slate-400">
                  {2 - chatCount} kuota gratis tersisa
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700">
                {messages.map((m, i) => (
                  <ChatBubble key={i} message={m.text} isAI={m.isAI} />
                ))}
                {showPaywall && (
                  <div className="flex justify-center my-6">
                    <div className="bg-slate-800/80 border border-teal-500/30 p-6 rounded-2xl max-w-md text-center backdrop-blur-xl animate-in zoom-in-95 duration-300">
                      <div className="w-12 h-12 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LockKeyhole className="text-teal-400" size={24} />
                      </div>
                      <h4 className="text-white font-bold mb-2">Penasaran dengan detailnya?</h4>
                      <p className="text-sm text-slate-400 mb-6">Buka ribuan database Primbon dan logika BaZi tanpa batas untuk panduan hidup presisimu.</p>
                      <button className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-3 rounded-xl transition-all shadow-lg shadow-teal-500/20">
                        Buka Jawaban Lengkap (Rp 29k)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 bg-slate-800/30 border-t border-white/5 flex gap-2">
                <input 
                  type="text" 
                  disabled={showPaywall}
                  placeholder={showPaywall ? "Chat limit tercapai" : "Tanyakan karir, asmara, atau hoki..."}
                  className="flex-1 bg-slate-800 border border-white/5 rounded-xl px-4 text-sm focus:border-teal-500 outline-none disabled:opacity-50"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                />
                <button 
                  disabled={showPaywall}
                  className="p-3 bg-teal-500 rounded-xl text-slate-950 hover:bg-teal-400 transition-all disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>

            {/* Sidebar Insight */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-teal-600/20 to-blue-600/20 border border-teal-500/20 p-6 rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <MessageSquare className="text-teal-400" size={20} />
                  <h3 className="font-bold text-white">Topik Terpopuler</h3>
                </div>
                <div className="space-y-3">
                  {["Kapan waktu terbaik buka bisnis?", "Kecocokan jodoh dengan Selasa Wage", "Prediksi karir di tahun 2026"].map((q, i) => (
                    <button key={i} className="w-full text-left text-xs bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/5 transition-all text-slate-400">
                      "{q}"
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all">
                    <Sparkles size={80} />
                 </div>
                 <h3 className="font-bold text-white mb-2 relative z-10">Metra Premium</h3>
                 <p className="text-xs text-slate-500 mb-4 relative z-10 leading-relaxed">Dapatkan akses ke Personalized Calendar dan Deep Analysis dari 5 sistem metafisika dunia.</p>
                 <button className="flex items-center gap-2 text-teal-400 text-xs font-bold hover:underline">
                   Pelajari lebih lanjut <ChevronRight size={14} />
                 </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
              <Sparkles className="text-teal-500" size={16} />
            </div>
            <span className="text-xl font-black text-white">METRA</span>
          </div>
          <p className="text-slate-600 text-xs text-center">
            © 2026 Metra Spiritual Data Science. Menggabungkan tradisi dan masa depan.
          </p>
          <div className="flex gap-6">
            <div className="w-5 h-5 bg-slate-800 rounded-full"></div>
            <div className="w-5 h-5 bg-slate-800 rounded-full"></div>
            <div className="w-5 h-5 bg-slate-800 rounded-full"></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
