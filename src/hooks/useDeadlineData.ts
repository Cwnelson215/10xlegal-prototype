import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export type DeadlineRecord = {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    caseNumber: string;
    assignedTo: string;
    status: string;
    clientId: string;
};

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
                const dataUrl = new URL('../data/fake-deadlines.json', import.meta.url).href;
                const response = await fetch(dataUrl);
                if (!response.ok) {
                    throw new Error('Unable to load deadline data.');
                }
                const data = (await response.json()) as DeadlineRecord[];
                if (isMounted) {
                    setAllDeadlines(data);
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
