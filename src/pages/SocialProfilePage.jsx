import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User,
    Crown,
    Zap,
    UserPlus,
    UserCheck,
    Calendar,
    Star,
    Sparkles,
    ArrowLeft,
    Sun,
    Compass,
    Scroll,
    Globe,
    CircleDot,
    Sunrise,
    Moon,
    X,
    Quote
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import SocialPostCard from '../components/SocialPostCard';
import { censorName, getPlanBadgeColor } from '../utils/socialUtils';
import { formatMessage } from '../utils/chat';

// Insight Modal Component
const InsightModal = ({ isOpen, onClose, insight }) => {
    if (!isOpen || !insight) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#1E293B] border border-white/10 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-slide-up relative">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-[#6366F1]/20 to-[#06B6D4]/20 blur-xl"></div>
                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={onClose}
                        className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/70 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] flex items-center justify-center mb-6 shadow-lg shadow-[#6366F1]/20">
                        <Sparkles className="text-white" size={32} />
                    </div>

                    <h2 className="text-2xl font-black text-white mb-2 leading-tight">
                        {insight.title || 'Insight dari Metra AI'}
                    </h2>

                    <div className="flex items-center gap-2 mb-6 text-slate-400 text-xs font-medium uppercase tracking-wider">
                        <Calendar size={14} />
                        <span>{insight.source || 'Insight Harian'}</span>
                    </div>

                    <div className="bg-[#0F172A]/50 rounded-2xl p-6 border border-white/5 relative max-h-80 overflow-y-auto">
                        <Quote className="absolute top-4 left-4 text-[#6366F1]/20" size={40} />
                        <div className="text-slate-300 text-sm leading-relaxed relative z-10 whitespace-pre-line">
                            {formatMessage(insight.content || insight.description || '')}
                        </div>
                        <Quote className="absolute bottom-4 right-4 text-[#06B6D4]/20 rotate-180" size={40} />
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={onClose}
                            className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl border border-white/10 transition-all"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SocialProfilePage = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [requestSent, setRequestSent] = useState(false);
    const [selectedInsight, setSelectedInsight] = useState(null);

    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('metra_token');

                if (!apiUrl) throw new Error('API URL not configured');

                const response = await fetch(`${apiUrl}/social/profile/${username}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    if (response.status === 404) throw new Error('Profil tidak ditemukan');
                    throw new Error('Gagal memuat profil');
                }

                const data = await response.json();

                setProfile({
                    ...data,
                    stats: data.stats || { posts: 0, friends: 0, likes: 0 },
                    posts: data.posts || []
                });
            } catch (err) {
                console.error('Fetch error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            fetchProfile();
        }
    }, [username, apiUrl]);

    const handleBack = () => {
        navigate(-1);
    };

    const handleAddFriend = () => {
        // Implement logic to add friend/follow
        // For now just simulate UI
        // In real impl, call API to follow
        handleFollow();
    };

    const handleFollow = async () => {
        if (!profile) return;
        try {
            const token = localStorage.getItem('metra_token');
            const res = await fetch(`${apiUrl}/social/users/${profile.id}/follow`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setProfile(prev => ({
                    ...prev,
                    isFollowing: data.isFollowing,
                    stats: {
                        ...prev.stats,
                        followers: data.followerCount
                    }
                }));
                setRequestSent(false);
            }
        } catch (error) {
            console.error('Follow error:', error);
        }
    };

    // Like post
    const handleLike = async (postId) => {
        const token = localStorage.getItem('metra_token');
        const res = await fetch(`${apiUrl}/social/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            throw new Error('Failed to like post');
        }
    };

    // Add comment
    const handleComment = async (postId, content) => {
        const token = localStorage.getItem('metra_token');
        const res = await fetch(`${apiUrl}/social/posts/${postId}/comment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });

        if (res.ok) {
            const data = await res.json();
            // Update local state
            setProfile(prev => ({
                ...prev,
                posts: prev.posts.map(p =>
                    p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
                )
            }));
            return data.comment;
        } else {
            throw new Error('Failed to add comment');
        }
    };

    // Fetch comments for a post
    const handleFetchComments = async (postId) => {
        const token = localStorage.getItem('metra_token');
        const res = await fetch(`${apiUrl}/social/posts/${postId}/comments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            return data.comments || [];
        }
        return [];
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0F172A] text-slate-300">
                <Navbar />
                <div className="pt-28 px-4 text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button onClick={handleBack} className="text-[#6366F1] hover:underline">Kembali</button>
                </div>
            </div>
        );
    }

    if (!profile) return null;

    try {
        return (
            <div className="min-h-screen bg-[#0F172A] text-slate-300">
                <Navbar />

                {/* Background Effects */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6366F1]/10 blur-[160px] rounded-full"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#06B6D4]/10 blur-[160px] rounded-full"></div>
                </div>

                <main className="pt-28 pb-20 px-4 max-w-2xl mx-auto relative z-10">
                    {/* Navigation */}
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft size={20} />
                        <span>Kembali</span>
                    </button>

                    {/* Profile Header */}
                    <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-[#6366F1]/20 to-[#06B6D4]/20 blur-xl"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
                            {/* Avatar */}
                            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] p-[3px] relative shrink-0">
                                <div className="w-full h-full rounded-full bg-[#1E293B] flex items-center justify-center overflow-hidden">
                                    {profile.avatar ? (
                                        <img src={profile.avatar} alt={profile.name || 'User'} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={40} className="text-white" />
                                    )}
                                </div>
                                <div className="absolute bottom-0 right-0 bg-[#1E293B] rounded-full p-1.5">
                                    <Crown size={16} className={getPlanBadgeColor(profile.plan)} fill="currentColor" />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                                    <h1 className="text-2xl font-bold text-white">
                                        {censorName(profile.name, profile.isFollowing || profile.isOwnProfile)}
                                    </h1>
                                    {profile.compatibility && (
                                        <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 border border-emerald-500/20">
                                            <Zap size={10} fill="currentColor" />
                                            {profile.compatibility}% Cocok
                                        </span>
                                    )}
                                </div>
                                <p className="text-slate-500 text-sm mb-3 -mt-1">
                                    @{profile.username}
                                </p>

                                <p className="text-slate-400 text-sm mb-4 leading-relaxed max-w-md">
                                    {profile.bio || "Belum ada bio."}
                                </p>

                                <div className="flex items-center justify-center md:justify-start gap-6 mb-6">
                                    <div className="text-center md:text-left">
                                        <div className="text-white font-bold">{profile.stats?.posts || 0}</div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider">Post</div>
                                    </div>
                                    <div className="text-center md:text-left">
                                        <div className="text-white font-bold">{profile.stats?.followers || 0}</div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider">Pengikut</div>
                                    </div>
                                    <div className="text-center md:text-left">
                                        <div className="text-white font-bold">{profile.stats?.following || 0}</div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider">Mengikuti</div>
                                    </div>
                                </div>

                                {/* Actions */}
                                {!profile.isOwnProfile && (
                                    <div className="flex gap-3 justify-center md:justify-start">
                                        {profile.isFollowing ? (
                                            <button
                                                onClick={handleFollow}
                                                className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-6 py-2.5 rounded-xl text-sm font-bold border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                                            >
                                                <UserCheck size={18} />
                                                <span>Mengikuti</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleAddFriend}
                                                disabled={requestSent}
                                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${requestSent
                                                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                                    : 'bg-[#6366F1] hover:bg-[#4F46E5] text-white shadow-lg shadow-[#6366F1]/20'
                                                    }`}
                                            >
                                                <UserPlus size={18} />
                                                <span>{requestSent ? 'Permintaan Terkirim' : 'Ikuti'}</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Shared Spiritual Data Check */}
                    {profile.spiritualData ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                            {/* Weton */}
                            <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center group hover:border-[#6366F1]/30 transition-colors">
                                <div className="w-10 h-10 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-2 group-hover:scale-110 transition-transform">
                                    <Sun size={20} />
                                </div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Weton</div>
                                <div className="text-white font-bold text-xs truncate">{profile.spiritualData.weton || '-'}</div>
                            </div>

                            {/* Zodiak */}
                            <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center group hover:border-[#6366F1]/30 transition-colors">
                                <div className="w-10 h-10 mx-auto rounded-full bg-[#6366F1]/10 flex items-center justify-center text-[#6366F1] mb-2 group-hover:scale-110 transition-transform">
                                    <Star size={20} />
                                </div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Zodiak</div>
                                <div className="text-white font-bold text-xs truncate">{profile.spiritualData.zodiac || '-'}</div>
                            </div>

                            {/* Life Path */}
                            <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center group hover:border-[#6366F1]/30 transition-colors">
                                <div className="w-10 h-10 mx-auto rounded-full bg-[#06B6D4]/10 flex items-center justify-center text-[#06B6D4] mb-2 group-hover:scale-110 transition-transform">
                                    <Compass size={20} />
                                </div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Life Path</div>
                                <div className="text-white font-bold text-xs truncate">{profile.spiritualData.lifePath || '-'}</div>
                            </div>

                            {/* Shio */}
                            <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center group hover:border-[#6366F1]/30 transition-colors">
                                <div className="w-10 h-10 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2 group-hover:scale-110 transition-transform">
                                    <Scroll size={20} />
                                </div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Shio</div>
                                <div className="text-white font-bold text-xs truncate">{profile.spiritualData.shio || '-'}</div>
                            </div>

                            {/* Elemen */}
                            <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center group hover:border-[#6366F1]/30 transition-colors">
                                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2 group-hover:scale-110 transition-transform">
                                    <Globe size={20} />
                                </div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Elemen</div>
                                <div className="text-white font-bold text-xs truncate">{profile.spiritualData.element || '-'}</div>
                            </div>

                            {/* Planet */}
                            <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center group hover:border-[#6366F1]/30 transition-colors">
                                <div className="w-10 h-10 mx-auto rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500 mb-2 group-hover:scale-110 transition-transform">
                                    <CircleDot size={20} />
                                </div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Planet</div>
                                <div className="text-white font-bold text-xs truncate">{profile.spiritualData.rulingPlanet || '-'}</div>
                            </div>

                            {/* Ascendant */}
                            <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center group hover:border-[#6366F1]/30 transition-colors">
                                <div className="w-10 h-10 mx-auto rounded-full bg-orange-400/10 flex items-center justify-center text-orange-400 mb-2 group-hover:scale-110 transition-transform">
                                    <Sunrise size={20} />
                                </div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Ascendant</div>
                                <div className="text-white font-bold text-xs truncate">{profile.spiritualData.ascendant || '-'}</div>
                            </div>

                            {/* Moon */}
                            <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center group hover:border-[#6366F1]/30 transition-colors">
                                <div className="w-10 h-10 mx-auto rounded-full bg-slate-400/10 flex items-center justify-center text-slate-400 mb-2 group-hover:scale-110 transition-transform">
                                    <Moon size={20} />
                                </div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Fase Bulan</div>
                                <div className="text-white font-bold text-xs truncate">{profile.spiritualData.moonPhase || '-'}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8 text-center">
                            <Sparkles className="mx-auto text-slate-600 mb-2" size={32} />
                            <p className="text-slate-500 text-sm">Info spiritual disembunyikan oleh pengguna.</p>
                        </div>
                    )}

                    {/* Post Timeline */}
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 bg-[#6366F1] rounded-full"></div>
                        Postingan
                    </h3>

                    <div className="space-y-6">
                        {profile.posts && profile.posts.length > 0 ? (
                            profile.posts.map(post => (
                                <SocialPostCard
                                    key={post.id}
                                    post={post}
                                    onViewInsight={(content) => setSelectedInsight(content)}
                                    onLike={handleLike}
                                    onComment={handleComment}
                                    onFetchComments={handleFetchComments}
                                />
                            ))
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                Belum ada postingan
                            </div>
                        )}
                    </div>

                    <InsightModal
                        isOpen={!!selectedInsight}
                        onClose={() => setSelectedInsight(null)}
                        insight={selectedInsight}
                    />

                </main>
            </div>
        );
    } catch (renderError) {
        console.error('Render error:', renderError);
        return (
            <div className="min-h-screen bg-[#0F172A] text-slate-300 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-2">Terjadi kesalahan tampilan</p>
                    <p className="text-xs text-slate-500">{renderError.message}</p>
                    <button onClick={() => window.location.reload()} className="mt-4 bg-[#6366F1] px-4 py-2 rounded text-white">Reload</button>
                </div>
            </div>
        );
    }
};

export default SocialProfilePage;
