import React, { useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UsernameModal = ({ onClose, onSuccess }) => {
    const { user, updateUser } = useAuth();
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [available, setAvailable] = useState(null);

    const getMinLength = () => {
        const plan = user?.plan_type || 'free';
        if (plan === 'visionary') return 3;
        if (plan === 'pro') return 4;
        return 5;
    };

    const minLength = getMinLength();

    const checkUsername = async (val) => {
        if (val.length < minLength) return setAvailable(false);
        try {
            const token = localStorage.getItem('metra_token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/check-username`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username: val })
            });
            const data = await response.json();
            setAvailable(data.available);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const token = localStorage.getItem('metra_token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/username`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Gagal menyimpan username');
            }

            // Update local user state if possible, or force reload
            // Ideally useAuth provides a way to patch user state
            // For now, we can trigger a reload or callback
            if (onSuccess) onSuccess(username);
            window.location.reload(); // Simple way to refresh auth state

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1E293B] border border-white/10 rounded-3xl w-full max-w-md p-6 relative overflow-hidden animate-fade-in-up">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#6366F1] to-[#06B6D4]"></div>

                <h2 className="text-2xl font-bold text-white mb-2">Buat Username</h2>
                <p className="text-slate-400 text-sm mb-6">
                    Anda perlu mengatur username sebelum mengakses fitur sosial. Username ini akan menjadi identitas unik Anda.
                    <br />
                    <span className="text-xs text-slate-500 mt-1 block">Minimal karakter: Free (5), Pro (4), Visionary (3).</span>
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Username</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => {
                                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '');
                                    setUsername(val);
                                    if (val.length >= minLength) checkUsername(val);
                                }}
                                className={`w-full bg-[#0F172A] border ${available === false ? 'border-red-500' : available === true ? 'border-emerald-500' : 'border-white/10'} rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#6366F1] transition-colors`}
                                placeholder={`minimal ${minLength} karakter`}
                                required
                                minLength={minLength}
                                maxLength={30}
                            />
                            {available === true && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                                    <Check size={18} />
                                </div>
                            )}
                            {available === false && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                                    <X size={18} />
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                            Hanya huruf kecil, angka, titik, underscore, dan strip.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2">
                            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-400">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || available === false || username.length < minLength}
                        className={`w-full py-3 rounded-xl font-bold text-white transition-all ${loading || available === false || username.length < minLength
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-[#6366F1] to-[#06B6D4] hover:shadow-lg hover:shadow-[#6366F1]/20'
                            }`}
                    >
                        {loading ? 'Menyimpan...' : 'Simpan Username'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UsernameModal;
