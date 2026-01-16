import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Menu, X, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
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

    return (
        <nav className="fixed top-0 w-full z-50 bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] rounded-2xl flex items-center justify-center shadow-lg shadow-[#6366F1]/20">
                        <Sparkles className="text-white" size={22} />
                    </div>
                    <span className="text-2xl font-black tracking-tighter text-white ml-2">METRA</span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-10 text-sm font-bold text-slate-400">
                    <a href="/#fitur" className="hover:text-white transition-colors uppercase tracking-widest text-[11px]">Metodologi</a>
                    <a href="/#pricing" className="hover:text-white transition-colors uppercase tracking-widest text-[11px]">Pricing</a>

                    {isAuthenticated ? (
                        <div className="flex items-center gap-4">
                            {user?.role === 'admin' && (
                                <Link
                                    to="/admin"
                                    className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-widest text-[11px] font-bold"
                                >
                                    <Crown size={14} />
                                    Admin
                                </Link>
                            )}
                            <Link
                                to="/dashboard"
                                className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-2.5 rounded-full transition-all text-white font-bold text-xs uppercase tracking-widest"
                            >
                                Dashboard
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="text-slate-400 hover:text-white transition-colors uppercase tracking-widest text-[11px]"
                            >
                                Keluar
                            </button>
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

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-white p-2"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    {menuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="md:hidden bg-[#0F172A]/95 backdrop-blur-xl border-t border-white/5 p-6 space-y-4 animate-fade-in">
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
