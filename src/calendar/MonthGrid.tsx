import { useMemo } from 'react';
import { DayCell } from './DayCell';
import {
    getDaysInMonth,
    getFirstDayOfMonth,
    getEventsForDate,
    formatMonthYear,
    toDateString,
} from './calendarUtils';
import type { CalendarEvent } from './calendarUtils';

type MonthGridProps = {
    year: number;
    month: number;
    events: CalendarEvent[];
    selectedDate: string | null;
    onSelectDate: (date: string) => void;
    onPrev: () => void;
    onNext: () => void;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function MonthGrid({
    year,
    month,
    events,
    selectedDate,
    onSelectDate,
    onPrev,
    onNext,
}: MonthGridProps) {
    const todayStr = new Date().toISOString().slice(0, 10);

    const cells = useMemo(() => {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const result: Array<{ day: number | null; dateString: string | null }> = [];

        for (let i = 0; i < firstDay; i++) {
            result.push({ day: null, dateString: null });
        }
        for (let d = 1; d <= daysInMonth; d++) {
            result.push({ day: d, dateString: toDateString(year, month, d) });
        }
        return result;
    }, [year, month]);

    return (
        <div className="month-grid-wrapper">
            <div className="month-nav">
                <button className="month-nav-btn" onClick={onPrev}>
                    &lt; Prev
                </button>
                <h2 className="month-title">{formatMonthYear(year, month)}</h2>
                <button className="month-nav-btn" onClick={onNext}>
                    Next &gt;
                </button>
            </div>

            <div className="month-grid">
                {WEEKDAYS.map((wd) => (
                    <div key={wd} className="weekday-header">
                        {wd}
                    </div>
                ))}
                {cells.map((cell, idx) => (
                    <DayCell
                        key={idx}
                        day={cell.day}
                        dateString={cell.dateString}
                        events={cell.dateString ? getEventsForDate(events, cell.dateString) : []}
                        isToday={cell.dateString === todayStr}
                        isSelected={cell.dateString === selectedDate}
                        onClick={() => {
                            if (cell.dateString) {
                                onSelectDate(cell.dateString);
                            }
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
