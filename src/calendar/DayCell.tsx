import type { CalendarEvent } from './calendarUtils';

type DayCellProps = {
    day: number | null;
    dateString: string | null;
    events: CalendarEvent[];
    isToday: boolean;
    isSelected: boolean;
    onClick: () => void;
};

export function DayCell({ day, events, isToday, isSelected, onClick }: DayCellProps) {
    if (day === null) {
        return <div className="day-cell empty" />;
    }

    const hasCourtDate = events.some((e) => e.type === 'court-date');
    const hasDeadline = events.some((e) => e.type === 'deadline');
    const hasFiling = events.some((e) => e.type === 'filing-date');
    const hasDisposition = events.some((e) => e.type === 'disposition');
    const hasConviction = events.some((e) => e.type === 'conviction');

    return (
        <div
            className={`day-cell${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${hasCourtDate ? ' has-court-date' : ''}${hasDeadline ? ' has-deadline' : ''}${hasFiling ? ' has-filing' : ''}${hasDisposition ? ' has-disposition' : ''}${hasConviction ? ' has-conviction' : ''}`}
            onClick={onClick}
        >
            <span className="day-number">{day}</span>
            <div className="day-dots">
                {hasCourtDate && <span className="dot court-dot" />}
                {hasDeadline && <span className="dot deadline-dot" />}
                {hasFiling && <span className="dot filing-dot" />}
                {hasDisposition && <span className="dot disposition-dot" />}
                {hasConviction && <span className="dot conviction-dot" />}
            </div>
        </div>
    );
}
