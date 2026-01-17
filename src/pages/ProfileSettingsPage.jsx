import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Save,
    User,
    Lock,
    Eye,
    ArrowLeft,
    Upload,
    CheckCircle,

    AlertCircle,
    Loader2,
    Settings
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const ProfileSettingsPage = () => {
    const navigate = useNavigate();
    const { user, login } = useAuth(); // login used here to update generic user context if needed, or we might need a specific update function
    // Ideally AuthContext should expose an updateUser function. For now we might need to reload or manually update.

    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        avatar_url: '',
        visibility_settings: {
            showBio: true,
            showSpiritual: true
        }
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                bio: user.bio || '',
                avatar_url: user.avatar_url || '',
                visibility_settings: {
                    showBio: user.visibility_settings?.showBio !== false,
                    showSpiritual: user.visibility_settings?.showSpiritual !== false
                }
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleVisibilityChange = (key) => {
        setFormData(prev => ({
            ...prev,
            visibility_settings: {
                ...prev.visibility_settings,
                [key]: !prev.visibility_settings[key]
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const token = localStorage.getItem('metra_token');
            const response = await axios.put('http://localhost:3001/api/auth/profile', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccessMsg('Profil berhasil diperbarui!');

            // Basic way to update context: reload page or use a refresh method if available.
            // Since useAuth probably loads from localStorage or /me, we might want to update localStorage if it stores user data
            // But usually /me is fetched on load.
            // Let's reload to be safe and simple for now.
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (error) {
            console.error("Update failed", error);
            setErrorMsg(error.response?.data?.error || 'Gagal memperbarui profil');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-300">
            <Navbar />

            <div className="pt-28 pb-20 px-4 max-w-2xl mx-auto">
                <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft size={20} />
                    <span>Kembali ke Profil</span>
                </button>

                <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                    <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <Settings className="text-[#6366F1]" />
                        Pengaturan Profil
                    </h1>

                    {successMsg && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl mb-6 flex items-center gap-3">
                            <CheckCircle size={20} />
                            {successMsg}
                        </div>
                    )}

                    {errorMsg && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3">
                            <AlertCircle size={20} />
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Avatar Section */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Foto Profil (URL)</label>
                            <div className="flex gap-4 items-start">
                                <div className="w-16 h-16 rounded-full bg-[#0F172A] overflow-hidden border border-white/10 shrink-0">
                                    {formData.avatar_url ? (
                                        <img src={formData.avatar_url} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                                            <User size={24} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        name="avatar_url"
                                        value={formData.avatar_url}
                                        onChange={handleChange}
                                        disabled={loading}
                                        placeholder="https://example.com/photo.jpg"
                                        className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6366F1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <p className="text-xs text-slate-500 mt-2">
                                        Saat ini hanya mendukung URL gambar langsung.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-3.5 text-slate-500" size={18} />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className="w-full bg-[#0F172A] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#6366F1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Bio Singkat</label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    disabled={loading}
                                    placeholder="Ceritakan sedikit tentang diri Anda..."
                                    rows="3"
                                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6366F1] transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Visibility Settings */}
                        <div className="pt-4 border-t border-white/5">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Eye size={18} className="text-[#06B6D4]" />
                                Privasi Profil
                            </h3>

                            <div className="space-y-3">
                                <label className={`flex items-center justify-between p-4 rounded-xl bg-[#0F172A] border border-white/5 cursor-pointer hover:border-white/10 transition-colors ${loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}>
                                    <span className="text-sm font-medium text-slate-300">Tampilkan Bio</span>
                                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.visibility_settings.showBio ? 'bg-[#6366F1]' : 'bg-slate-700'}`}
                                        onClick={() => !loading && handleVisibilityChange('showBio')}>
                                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.visibility_settings.showBio ? 'translate-x-6' : ''}`}></div>
                                    </div>
                                </label>

                                <label className={`flex items-center justify-between p-4 rounded-xl bg-[#0F172A] border border-white/5 cursor-pointer hover:border-white/10 transition-colors ${loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}>
                                    <span className="text-sm font-medium text-slate-300">Tampilkan Data Spiritual</span>
                                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.visibility_settings.showSpiritual ? 'bg-[#6366F1]' : 'bg-slate-700'}`}
                                        onClick={() => !loading && handleVisibilityChange('showSpiritual')}>
                                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.visibility_settings.showSpiritual ? 'translate-x-6' : ''}`}></div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-[#6366F1] to-[#06B6D4] hover:opacity-90 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-[#6366F1]/20 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        Simpan Perubahan
                                    </>
                                )}
                            </button>
                        </div>

                    </form>

                    {/* Password Change Section */}
                    <div className="mt-12 pt-8 border-t border-white/10">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Lock size={18} className="text-amber-400" />
                            Ubah Password
                        </h3>
                        <PasswordChangeForm />
                    </div>
                </div>
            </div>
        </div>
    );
};

const PasswordChangeForm = () => {
    const [passData, setPassData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    const handleChange = (e) => {
        setPassData({ ...passData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passData.newPassword !== passData.confirmPassword) {
            setMsg({ type: 'error', text: 'Password baru tidak cocok' });
            return;
        }
        if (passData.newPassword.length < 6) {
            setMsg({ type: 'error', text: 'Password minimal 6 karakter' });
            return;
        }

        setLoading(true);
        setMsg({ type: '', text: '' });

        try {
            const token = localStorage.getItem('metra_token');
            await axios.post('http://localhost:3001/api/auth/change-password', {
                currentPassword: passData.currentPassword,
                newPassword: passData.newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMsg({ type: 'success', text: 'Password berhasil diubah!' });
            setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setMsg({ type: 'error', text: error.response?.data?.error || 'Gagal mengubah password' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {msg.text && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {msg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {msg.text}
                </div>
            )}

            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Password Saat Ini</label>
                <input
                    type="password"
                    name="currentPassword"
                    value={passData.currentPassword}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Password Baru</label>
                    <input
                        type="password"
                        name="newPassword"
                        value={passData.newPassword}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Konfirmasi Password Baru</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={passData.confirmPassword}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>
            </div>
            <div className="pt-2">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
                    Update Password
                </button>
            </div>
        </form>
    );
};

export default ProfileSettingsPage;
