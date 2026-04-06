import type { TooltipProps } from 'recharts';

type Formatter = (value: number, name: string) => string;

interface CustomTooltipProps extends TooltipProps<number, string> {
    formatter?: Formatter;
}

export function CustomTooltip({ active, payload, label, formatter }: CustomTooltipProps) {
    if (!active || !payload?.length) return null;

    return (
        <div className="custom-tooltip">
            {label != null && <p className="custom-tooltip-label">{label}</p>}
            {payload.map((entry, i) => (
                <p key={i} className="custom-tooltip-item" style={{ color: entry.color }}>
                    <span className="custom-tooltip-dot" style={{ backgroundColor: entry.color }} />
                    {entry.name}: {formatter ? formatter(entry.value ?? 0, entry.name ?? '') : (entry.value ?? 0).toLocaleString()}
                </p>
            ))}
        </div>
    );
}
