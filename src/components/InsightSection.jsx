import React from 'react';
import {
    Sparkles,
    Zap,
    Heart,
    Briefcase,
    Activity,
    CheckCircle2,
    XCircle,
    Clock,
    Calendar,
    TrendingUp,
    Users,
    Crown,
    Star,
    Moon,
    Sun
} from 'lucide-react';

// Helper: Format chat message (bold, line breaks)
const formatMessage = (text) => {
    if (!text) return null;

    // Split by line breaks
    const lines = text.split('\n');

    return lines.map((line, lineIndex) => {
        // Process bold text (**text**)
        const parts = line.split(/(\*\*[^*]+\*\*)/g);

        const formattedLine = parts.map((part, partIndex) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                // Remove ** and make bold
                return <strong key={partIndex} className="font-bold text-white">{part.slice(2, -2)}</strong>;
            }
            return part;
        });

        return (
            <React.Fragment key={lineIndex}>
                {formattedLine}
                {lineIndex < lines.length - 1 && <br />}
            </React.Fragment>
        );
    });
};

// Energy Score Bar Component
const EnergyBar = ({ label, value, color, icon: Icon }) => (
    <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color.bg}`}>
            <Icon size={16} className={color.text} />
        </div>
        <div className="flex-1">
            <div className="flex justify-between mb-1">
                <span className="text-sm text-slate-400">{label}</span>
                <span className="text-sm font-bold text-white">{value}%</span>
            </div>
            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ${color.bar}`}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    </div>
);

