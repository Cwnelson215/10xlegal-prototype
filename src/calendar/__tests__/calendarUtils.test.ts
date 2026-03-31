import { describe, it, expect } from 'vitest';
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  buildCalendarEvents,
  getEventsForDate,
  getUpcomingEvents,
  formatMonthYear,
  toDateString,
} from '../calendarUtils';
import type { CaseRecord } from '../../types';
import type { DeadlineRecord } from '../../hooks/useDeadlineData';

describe('calendarUtils', () => {
  describe('getDaysInMonth', () => {
    it('returns 31 for January', () => {
      expect(getDaysInMonth(2026, 0)).toBe(31);
    });

    it('returns 28 for February in non-leap year', () => {
      expect(getDaysInMonth(2025, 1)).toBe(28);
    });

    it('returns 29 for February in leap year', () => {
      expect(getDaysInMonth(2024, 1)).toBe(29);
    });

    it('returns 30 for April', () => {
      expect(getDaysInMonth(2026, 3)).toBe(30);
    });
  });

  describe('getFirstDayOfMonth', () => {
    it('returns day of week (0=Sunday)', () => {
      // 2026-01-01 is a Thursday
      expect(getFirstDayOfMonth(2026, 0)).toBe(4);
    });
  });

  describe('buildCalendarEvents', () => {
    const mockCase = {
      id: 'c1',
      caseNumber: '21-CR-001',
      courtDate: '2026-06-15',
      charge: 'DUI',
      court: 'Salt Lake',
      filingDate: '2026-01-10',
      dispositionDate: '2026-07-01',
      ruling: 'Guilty',
      convictionDate: '2026-07-15',
      convictionOutcome: 'Convicted',
    } as CaseRecord;

    const mockDeadline = {
      id: 'd1',
      title: 'File Motion',
      dueDate: '2026-06-10',
      caseNumber: '21-CR-001',
      description: 'Motion to dismiss',
      assignedTo: 'John',
      status: 'pending',
    } as DeadlineRecord;

    it('creates court-date events from cases', () => {
      const events = buildCalendarEvents([mockCase], []);
      const courtEvent = events.find(e => e.type === 'court-date');
      expect(courtEvent).toBeDefined();
      expect(courtEvent!.date).toBe('2026-06-15');
      expect(courtEvent!.caseNumber).toBe('21-CR-001');
    });

    it('creates filing-date events when filingDate exists', () => {
      const events = buildCalendarEvents([mockCase], []);
      const filingEvent = events.find(e => e.type === 'filing-date');
      expect(filingEvent).toBeDefined();
      expect(filingEvent!.date).toBe('2026-01-10');
    });

    it('creates disposition events when dispositionDate exists', () => {
      const events = buildCalendarEvents([mockCase], []);
      const dispEvent = events.find(e => e.type === 'disposition');
      expect(dispEvent).toBeDefined();
      expect(dispEvent!.date).toBe('2026-07-01');
    });

    it('creates conviction events when convictionDate exists', () => {
      const events = buildCalendarEvents([mockCase], []);
      const convEvent = events.find(e => e.type === 'conviction');
      expect(convEvent).toBeDefined();
      expect(convEvent!.date).toBe('2026-07-15');
    });

    it('skips disposition when date is N/A', () => {
      const caseWithNA = { ...mockCase, dispositionDate: 'N/A' } as CaseRecord;
      const events = buildCalendarEvents([caseWithNA], []);
      expect(events.find(e => e.type === 'disposition')).toBeUndefined();
    });

    it('creates deadline events', () => {
      const events = buildCalendarEvents([], [mockDeadline]);
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('deadline');
      expect(events[0]!.title).toBe('File Motion');
    });

    it('combines case and deadline events', () => {
      const events = buildCalendarEvents([mockCase], [mockDeadline]);
      expect(events.length).toBeGreaterThan(1);
      expect(events.some(e => e.type === 'court-date')).toBe(true);
      expect(events.some(e => e.type === 'deadline')).toBe(true);
    });
  });

  describe('getEventsForDate', () => {
    const events = [
      { id: '1', date: '2026-06-15', title: 'A', type: 'court-date' as const, caseNumber: 'X', detail: '' },
      { id: '2', date: '2026-06-15', title: 'B', type: 'deadline' as const, caseNumber: 'Y', detail: '' },
      { id: '3', date: '2026-06-16', title: 'C', type: 'court-date' as const, caseNumber: 'Z', detail: '' },
    ];

    it('returns events matching the date', () => {
      const result = getEventsForDate(events, '2026-06-15');
      expect(result).toHaveLength(2);
    });

    it('returns empty array when no events match', () => {
      expect(getEventsForDate(events, '2026-01-01')).toHaveLength(0);
    });
  });

  describe('getUpcomingEvents', () => {
    const events = [
      { id: '1', date: '2099-01-01', title: 'Future1', type: 'court-date' as const, caseNumber: '', detail: '' },
      { id: '2', date: '2099-06-01', title: 'Future2', type: 'deadline' as const, caseNumber: '', detail: '' },
      { id: '3', date: '2000-01-01', title: 'Past', type: 'court-date' as const, caseNumber: '', detail: '' },
    ];

    it('filters out past events', () => {
      const result = getUpcomingEvents(events, 10);
      expect(result.every(e => e.date >= new Date().toISOString().slice(0, 10))).toBe(true);
    });

    it('sorts by date ascending', () => {
      const result = getUpcomingEvents(events, 10);
      expect(result[0]!.title).toBe('Future1');
      expect(result[1]!.title).toBe('Future2');
    });

    it('respects count limit', () => {
      const result = getUpcomingEvents(events, 1);
      expect(result).toHaveLength(1);
    });
  });

  describe('formatMonthYear', () => {
    it('formats month and year', () => {
      expect(formatMonthYear(2026, 0)).toBe('January 2026');
      expect(formatMonthYear(2026, 11)).toBe('December 2026');
    });
  });

  describe('toDateString', () => {
    it('returns zero-padded date string', () => {
      expect(toDateString(2026, 0, 5)).toBe('2026-01-05');
      expect(toDateString(2026, 11, 25)).toBe('2026-12-25');
    });

    it('handles double-digit months and days', () => {
      expect(toDateString(2026, 9, 15)).toBe('2026-10-15');
    });
  });
});
