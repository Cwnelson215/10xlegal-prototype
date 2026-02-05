import type { CalendarEvent } from './calendarUtils';

type UpcomingEventsProps = {
    events: CalendarEvent[];
    onSelectEvent: (event: CalendarEvent) => void;
};

export function UpcomingEvents({ events, onSelectEvent }: UpcomingEventsProps) {
    if (events.length === 0) {
        return (
            <div className="upcoming-events">
                <h3>Upcoming Events</h3>
                <p className="no-events">No upcoming events.</p>
            </div>
        );
    }

    return (
        <div className="upcoming-events">
            <h3>Upcoming Events</h3>
            <ul className="event-list">
                {events.map((event) => (
                    <li
                        key={event.id}
                        className={`event-item ${event.type}`}
                        onClick={() => onSelectEvent(event)}
                    >
                        <span className="event-date">{event.date}</span>
                        <span className="event-title">{event.title}</span>
                        <span className="event-case">{event.caseNumber}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
