import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';

// ── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

// ── Provider — runs the session check exactly once for the whole app ──────────

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data } = await api.get('/api/auth/me');
                setUser(data);
            } catch {
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = useCallback(async (username, password) => {
        const { data } = await api.post('/api/auth/login', { username, password });
        setUser(data);
        navigate('/dashboard');
    }, [navigate]);

    const logout = useCallback(async () => {
        try {
            await api.post('/api/auth/logout');
        } finally {
            setUser(null);
            navigate('/login');
        }
    }, [navigate]);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// ── Hook — just reads from context, zero side effects ────────────────────────

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
};
