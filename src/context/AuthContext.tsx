import React, { createContext, useContext, useState, useCallback } from 'react';
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
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        } catch {
            // No backend available — simulate login from fake users
            try {
                const dataUrl = new URL('../data/fake-users.json', import.meta.url).href;
                const res = await fetch(dataUrl);
                const fakeUsers = (await res.json()) as Array<{ id: string; name: string; email: string; role: string }>;
                const matched = fakeUsers.find((u) => u.role === role) ?? fakeUsers[0];
                if (matched) {
                    const simulatedUser: User = {
                        id: matched.id,
                        name: matched.name,
                        email: email || matched.email,
                        role: matched.role as 'client' | 'lawyer' | 'legal-official',
                        verificationStatus: 'verified',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    setUser(simulatedUser);
                    return;
                }
            } catch {
                // If fake users also fail, fall through to error
            }
            setError('Login failed — no backend or fake data available');
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
            setUser(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Logout failed';
            setError(errorMessage);
        } finally {
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
