import React, { useState } from 'react';
import {
    Heart,
    MessageCircle,
    Share2,
    MoreHorizontal,
    User,
    Sparkles,
    Bookmark,
    Crown,
    Zap,
    Send,
    EyeOff,
    Flag,
    Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatMessage } from '../utils/chat';

// Censor name - show only first and last character
const censorName = (name, isFollowing, isOwnPost) => {
    if (isFollowing || isOwnPost) return name;
    if (!name || name.length <= 2) return '***';

    const parts = name.split(' ');
    return parts.map(part => {
        if (part.length <= 2) return part[0] + '*';
        return part[0] + '*'.repeat(part.length - 2) + part[part.length - 1];
    }).join(' ');
};

// Get plan badge color
const getPlanBadgeColor = (plan) => {
    switch (plan) {
        case 'visionary': return 'text-amber-400';
        case 'pro': return 'text-[#06B6D4]';
        default: return 'text-slate-400';
    }
};

// Helper to format time (Relative < 24h, Absolute Date+Time > 24h)
// Helper to format time (Relative < 24h, Absolute Date+Time > 24h)
const formatPostTime = (dateString) => {
    if (!dateString) return '';

    // Parse timestamp (assume DB sends UTC but browser parses as Local)
    const date = new Date(dateString);

    // MANUAL FIX: Add +7 hours to convert DB UTC to WIB
    date.setHours(date.getHours() + 7);

    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    // Future handling (if slight clock skew)
    if (diffInSeconds < 0) return 'Baru saja';

    // Just now (< 1 minute)
    if (diffInSeconds < 60) {
        return 'Baru saja';
    }

    // Minutes (< 1 hour)
    if (diffInSeconds < 3600) {
        return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    }

    // Hours (< 24 hours)
    if (diffInSeconds < 86400) {
        return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    }

    // Absolute Date+Time in WIB (> 24 hours)
    return date.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
    }) + ' WIB';
};

