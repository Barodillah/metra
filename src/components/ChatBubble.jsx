import React from 'react';

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
                return <strong key={partIndex} className="font-bold">{part.slice(2, -2)}</strong>;
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
