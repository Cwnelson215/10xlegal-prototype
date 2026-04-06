import type { Payload } from 'recharts/types/component/DefaultTooltipContent';

type Formatter = (value: number, name: string) => string;

interface CustomTooltipProps {
    active?: boolean | undefined;
    payload?: Payload<number, string>[] | undefined;
    label?: string | number | undefined;
    formatter?: Formatter | undefined;
}

export function CustomTooltip({ active, payload, label, formatter }: CustomTooltipProps) {
    if (!active || !payload?.length) return null;

    return (
        <div className="custom-tooltip">
            {label != null && <p className="custom-tooltip-label">{String(label)}</p>}
            {payload.map((entry: Payload<number, string>, i: number) => (
                <p key={i} className="custom-tooltip-item" style={{ color: entry.color }}>
                    <span className="custom-tooltip-dot" style={{ backgroundColor: entry.color }} />
                    {entry.name}: {formatter ? formatter(entry.value ?? 0, entry.name ?? '') : (entry.value ?? 0).toLocaleString()}
                </p>
            ))}
        </div>
    );
}