const SocialPostCard = ({
    post,
    onViewInsight,
    onVisitProfile,
    onLike,
    onComment,
    onFetchComments
}) => {
    const { user } = useAuth();
    const [liked, setLiked] = useState(post.isLiked || false);
    const [likesCount, setLikesCount] = useState(post.likes_count || 0);
    const [bookmarked, setBookmarked] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    // Determine if this is own post or following
    const isOwnPost = user?.id === post.user_id;
    const isFollowing = post.isFollowing || false;
    const shouldCensor = !isFollowing && !isOwnPost;

    // Parse shared payload
    const sharedContent = post.shared_payload ?
        (typeof post.shared_payload === 'string' ? JSON.parse(post.shared_payload) : post.shared_payload)
        : null;

    const isInsightShare = post.post_type === 'insight_share' || post.post_type === 'response_advisor';

    // Fetch comments
    const fetchComments = async () => {
        if (comments.length > 0 || !onFetchComments) return;
        setLoadingComments(true);
        try {
            const fetchedComments = await onFetchComments(post.id);
            setComments(fetchedComments || []);
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleToggleLike = async () => {
        if (!onLike) return;
        const newLiked = !liked;
        setLiked(newLiked);
        setLikesCount(prev => newLiked ? prev + 1 : prev - 1);

        try {
            await onLike(post.id);
        } catch (error) {
            setLiked(!newLiked);
            setLikesCount(prev => newLiked ? prev - 1 : prev + 1);
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || !onComment) return;

        setSubmittingComment(true);
        try {
            const newComment = await onComment(post.id, commentText.trim());
            if (newComment) {
                setComments(prev => [...prev, newComment]);
                setCommentText('');
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleShowComments = () => {
        setShowComments(!showComments);
        if (!showComments) {
            fetchComments();
        }
    };

    // Display name and avatar based on follow status
    const displayName = censorName(post.author_name, isFollowing, isOwnPost);
    const showAvatar = !shouldCensor;

    return (
        <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-6 hover:border-white/20 transition-all">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div
                        onClick={() => onVisitProfile && onVisitProfile(post.author_username || post.user_id)}
                        className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] p-[2px] relative cursor-pointer hover:scale-105 transition-transform"
                    >
                        <div className="w-full h-full rounded-full bg-[#1E293B] flex items-center justify-center overflow-hidden">
                            {showAvatar && post.author_avatar ? (
                                <img src={post.author_avatar} alt={post.author_name} className="w-full h-full object-cover" />
                            ) : (
                                <User size={20} className="text-white" />
                            )}
                        </div>
                        {/* Plan Badge */}
                        {post.author_plan && (
                            <div className="absolute -bottom-1 -right-1 bg-[#1E293B] rounded-full p-0.5">
                                <Crown size={12} className={getPlanBadgeColor(post.author_plan)} fill="currentColor" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4
                                onClick={() => onVisitProfile && onVisitProfile(post.author_username || post.user_id)}
                                className="text-white font-bold text-sm hover:text-[#6366F1] cursor-pointer transition-colors"
                            >
                                {displayName}
                            </h4>
                            {isOwnPost && (
                                <span className="bg-[#6366F1]/20 text-[#6366F1] text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#6366F1]/30">
                                    Kamu
                                </span>
                            )}
                            {!isOwnPost && isFollowing && (
                                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-500/20">
                                    <Zap size={8} fill="currentColor" />
                                    Following
                                </span>
                            )}
                        </div>
                        <p className="text-slate-500 text-xs">
                            {shouldCensor ? '***' : `@${post.author_username}`} • {formatPostTime(post.created_at)}
                        </p>
                    </div>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        <MoreHorizontal size={20} />
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 top-full mt-2 w-32 bg-[#1E293B] border border-white/10 rounded-xl shadow-xl z-10 overflow-hidden animate-fade-in">
                            <button className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                                <EyeOff size={14} />
                                <span>Hide</span>
                            </button>
                            <button className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                                <Flag size={14} />
                                <span>Report</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="mb-4">
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line mb-3">
                    {post.content}
                </p>

                {/* Shared Insight Card - for insight_share and response_advisor */}
                {isInsightShare && sharedContent && (
                    <div
                        onClick={() => onViewInsight && onViewInsight(sharedContent)}
                        className="bg-[#0F172A]/50 rounded-2xl p-4 border border-white/5 relative overflow-hidden group hover:border-[#6366F1]/30 transition-colors cursor-pointer"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#6366F1]"></div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-xl bg-[#6366F1]/10 text-[#6366F1] group-hover:scale-110 transition-transform">
                                <Sparkles size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-bold text-sm mb-1 group-hover:text-[#6366F1] transition-colors">
                                    {sharedContent.title || (post.post_type === 'response_advisor' ? 'Jawaban dari Metra AI Advisor' : 'Insight Harian')}
                                </p>
                                <p className="text-slate-400 text-xs line-clamp-2">
                                    {sharedContent.content?.substring(0, 150) || sharedContent.description?.substring(0, 150)}...
                                </p>
                                <p className="text-[10px] text-slate-500 mt-2 font-medium uppercase tracking-wider">
                                    {sharedContent.source || (post.post_type === 'response_advisor' ? 'Metra AI Advisor' : 'Metra Insight')} • Ketuk untuk melihat detail
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                <button
                    onClick={handleToggleLike}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors ${liked ? 'text-pink-500' : 'text-slate-400 hover:text-pink-500'}`}
                >
                    <Heart size={18} fill={liked ? "currentColor" : "none"} />
                    <span>{likesCount}</span>
                </button>
                <button
                    className="flex items-center gap-2 text-slate-400 hover:text-[#6366F1] text-sm font-medium transition-colors"
                    onClick={handleShowComments}
                >
                    <MessageCircle size={18} />
                    <span>{post.comments_count || 0}</span>
                </button>
                <button className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors">
                    <Share2 size={18} />
                    <span>Share</span>
                </button>
                <div className="flex-1"></div>
                <button
                    onClick={() => setBookmarked(!bookmarked)}
                    className={`flex items-center gap-2 transition-colors ${bookmarked ? 'text-amber-400' : 'text-slate-400 hover:text-white'}`}
                >
                    <Bookmark size={18} fill={bookmarked ? "currentColor" : "none"} />
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in">
                    {loadingComments ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="animate-spin text-slate-500" size={20} />
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4 mb-4">
                                {comments.map(comment => {
                                    const isOwnComment = user?.id === comment.user_id;
                                    const shouldCensorComment = !comment.isFollowing && !isOwnComment;

                                    return (
                                        <div key={comment.id} className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 shrink-0 overflow-hidden">
                                                {!shouldCensorComment && comment.author_avatar ? (
                                                    <img src={comment.author_avatar} alt={comment.author_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                                                        <User size={14} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="bg-[#0F172A]/50 rounded-2xl rounded-tl-none p-3 border border-white/5">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-white text-xs font-bold">
                                                            {censorName(comment.author_name, comment.isFollowing, isOwnComment)}
                                                        </span>
                                                        <span className="text-slate-500 text-[10px]">
                                                            {formatPostTime(comment.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-300 text-xs leading-relaxed">{comment.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {comments.length === 0 && (
                                    <p className="text-slate-500 text-xs text-center py-2">Belum ada komentar</p>
                                )}
                            </div>

                            {/* Add Comment Input */}
                            <form onSubmit={handleSubmitComment} className="flex gap-3 items-center">
                                <div className="w-8 h-8 rounded-full bg-slate-700 shrink-0 overflow-hidden">
                                    {user?.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                                            <User size={14} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Tulis komentar..."
                                        className="w-full bg-[#0F172A]/50 border border-white/5 rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:border-[#6366F1]/50 placeholder:text-slate-500 pr-10"
                                        disabled={submittingComment}
                                    />
                                    <button
                                        type="submit"
                                        disabled={submittingComment || !commentText.trim()}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6366F1] hover:text-[#4F46E5] p-1 disabled:opacity-50"
                                    >
                                        {submittingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default SocialPostCard;
