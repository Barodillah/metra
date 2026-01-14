import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X, Star, Sun, Moon, Sparkles } from 'lucide-react';

// Zodiac data with date ranges and colors
const ZODIAC_DATA = [
    { name: 'Capricorn', symbol: '♑', startMonth: 12, startDay: 22, endMonth: 1, endDay: 19, color: '#6B7280' },
    { name: 'Aquarius', symbol: '♒', startMonth: 1, startDay: 20, endMonth: 2, endDay: 18, color: '#06B6D4' },
    { name: 'Pisces', symbol: '♓', startMonth: 2, startDay: 19, endMonth: 3, endDay: 20, color: '#3B82F6' },
    { name: 'Aries', symbol: '♈', startMonth: 3, startDay: 21, endMonth: 4, endDay: 19, color: '#EF4444' },
    { name: 'Taurus', symbol: '♉', startMonth: 4, startDay: 20, endMonth: 5, endDay: 20, color: '#22C55E' },
    { name: 'Gemini', symbol: '♊', startMonth: 5, startDay: 21, endMonth: 6, endDay: 20, color: '#EAB308' },
    { name: 'Cancer', symbol: '♋', startMonth: 6, startDay: 21, endMonth: 7, endDay: 22, color: '#94A3B8' },
    { name: 'Leo', symbol: '♌', startMonth: 7, startDay: 23, endMonth: 8, endDay: 22, color: '#F97316' },
    { name: 'Virgo', symbol: '♍', startMonth: 8, startDay: 23, endMonth: 9, endDay: 22, color: '#84CC16' },
    { name: 'Libra', symbol: '♎', startMonth: 9, startDay: 23, endMonth: 10, endDay: 22, color: '#EC4899' },
    { name: 'Scorpio', symbol: '♏', startMonth: 10, startDay: 23, endMonth: 11, endDay: 21, color: '#7C3AED' },
    { name: 'Sagittarius', symbol: '♐', startMonth: 11, startDay: 22, endMonth: 12, endDay: 21, color: '#6366F1' },
];

// Pasaran (Javanese calendar cycle)
const PASARAN = ['Legi', 'Paing', 'Pon', 'Wage', 'Kliwon'];
const HARI_JAWA = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// Calendar view types
const CALENDAR_VIEWS = [
    { id: 'grid', label: 'Grid', icon: Calendar, description: 'Tampilan kalender grid' },
    { id: 'zodiac', label: 'Zodiak', icon: Star, description: 'Berdasarkan zodiak' },
    { id: 'wheel', label: 'Wheel', icon: Sun, description: 'Tampilan roda' },
];

// Calendar types
const CALENDAR_TYPES = [
    { id: 'masehi', label: 'Masehi', description: 'Gregorian', icon: '🌍' },
    { id: 'jawa', label: 'Jawa', description: 'Pasaran', icon: '🏝️' },
];

// Indonesian month names
const MONTHS_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// Get zodiac for a specific date
const getZodiacForDate = (month, day) => {
    for (const zodiac of ZODIAC_DATA) {
        if (zodiac.startMonth === zodiac.endMonth) {
            if (month === zodiac.startMonth && day >= zodiac.startDay && day <= zodiac.endDay) {
                return zodiac;
            }
        } else if (zodiac.startMonth > zodiac.endMonth) {
            if ((month === zodiac.startMonth && day >= zodiac.startDay) ||
                (month === zodiac.endMonth && day <= zodiac.endDay)) {
                return zodiac;
            }
        } else {
            if ((month === zodiac.startMonth && day >= zodiac.startDay) ||
                (month === zodiac.endMonth && day <= zodiac.endDay)) {
                return zodiac;
            }
        }
    }
    return ZODIAC_DATA[0];
};

// Calculate Julian Day Number for a given year, month, day (month is 1-12)
const getJulianDayNumber = (year, month, day) => {
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
};

// Get Pasaran for a date using year, month (1-12), day - no timezone issues
const getPasaranByYMD = (year, month, day) => {
    const jdn = getJulianDayNumber(year, month, day);
    const baseJdn = getJulianDayNumber(1900, 1, 1); // 1 Januari 1900 = Legi
    const diffDays = jdn - baseJdn;
    const pasaranIdx = ((diffDays % 5) + 5) % 5;
    return PASARAN[(pasaranIdx + 1) % 5];
};

