import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GoogleButton = ({ onSuccess, onError, loading, disabled }) => {
    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            // Exchange access token for credential (id_token)
            try {
                const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const userInfo = await res.json();

                // We need to get the id_token from Google's token endpoint
                // For now, we'll send the access_token and handle it differently
                onSuccess({ credential: tokenResponse.access_token, userInfo });
            } catch (err) {
                onError(err);
            }
        },
        onError: onError,
        flow: 'implicit'
    });

    return (
        <button
            type="button"
            onClick={() => login()}
            disabled={loading || disabled}
            className="w-full bg-white hover:bg-gray-100 text-gray-800 font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-3"
        >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Masuk dengan Google
        </button>
    );
};

const LoginPageContent = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/dashboard';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate(from, { replace: true });
        } catch (err) {
            console.error(err);
            // Check if needs OTP verification
            if (err.needsVerification) {
                navigate('/verify-otp', { state: { email: err.email } });
                return;
            }
            setError(err.message || 'Login gagal. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (response) => {
        setError('');
        setLoading(true);

        try {
            // Send userInfo directly to backend for Google auth
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/google-userinfo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userInfo: response.userInfo, accessToken: response.credential })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login Google gagal');
            }

            localStorage.setItem('metra_token', data.token);
            window.location.href = from;
        } catch (err) {
            setError(err.message || 'Login dengan Google gagal.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Login dengan Google gagal. Silakan coba lagi.');
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
                        <h1 className="text-2xl font-black text-white mb-2">Selamat Datang Kembali</h1>
                        <p className="text-slate-400 text-sm">Masuk untuk melanjutkan perjalanan spiritualmu</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="nama@email.com"
                                    required
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-12 py-4 text-white placeholder:text-slate-600 focus:border-[#6366F1]/50 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-12 py-4 text-white placeholder:text-slate-600 focus:border-[#6366F1]/50 outline-none transition-all pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-[#6366F1]/30 hover:brightness-110 disabled:opacity-50 uppercase tracking-widest text-xs"
                        >
                            {loading ? 'Memproses...' : 'Masuk'}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#1E293B] px-4 text-slate-500 font-bold tracking-widest">atau</span>
                        </div>
                    </div>

                    {/* Google Login Button - Custom styled */}
                    <GoogleButton
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        loading={loading}
                        disabled={loading}
                    />

                    <p className="text-center text-slate-400 text-sm mt-8">
                        Belum punya akun?{' '}
                        <Link to="/register" className="text-[#06B6D4] font-bold hover:underline">
                            Daftar sekarang
                        </Link>
                    </p>
                </div>

                <p className="text-center text-slate-600 text-xs mt-8">
                    © 2026 METRA Spiritual Data Science
                </p>
            </div>
        </div>
    );
};

const LoginPage = () => (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <LoginPageContent />
    </GoogleOAuthProvider>
);

export default LoginPage;
