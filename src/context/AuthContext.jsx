'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // Check auth status on mount
    const checkAuth = useCallback(async () => {
        try {
            const res = await fetch('/api/auth');
            const data = await res.json();
            setIsAuthenticated(data.authenticated);
        } catch {
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = async (email, password) => {
        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (data.success) {
                setIsAuthenticated(true);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/auth', { method: 'DELETE' });
        } catch { /* ignore */ }
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
