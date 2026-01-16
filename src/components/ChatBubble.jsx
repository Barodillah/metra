import React from 'react';
import { formatMessage } from '../utils/chat';

const ChatBubble = ({ message, isAI }) => (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4 animate-fade-in`}>
        <div className={`max-w-[85%] p-4 rounded-2xl shadow-lg ${isAI
            ? 'bg-[#1E293B] border border-white/5 text-slate-200 shadow-black/20'
            : 'bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white shadow-[#6366F1]/20'
            }`}>
            <div className="text-sm leading-relaxed">
                {formatMessage(message)}
            </div>
        </div>
    </div>
);

export default ChatBubble;

