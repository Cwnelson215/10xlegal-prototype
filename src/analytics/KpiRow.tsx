import type { ReactNode } from 'react';

export function KpiRow({ children }: { children: ReactNode }) {
    return <div className="kpi-row">{children}</div>;
}
