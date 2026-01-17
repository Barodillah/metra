import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Menu, X, Crown, Bell, Settings, LogOut, User as UserIcon, Users, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isSocialPage = location.pathname.startsWith('/social');
    const [menuOpen, setMenuOpen] = React.useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
            setMenuOpen(false);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const [showNotifications, setShowNotifications] = React.useState(false);
    const [showProfileMenu, setShowProfileMenu] = React.useState(false);
    const [notifications, setNotifications] = React.useState([]);

    const fetchNotifications = React.useCallback(async () => {
        try {
            const token = localStorage.getItem('metra_token');
            if (!token) return;

            const res = await fetch(`${API_URL}/social/notifications?limit=10`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    }, []);

    React.useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
            // Poll for new notifications every minute
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, fetchNotifications]);

    // Refresh notifications when menu is opened
    React.useEffect(() => {
        if (showNotifications && isAuthenticated) {
            fetchNotifications();
        }
    }, [showNotifications, isAuthenticated, fetchNotifications]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleNotificationClick = async (notif) => {
        // Mark as read
        if (!notif.read) {
            try {
                const token = localStorage.getItem('metra_token');
                await fetch(`${API_URL}/social/notifications/${notif.id}/read`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
            } catch (e) {
                console.error("Failed to mark read", e);
            }
        }

        // Navigate
        if (notif.type === 'follow') {
            navigate(`/social/profile/${notif.actor.username}`);
        } else if (notif.type === 'like' || notif.type === 'comment') {
            navigate(`/social/post/${notif.reference_id}`);
        }
        setShowNotifications(false);
    };

    // Censor name helper
    const censorName = (name, isFollowing) => {
        if (isFollowing) return name;
        if (!name || name.length <= 2) return '***';

        const parts = name.split(' ');
        return parts.map(part => {
            if (part.length <= 2) return part[0] + '*';
            return part[0] + '*'.repeat(part.length - 2) + part[part.length - 1];
        }).join(' ');
    };

    const getNotificationText = (notif) => {
        const actorName = censorName(notif.actor.name, notif.actor.is_following);
        if (notif.type === 'like') return `${actorName} menyukai postingan Anda`;
        if (notif.type === 'comment') return `${actorName} mengomentari postingan Anda`;
        if (notif.type === 'follow') return `${actorName} mulai mengikuti Anda`;
        return 'Notifikasi baru';
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        // Parse date
        const date = new Date(dateString);

        // MANUAL FIX: Add +7 hours
        date.setHours(date.getHours() + 7);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 0) return 'Baru saja';
        if (diffInSeconds < 60) return `${Math.max(0, diffInSeconds)}d lalu`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m lalu`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}j lalu`;

        // Show absolute date in WIB for > 24h
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            timeZone: 'Asia/Jakarta'
        });
    };

    return (
        <nav className="fixed top-0 w-full z-50 bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo - Hidden on mobile if authenticated */}
                <Link to="/" className={`flex items-center gap-2 ${isAuthenticated ? 'hidden md:flex' : 'flex'}`}>
                    <div className="w-10 h-10 bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] rounded-2xl flex items-center justify-center shadow-lg shadow-[#6366F1]/20">
                        <Sparkles className="text-white" size={22} />
                    </div>
                    <span className="text-2xl font-black tracking-tighter text-white ml-2">METRA</span>
                </Link>

                {/* Context Switcher - Visible ONLY on mobile AND authenticated (Replaces Logo) */}
                {isAuthenticated && (
                    <Link
                        to={isSocialPage ? "/dashboard" : "/social"}
                        className="md:hidden text-lg font-black text-white uppercase tracking-wider flex items-center gap-2 animate-fade-in"
                    >
                        {isSocialPage ? (
                            <>
                                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <Sparkles size={20} className="text-[#6366F1]" />
                                </div>
                                <span>Dashboard</span>
                            </>
                        ) : (
                            <>
                                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <Users size={20} className="text-[#6366F1]" />
                                </div>
                                <span>SoulSync</span>
                            </>
                        )}
                    </Link>
                )}

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-10 text-sm font-bold text-slate-400">
                    {!isAuthenticated && (
                        <>
                            <a href="/#fitur" className="hover:text-white transition-colors uppercase tracking-widest text-[11px]">Metodologi</a>
                            <a href="/#pricing" className="hover:text-white transition-colors uppercase tracking-widest text-[11px]">Pricing</a>
                        </>
                    )}

                    {isAuthenticated ? (
                        <div className="flex items-center gap-6">
                            {/* Context Switcher (Dashboard <-> SoulSync) */}
                            <Link
                                to={isSocialPage ? "/dashboard" : "/social"}
                                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
                            >
                                <div className="p-1.5 rounded-lg bg-[#6366F1]/10 text-[#6366F1] group-hover:bg-[#6366F1] group-hover:text-white transition-all">
                                    {isSocialPage ? <Sparkles size={18} /> : <Users size={18} />}
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider hidden lg:block">
                                    {isSocialPage ? 'Dashboard' : 'SoulSync'}
                                </span>
                            </Link>

                            {/* Notification Bell */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="relative p-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    <Bell size={20} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                    )}
                                </button>

                                {/* Notification Dropdown */}
                                {showNotifications && (
                                    <div className="absolute right-0 top-full mt-4 w-80 bg-[#1E293B] border border-white/10 rounded-2xl shadow-xl overflow-hidden animate-fade-in-up z-50">
                                        <div className="p-4 border-b border-white/5 flex justify-between items-center">
                                            <h3 className="font-bold text-white text-sm">Notifikasi</h3>
                                            <span className="text-[10px] bg-[#6366F1]/20 text-[#6366F1] px-2 py-0.5 rounded-full font-bold">{unreadCount} Baru</span>
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto">
                                            {notifications.length > 0 ? (
                                                notifications.map(notif => (
                                                    <div
                                                        key={notif.id}
                                                        onClick={() => handleNotificationClick(notif)}
                                                        className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!notif.read ? 'bg-[#6366F1]/5' : ''}`}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                                                                {notif.actor.avatar ? (
                                                                    <img src={notif.actor.avatar} alt={notif.actor.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <UserIcon size={16} className="text-slate-400 m-auto mt-1.5" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-slate-300 mb-1 leading-tight">{getNotificationText(notif)}</p>
                                                                <p className="text-[10px] text-slate-500">{formatTime(notif.created_at)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center text-slate-500 text-xs">
                                                    Belum ada notifikasi
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User Profile Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="flex items-center gap-3 pl-3 pr-1 py-1.5 rounded-full hover:bg-white/5 transition-all border border-transparent hover:border-white/10 group"
                                >
                                    <span className="text-xs font-bold text-white hidden sm:block group-hover:text-blue-200 transition-colors">
                                        {user?.name?.split(' ')[0]}
                                    </span>
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] p-[1.5px] shadow-lg shadow-[#6366F1]/20">
                                        <div className="w-full h-full rounded-full bg-[#0F172A] overflow-hidden">
                                            {user?.avatar_url || user?.avatar ? (
                                                <img
                                                    src={user?.avatar_url || user?.avatar}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white">
                                                    <UserIcon size={16} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ${showProfileMenu ? 'rotate-180 text-white' : ''}`} />
                                </button>

                                {/* Profile Menu */}
                                {showProfileMenu && (
                                    <div className="absolute right-0 top-full mt-4 w-64 bg-[#1E293B] border border-white/10 rounded-2xl shadow-xl overflow-hidden animate-fade-in-up z-50 ring-1 ring-black/5">
                                        <div className="p-5 border-b border-white/5 bg-white/5">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] p-[1.5px]">
                                                    <div className="w-full h-full rounded-full bg-[#0F172A] overflow-hidden">
                                                        {user?.avatar_url || user?.avatar ? (
                                                            <img
                                                                src={user?.avatar_url || user?.avatar}
                                                                alt="Profile"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-white">
                                                                <UserIcon size={20} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-sm truncate max-w-[140px]">{user?.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <Crown size={12} className={
                                                            user?.role === 'admin' ? 'text-amber-400' :
                                                                user?.plan_type === 'visionary' ? 'text-amber-400' :
                                                                    user?.plan_type === 'pro' ? 'text-[#06B6D4]' :
                                                                        'text-slate-400'
                                                        } />
                                                        <p className={`text-[10px] font-medium uppercase tracking-wider ${user?.role === 'admin' ? 'text-amber-400' :
                                                            user?.plan_type === 'visionary' ? 'text-amber-400' :
                                                                user?.plan_type === 'pro' ? 'text-[#06B6D4]' :
                                                                    'text-slate-400'
                                                            }`}>
                                                            {user?.role === 'admin' ? 'Admin' : user?.plan_type || 'Free Member'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-2 space-y-1">
                                            {user?.role === 'admin' && (
                                                <Link to="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-amber-400 hover:bg-amber-400/10 transition-colors text-xs font-bold">
                                                    <Crown size={16} />
                                                    Admin Dashboard
                                                </Link>
                                            )}
                                            <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-xs font-medium group">
                                                <UserIcon size={16} className="text-slate-500 group-hover:text-[#6366F1]" />
                                                Lihat Profil
                                            </Link>
                                            <Link to="/profile/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-xs font-medium group">
                                                <Settings size={16} className="text-slate-500 group-hover:text-[#06B6D4]" />
                                                Pengaturan Profil
                                            </Link>
                                        </div>

                                        <div className="p-2 border-t border-white/5">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors text-xs font-medium"
                                            >
                                                <LogOut size={16} />
                                                Keluar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-2.5 rounded-full transition-all text-white font-bold text-xs uppercase tracking-widest"
                        >
                            Masuk
                        </Link>
                    )}
                </div>

                {/* Mobile Nav & Menu Button */}
                <div className="md:hidden flex items-center gap-4">
                    {isAuthenticated ? (
                        <>
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="relative text-slate-400 hover:text-white transition-colors"
                                >
                                    <Bell size={20} />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                    )}
                                </button>
                                {/* Mobile Notification Dropdown */}
                                {showNotifications && (
                                    <div className="absolute right-0 top-full mt-4 w-72 bg-[#1E293B] border border-white/10 rounded-2xl shadow-xl overflow-hidden animate-fade-in-up z-50">
                                        <div className="p-4 border-b border-white/5 flex justify-between items-center">
                                            <h3 className="font-bold text-white text-sm">Notifikasi</h3>
                                            <span className="text-[10px] bg-[#6366F1]/20 text-[#6366F1] px-2 py-0.5 rounded-full font-bold">{unreadCount} Baru</span>
                                        </div>
                                        <div className="max-h-[250px] overflow-y-auto">
                                            {notifications.length > 0 ? (
                                                notifications.map(notif => (
                                                    <div
                                                        key={notif.id}
                                                        onClick={() => handleNotificationClick(notif)}
                                                        className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!notif.read ? 'bg-[#6366F1]/5' : ''}`}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                                                                {notif.actor.avatar ? (
                                                                    <img src={notif.actor.avatar} alt={notif.actor.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <UserIcon size={16} className="text-slate-400 m-auto mt-1.5" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-slate-300 mb-1 leading-tight">{getNotificationText(notif)}</p>
                                                                <p className="text-[10px] text-slate-500">{formatTime(notif.created_at)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center text-slate-500 text-xs">
                                                    Belum ada notifikasi
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] p-[1.5px]"
                                >
                                    <div className="w-full h-full rounded-full bg-[#0F172A] overflow-hidden">
                                        {user?.avatar_url || user?.avatar ? (
                                            <img
                                                src={user?.avatar_url || user?.avatar}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white">
                                                <UserIcon size={14} />
                                            </div>
                                        )}
                                    </div>
                                </button>
                                {/* Mobile Profile Menu */}
                                {showProfileMenu && (
                                    <div className="absolute right-0 top-full mt-4 w-64 bg-[#1E293B] border border-white/10 rounded-2xl shadow-xl overflow-hidden animate-fade-in-up z-50 ring-1 ring-black/5">
                                        <div className="p-5 border-b border-white/5 bg-white/5">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] p-[1.5px]">
                                                    <div className="w-full h-full rounded-full bg-[#0F172A] overflow-hidden">
                                                        {user?.avatar_url || user?.avatar ? (
                                                            <img
                                                                src={user?.avatar_url || user?.avatar}
                                                                alt="Profile"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-white">
                                                                <UserIcon size={20} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-sm truncate max-w-[140px]">{user?.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <Crown size={12} className={
                                                            user?.role === 'admin' ? 'text-amber-400' :
                                                                user?.plan_type === 'visionary' ? 'text-amber-400' :
                                                                    user?.plan_type === 'pro' ? 'text-[#06B6D4]' :
                                                                        'text-slate-400'
                                                        } />
                                                        <p className={`text-[10px] font-medium uppercase tracking-wider ${user?.role === 'admin' ? 'text-amber-400' :
                                                            user?.plan_type === 'visionary' ? 'text-amber-400' :
                                                                user?.plan_type === 'pro' ? 'text-[#06B6D4]' :
                                                                    'text-slate-400'
                                                            }`}>
                                                            {user?.role === 'admin' ? 'Admin' : user?.plan_type || 'Free Member'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-2 space-y-1">
                                            {user?.role === 'admin' && (
                                                <Link to="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-amber-400 hover:bg-amber-400/10 transition-colors text-xs font-bold">
                                                    <Crown size={16} />
                                                    Admin Dashboard
                                                </Link>
                                            )}
                                            <Link to="/profile/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-xs font-medium group">
                                                <Settings size={16} className="text-slate-500 group-hover:text-[#06B6D4]" />
                                                Pengaturan Profil
                                            </Link>
                                        </div>

                                        <div className="p-2 border-t border-white/5">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors text-xs font-medium"
                                            >
                                                <LogOut size={16} />
                                                Keluar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <button
                            className="text-white p-2"
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            {menuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="md:hidden bg-[#0F172A]/95 backdrop-blur-xl border-t border-white/5 p-6 space-y-4 animate-fade-in">
                    {!isAuthenticated && (
                        <>
                            <a
                                href="/#fitur"
                                className="block text-slate-400 hover:text-white transition-colors uppercase tracking-widest text-[11px] font-bold py-2"
                                onClick={() => setMenuOpen(false)}
                            >
                                Metodologi
                            </a>
                            <a
                                href="/#pricing"
                                className="block text-slate-400 hover:text-white transition-colors uppercase tracking-widest text-[11px] font-bold py-2"
                                onClick={() => setMenuOpen(false)}
                            >
                                Pricing
                            </a>
                        </>
                    )}

                    {isAuthenticated ? (
                        <>
                            {user?.role === 'admin' && (
                                <Link
                                    to="/admin"
                                    className="flex items-center justify-center gap-2 text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-widest text-[11px] font-bold py-2"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <Crown size={14} />
                                    Admin Dashboard
                                </Link>
                            )}
                            <Link
                                to="/dashboard"
                                className="block bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-full transition-all text-white font-bold text-xs uppercase tracking-widest text-center"
                                onClick={() => setMenuOpen(false)}
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/profile"
                                className="block bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-full transition-all text-white font-bold text-xs uppercase tracking-widest text-center"
                                onClick={() => setMenuOpen(false)}
                            >
                                Profil Saya
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="block w-full text-slate-400 hover:text-white transition-colors uppercase tracking-widest text-[11px] font-bold py-2 text-center"
                            >
                                Keluar
                            </button>
                        </>
                    ) : (
                        <Link
                            to="/login"
                            className="block bg-gradient-to-r from-[#6366F1] to-[#06B6D4] px-6 py-3 rounded-full transition-all text-white font-bold text-xs uppercase tracking-widest text-center"
                            onClick={() => setMenuOpen(false)}
                        >
                            Masuk
                        </Link>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