// Checklist Item Component
const ChecklistItem = ({ label, isGood }) => (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${isGood
        ? 'bg-emerald-500/10 border-emerald-500/30'
        : 'bg-red-500/10 border-red-500/30'
        }`}>
        {isGood ? (
            <CheckCircle2 size={16} className="text-emerald-400" />
        ) : (
            <XCircle size={16} className="text-red-400" />
        )}
        <span className={`text-sm font-medium ${isGood ? 'text-emerald-300' : 'text-red-300'}`}>
            {label}
        </span>
    </div>
);

// Main InsightSection Component
const InsightSection = ({ insights, loading, planType, onUpgrade }) => {
    if (loading) {
        return (
            <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl animate-pulse">
                <div className="h-8 bg-slate-700/50 rounded-xl w-48 mb-6" />
                <div className="h-20 bg-slate-700/50 rounded-xl mb-4" />
                <div className="h-16 bg-slate-700/50 rounded-xl" />
            </div>
        );
    }

    if (!insights) return null;

    // FREE Tier Content
    const FreeTierContent = () => (
        <>
            {/* Daily Tip */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-2xl mb-6">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <Sparkles className="text-indigo-400" size={18} />
                    </div>
                    <div>
                        <p className="text-white font-bold mb-1 text-sm">Tip Harian</p>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            {insights.dailyTip}
                        </p>
                    </div>
                </div>
            </div>

            {/* Weton & Shio Status */}
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-5 rounded-2xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                        <Calendar className="text-amber-400" size={18} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Energi Hari Ini</p>
                        <p className="text-white font-bold text-lg">{insights.wetonShio}</p>
                        <p className="text-amber-400/70 text-xs mt-1">Neptu: {insights.neptu}</p>
                    </div>
                </div>
            </div>

            {/* Upgrade CTA for FREE users */}
            {planType === 'free' && (
                <div className="mt-6 p-4 bg-gradient-to-r from-[#6366F1]/10 to-[#06B6D4]/10 border border-[#6366F1]/20 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <Crown className="text-[#06B6D4]" size={20} />
                        <div className="flex-1">
                            <p className="text-white text-sm font-bold">Unlock PRO Insights</p>
                            <p className="text-slate-400 text-xs">Daily Energy Score, AI Analysis & more</p>
                        </div>
                        <button
                            onClick={onUpgrade}
                            className="px-4 py-2 bg-gradient-to-r from-[#6366F1] to-[#06B6D4] rounded-xl text-white text-xs font-bold hover:brightness-110 transition-all"
                        >
                            Upgrade
                        </button>
                    </div>
                </div>
            )}
        </>
    );

    // PRO Tier Content
    const ProTierContent = () => (
        <>
            <FreeTierContent />

            {/* Daily Energy Score */}
            {insights.energyScores && (
                <div className="mt-6 bg-slate-800/50 border border-white/5 p-5 rounded-2xl">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="text-[#06B6D4]" size={18} />
                        <h3 className="text-white font-bold">Daily Energy Score</h3>
                    </div>
                    <div className="space-y-4">
                        <EnergyBar
                            label="Karir"
                            value={insights.energyScores.karir}
                            color={{ bg: 'bg-blue-500/20', text: 'text-blue-400', bar: 'bg-gradient-to-r from-blue-500 to-blue-400' }}
                            icon={Briefcase}
                        />
                        <EnergyBar
                            label="Asmara"
                            value={insights.energyScores.asmara}
                            color={{ bg: 'bg-pink-500/20', text: 'text-pink-400', bar: 'bg-gradient-to-r from-pink-500 to-pink-400' }}
                            icon={Heart}
                        />
                        <EnergyBar
                            label="Kesehatan"
                            value={insights.energyScores.kesehatan}
                            color={{ bg: 'bg-emerald-500/20', text: 'text-emerald-400', bar: 'bg-gradient-to-r from-emerald-500 to-emerald-400' }}
                            icon={Activity}
                        />
                    </div>
                </div>
            )}

            {/* Personalized AI Insight */}
            {insights.personalizedInsight && (
                <div className="mt-6 bg-gradient-to-br from-[#6366F1]/10 to-[#06B6D4]/10 border border-[#6366F1]/20 p-5 rounded-2xl">
                    <div className="flex items-center gap-2 mb-4">
                        <Star className="text-amber-400" size={18} />
                        <h3 className="text-white font-bold">Personal Insight by AI</h3>
                    </div>
                    <div className="text-slate-300 text-sm leading-relaxed">
                        {formatMessage(insights.personalizedInsight)}
                    </div>
                </div>
            )}

            {/* Good Day Checklist */}
            {insights.goodDayChecklist && (
                <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="text-emerald-400" size={18} />
                        <h3 className="text-white font-bold text-sm">Checklist Hari Baik</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <ChecklistItem label="Menikah" isGood={insights.goodDayChecklist.menikah} />
                        <ChecklistItem label="Bisnis" isGood={insights.goodDayChecklist.bisnis} />
                        <ChecklistItem label="Bepergian" isGood={insights.goodDayChecklist.bepergian} />
                    </div>
                </div>
            )}

            {/* Upgrade CTA for PRO users */}
            {planType === 'pro' && (
                <div className="mt-6 p-4 bg-gradient-to-r from-amber-400/10 to-orange-500/10 border border-amber-400/20 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <Crown className="text-amber-400" size={20} />
                        <div className="flex-1">
                            <p className="text-white text-sm font-bold">Go Visionary</p>
                            <p className="text-slate-400 text-xs">Golden Hour, Weekly Forecast & Multi-Profile</p>
                        </div>
                        <button
                            onClick={onUpgrade}
                            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl text-white text-xs font-bold hover:brightness-110 transition-all"
                        >
                            Upgrade
                        </button>
                    </div>
                </div>
            )}
        </>
    );

    // VISIONARY Tier Content
    const VisionaryTierContent = () => (
        <>
            {/* Include PRO content without upgrade CTA */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-2xl mb-6">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <Sparkles className="text-indigo-400" size={18} />
                    </div>
                    <div>
                        <p className="text-white font-bold mb-1 text-sm">Tip Harian</p>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            {insights.dailyTip}
                        </p>
                    </div>
                </div>
            </div>

            {/* Golden Hour - Visionary Exclusive */}
            {insights.goldenHour && (
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 p-5 rounded-2xl mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-500/30 rounded-xl">
                            <Clock className="text-amber-300" size={22} />
                        </div>
                        <div className="flex-1">
                            <p className="text-amber-300 text-xs uppercase tracking-wider font-bold mb-1">⚡ Golden Hour</p>
                            <p className="text-white font-bold text-xl">{insights.goldenHour.hours.join(' & ')} WIB</p>
                            <p className="text-amber-200/70 text-xs mt-1">{insights.goldenHour.description}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Weton & Shio Status */}
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-5 rounded-2xl mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                        <Calendar className="text-amber-400" size={18} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Energi Hari Ini</p>
                        <p className="text-white font-bold text-lg">{insights.wetonShio}</p>
                        <p className="text-amber-400/70 text-xs mt-1">Neptu: {insights.neptu}</p>
                    </div>
                </div>
            </div>

            {/* Daily Energy Score */}
            {insights.energyScores && (
                <div className="bg-slate-800/50 border border-white/5 p-5 rounded-2xl mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="text-[#06B6D4]" size={18} />
                        <h3 className="text-white font-bold">Daily Energy Score</h3>
                    </div>
                    <div className="space-y-4">
                        <EnergyBar
                            label="Karir"
                            value={insights.energyScores.karir}
                            color={{ bg: 'bg-blue-500/20', text: 'text-blue-400', bar: 'bg-gradient-to-r from-blue-500 to-blue-400' }}
                            icon={Briefcase}
                        />
                        <EnergyBar
                            label="Asmara"
                            value={insights.energyScores.asmara}
                            color={{ bg: 'bg-pink-500/20', text: 'text-pink-400', bar: 'bg-gradient-to-r from-pink-500 to-pink-400' }}
                            icon={Heart}
                        />
                        <EnergyBar
                            label="Kesehatan"
                            value={insights.energyScores.kesehatan}
                            color={{ bg: 'bg-emerald-500/20', text: 'text-emerald-400', bar: 'bg-gradient-to-r from-emerald-500 to-emerald-400' }}
                            icon={Activity}
                        />
                    </div>
                </div>
            )}

            {/* Visionary Forecast */}
            {insights.forecast && (
                <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 p-5 rounded-2xl mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Moon className="text-violet-400" size={18} />
                        <h3 className="text-white font-bold">Visionary Forecast</h3>
                    </div>
                    <div className="text-slate-300 text-sm leading-relaxed">
                        {formatMessage(insights.forecast)}
                    </div>
                </div>
            )}

            {/* Personalized AI Insight */}
            {insights.personalizedInsight && (
                <div className="bg-gradient-to-br from-[#6366F1]/10 to-[#06B6D4]/10 border border-[#6366F1]/20 p-5 rounded-2xl mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Star className="text-amber-400" size={18} />
                        <h3 className="text-white font-bold">Personal Insight by AI</h3>
                    </div>
                    <div className="text-slate-300 text-sm leading-relaxed">
                        {formatMessage(insights.personalizedInsight)}
                    </div>
                </div>
            )}

            {/* Good Day Checklist */}
            {insights.goodDayChecklist && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="text-emerald-400" size={18} />
                        <h3 className="text-white font-bold text-sm">Checklist Hari Baik</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <ChecklistItem label="Menikah" isGood={insights.goodDayChecklist.menikah} />
                        <ChecklistItem label="Bisnis" isGood={insights.goodDayChecklist.bisnis} />
                        <ChecklistItem label="Bepergian" isGood={insights.goodDayChecklist.bepergian} />
                    </div>
                </div>
            )}

            {/* Multi-Profile Placeholder */}
            {insights.multiProfile && (
                <div className="bg-slate-800/30 border border-white/5 p-5 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-700/50 rounded-lg">
                            <Users className="text-slate-400" size={18} />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Multi-Profile Insight</p>
                            <p className="text-slate-500 text-xs">{insights.multiProfile.message}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    return (
        <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500/10 rounded-xl">
                        <Zap className="text-amber-500" size={22} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white">Insight Hari Ini</h2>
                        <p className="text-slate-500 text-xs">
                            {planType === 'visionary' ? '🔮 Visionary' : planType === 'pro' ? '⚡ Pro Navigator' : '👁️ Observer'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tier-based Content */}
            {planType === 'visionary' ? (
                <VisionaryTierContent />
            ) : planType === 'pro' ? (
                <ProTierContent />
            ) : (
                <FreeTierContent />
            )}
        </div>
    );
};

export default InsightSection;
