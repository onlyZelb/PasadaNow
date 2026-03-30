import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, LogOut, User, ShoppingBag } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 mb-6 shadow-lg shadow-emerald-500/30 text-white">
                    <LayoutDashboard className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400 mb-2">
                    Dashboard
                </h1>

                {user && (
                    <div className="flex items-center justify-center gap-2 text-slate-300 text-sm mt-1 mb-6">
                        <User className="w-4 h-4 text-emerald-400" />
                        <span>Logged in as <span className="text-emerald-400 font-semibold">{user.username}</span></span>
                    </div>
                )}

                <p className="text-slate-400 text-sm mb-6">
                    Your session persists across page refreshes via HttpOnly cookie. 🍪
                </p>

                {/* Navigate to PHP-backed product catalog */}
                <Link
                    to="/catalog"
                    className="w-full py-3 px-4 mb-3 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-medium rounded-xl shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                    <ShoppingBag className="w-5 h-5" />
                    Browse Catalog
                </Link>

                <button
                    onClick={logout}
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