// Get Pasaran for a Date object (for backward compatibility)
const getPasaran = (date) => {
    return getPasaranByYMD(date.getFullYear(), date.getMonth() + 1, date.getDate());
};

// Generate year range for picker
const generateYearRange = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear - 100; y <= currentYear + 1; y++) {
        years.push(y);
    }
    return years;
};

const YEARS = generateYearRange();

const DatePicker = ({ value, onChange, placeholder = "Pilih Tanggal", className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [calendarType, setCalendarType] = useState('masehi');
    const [calendarView, setCalendarView] = useState('grid');
    const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);

    const selectedDate = value ? new Date(value) : null;

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const handleSelectDate = (day) => {
        // Format date manually to avoid timezone issues with toISOString()
        const year = currentYear;
        const month = String(currentMonth + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const formattedDate = `${year}-${month}-${dayStr}`;
        onChange(formattedDate);
        setIsOpen(false);
    };

    const formatDisplayValue = () => {
        if (!selectedDate) return '';
        const day = selectedDate.getDate();
        const month = MONTHS_ID[selectedDate.getMonth()];
        const year = selectedDate.getFullYear();

        if (calendarType === 'jawa') {
            const pasaran = getPasaran(selectedDate);
            return `${day} ${month} ${year} (${pasaran})`;
        }
        return `${day} ${month} ${year}`;
    };

    // Month/Year Picker View
    const renderMonthYearPicker = () => {
        return (
            <div className="p-4">
                {/* Year Selector */}
                <div className="mb-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Tahun</p>
                    <div className="grid grid-cols-4 gap-2 max-h-[120px] overflow-y-auto">
                        {YEARS.slice().reverse().slice(0, 50).map((year) => (
                            <button
                                key={year}
                                type="button"
                                onClick={() => setCurrentYear(year)}
                                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${currentYear === year
                                    ? 'bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                    }`}
                            >
                                {year}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Month Selector */}
                <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Bulan</p>
                    <div className="grid grid-cols-3 gap-2">
                        {MONTHS_ID.map((month, idx) => (
                            <button
                                key={month}
                                type="button"
                                onClick={() => {
                                    setCurrentMonth(idx);
                                    setShowMonthYearPicker(false);
                                }}
                                className={`py-3 px-3 rounded-xl text-xs font-bold transition-all ${currentMonth === idx
                                    ? 'bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white shadow-lg'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                    }`}
                            >
                                {month.slice(0, 3)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Confirm Button */}
                <button
                    type="button"
                    onClick={() => setShowMonthYearPicker(false)}
                    className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white font-bold text-sm shadow-lg"
                >
                    Pilih {MONTHS_ID[currentMonth]} {currentYear}
                </button>
            </div>
        );
    };

    // Grid View Calendar
    const renderGridCalendar = () => {
        const daysInMonth = getDaysInMonth(currentMonth, currentYear);
        const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="w-9 h-9 sm:w-10 sm:h-10" />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const zodiac = getZodiacForDate(currentMonth + 1, day);
            const isSelected = selectedDate &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === currentMonth &&
                selectedDate.getFullYear() === currentYear;
            const isToday = new Date().toDateString() === date.toDateString();

            let additionalLabel = '';
            if (calendarType === 'jawa') {
                additionalLabel = getPasaranByYMD(currentYear, currentMonth + 1, day).charAt(0);
            }

            days.push(
                <button
                    key={day}
                    type="button"
                    onClick={() => handleSelectDate(day)}
                    className={`
                        w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-bold
                        transition-all duration-200 relative group
                        ${isSelected
                            ? 'bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white shadow-lg shadow-[#6366F1]/30 scale-110'
                            : 'hover:scale-110 hover:shadow-lg'
                        }
                        ${isToday && !isSelected ? 'ring-2 ring-[#06B6D4]' : ''}
                    `}
                    style={{
                        backgroundColor: isSelected ? undefined : `${zodiac.color}25`,
                        color: isSelected ? undefined : 'white',
                    }}
                >
                    <span className="relative z-10">{day}</span>
                    {additionalLabel && !isSelected && (
                        <span className="absolute bottom-0.5 right-1 text-[8px] opacity-70 font-medium">
                            {additionalLabel}
                        </span>
                    )}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900/95 border border-white/10 rounded-lg text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 shadow-xl">
                        <span style={{ color: zodiac.color }}>{zodiac.symbol}</span> {zodiac.name}
                    </div>
                </button>
            );
        }

        return days;
    };

    // Zodiac View Calendar
    const renderZodiacCalendar = () => {
        return (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-4">
                {ZODIAC_DATA.map((zodiac) => {
                    const isCurrentZodiac = selectedDate && getZodiacForDate(selectedDate.getMonth() + 1, selectedDate.getDate()).name === zodiac.name;
                    return (
                        <button
                            key={zodiac.name}
                            type="button"
                            onClick={() => {
                                // Navigate to the start of this zodiac
                                setCurrentMonth(zodiac.startMonth - 1);
                                setCalendarView('grid');
                            }}
                            className={`p-4 rounded-2xl border transition-all hover:scale-105 ${isCurrentZodiac
                                ? 'border-white/30 shadow-lg'
                                : 'border-white/5 hover:border-white/20'
                                }`}
                            style={{ backgroundColor: `${zodiac.color}20` }}
                        >
                            <div className="text-3xl mb-2" style={{ color: zodiac.color }}>{zodiac.symbol}</div>
                            <div className="text-xs font-bold text-white">{zodiac.name}</div>
                            <div className="text-[10px] text-slate-400 mt-1">
                                {zodiac.startDay}/{zodiac.startMonth} - {zodiac.endDay}/{zodiac.endMonth}
                            </div>
                        </button>
                    );
                })}
            </div>
        );
    };

    // Wheel View Calendar
    const renderWheelCalendar = () => {
        const daysInMonth = getDaysInMonth(currentMonth, currentYear);
        const radius = 120;
        const centerX = 150;
        const centerY = 150;

        return (
            <div className="flex justify-center items-center py-4">
                <svg width="300" height="300" className="overflow-visible">
                    {/* Center circle */}
                    <circle cx={centerX} cy={centerY} r="40" fill="url(#centerGradient)" />
                    <defs>
                        <linearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6366F1" />
                            <stop offset="100%" stopColor="#06B6D4" />
                        </linearGradient>
                    </defs>
                    <text x={centerX} y={centerY - 5} textAnchor="middle" className="fill-white text-xs font-bold">
                        {MONTHS_ID[currentMonth].slice(0, 3)}
                    </text>
                    <text x={centerX} y={centerY + 12} textAnchor="middle" className="fill-white/70 text-[10px]">
                        {currentYear}
                    </text>

                    {/* Day circles */}
                    {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1;
                        const angle = (day / daysInMonth) * 2 * Math.PI - Math.PI / 2;
                        const x = centerX + radius * Math.cos(angle);
                        const y = centerY + radius * Math.sin(angle);
                        const zodiac = getZodiacForDate(currentMonth + 1, day);
                        const isSelected = selectedDate &&
                            selectedDate.getDate() === day &&
                            selectedDate.getMonth() === currentMonth &&
                            selectedDate.getFullYear() === currentYear;

                        return (
                            <g key={day} className="cursor-pointer" onClick={() => handleSelectDate(day)}>
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={isSelected ? 18 : 14}
                                    fill={isSelected ? 'url(#centerGradient)' : `${zodiac.color}40`}
                                    stroke={isSelected ? 'white' : 'transparent'}
                                    strokeWidth="2"
                                    className="transition-all duration-200 hover:r-18"
                                />
                                <text
                                    x={x}
                                    y={y + 4}
                                    textAnchor="middle"
                                    className={`text-[10px] font-bold ${isSelected ? 'fill-white' : 'fill-white/90'}`}
                                >
                                    {day}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        );
    };

    return (
        <div className={`relative ${className}`}>
            {/* Input Display */}
            <div
                onClick={() => setIsOpen(true)}
                className="flex-1 w-full px-4 sm:px-5 py-3 flex items-center gap-3 bg-slate-900/50 rounded-2xl border border-white/5 hover:border-[#6366F1]/50 transition-all cursor-pointer group"
            >
                <Calendar className="text-slate-500 group-hover:text-[#6366F1] shrink-0" size={18} />
                <span className={`text-sm font-bold ${value ? 'text-white' : 'text-slate-600'}`}>
                    {value ? formatDisplayValue() : placeholder}
                </span>
            </div>

            {/* Modal Portal - renders to body */}
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
                        pointerEvents: 'auto',
                    }}
                >
                    {/* Backdrop - Full Screen */}
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

                    {/* Modal Content - Centered with Transform */}
                    <div
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 'min(calc(100vw - 32px), 360px)',
                            maxHeight: 'calc(100vh - 32px)',
                            backgroundColor: '#0F172A',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                        }}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between p-3 sm:p-4 border-b border-white/5 bg-[#0F172A]">
                            <div>
                                <h2 className="text-lg font-black text-white flex items-center gap-2">
                                    <Sparkles size={20} className="text-[#06B6D4]" />
                                    Pilih Tanggal
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">Dengan warna zodiak spiritual</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Calendar Type Tabs */}
                        <div className="flex gap-2 p-4 border-b border-white/5 overflow-x-auto">
                            {CALENDAR_TYPES.map((type) => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setCalendarType(type.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${calendarType === type.id
                                        ? 'bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white shadow-lg'
                                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                        }`}
                                >
                                    <span>{type.icon}</span>
                                    {type.label}
                                </button>
                            ))}
                        </div>

                        {/* View Type Tabs */}
                        <div className="flex gap-2 px-4 pt-4">
                            {CALENDAR_VIEWS.map((view) => {
                                const Icon = view.icon;
                                return (
                                    <button
                                        key={view.id}
                                        type="button"
                                        onClick={() => setCalendarView(view.id)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${calendarView === view.id
                                            ? 'bg-white/10 text-white'
                                            : 'text-slate-500 hover:text-white'
                                            }`}
                                    >
                                        <Icon size={14} />
                                        {view.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Month/Year Navigation */}
                        {(calendarView === 'grid' || calendarView === 'wheel') && !showMonthYearPicker && (
                            <div className="flex items-center justify-between px-4 py-3">
                                <button
                                    type="button"
                                    onClick={prevMonth}
                                    className="p-2 rounded-xl bg-white/5 border border-white/5 text-white hover:bg-[#6366F1]/20 transition-all"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowMonthYearPicker(true)}
                                    className="text-base font-black text-white hover:text-[#06B6D4] transition-colors px-4 py-1 rounded-lg hover:bg-white/5"
                                >
                                    {MONTHS_ID[currentMonth]} {currentYear} ▾
                                </button>
                                <button
                                    type="button"
                                    onClick={nextMonth}
                                    className="p-2 rounded-xl bg-white/5 border border-white/5 text-white hover:bg-[#6366F1]/20 transition-all"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        )}

                        {/* Calendar Content */}
                        <div style={{ padding: '0 8px' }}>
                            {/* Month/Year Picker */}
                            {showMonthYearPicker && renderMonthYearPicker()}

                            {!showMonthYearPicker && calendarView === 'grid' && (
                                <>
                                    <div className="grid grid-cols-7 gap-0.5">
                                        {DAYS_ID.map((day) => (
                                            <div key={day} className="w-9 h-6 sm:w-10 sm:h-7 flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase">
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-0.5 pb-3">
                                        {renderGridCalendar()}
                                    </div>
                                </>
                            )}

                            {!showMonthYearPicker && calendarView === 'zodiac' && renderZodiacCalendar()}
                            {!showMonthYearPicker && calendarView === 'wheel' && renderWheelCalendar()}
                        </div>
                    </div>

                    {/* Selected Date Display */}
                    {selectedDate && (
                        <div className="p-4 border-t border-white/5 bg-white/5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Tanggal Terpilih</p>
                                    <p className="text-sm font-bold text-white mt-1">{formatDisplayValue()}</p>
                                    {calendarType === 'jawa' && (
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {HARI_JAWA[selectedDate.getDay()]} {getPasaran(selectedDate)}
                                        </p>
                                    )}
                                </div>
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                    style={{
                                        backgroundColor: `${getZodiacForDate(selectedDate.getMonth() + 1, selectedDate.getDate()).color}30`,
                                        color: getZodiacForDate(selectedDate.getMonth() + 1, selectedDate.getDate()).color
                                    }}
                                >
                                    {getZodiacForDate(selectedDate.getMonth() + 1, selectedDate.getDate()).symbol}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Zodiac Legend */}
                    <div className="px-4 pb-4">
                        <div className="flex flex-wrap gap-1 justify-center">
                            {ZODIAC_DATA.slice(0, 6).map((z) => (
                                <div
                                    key={z.name}
                                    className="flex items-center gap-1 px-2 py-1 rounded-full text-[8px] font-medium"
                                    style={{ backgroundColor: `${z.color}20`, color: z.color }}
                                >
                                    <span>{z.symbol}</span>
                                    {z.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default DatePicker;
