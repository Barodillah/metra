import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SocialPostCard from '../components/SocialPostCard';
import InsightModal from '../components/InsightModal';
import toast, { Toaster } from 'react-hot-toast';
import { Loader2, ArrowLeft, X, Sparkles, Calendar, Quote } from 'lucide-react';
import { formatMessage } from '../utils/chat';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Reusing InsightModal (ideally this should be a shared component)
// InsightModal moved to src/components/InsightModal.jsx

const SocialPostPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedInsight, setSelectedInsight] = useState(null);

    const fetchPost = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('metra_token');
            const res = await fetch(`${API_URL}/social/posts/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setPost(data);
            } else {
                toast.error('Post tidak ditemukan');
                navigate('/social');
            }
        } catch (error) {
            console.error('Failed to fetch post:', error);
            toast.error('Gagal memuat post');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchPost();
    }, [fetchPost]);

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
            setPost(prev => ({
                ...prev,
                comments_count: (prev.comments_count || 0) + 1
            }));
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

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#6366F1]" size={32} />
            </div>
        );
    }

    if (!post) return null;

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-300">
            <Navbar />
            <Toaster position="top-center" />

            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6366F1]/10 blur-[160px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#06B6D4]/10 blur-[160px] rounded-full"></div>
            </div>

            <main className="pt-28 pb-20 px-4 max-w-2xl mx-auto relative z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft size={20} />
                    <span className="font-bold text-sm">Kembali</span>
                </button>

                <SocialPostCard
                    post={post}
                    onViewInsight={(content) => setSelectedInsight(content)}
                    onVisitProfile={(identifier) => navigate(`/social/profile/${identifier}`)}
                    onLike={handleLike}
                    onComment={handleComment}
                    onFetchComments={handleFetchComments}
                    defaultExpanded={true}
                />

                <InsightModal
                    isOpen={!!selectedInsight}
                    onClose={() => setSelectedInsight(null)}
                    insight={selectedInsight}
                />
            </main>
        </div>
    );
};

export default SocialPostPage;
