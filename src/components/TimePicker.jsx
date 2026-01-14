import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock, X, ChevronUp, ChevronDown, Sun, Moon, Sunrise, Sunset } from 'lucide-react';

const TimePicker = ({ value, onChange, placeholder = "Pilih Jam", className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Parse value into hours and minutes
    const parseTime = (timeStr) => {
        if (!timeStr) return { hours: 8, minutes: 0 };
        const [h, m] = timeStr.split(':').map(Number);
        return { hours: h || 0, minutes: m || 0 };
    };

    const [selectedHour, setSelectedHour] = useState(parseTime(value).hours);
    const [selectedMinute, setSelectedMinute] = useState(parseTime(value).minutes);

    // Update internal state when value changes
    useEffect(() => {
        const parsed = parseTime(value);
        setSelectedHour(parsed.hours);
        setSelectedMinute(parsed.minutes);
    }, [value]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const formatTime = (h, m) => {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const handleConfirm = () => {
        onChange(formatTime(selectedHour, selectedMinute));
        setIsOpen(false);
    };

    const handleClear = () => {
        onChange('');
        setIsOpen(false);
    };

    // Increment/Decrement functions
    const incrementHour = () => setSelectedHour((h) => (h + 1) % 24);
    const decrementHour = () => setSelectedHour((h) => (h - 1 + 24) % 24);
    const incrementMinute = () => setSelectedMinute((m) => (m + 1) % 60);
    const decrementMinute = () => setSelectedMinute((m) => (m - 1 + 60) % 60);

    // Get period info with icon
    const getPeriod = (h) => {
        if (h >= 5 && h < 11) return { name: 'Pagi', Icon: Sunrise, color: '#F59E0B' };
        if (h >= 11 && h < 15) return { name: 'Siang', Icon: Sun, color: '#EAB308' };
        if (h >= 15 && h < 18) return { name: 'Sore', Icon: Sunset, color: '#F97316' };
        return { name: 'Malam', Icon: Moon, color: '#6366F1' };
    };

    const period = getPeriod(selectedHour);

    return (
        <div className={`relative ${className}`}>
            {/* Input Display */}
            <div
                onClick={() => setIsOpen(true)}
                className="flex-1 w-full px-4 py-3 flex items-center gap-3 bg-slate-900/50 rounded-2xl border border-white/5 hover:border-[#6366F1]/50 transition-all cursor-pointer group"
            >
                <Clock className="text-slate-500 group-hover:text-[#6366F1] shrink-0 transition-colors" size={18} />
                <span className={`text-sm font-bold ${value ? 'text-white' : 'text-slate-600'}`}>
                    {value ? (
                        <span className="flex items-center gap-2">
                            {value}
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${getPeriod(parseTime(value).hours).color}20`, color: getPeriod(parseTime(value).hours).color }}>
                                {getPeriod(parseTime(value).hours).name}
                            </span>
                        </span>
                    ) : placeholder}
                </span>
            </div>

            {/* Modal Portal */}
            {isOpen && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100vw',
                        height: '100vh',
                        zIndex: 99999,
                    }}
                >
                    {/* Backdrop */}
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            width: '100vw',
                            height: '100vh',
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            backdropFilter: 'blur(8px)',
                        }}
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal Content */}
                    <div
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 'min(calc(100vw - 32px), 320px)',
                            backgroundColor: '#0F172A',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '20px',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/5">
                            <div>
                                <h2 className="text-lg font-black text-white flex items-center gap-2">
                                    <Clock size={20} className="text-[#06B6D4]" />
                                    Jam Lahir
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Time Spinner - Side by Side */}
                        <div className="p-6">
                            <div className="flex items-center justify-center gap-4">
                                {/* Hour Spinner */}
                                <div className="flex flex-col items-center">
                                    <button
                                        type="button"
                                        onClick={incrementHour}
                                        className="p-3 text-slate-500 hover:text-white transition-colors"
                                    >
                                        <ChevronUp size={28} />
                                    </button>
                                    <div
                                        className="w-20 h-16 flex items-center justify-center text-4xl font-black rounded-xl"
                                        style={{ color: period.color }}
                                    >
                                        {String(selectedHour).padStart(2, '0')}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={decrementHour}
                                        className="p-3 text-slate-500 hover:text-white transition-colors"
                                    >
                                        <ChevronDown size={28} />
                                    </button>
                                </div>

                                {/* Separator */}
                                <div className="text-4xl font-black text-slate-600">:</div>

                                {/* Minute Spinner */}
                                <div className="flex flex-col items-center">
                                    <button
                                        type="button"
                                        onClick={incrementMinute}
                                        className="p-3 text-slate-500 hover:text-white transition-colors"
                                    >
                                        <ChevronUp size={28} />
                                    </button>
                                    <div className="w-20 h-16 flex items-center justify-center text-4xl font-black text-slate-400 rounded-xl">
                                        {String(selectedMinute).padStart(2, '0')}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={decrementMinute}
                                        className="p-3 text-slate-500 hover:text-white transition-colors"
                                    >
                                        <ChevronDown size={28} />
                                    </button>
                                </div>
                            </div>

                            {/* Period Indicator */}
                            <div
                                className="mt-4 flex items-center justify-center gap-2 py-2 px-4 rounded-full mx-auto w-fit"
                                style={{ backgroundColor: `${period.color}20` }}
                            >
                                <period.Icon size={18} style={{ color: period.color }} />
                                <span className="text-sm font-bold" style={{ color: period.color }}>
                                    {period.name}
                                </span>
                            </div>
                        </div>

                        {/* Quick Period Selection */}
                        <div className="px-4 pb-4">
                            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-2 text-center">Pilih Cepat</p>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { hour: 6, minute: 0, label: 'Pagi', Icon: Sunrise, color: '#F59E0B' },
                                    { hour: 12, minute: 0, label: 'Siang', Icon: Sun, color: '#EAB308' },
                                    { hour: 16, minute: 0, label: 'Sore', Icon: Sunset, color: '#F97316' },
                                    { hour: 21, minute: 0, label: 'Malam', Icon: Moon, color: '#6366F1' },
                                ].map((preset) => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() => {
                                            setSelectedHour(preset.hour);
                                            setSelectedMinute(preset.minute);
                                        }}
                                        className="flex flex-col items-center gap-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                                    >
                                        <preset.Icon size={16} style={{ color: preset.color }} />
                                        <span className="text-[10px] font-bold text-slate-400">{preset.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-4 border-t border-white/5 flex gap-3">
                            <button
                                type="button"
                                onClick={handleClear}
                                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-xs uppercase tracking-wider transition-all"
                            >
                                Tidak Tahu
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all hover:brightness-110"
                            >
                                Pilih {formatTime(selectedHour, selectedMinute)}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default TimePicker;
