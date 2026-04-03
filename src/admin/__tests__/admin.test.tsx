import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Admin } from '../admin';
import { createElement } from 'react';

// Mock the child components to avoid MSW/API complexity
vi.mock('../DataImportTab', () => ({
    DataImportTab: () => createElement('div', { 'data-testid': 'data-import-tab' }, 'DataImportTab'),
}));
vi.mock('../UserManagementTab', () => ({
    UserManagementTab: () => createElement('div', { 'data-testid': 'user-management-tab' }, 'UserManagementTab'),
}));
vi.mock('../SystemOverviewTab', () => ({
    SystemOverviewTab: () => createElement('div', { 'data-testid': 'system-overview-tab' }, 'SystemOverviewTab'),
}));
vi.mock('../ImportHistoryTab', () => ({
    ImportHistoryTab: () => createElement('div', { 'data-testid': 'import-history-tab' }, 'ImportHistoryTab'),
}));
vi.mock('../AuditLogTab', () => ({
    AuditLogTab: () => createElement('div', { 'data-testid': 'audit-log-tab' }, 'AuditLogTab'),
}));

describe('Admin', () => {
    it('renders admin header', () => {
        render(createElement(Admin));
        expect(screen.getByText('Admin Panel')).toBeInTheDocument();
        expect(screen.getByText('Manage data imports, users, and system settings')).toBeInTheDocument();
    });

    it('renders all tab buttons', () => {
        render(createElement(Admin));
        expect(screen.getByText('Data Import')).toBeInTheDocument();
        expect(screen.getByText('User Management')).toBeInTheDocument();
        expect(screen.getByText('System Overview')).toBeInTheDocument();
        expect(screen.getByText('Import History')).toBeInTheDocument();
        expect(screen.getByText('Audit Log')).toBeInTheDocument();
    });

    it('shows DataImportTab by default', () => {
        render(createElement(Admin));
        expect(screen.getByTestId('data-import-tab')).toBeInTheDocument();
    });

    it('switches to User Management tab', () => {
        render(createElement(Admin));
        fireEvent.click(screen.getByText('User Management'));
        expect(screen.getByTestId('user-management-tab')).toBeInTheDocument();
        expect(screen.queryByTestId('data-import-tab')).not.toBeInTheDocument();
    });

    it('switches to System Overview tab', () => {
        render(createElement(Admin));
        fireEvent.click(screen.getByText('System Overview'));
        expect(screen.getByTestId('system-overview-tab')).toBeInTheDocument();
    });

    it('switches to Import History tab', () => {
        render(createElement(Admin));
        fireEvent.click(screen.getByText('Import History'));
        expect(screen.getByTestId('import-history-tab')).toBeInTheDocument();
    });

    it('switches to Audit Log tab', () => {
        render(createElement(Admin));
        fireEvent.click(screen.getByText('Audit Log'));
        expect(screen.getByTestId('audit-log-tab')).toBeInTheDocument();
    });
});
