import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { deadlinesService } from '../api/services/deadlinesService';
import type { Deadline } from '../api/types';

export type DeadlineRecord = Deadline;

export function useDeadlineData() {
    const { user, isAuthenticated } = useAuth();
    const [allDeadlines, setAllDeadlines] = useState<DeadlineRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadDeadlines = async () => {
            try {
                setIsLoading(true);
                setErrorMessage('');
                const response = await deadlinesService.getDeadlines(undefined, 1, 1000);
                if (isMounted) {
                    setAllDeadlines(response.data);
                }
            } catch (error) {
                if (isMounted) {
                    setErrorMessage(error instanceof Error ? error.message : 'Unable to load deadlines.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadDeadlines();
        return () => { isMounted = false; };
    }, []);

    const deadlines = useMemo(() => {
        if (!isAuthenticated || !user) {
            return allDeadlines;
        }

        switch (user.role) {
            case 'client':
                return allDeadlines.filter((d) => d.clientId === user.id);
            case 'lawyer':
                return allDeadlines.filter((d) => d.assignedTo === user.name);
            case 'legal-official':
                return allDeadlines;
            default:
                return allDeadlines;
        }
    }, [allDeadlines, isAuthenticated, user]);

    return { deadlines, allDeadlines, isLoading, errorMessage };
}
