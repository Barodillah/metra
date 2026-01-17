import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import UsernameModal from '../components/UsernameModal';
import toast, { Toaster } from 'react-hot-toast';
import {
    User,
    Sparkles,
    X,
    Calendar,
    Quote,
    Send,
    Loader2,
    RefreshCw
} from 'lucide-react';
import Navbar from '../components/Navbar';
import SocialPostCard from '../components/SocialPostCard';
import InsightModal from '../components/InsightModal';
import { useAuth } from '../context/AuthContext';
import { formatMessage } from '../utils/chat';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Insight Modal Component
// InsightModal moved to src/components/InsightModal.jsx

// Main SocialPage Component
const SocialPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [selectedInsight, setSelectedInsight] = useState(null);
    const [showUsernameModal, setShowUsernameModal] = useState(false);

    // Feed state
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Create post state
    const [newPostContent, setNewPostContent] = useState('');
    const [creatingPost, setCreatingPost] = useState(false);

    // Check for username on mount
    useEffect(() => {
        if (user && !user.username) {
            setShowUsernameModal(true);
        }
    }, [user]);

    // Fetch feed
    const fetchFeed = useCallback(async (page = 1, append = false) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('metra_token');
            const res = await fetch(`${API_URL}/social/feed?page=${page}&limit=10`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (append) {
                    setPosts(prev => [...prev, ...data.posts]);
                } else {
                    setPosts(data.posts);
                }
                setHasMore(data.hasMore);
                setCurrentPage(page);
            }
        } catch (error) {
            console.error('Failed to fetch feed:', error);
            toast.error('Gagal memuat feed');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchFeed();
        }
    }, [user, fetchFeed]);

    const handleUsernameSuccess = () => {
        setShowUsernameModal(false);
        fetchFeed();
    };

    // Create post
    const handleCreatePost = async () => {
        if (!newPostContent.trim()) return;

        setCreatingPost(true);
        try {
            const token = localStorage.getItem('metra_token');
            const res = await fetch(`${API_URL}/social/posts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: newPostContent.trim(),
                    postType: 'text'
                })
            });

            if (res.ok) {
                const data = await res.json();
                setPosts(prev => [data.post, ...prev]);
                setNewPostContent('');
                toast.success('Post berhasil dibuat!');
            } else {
                const error = await res.json();
                throw new Error(error.error);
            }
        } catch (error) {
            console.error('Failed to create post:', error);
            toast.error('Gagal membuat post');
        } finally {
            setCreatingPost(false);
        }
    };

    // Like post
    const handleLike = async (postId) => {
        const token = localStorage.getItem('metra_token');
        const res = await fetch(`${API_URL}/social/posts/${postId}/like`, {
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
        const res = await fetch(`${API_URL}/social/posts/${postId}/comment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });

        if (res.ok) {
            const data = await res.json();
            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
            ));
            return data.comment;
        } else {
            throw new Error('Failed to add comment');
        }
    };

    // Fetch comments for a post
    const handleFetchComments = async (postId) => {
        const token = localStorage.getItem('metra_token');
        const res = await fetch(`${API_URL}/social/posts/${postId}/comments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            return data.comments || [];
        }
        return [];
    };

    // Load more posts
    const loadMore = () => {
        if (hasMore && !loading) {
            fetchFeed(currentPage + 1, true);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-300">
            <Navbar />

            <Toaster
                position="top-center"
                toastOptions={{
                    style: { background: '#1E293B', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
                    success: { iconTheme: { primary: '#06B6D4', secondary: '#fff' } }
                }}
            />

            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6366F1]/10 blur-[160px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#06B6D4]/10 blur-[160px] rounded-full"></div>
            </div>

            <main className="pt-28 pb-20 px-4 max-w-2xl mx-auto relative z-10">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-widest mb-2">SOULSYNC</h1>
                    <p className="text-slate-400 text-sm">Berbagi perjalanan & insight spiritual</p>
                </div>

                {/* Create Post Input */}
                <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-4 mb-8 focus-within:border-[#6366F1]/50 transition-colors">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] p-[2px] shrink-0">
                            <div className="w-full h-full rounded-full bg-[#1E293B] flex items-center justify-center overflow-hidden">
                                {user?.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={20} className="text-white" />
                                )}
                            </div>
                        </div>
                        <div className="flex-1">
                            <textarea
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                placeholder="Apa yang kamu rasakan hari ini?"
                                className="w-full bg-transparent border-none text-white text-sm placeholder:text-slate-500 focus:outline-none resize-none min-h-[40px] py-2"
                                maxLength={2000}
                            />
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                                <div className="flex gap-2">
                                    <span className="text-xs text-slate-500">{newPostContent.length}/2000</span>
                                </div>
                                <button
                                    onClick={handleCreatePost}
                                    disabled={creatingPost || !newPostContent.trim()}
                                    className="bg-[#6366F1] hover:bg-[#4F46E5] text-white p-2 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {creatingPost ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feed */}
                {loading && posts.length === 0 ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-[#6366F1]" size={32} />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-12 bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-3xl">
                        <Sparkles className="mx-auto text-[#6366F1] mb-4" size={40} />
                        <p className="text-white font-bold mb-2">Belum ada post</p>
                        <p className="text-slate-400 text-sm">Jadilah yang pertama berbagi insight!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {posts.map(post => (
                            <SocialPostCard
                                key={post.id}
                                post={post}
                                onViewInsight={(content) => setSelectedInsight(content)}
                                onVisitProfile={(identifier) => navigate(`/social/profile/${identifier}`)}
                                onLike={handleLike}
                                onComment={handleComment}
                                onFetchComments={handleFetchComments}
                            />
                        ))}

                        {hasMore && (
                            <button
                                onClick={loadMore}
                                disabled={loading}
                                className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                {loading ? 'Memuat...' : 'Muat Lebih Banyak'}
                            </button>
                        )}
                    </div>
                )}

                <InsightModal
                    isOpen={!!selectedInsight}
                    onClose={() => setSelectedInsight(null)}
                    insight={selectedInsight}
                />

                {showUsernameModal && (
                    <UsernameModal
                        onSuccess={handleUsernameSuccess}
                        onClose={() => { /* Prevent closing without setting */ }}
                    />
                )}
            </main>
        </div>
    );
};

export default SocialPage;
