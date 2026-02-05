import { useMemo, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCaseData, useDeadlineData } from '../hooks';
import { MonthGrid } from './MonthGrid';
import { UpcomingEvents } from './UpcomingEvents';
import { EventDetail } from './EventDetail';
import { buildCalendarEvents, getEventsForDate, getUpcomingEvents } from './calendarUtils';
import type { CalendarEvent } from './calendarUtils';
import './calendar.css';

export function Calendar() {
    const { user, isAuthenticated } = useAuth();
    const { cases, isLoading: casesLoading, errorMessage: casesError } = useCaseData();
    const { deadlines, isLoading: deadlinesLoading, errorMessage: deadlinesError } = useDeadlineData();

    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const isLoading = casesLoading || deadlinesLoading;
    const errorMessage = casesError || deadlinesError;

    const events = useMemo(() => buildCalendarEvents(cases, deadlines), [cases, deadlines]);

    const selectedEvents = useMemo(
        () => (selectedDate ? getEventsForDate(events, selectedDate) : []),
        [events, selectedDate],
    );

    const upcoming = useMemo(() => getUpcomingEvents(events, 15), [events]);

    const handlePrev = useCallback(() => {
        setMonth((m) => {
            if (m === 0) {
                setYear((y) => y - 1);
                return 11;
            }
            return m - 1;
        });
    }, []);

    const handleNext = useCallback(() => {
        setMonth((m) => {
            if (m === 11) {
                setYear((y) => y + 1);
                return 0;
            }
            return m + 1;
        });
    }, []);

    const handleSelectEvent = useCallback((event: CalendarEvent) => {
        setSelectedDate(event.date);
    }, []);

    return (
        <div className="calendar-container">
            <header className="calendar-header">
                <div className="header-content">
                    <h1>Calendar</h1>
                    <p>
                        {isAuthenticated && user
                            ? `Court dates and deadlines for ${user.name}`
                            : 'All court dates and deadlines'}
                    </p>
                </div>
            </header>

            {isLoading && <div className="calendar-state">Loading calendar...</div>}
            {!isLoading && errorMessage && <div className="calendar-state error">{errorMessage}</div>}

            {!isLoading && !errorMessage && (
                <div className="calendar-content">
                    <div className="calendar-main">
                        <MonthGrid
                            year={year}
                            month={month}
                            events={events}
                            selectedDate={selectedDate}
                            onSelectDate={setSelectedDate}
                            onPrev={handlePrev}
                            onNext={handleNext}
                        />
                        <EventDetail events={selectedEvents} selectedDate={selectedDate} />
                    </div>
                    <aside className="calendar-sidebar">
                        <UpcomingEvents events={upcoming} onSelectEvent={handleSelectEvent} />
                    </aside>
                </div>
            )}
        </div>
    );
}
