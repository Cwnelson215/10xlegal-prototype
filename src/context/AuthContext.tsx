import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../api/services/authService';
import type { LoginRequest, RegisterRequest, User } from '../api/types';

export type UserRole = 'client' | 'lawyer' | 'legal-official' | null;

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string, role: UserRole) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Restore session on mount if token exists
    useEffect(() => {
        const restoreSession = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setIsLoading(false);
                return;
            }
            try {
                const restoredUser = await authService.verifyToken();
                setUser(restoredUser);
            } catch {
                // Token invalid or backend unavailable — clear stale token
                authService.clearToken();
            } finally {
                setIsLoading(false);
            }
        };
        restoreSession();
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const login = useCallback(async (email: string, password: string, role: UserRole) => {
        setIsLoading(true);
        setError(null);

        try {
            const credentials: LoginRequest = {
                email,
                password,
                role: role as 'client' | 'lawyer' | 'legal-official',
            };

            const response = await authService.login(credentials);
            setUser(response.user);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed. Is the backend running?';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const register = useCallback(async (data: RegisterRequest) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await authService.register(data);
            setUser(response.user);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Registration failed';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            await authService.logout();
        } catch {
            // Logout failed on server, still clear locally
        } finally {
            setUser(null);
            authService.clearToken();
            setIsLoading(false);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, error, login, register, logout, clearError }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
