import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../types';
import fakeUsers from '../../data/fake-users.json';

const MOCK_TOKEN = 'mock-jwt-token-' + Math.random().toString(36).slice(2);

function buildUser(entry: typeof fakeUsers[number]): User {
    return {
        id: entry.id,
        name: entry.name,
        email: entry.email,
        role: entry.role as User['role'],
        verificationStatus: 'verified',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    };
}

function buildAuthResponse(user: User): AuthResponse {
    return {
        token: MOCK_TOKEN,
        refreshToken: 'mock-refresh-' + Math.random().toString(36).slice(2),
        user,
    };
}

export const mockAuth = {
    login(credentials: LoginRequest): AuthResponse {
        const match = fakeUsers.find(
            u => u.email === credentials.email && u.role === credentials.role
        );

        if (!match) {
            throw new Error('Invalid email or role. Try one of the demo accounts (any password works).');
        }

        return buildAuthResponse(buildUser(match));
    },

    register(data: RegisterRequest): AuthResponse {
        if (data.role === 'admin') {
            throw new Error('Admin accounts cannot be registered.');
        }

        const existing = fakeUsers.find(u => u.email === data.email);
        if (existing) {
            throw new Error('An account with this email already exists.');
        }

        const user: User = {
            id: `${data.role}-${Date.now()}`,
            name: data.name,
            email: data.email,
            role: data.role,
            verificationStatus: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        return buildAuthResponse(user);
    },

    verifyToken(): User | null {
        const stored = localStorage.getItem('mockUser');
        if (stored) {
            return JSON.parse(stored) as User;
        }
        return null;
    },

    saveUser(user: User): void {
        localStorage.setItem('mockUser', JSON.stringify(user));
    },

    clearUser(): void {
        localStorage.removeItem('mockUser');
    },
};
