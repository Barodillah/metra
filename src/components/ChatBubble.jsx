import React from 'react';
import { Share2 } from 'lucide-react';
import { formatMessage } from '../utils/chat';

const ChatBubble = ({ message, isAI, onShare }) => (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4 animate-fade-in group`}>
        <div className={`max-w-[85%] p-4 rounded-2xl shadow-lg ${isAI
            ? 'bg-[#1E293B] border border-white/5 text-slate-200 shadow-black/20'
            : 'bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white shadow-[#6366F1]/20'
            }`}>
            <div className="text-sm leading-relaxed">
                {formatMessage(message)}
            </div>
            {isAI && onShare && (
                <div className="mt-3 pt-2 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={onShare}
                        className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-[#06B6D4] transition-colors font-medium"
                    >
                        <Share2 size={12} />
                        Bagikan ke Feed
                    </button>
                </div>
            )}
        </div>
    </div>
);

export default ChatBubble;


