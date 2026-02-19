import { http, HttpResponse } from 'msw';

const mockCases = [
    {
        id: 'case-1',
        title: 'Test Case 1',
        description: 'Test case description',
        status: 'active',
        caseNumber: '21-CR-10001',
        clientId: 'client-1',
        lawyerId: '',
        county: 'Salt Lake',
        judge: 'Hon. Test Judge',
        judgeId: 'judge-1',
        prosecutionAttorney: 'Test Prosecutor',
        prosecutionAttorneyId: 'att-1',
        prosecutionFirm: 'Test Prosecution Firm',
        prosecutionFirmId: 'firm-1',
        defenseAttorney: 'Test Defender',
        defenseAttorneyId: 'att-2',
        defenseFirm: 'Test Defense Firm',
        defenseFirmId: 'firm-2',
        charge: 'Test Charge',
        courtDate: '2026-06-15',
        ruling: 'Pending',
        sentence: '',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
        id: 'case-2',
        title: 'Test Case 2',
        description: 'Another test case',
        status: 'closed',
        caseNumber: '21-CR-10002',
        clientId: 'client-2',
        lawyerId: '',
        county: 'Utah',
        judge: 'Hon. Another Judge',
        judgeId: 'judge-2',
        prosecutionAttorney: 'Another Prosecutor',
        prosecutionAttorneyId: 'att-3',
        prosecutionFirm: 'Test Prosecution Firm',
        prosecutionFirmId: 'firm-1',
        defenseAttorney: 'Another Defender',
        defenseAttorneyId: 'att-4',
        defenseFirm: 'Another Defense Firm',
        defenseFirmId: 'firm-3',
        charge: 'Another Charge',
        courtDate: '2026-05-10',
        ruling: 'Guilty',
        sentence: '30 days',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    },
];

const mockDeadlines = [
    {
        id: 'dl-1',
        title: 'Filing Deadline',
        description: 'File motion',
        dueDate: '2026-07-01',
        caseId: 'case-1',
        caseNumber: '21-CR-10001',
        assignedTo: 'Test Defender',
        status: 'pending',
        clientId: 'client-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    },
];

const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'legal-official',
    verificationStatus: 'verified',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
};

export const handlers = [
    http.get('/api/cases', () => {
        return HttpResponse.json({
            data: mockCases,
            total: mockCases.length,
            page: 1,
            pageSize: 1000,
            totalPages: 1,
        });
    }),

    http.get('/api/cases/:id', ({ params }) => {
        const found = mockCases.find((c) => c.id === params.id);
        if (!found) return HttpResponse.json({ success: false, error: 'Not found' }, { status: 404 });
        return HttpResponse.json({ success: true, data: found });
    }),

    http.get('/api/deadlines', () => {
        return HttpResponse.json({
            data: mockDeadlines,
            total: mockDeadlines.length,
            page: 1,
            pageSize: 1000,
            totalPages: 1,
        });
    }),

    http.post('/api/auth/login', async ({ request }) => {
        const body = await request.json() as Record<string, string>;
        if (body.email === 'test@example.com' && body.password === 'password123') {
            return HttpResponse.json({
                success: true,
                data: {
                    token: 'mock-jwt-token',
                    refreshToken: 'mock-refresh-token',
                    user: mockUser,
                },
            });
        }
        return HttpResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }),

    http.get('/api/auth/verify-token', () => {
        return HttpResponse.json({ success: true, data: mockUser });
    }),

    http.post('/api/auth/logout', () => {
        return HttpResponse.json({ success: true, data: null });
    }),

    http.get('/api/judges', () => {
        return HttpResponse.json({
            data: [{ id: 'judge-1', name: 'Hon. Test Judge', caseCount: 1, counties: ['Salt Lake'], createdAt: '', updatedAt: '' }],
            total: 1, page: 1, pageSize: 100, totalPages: 1,
        });
    }),

    http.get('/api/attorneys', () => {
        return HttpResponse.json({
            data: [], total: 0, page: 1, pageSize: 100, totalPages: 1,
        });
    }),

    http.get('/api/firms', () => {
        return HttpResponse.json({
            data: [], total: 0, page: 1, pageSize: 100, totalPages: 1,
        });
    }),
];
