import type { CaseRecord } from '../types';
import type { DeadlineRecord } from '../hooks/useDeadlineData';

export type CalendarEvent = {
    id: string;
    date: string;
    title: string;
    type: 'court-date' | 'deadline' | 'filing-date' | 'disposition' | 'conviction';
    caseNumber: string;
    detail: string;
};

export function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 1).getDay();
}

export function buildCalendarEvents(
    cases: CaseRecord[],
    deadlines: DeadlineRecord[],
): CalendarEvent[] {
    const events: CalendarEvent[] = [];

    for (const c of cases) {
        const caseKey = c.districtNumber ? `${c.caseNumber}-${c.districtNumber}` : c.caseNumber;
        events.push({
            id: `court-${caseKey}`,
            date: c.courtDate,
            title: `Court: ${c.caseNumber}`,
            type: 'court-date',
            caseNumber: c.caseNumber,
            detail: `${c.charge} — ${c.court}`,
        });

        if (c.filingDate) {
            events.push({
                id: `filing-${caseKey}`,
                date: c.filingDate,
                title: `Filed: ${c.caseNumber}`,
                type: 'filing-date',
                caseNumber: c.caseNumber,
                detail: `${c.charge} — ${c.court}`,
            });
        }

        if (c.dispositionDate && c.dispositionDate !== 'N/A') {
            events.push({
                id: `disposition-${caseKey}`,
                date: c.dispositionDate,
                title: `Disposition: ${c.caseNumber}`,
                type: 'disposition',
                caseNumber: c.caseNumber,
                detail: `${c.charge} — Ruling: ${c.ruling}`,
            });
        }

        if (c.convictionDate && c.convictionDate !== 'N/A') {
            events.push({
                id: `conviction-${caseKey}`,
                date: c.convictionDate,
                title: `Conviction: ${c.caseNumber}`,
                type: 'conviction',
                caseNumber: c.caseNumber,
                detail: `${c.charge} — ${c.convictionOutcome}`,
            });
        }
    }

    for (const d of deadlines) {
        events.push({
            id: d.id,
            date: d.dueDate,
            title: d.title,
            type: 'deadline',
            caseNumber: d.caseNumber,
            detail: `${d.description} — Assigned to ${d.assignedTo} — Status: ${d.status}`,
        });
    }

    return events;
}

export function getEventsForDate(events: CalendarEvent[], date: string): CalendarEvent[] {
    return events.filter((e) => e.date === date);
}

export function getUpcomingEvents(events: CalendarEvent[], count: number): CalendarEvent[] {
    const today = new Date().toISOString().slice(0, 10);
    return events
        .filter((e) => e.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, count);
}

export function formatMonthYear(year: number, month: number): string {
    const date = new Date(year, month, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function toDateString(year: number, month: number, day: number): string {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
}
