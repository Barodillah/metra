import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const OtpPage = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const inputRefs = useRef([]);
    const { verifyOtp, resendOtp } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const email = location.state?.email;

    useEffect(() => {
        if (!email) {
            navigate('/register');
            return;
        }
        inputRefs.current[0]?.focus();
    }, [email, navigate]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [countdown]);

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        // Auto focus to next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto submit when all filled
        if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
            handleSubmit(newOtp.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
        setOtp(newOtp);

        if (pastedData.length === 6) {
            handleSubmit(pastedData);
        } else {
            inputRefs.current[pastedData.length]?.focus();
        }
    };

    const handleSubmit = async (otpCode = otp.join('')) => {
        if (otpCode.length !== 6) {
            setError('Masukkan 6 digit kode OTP');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await verifyOtp(email, otpCode);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(err.message || 'Kode OTP tidak valid');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend || resendLoading) return;

        setResendLoading(true);
        setError('');

        try {
            await resendOtp(email);
            setCountdown(60);
            setCanResend(false);
        } catch (err) {
            setError(err.message || 'Gagal mengirim ulang kode');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6366F1]/10 blur-[160px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#06B6D4]/10 blur-[160px] rounded-full"></div>
            </div>

            <div className="w-full max-w-md relative z-10 animate-fade-in">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-12 h-12 bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] rounded-2xl flex items-center justify-center shadow-lg shadow-[#6366F1]/20">
                            <Sparkles className="text-white" size={26} />
                        </div>
                        <span className="text-3xl font-black tracking-tighter text-white ml-2">METRA</span>
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-[#6366F1]/20 to-[#06B6D4]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="text-[#06B6D4]" size={28} />
                        </div>
                        <h1 className="text-2xl font-black text-white mb-2">Verifikasi Email</h1>
                        <p className="text-slate-400 text-sm">
                            Masukkan kode 6 digit yang dikirim ke
                        </p>
                        <p className="text-[#06B6D4] font-bold text-sm mt-1">{email}</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* OTP Inputs */}
                    <div className="flex gap-3 justify-center mb-8">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={el => inputRefs.current[index] = el}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                disabled={loading}
                                className="w-12 h-14 bg-slate-900/50 border border-white/10 rounded-xl text-center text-white text-xl font-bold focus:border-[#6366F1]/50 focus:ring-2 focus:ring-[#6366F1]/20 outline-none transition-all disabled:opacity-50"
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => handleSubmit()}
                        disabled={loading || otp.some(d => !d)}
                        className="w-full bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-[#6366F1]/30 hover:brightness-110 disabled:opacity-50 uppercase tracking-widest text-xs"
                    >
                        {loading ? 'Memverifikasi...' : 'Verifikasi'}
                    </button>

                    {/* Resend */}
                    <div className="text-center mt-6">
                        {canResend ? (
                            <button
                                onClick={handleResend}
                                disabled={resendLoading}
                                className="text-[#06B6D4] font-bold text-sm hover:underline flex items-center justify-center gap-2 mx-auto"
                            >
                                <RefreshCw size={14} className={resendLoading ? 'animate-spin' : ''} />
                                {resendLoading ? 'Mengirim...' : 'Kirim Ulang Kode'}
                            </button>
                        ) : (
                            <p className="text-slate-500 text-sm">
                                Kirim ulang dalam <span className="text-[#06B6D4] font-bold">{countdown}s</span>
                            </p>
                        )}
                    </div>

                    {/* Back link */}
                    <Link
                        to="/register"
                        className="flex items-center justify-center gap-2 text-slate-400 text-sm mt-8 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Kembali ke Registrasi
                    </Link>
                </div>

                <p className="text-center text-slate-600 text-xs mt-8">
                    © 2026 METRA Spiritual Data Science
                </p>
            </div>
        </div>
    );
};

export default OtpPage;
