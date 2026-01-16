import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    MessageSquare,
    Crown,
    TrendingUp,
    Clock,
    Activity,
    DollarSign,
    BarChart3,
    PieChart as PieChartIcon,
    RefreshCw,
    UserPlus,
    Zap,
    Globe,
    ChevronRight,
    Search,
    Filter,
    Lightbulb,
    Send,
    Loader2,
    Trash2,
    X,
    User,
    Bot
} from 'lucide-react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { toWIB } from '../utils/dateTime';
import { formatMessage } from '../utils/chat';

// Stat Card Component
const StatCard = ({ title, value, subValue, icon: Icon, trend, glowColor, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl hover:border-white/20 transition-all group overflow-hidden relative hover:translate-y-[-4px] ${onClick ? 'cursor-pointer' : ''}`}
    >
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-[40px] opacity-10 group-hover:opacity-20 transition-all" style={{ backgroundColor: glowColor }}></div>
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-white/5" style={{ color: glowColor }}>
                <Icon size={22} />
            </div>
            {trend !== undefined && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {trend >= 0 ? '+' : ''}{trend}%
                </span>
            )}
        </div>
        <h3 className="text-slate-400 text-sm font-semibold mb-1 relative z-10">{title}</h3>
        <div className="flex flex-col relative z-10">
            <span className="text-2xl font-bold text-white tracking-tight">
                {value}
            </span>
            {subValue && <span className="text-xs text-slate-500 mt-1 font-medium">{subValue}</span>}
        </div>
    </div>
);

// Chart Colors
const COLORS = {
    primary: '#6366F1',
    secondary: '#06B6D4',
    accent: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    pro: '#6366F1',
    visionary: '#F59E0B',
    free: '#64748B'
};

const PIE_COLORS = ['#6366F1', '#06B6D4', '#F59E0B'];

const AdminDashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [engagement, setEngagement] = useState(null);
    const [aiMetrics, setAiMetrics] = useState(null);
    const [revenue, setRevenue] = useState(null);
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // Brainstorm state
    const [brainstormMessages, setBrainstormMessages] = useState([]);
    const [brainstormInput, setBrainstormInput] = useState('');
    const [brainstormLoading, setBrainstormLoading] = useState(false);

    // Session Chat History Modal state
    const [selectedSession, setSelectedSession] = useState(null);
    const [sessionMessages, setSessionMessages] = useState([]);
    const [sessionModalOpen, setSessionModalOpen] = useState(false);
    const [sessionLoading, setSessionLoading] = useState(false);

    // Fetch session messages
    const fetchSessionMessages = async (sessionId) => {
        setSessionLoading(true);
        try {
            const token = localStorage.getItem('metra_token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/session/${sessionId}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSelectedSession(data.session);
                setSessionMessages(data.messages);
                setSessionModalOpen(true);
            }
        } catch (error) {
            console.error('Failed to fetch session messages:', error);
        } finally {
            setSessionLoading(false);
        }
    };

    // Check admin role
    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const fetchData = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        try {
            const token = localStorage.getItem('metra_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [statsRes, engagementRes, aiRes, revenueRes, activityRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/admin/stats`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/admin/engagement`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/admin/ai-metrics`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/admin/revenue`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/admin/activity`, { headers })
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (engagementRes.ok) setEngagement(await engagementRes.json());
            if (aiRes.ok) setAiMetrics(await aiRes.json());
            if (revenueRes.ok) setRevenue(await revenueRes.json());
            if (activityRes.ok) setActivity(await activityRes.json());
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchData();
        }
    }, [user]);

    // Load brainstorm history on mount
    const loadBrainstormHistory = async () => {
        try {
            const token = localStorage.getItem('metra_token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/brainstorm`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setBrainstormMessages(data.messages.map(m => ({
                    role: m.role,
                    content: m.content
                })));
            }
        } catch (error) {
            console.error('Failed to load brainstorm history:', error);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin' && activeTab === 'brainstorm') {
            loadBrainstormHistory();
        }
    }, [user, activeTab]);

    // Format number with K/M suffix
    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    };

    // Format currency (IDR)
    const formatCurrency = (num) => {
        if (num >= 1000000) return 'Rp ' + (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return 'Rp ' + (num / 1000).toFixed(0) + 'K';
        return 'Rp ' + (num || 0);
    };

    // Format duration
    const formatDuration = (seconds) => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
        return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    };

    // Prepare chart data
    const planDistributionData = stats ? [
        { name: 'Free', value: stats.plans.free || 0, color: COLORS.free },
        { name: 'Pro', value: stats.plans.pro || 0, color: COLORS.pro },
        { name: 'Visionary', value: stats.plans.visionary || 0, color: COLORS.visionary }
    ].filter(d => d.value > 0) : [];

    const userGrowthData = engagement?.cumulative_users?.map(d => ({
        date: toWIB(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        users: d.total_users
    })) || [];

    const sessionsPerDayData = engagement?.sessions_per_day?.map(d => ({
        date: toWIB(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        sessions: d.sessions
    })) || [];

    const messagesPerDayData = engagement?.messages_per_day?.map(d => ({
        date: toWIB(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        user: d.user_messages,
        ai: d.ai_messages
    })) || [];

    const peakHoursData = engagement?.peak_hours?.map(d => ({
        hour: `${String(d.hour).padStart(2, '0')}:00`,
        messages: d.message_count
    })) || [];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-sm">Memuat data admin...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-300">
            <Navbar />

            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6366F1]/10 blur-[160px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#06B6D4]/10 blur-[160px] rounded-full"></div>
            </div>

            <main className="pt-28 pb-16 px-6 max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            <Crown className="text-amber-400" size={32} />
                            Admin Dashboard
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Overview lengkap platform METRA
                        </p>
                    </div>
                    <button
                        onClick={() => fetchData(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 bg-[#1E293B] hover:bg-[#2D3B4F] border border-white/10 px-4 py-2 rounded-xl transition-all text-sm font-medium disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                        {refreshing ? 'Memuat...' : 'Refresh'}
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    {[
                        { id: 'overview', label: 'Overview', icon: BarChart3 },
                        { id: 'users', label: 'Users', icon: Users },
                        { id: 'engagement', label: 'Engagement', icon: Activity },
                        { id: 'revenue', label: 'Revenue', icon: DollarSign },
                        { id: 'brainstorm', label: 'Brainstorm', icon: Lightbulb }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-[#6366F1] text-white'
                                : 'bg-[#1E293B]/60 text-slate-400 hover:text-white hover:bg-[#1E293B]'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard
                                title="Total Users"
                                value={formatNumber(stats?.users?.total)}
                                subValue={`+${stats?.users?.new_today || 0} hari ini`}
                                icon={Users}
                                glowColor={COLORS.primary}
                            />
                            <StatCard
                                title="Paid Users"
                                value={formatNumber((stats?.plans?.pro || 0) + (stats?.plans?.visionary || 0))}
                                subValue={`${revenue?.conversion_rate || 0}% conversion`}
                                icon={Crown}
                                glowColor={COLORS.warning}
                            />
                            <StatCard
                                title="Chat Sessions"
                                value={formatNumber(stats?.chat?.total_sessions)}
                                subValue={`${formatNumber(stats?.chat?.total_messages)} messages`}
                                icon={MessageSquare}
                                glowColor={COLORS.secondary}
                            />
                            <StatCard
                                title="Avg AI Response"
                                value={`${aiMetrics?.avg_response_time_seconds || 0}s`}
                                subValue={`${aiMetrics?.avg_messages_per_session || 0} msg/session`}
                                icon={Zap}
                                glowColor={COLORS.accent}
                            />
                        </div>

                        {/* Charts Row 1 */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            {/* User Growth */}
                            <div className="lg:col-span-2 bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-white font-bold text-lg">User Growth</h3>
                                        <p className="text-slate-400 text-xs">30 hari terakhir</p>
                                    </div>
                                    <TrendingUp className="text-emerald-400" size={20} />
                                </div>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={userGrowthData}>
                                            <defs>
                                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} />
                                            <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                labelStyle={{ color: '#fff' }}
                                            />
                                            <Area type="monotone" dataKey="users" stroke={COLORS.primary} fillOpacity={1} fill="url(#colorUsers)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Plan Distribution */}
                            <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-white font-bold text-lg">Plan Distribution</h3>
                                        <p className="text-slate-400 text-xs">User berdasarkan plan</p>
                                    </div>
                                    <PieChartIcon className="text-[#06B6D4]" size={20} />
                                </div>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={planDistributionData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={70}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {planDistributionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-4 mt-2">
                                    {planDistributionData.map((entry, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                            <span className="text-xs text-slate-400">{entry.name}: {entry.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Charts Row 2 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Daily Sessions */}
                            <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-white font-bold text-lg">Daily Chat Sessions</h3>
                                        <p className="text-slate-400 text-xs">30 hari terakhir</p>
                                    </div>
                                    <MessageSquare className="text-[#06B6D4]" size={20} />
                                </div>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={sessionsPerDayData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} />
                                            <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                            />
                                            <Bar dataKey="sessions" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Messages by Type */}
                            <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-white font-bold text-lg">Messages Volume</h3>
                                        <p className="text-slate-400 text-xs">User vs AI messages</p>
                                    </div>
                                    <Activity className="text-emerald-400" size={20} />
                                </div>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={messagesPerDayData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} />
                                            <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                                            <Area type="monotone" dataKey="user" stackId="1" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.5} name="User" />
                                            <Area type="monotone" dataKey="ai" stackId="1" stroke={COLORS.accent} fill={COLORS.accent} fillOpacity={0.5} name="AI" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Peak Hours */}
                        <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-white font-bold text-lg">Peak Usage Hours</h3>
                                    <p className="text-slate-400 text-xs">Aktivitas per jam (7 hari terakhir)</p>
                                </div>
                                <Clock className="text-amber-400" size={20} />
                            </div>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={peakHoursData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="hour" tick={{ fill: '#64748B', fontSize: 10 }} />
                                        <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        />
                                        <Bar dataKey="messages" fill={COLORS.warning} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Users */}
                            <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-white font-bold">Recent Users</h3>
                                    <UserPlus className="text-emerald-400" size={18} />
                                </div>
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {activity?.recent_users?.slice(0, 8).map((u, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors">
                                            {u.avatar_url ? (
                                                <img src={u.avatar_url} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                    {u.name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-medium text-sm truncate">{u.name || 'No Name'}</p>
                                                <p className="text-slate-500 text-xs truncate">{u.email}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${u.plan_type === 'visionary' ? 'bg-amber-500/20 text-amber-400' :
                                                    u.plan_type === 'pro' ? 'bg-indigo-500/20 text-indigo-400' :
                                                        'bg-slate-500/20 text-slate-400'
                                                    }`}>
                                                    {u.plan_type?.toUpperCase()}
                                                </span>
                                                <p className="text-slate-500 text-[10px] mt-1">
                                                    {toWIB(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Sessions */}
                            <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-white font-bold">Recent Chat Sessions</h3>
                                    <MessageSquare className="text-[#06B6D4]" size={18} />
                                </div>
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {activity?.recent_sessions?.slice(0, 8).map((s, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => fetchSessionMessages(s.id)}
                                            className="p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-white font-medium text-sm truncate">{s.user_name || 'Guest'}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-500 text-[10px]">
                                                        {toWIB(s.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <ChevronRight size={14} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                            <p className="text-slate-400 text-xs line-clamp-1 mb-2">{s.summary || 'No summary'}</p>
                                            <div className="flex items-center gap-3 text-[10px]">
                                                <span className="text-slate-500">{s.message_count} messages</span>
                                                {s.duration_seconds > 0 && (
                                                    <span className="text-slate-500">• {formatDuration(s.duration_seconds)}</span>
                                                )}
                                                {s.ended_at && (
                                                    <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Completed</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="space-y-6">
                        {/* User Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                title="Total Users"
                                value={formatNumber(stats?.users?.total)}
                                subValue="All registered users"
                                icon={Users}
                                glowColor={COLORS.primary}
                            />
                            <StatCard
                                title="New Today"
                                value={stats?.users?.new_today || 0}
                                subValue="Registrations today"
                                icon={UserPlus}
                                glowColor={COLORS.success}
                            />
                            <StatCard
                                title="Active Today"
                                value={stats?.users?.active_today || 0}
                                subValue="Users who chatted"
                                icon={Activity}
                                glowColor={COLORS.secondary}
                            />
                            <StatCard
                                title="Google Users"
                                value={stats?.auth_methods?.google || 0}
                                subValue={`${stats?.auth_methods?.email || 0} email users`}
                                icon={Globe}
                                glowColor={COLORS.accent}
                            />
                        </div>

                        {/* All Users Table */}
                        <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-white font-bold text-lg">All Users</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider py-3 px-4">User</th>
                                            <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider py-3 px-4">Plan</th>
                                            <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider py-3 px-4">Sessions</th>
                                            <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider py-3 px-4">Joined</th>
                                            <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider py-3 px-4">Last Active</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {activity?.recent_users?.map((u, idx) => (
                                            <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        {u.avatar_url ? (
                                                            <img src={u.avatar_url} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-8 h-8 bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] rounded-full flex items-center justify-center text-white font-bold text-xs">
                                                                {u.name?.charAt(0)?.toUpperCase() || '?'}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-white text-sm font-medium">{u.name || 'No Name'}</p>
                                                            <p className="text-slate-500 text-xs">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.plan_type === 'visionary' ? 'bg-amber-500/20 text-amber-400' :
                                                        u.plan_type === 'pro' ? 'bg-indigo-500/20 text-indigo-400' :
                                                            'bg-slate-500/20 text-slate-400'
                                                        }`}>
                                                        {u.plan_type?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-slate-300 text-sm">{u.session_count || 0}</td>
                                                <td className="py-3 px-4 text-slate-400 text-sm">
                                                    {toWIB(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="py-3 px-4 text-slate-500 text-sm">
                                                    {u.last_active
                                                        ? toWIB(u.last_active).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                                                        : '-'
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Engagement Tab */}
                {activeTab === 'engagement' && (
                    <div className="space-y-6">
                        {/* Engagement Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                title="Total Sessions"
                                value={formatNumber(stats?.chat?.total_sessions)}
                                subValue="All time"
                                icon={MessageSquare}
                                glowColor={COLORS.primary}
                            />
                            <StatCard
                                title="Total Messages"
                                value={formatNumber(stats?.chat?.total_messages)}
                                subValue={`${formatNumber(stats?.chat?.ai_messages)} AI responses`}
                                icon={Zap}
                                glowColor={COLORS.accent}
                            />
                            <StatCard
                                title="Avg Session Duration"
                                value={formatDuration(stats?.chat?.avg_duration_seconds || 0)}
                                subValue="Per session"
                                icon={Clock}
                                glowColor={COLORS.warning}
                            />
                            <StatCard
                                title="Avg Messages/Session"
                                value={aiMetrics?.avg_messages_per_session || 0}
                                subValue="Messages per session"
                                icon={Activity}
                                glowColor={COLORS.success}
                            />
                        </div>

                        {/* Daily Active Users Chart */}
                        <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-white font-bold text-lg">Daily Active Users</h3>
                                    <p className="text-slate-400 text-xs">Users yang chat per hari (7 hari)</p>
                                </div>
                                <Users className="text-emerald-400" size={20} />
                            </div>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={engagement?.daily_active_users?.map(d => ({
                                        date: toWIB(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
                                        users: d.active_users
                                    })) || []}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} />
                                        <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        />
                                        <Bar dataKey="users" fill={COLORS.success} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* AI Response Time Distribution */}
                        <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-white font-bold text-lg">AI Response Time Distribution</h3>
                                    <p className="text-slate-400 text-xs">Avg: {aiMetrics?.avg_response_time_seconds || 0} seconds</p>
                                </div>
                                <Zap className="text-amber-400" size={20} />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {aiMetrics?.response_distribution?.map((d, idx) => (
                                    <div key={idx} className="bg-slate-800/50 p-4 rounded-xl text-center">
                                        <p className="text-2xl font-bold text-white">{d.count}</p>
                                        <p className="text-slate-400 text-sm">{d.response_range}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Revenue Tab */}
                {activeTab === 'revenue' && (
                    <div className="space-y-6">
                        {/* Revenue Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                title="Monthly Revenue"
                                value={formatCurrency(revenue?.monthly_recurring_revenue)}
                                subValue="Estimated MRR"
                                icon={DollarSign}
                                glowColor={COLORS.success}
                            />
                            <StatCard
                                title="Paid Users"
                                value={revenue?.paid_users || 0}
                                subValue={`${revenue?.free_users || 0} free users`}
                                icon={Crown}
                                glowColor={COLORS.warning}
                            />
                            <StatCard
                                title="Conversion Rate"
                                value={`${revenue?.conversion_rate || 0}%`}
                                subValue="Free → Paid"
                                icon={TrendingUp}
                                glowColor={COLORS.primary}
                            />
                            <StatCard
                                title="Pro Users"
                                value={stats?.plans?.pro || 0}
                                subValue={`${stats?.plans?.visionary || 0} visionary`}
                                icon={Crown}
                                glowColor={COLORS.pro}
                            />
                        </div>

                        {/* Plan Breakdown */}
                        <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-white font-bold text-lg">Plan Breakdown</h3>
                                <PieChartIcon className="text-[#06B6D4]" size={20} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {revenue?.plan_breakdown?.map((plan, idx) => (
                                    <div key={idx} className="bg-slate-800/50 p-6 rounded-xl text-center">
                                        <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${plan.plan_type === 'visionary' ? 'bg-amber-500/20' :
                                            plan.plan_type === 'pro' ? 'bg-indigo-500/20' :
                                                'bg-slate-500/20'
                                            }`}>
                                            <Crown size={24} className={
                                                plan.plan_type === 'visionary' ? 'text-amber-400' :
                                                    plan.plan_type === 'pro' ? 'text-indigo-400' :
                                                        'text-slate-400'
                                            } />
                                        </div>
                                        <h4 className="text-white font-bold text-lg capitalize">{plan.plan_type}</h4>
                                        <p className="text-3xl font-black text-white my-2">{plan.count}</p>
                                        <p className="text-slate-400 text-sm">{plan.percentage}% of users</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Revenue Estimation Notice */}
                        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                            <p className="text-amber-400 text-sm">
                                <strong>Note:</strong> Revenue data adalah estimasi berdasarkan jumlah user paid.
                                Untuk data revenue aktual, integrasikan dengan payment gateway.
                            </p>
                        </div>
                    </div>
                )}

                {/* Brainstorm Tab */}
                {activeTab === 'brainstorm' && (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-6 rounded-3xl">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
                                        <Lightbulb size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">Brainstorm Mode</h3>
                                        <p className="text-slate-400 text-sm mt-1">
                                            Diskusikan analisis dan pengembangan aplikasi METRA dengan AI.
                                            Semua chat tersimpan di session ID 1.
                                        </p>
                                    </div>
                                </div>
                                {brainstormMessages.length > 0 && (
                                    <button
                                        onClick={async () => {
                                            if (confirm('Hapus semua riwayat brainstorm?')) {
                                                try {
                                                    const token = localStorage.getItem('metra_token');
                                                    await fetch(`${import.meta.env.VITE_API_URL}/admin/brainstorm`, {
                                                        method: 'DELETE',
                                                        headers: { 'Authorization': `Bearer ${token}` }
                                                    });
                                                    setBrainstormMessages([]);
                                                } catch (error) {
                                                    console.error('Failed to clear brainstorm:', error);
                                                }
                                            }
                                        }}
                                        className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                        Hapus Riwayat
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Chat Container */}
                        <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
                            {/* Messages Area */}
                            <div className="h-[500px] overflow-y-auto p-6 space-y-4">
                                {brainstormMessages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                                            <Lightbulb className="text-amber-400" size={32} />
                                        </div>
                                        <h4 className="text-white font-bold text-lg mb-2">Mulai Brainstorming</h4>
                                        <p className="text-slate-400 text-sm max-w-md">
                                            Tanyakan tentang analisis data, ide fitur baru, strategi monetisasi,
                                            peningkatan UX, atau apapun tentang pengembangan METRA.
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-6 justify-center">
                                            {[
                                                'Analisis trend user',
                                                'Ide fitur baru',
                                                'Optimasi conversion',
                                                'Strategi engagement'
                                            ].map((suggestion, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setBrainstormInput(suggestion)}
                                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-sm text-slate-300 transition-colors"
                                                >
                                                    {suggestion}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    brainstormMessages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user'
                                                ? 'bg-[#6366F1] text-white'
                                                : 'bg-slate-800 text-slate-200'
                                                }`}>
                                                {msg.role === 'assistant' && (
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Lightbulb size={14} className="text-amber-400" />
                                                        <span className="text-xs text-amber-400 font-bold">AI Advisor</span>
                                                    </div>
                                                )}
                                                <div className="text-sm leading-relaxed">{formatMessage(msg.content)}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {brainstormLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-slate-800 p-4 rounded-2xl flex items-center gap-3">
                                            <Loader2 className="animate-spin text-amber-400" size={18} />
                                            <span className="text-slate-400 text-sm">AI sedang berpikir...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="border-t border-white/10 p-4">
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (!brainstormInput.trim() || brainstormLoading) return;

                                    const userMessage = brainstormInput.trim();
                                    setBrainstormInput('');
                                    setBrainstormMessages(prev => [...prev, { role: 'user', content: userMessage }]);
                                    setBrainstormLoading(true);

                                    try {
                                        const token = localStorage.getItem('metra_token');

                                        // Build context from current stats
                                        const appContext = `
DATA STATISTIK APLIKASI METRA (Real-time):
- Total Users: ${stats?.users?.total || 0}
- New Users Today: ${stats?.users?.new_today || 0}
- New Users Week: ${stats?.users?.new_week || 0}
- Active Users Today: ${stats?.users?.active_today || 0}
- Plan Distribution: Free=${stats?.plans?.free || 0}, Pro=${stats?.plans?.pro || 0}, Visionary=${stats?.plans?.visionary || 0}
- Total Chat Sessions: ${stats?.chat?.total_sessions || 0}
- Total Messages: ${stats?.chat?.total_messages || 0}
- Avg AI Response Time: ${aiMetrics?.avg_response_time_seconds || 0}s
- Avg Messages/Session: ${aiMetrics?.avg_messages_per_session || 0}
- Conversion Rate: ${revenue?.conversion_rate || 0}%
- Monthly Revenue (Est.): Rp ${revenue?.monthly_recurring_revenue || 0}

FITUR UTAMA METRA:
- AI Spiritual Advisor berbasis Weton, Zodiak, Numerologi, BaZi
- Tier: Free (2 chat/hari), Pro (unlimited), Visionary (GPT-4o)
- Dashboard personalized dengan insight harian
- Google & Email authentication
                                        `;

                                        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/brainstorm`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify({
                                                message: userMessage,
                                                context: appContext,
                                                history: brainstormMessages
                                            })
                                        });

                                        if (response.ok) {
                                            const data = await response.json();
                                            setBrainstormMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
                                        } else {
                                            setBrainstormMessages(prev => [...prev, {
                                                role: 'assistant',
                                                content: 'Maaf, terjadi kesalahan. Silakan coba lagi.'
                                            }]);
                                        }
                                    } catch (error) {
                                        console.error('Brainstorm error:', error);
                                        setBrainstormMessages(prev => [...prev, {
                                            role: 'assistant',
                                            content: 'Gagal terhubung ke server. Pastikan koneksi internet Anda stabil.'
                                        }]);
                                    } finally {
                                        setBrainstormLoading(false);
                                    }
                                }} className="flex gap-3">
                                    <input
                                        type="text"
                                        value={brainstormInput}
                                        onChange={(e) => setBrainstormInput(e.target.value)}
                                        placeholder="Tanya tentang analisis atau ide pengembangan..."
                                        className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#6366F1]/50 transition-colors"
                                        disabled={brainstormLoading}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!brainstormInput.trim() || brainstormLoading}
                                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-6 py-3 rounded-xl text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <Send size={18} />
                                        Kirim
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Quick Stats for Context */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-[#1E293B]/40 border border-white/5 p-4 rounded-xl text-center">
                                <p className="text-2xl font-bold text-white">{formatNumber(stats?.users?.total)}</p>
                                <p className="text-xs text-slate-500">Total Users</p>
                            </div>
                            <div className="bg-[#1E293B]/40 border border-white/5 p-4 rounded-xl text-center">
                                <p className="text-2xl font-bold text-white">{revenue?.conversion_rate || 0}%</p>
                                <p className="text-xs text-slate-500">Conversion</p>
                            </div>
                            <div className="bg-[#1E293B]/40 border border-white/5 p-4 rounded-xl text-center">
                                <p className="text-2xl font-bold text-white">{formatNumber(stats?.chat?.total_sessions)}</p>
                                <p className="text-xs text-slate-500">Sessions</p>
                            </div>
                            <div className="bg-[#1E293B]/40 border border-white/5 p-4 rounded-xl text-center">
                                <p className="text-2xl font-bold text-white">{aiMetrics?.avg_messages_per_session || 0}</p>
                                <p className="text-xs text-slate-500">Msg/Session</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Chat History Modal */}
            {sessionModalOpen && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSessionModalOpen(false)}
                >
                    <div
                        className="bg-[#1E293B] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/10 flex items-start justify-between flex-shrink-0">
                            <div>
                                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                    <MessageSquare className="text-[#06B6D4]" size={20} />
                                    Riwayat Chat Session
                                </h3>
                                {selectedSession && (
                                    <div className="mt-2 space-y-1">
                                        <p className="text-slate-300 text-sm">
                                            <span className="text-slate-500">User:</span> {selectedSession.user_name || selectedSession.guest_name || 'Guest'}
                                        </p>
                                        <p className="text-slate-400 text-xs">
                                            {toWIB(selectedSession.created_at).toLocaleDateString('id-ID', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                        {selectedSession.summary && (
                                            <p className="text-slate-500 text-xs mt-1 italic">"{selectedSession.summary}"</p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setSessionModalOpen(false)}
                                className="p-2 rounded-xl hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages List */}
                        <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-4 bg-[#0F172A]/50">
                            {sessionLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="animate-spin text-[#06B6D4]" size={32} />
                                </div>
                            ) : sessionMessages.length === 0 ? (
                                <div className="text-center py-12">
                                    <MessageSquare className="mx-auto text-slate-600 mb-3" size={40} />
                                    <p className="text-slate-500">Tidak ada pesan dalam session ini</p>
                                </div>
                            ) : (
                                sessionMessages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                                            <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                {msg.role === 'user' ? (
                                                    <>
                                                        <span className="text-xs text-slate-500">User</span>
                                                        <div className="p-1 rounded-full bg-[#6366F1]/20">
                                                            <User size={12} className="text-[#6366F1]" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="p-1 rounded-full bg-[#06B6D4]/20">
                                                            <Bot size={12} className="text-[#06B6D4]" />
                                                        </div>
                                                        <span className="text-xs text-slate-500">AI</span>
                                                    </>
                                                )}
                                            </div>
                                            <div className={`p-4 rounded-2xl ${msg.role === 'user'
                                                ? 'bg-[#6366F1] text-white'
                                                : 'bg-slate-800 text-slate-200'
                                                }`}>
                                                <div className="text-sm leading-relaxed">{formatMessage(msg.content)}</div>
                                            </div>
                                            <p className="text-[10px] text-slate-600 mt-1 px-2">
                                                {toWIB(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-white/10 bg-[#1E293B] flex items-center justify-between flex-shrink-0 rounded-b-3xl">
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span>{sessionMessages.length} pesan</span>
                                {selectedSession?.duration_seconds > 0 && (
                                    <span>Durasi: {formatDuration(selectedSession.duration_seconds)}</span>
                                )}
                                {selectedSession?.ended_at && (
                                    <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
                                        Completed
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setSessionModalOpen(false)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboardPage;
