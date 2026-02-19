import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { casesService } from '../api/services/casesService';
import type { CaseRecord } from '../types';

export function useCaseData() {
    const { user, isAuthenticated } = useAuth();
    const [allCases, setAllCases] = useState<CaseRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadCases = async () => {
            try {
                setIsLoading(true);
                setErrorMessage('');
                const response = await casesService.getCases(1, 1000);
                if (isMounted) {
                    setAllCases(response.data);
                }
            } catch (error) {
                if (isMounted) {
                    setErrorMessage(error instanceof Error ? error.message : 'Unable to load cases.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadCases();
        return () => { isMounted = false; };
    }, []);

    const cases = useMemo(() => {
        if (!isAuthenticated || !user) {
            return allCases; // demo mode — show all
        }

        switch (user.role) {
            case 'client':
                return allCases.filter((c) => c.clientId === user.id);
            case 'lawyer':
                return allCases.filter(
                    (c) => c.defenseAttorney === user.name || c.prosecutionAttorney === user.name,
                );
            case 'legal-official':
                return allCases; // admin sees everything
            default:
                return allCases;
        }
    }, [allCases, isAuthenticated, user]);

    return { cases, allCases, isLoading, errorMessage };
}
