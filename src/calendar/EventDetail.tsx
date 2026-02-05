import type { CalendarEvent } from './calendarUtils';

type EventDetailProps = {
    events: CalendarEvent[];
    selectedDate: string | null;
};

export function EventDetail({ events, selectedDate }: EventDetailProps) {
    if (!selectedDate) {
        return (
            <div className="event-detail">
                <p className="no-selection">Select a day to view events.</p>
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="event-detail">
                <h3>Events on {selectedDate}</h3>
                <p className="no-events">No events on this day.</p>
            </div>
        );
    }

    return (
        <div className="event-detail">
            <h3>Events on {selectedDate}</h3>
            <ul className="detail-list">
                {events.map((event) => (
                    <li key={event.id} className={`detail-item ${event.type}`}>
                        <div className="detail-header">
                            <span className={`detail-badge ${event.type}`}>
                                {event.type === 'court-date' ? 'Court' : 'Deadline'}
                            </span>
                            <span className="detail-case">{event.caseNumber}</span>
                        </div>
                        <p className="detail-title">{event.title}</p>
                        <p className="detail-desc">{event.detail}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}
