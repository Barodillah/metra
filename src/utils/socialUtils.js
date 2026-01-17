export const censorName = (name, isFollowing) => {
    if (!name) return 'User';
    if (isFollowing || name === 'Admin Metra') return name;

    const parts = name.toString().split(' ');

    return parts.map(part => {
        if (part.length <= 2) return part; // Don't sensor very short names
        return part[0] + '*'.repeat(Math.max(1, part.length - 2)) + part[part.length - 1];
    }).join(' ');
};

export const getPlanBadgeColor = (plan) => {
    switch (plan) {
        case 'visionary': return 'text-amber-400';
        case 'pro': return 'text-[#06B6D4]';
        default: return 'text-slate-400';
    }
};
