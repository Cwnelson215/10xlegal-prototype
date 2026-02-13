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

    return (
        <div
            className={`day-cell${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${hasCourtDate ? ' has-court-date' : ''}${hasDeadline ? ' has-deadline' : ''}`}
            onClick={onClick}
        >
            <span className="day-number">{day}</span>
            <div className="day-dots">
                {hasCourtDate && <span className="dot court-dot" />}
                {hasDeadline && <span className="dot deadline-dot" />}
            </div>
        </div>
    );
}
