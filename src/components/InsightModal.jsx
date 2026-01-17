import React from 'react';
import { X, Sparkles, Calendar, Quote } from 'lucide-react';
import { formatMessage } from '../utils/chat';

const InsightModal = ({ isOpen, onClose, insight }) => {
    if (!isOpen || !insight) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#1E293B] border border-white/10 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-slide-up relative flex flex-col max-h-[90vh]">
                {/* Decorative Background */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-[#6366F1]/20 to-[#06B6D4]/20 blur-xl"></div>

                {/* Close Button - High Z-Index to prevent overlap */}
                <div className="absolute top-4 right-4 z-50">
                    <button
                        onClick={onClose}
                        className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/70 hover:text-white transition-colors cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 md:p-8 relative z-10 flex flex-col overflow-hidden">
                    {/* Header Icon */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] flex items-center justify-center mb-6 shadow-lg shadow-[#6366F1]/20 shrink-0">
                        <Sparkles className="text-white" size={32} />
                    </div>

                    {/* Title */}
                    <h2 className="text-xl md:text-2xl font-black text-white mb-2 leading-tight">
                        {insight.title || 'Insight dari Metra AI'}
                    </h2>

                    {/* Source */}
                    <div className="flex items-center gap-2 mb-6 text-slate-400 text-xs font-medium uppercase tracking-wider shrink-0">
                        <Calendar size={14} />
                        <span>{insight.source || 'Insight Harian'}</span>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="bg-[#0F172A]/50 rounded-2xl p-6 border border-white/5 relative overflow-y-auto custom-scrollbar max-h-[30vh]">
                        <Quote className="absolute top-4 left-4 text-[#6366F1]/20" size={40} />
                        <div className="text-slate-300 text-sm leading-relaxed relative z-10 whitespace-pre-line px-2">
                            {formatMessage(insight.content || insight.description || '')}
                        </div>
                        <Quote className="absolute bottom-4 right-4 text-[#06B6D4]/20 rotate-180" size={40} />
                    </div>

                    {/* Footer Button */}
                    <div className="mt-6 shrink-0">
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

export default InsightModal;
