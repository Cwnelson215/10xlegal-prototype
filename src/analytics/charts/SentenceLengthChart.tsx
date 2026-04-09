import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { CHART_PALETTE, AXIS_TICK_STYLE, GRID_PROPS, BAR_HOVER_PROPS, classifyOutcome } from '../chartTheme';
import type { CaseRecord } from '../../types';

const BUCKETS = [
    { label: '0-30 days', maxDays: 30 },
    { label: '1-6 months', maxDays: 182 },
    { label: '6-12 months', maxDays: 365 },
    { label: '1-5 years', maxDays: 1825 },
    { label: '5+ years', maxDays: Infinity },
];

function parseSentenceDays(text: string): number | null {
    if (!text) return null;
    const lower = text.toLowerCase();

    const yearMatch = lower.match(/(\d+)\s*year/);
    if (yearMatch?.[1]) return parseInt(yearMatch[1], 10) * 365;

    const monthMatch = lower.match(/(\d+)\s*month/);
    if (monthMatch?.[1]) return parseInt(monthMatch[1], 10) * 30;

    const dayMatch = lower.match(/(\d+)\s*day/);
    if (dayMatch?.[1]) return parseInt(dayMatch[1], 10);

    // Try bare number (assume days)
    const bareNumber = lower.match(/^(\d+)$/);
    if (bareNumber?.[1]) return parseInt(bareNumber[1], 10);

    return null;
}

export function SentenceLengthChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        const bucketCounts = BUCKETS.map((b) => ({ label: b.label, count: 0, maxDays: b.maxDays }));

        for (const c of cases) {
            let days: number | null = null;

            // Try main sentence field
            days = parseSentenceDays(c.sentence);

            // Try sentenceDescription
            if (days === null) days = parseSentenceDays(c.sentenceDescription);

            // Try charges array
            if (days === null && c.charges?.length) {
                for (const charge of c.charges) {
                    if (charge.value && charge.units) {
                        const val = parseInt(charge.value, 10);
                        if (!isNaN(val) && val > 0) {
                            const unit = charge.units.toLowerCase();
                            if (unit.includes('year')) days = val * 365;
                            else if (unit.includes('month')) days = val * 30;
                            else if (unit.includes('day')) days = val;
                        }
                    } else if (charge.sentence) {
                        days = parseSentenceDays(charge.sentence);
                    }
                    if (days !== null) break;
                }
            }

            // Fallback: use filing-to-disposition duration for convicted cases
            if (days === null && c.filingDate && c.dispositionDate) {
                const outcome = classifyOutcome(c.ruling);
                if (outcome === 'guilty' || outcome === 'noContest') {
                    const filing = new Date(c.filingDate).getTime();
                    const disposition = new Date(c.dispositionDate).getTime();
                    if (!isNaN(filing) && !isNaN(disposition) && disposition > filing) {
                        days = Math.round((disposition - filing) / (1000 * 60 * 60 * 24));
                    }
                }
            }

            if (days !== null && days > 0) {
                for (const bucket of bucketCounts) {
                    if (days <= bucket.maxDays) {
                        bucket.count++;
                        break;
                    }
                }
            }
        }

        return bucketCounts.map(({ label, count }) => ({ label, count }));
    }, [cases]);

    const hasData = data.some((d) => d.count > 0);
    if (!hasData) return <p className="chart-empty">No sentence data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="label" tick={{ ...AXIS_TICK_STYLE, fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={AXIS_TICK_STYLE} />
                <CustomTooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Cases" activeBar={BAR_HOVER_PROPS}>
                    {data.map((_, i) => (
                        <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]!} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
