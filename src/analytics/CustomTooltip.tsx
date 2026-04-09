import type { ReactNode } from 'react';
import type { Payload } from 'recharts/types/component/DefaultTooltipContent';

type Formatter = (value: number, name: string) => string;
type LabelFormatter = (label: string | number) => string;
type FooterFn = (payload: Payload<number, string>[]) => ReactNode;

interface CustomTooltipProps {
    active?: boolean | undefined;
    payload?: Payload<number, string>[] | undefined;
    label?: string | number | undefined;
    formatter?: Formatter | undefined;
    labelFormatter?: LabelFormatter | undefined;
    /** When set, each item shows "(X.X%)" computed as value / total. */
    total?: number | undefined;
    /** When true, each item shows "(X.X%)" as a share of the sum of the current payload. */
    percentOfRow?: boolean | undefined;
    /** Optional secondary content rendered below the items. */
    footer?: FooterFn | undefined;
}

function formatPercent(value: number, denom: number): string {
    if (!denom || denom <= 0) return '';
    const pct = (value / denom) * 100;
    if (!Number.isFinite(pct)) return '';
    return ` (${pct.toFixed(1)}%)`;
}

export function CustomTooltip({
    active,
    payload,
    label,
    formatter,
    labelFormatter,
    total,
    percentOfRow,
    footer,
}: CustomTooltipProps) {
    if (!active || !payload?.length) return null;

    const rowSum = percentOfRow
        ? payload.reduce((s, p) => s + (p.value ?? 0), 0)
        : 0;

    const displayLabel =
        label != null && labelFormatter ? labelFormatter(label) : label;

    return (
        <div className="custom-tooltip">
            {displayLabel != null && displayLabel !== '' && (
                <p className="custom-tooltip-label">{String(displayLabel)}</p>
            )}
            {payload.map((entry: Payload<number, string>, i: number) => {
                const value = entry.value ?? 0;
                const name = entry.name ?? '';
                const formatted = formatter
                    ? formatter(value, name)
                    : value.toLocaleString();
                let suffix = '';
                if (total != null) suffix = formatPercent(value, total);
                else if (percentOfRow) suffix = formatPercent(value, rowSum);
                return (
                    <p
                        key={i}
                        className="custom-tooltip-item"
                        style={{ color: entry.color }}
                    >
                        <span
                            className="custom-tooltip-dot"
                            style={{ backgroundColor: entry.color }}
                        />
                        {name}: {formatted}
                        {suffix}
                    </p>
                );
            })}
            {footer && (
                <div className="custom-tooltip-footer">{footer(payload)}</div>
            )}
        </div>
    );
}
