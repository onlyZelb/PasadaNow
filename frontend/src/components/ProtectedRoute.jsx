import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="w-10 h-10 border-4 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
};

export default ProtectedRoute;