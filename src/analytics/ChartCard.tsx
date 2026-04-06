import type { ReactNode } from 'react';

interface ChartCardProps {
    title: string;
    subtitle?: string;
    span?: 4 | 6 | 8 | 12;
    children: ReactNode;
}

export function ChartCard({ title, subtitle, span = 6, children }: ChartCardProps) {
    return (
        <div className={`chart-card span-${span}`}>
            <div className="chart-card-header">
                <h3>{title}</h3>
                {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
            </div>
            {children}
        </div>
    );
}
