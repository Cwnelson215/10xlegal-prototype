interface KpiCardProps {
    label: string;
    value: string | number;
    accentColor?: string;
    subtitle?: string;
}

export function KpiCard({ label, value, accentColor = '#2680C2', subtitle }: KpiCardProps) {
    return (
        <div className="kpi-card" style={{ borderLeftColor: accentColor }}>
            <p className="kpi-label">{label}</p>
            <p className="kpi-value">{value}</p>
            {subtitle && <p className="kpi-subtitle">{subtitle}</p>}
        </div>
    );
}
