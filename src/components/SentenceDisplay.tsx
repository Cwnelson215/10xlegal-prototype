import './SentenceDisplay.css';

interface SentencePart {
    type: string;
    value: string;
    unit: string;
    category: 'custody' | 'financial' | 'probation' | 'other';
}

const UNIT_MAP: Record<string, string> = {
    'DD': 'days',
    'MM': 'months',
    'YY': 'years',
    '$$': '',
};

function getCategory(type: string): SentencePart['category'] {
    const lower = type.toLowerCase();
    if (lower.includes('jail') || lower.includes('prison')) return 'custody';
    if (lower.includes('fine') || lower.includes('surcharge') || lower.includes('fee')) return 'financial';
    if (lower.includes('probation')) return 'probation';
    return 'other';
}

function formatLabel(type: string): string {
    return type
        .replace(/\bSentenced\b/i, '')
        .replace(/\bSentence Fine Total\b/i, 'Fine Total')
        .replace(/\bSent\. Inc\.\b/i, '')
        .replace(/\bSuspended\b/i, 'Susp.')
        .trim()
        .replace(/:\s*$/, '')
        .trim();
}

function formatValue(value: string, unit: string): string {
    if (unit === '$$') {
        const num = parseFloat(value);
        if (!isNaN(num)) {
            return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `$${value}`;
    }
    const unitLabel = UNIT_MAP[unit] ?? unit;
    return `${value} ${unitLabel}`.trim();
}

function parseSentence(sentence: string): SentencePart[] {
    if (!sentence) return [];
    return sentence.split(';').map(part => {
        const trimmed = part.trim();
        if (!trimmed) return null;
        // Pattern: "Type: Value: Unit" e.g. "Jail Sentenced: 364: DD"
        const match = trimmed.match(/^(.+?):\s*(.+?):\s*(\S+)$/);
        if (match) {
            const [, type, value, unit] = match;
            return {
                type: type!.trim(),
                value: value!.trim(),
                unit: unit!.trim(),
                category: getCategory(type!),
            };
        }
        return { type: trimmed, value: '', unit: '', category: 'other' as const };
    }).filter((p): p is SentencePart => p !== null);
}

/** Deduplicate identical sentence parts */
function dedup(parts: SentencePart[]): (SentencePart & { count: number })[] {
    const seen = new Map<string, SentencePart & { count: number }>();
    for (const p of parts) {
        const key = `${p.type}|${p.value}|${p.unit}`;
        const existing = seen.get(key);
        if (existing) {
            existing.count++;
        } else {
            seen.set(key, { ...p, count: 1 });
        }
    }
    return Array.from(seen.values());
}

interface SentenceDisplayProps {
    sentence: string;
    compact?: boolean;
}

export function SentenceDisplay({ sentence, compact = false }: SentenceDisplayProps) {
    if (!sentence) return <span className="sentence-na">N/A</span>;

    const parts = parseSentence(sentence);
    if (parts.length === 0) return <span className="sentence-na">{sentence}</span>;

    const deduped = dedup(parts);

    if (compact && deduped.length > 4) {
        const shown = deduped.slice(0, 3);
        const remaining = deduped.length - 3;
        return (
            <div className="sentence-badges compact">
                {shown.map((p, i) => (
                    <span key={i} className={`sentence-badge ${p.category}`}>
                        <span className="badge-label">{formatLabel(p.type)}</span>
                        <span className="badge-value">{formatValue(p.value, p.unit)}</span>
                        {p.count > 1 && <span className="badge-count">&times;{p.count}</span>}
                    </span>
                ))}
                <span className="sentence-badge other">+{remaining} more</span>
            </div>
        );
    }

    return (
        <div className={`sentence-badges ${compact ? 'compact' : ''}`}>
            {deduped.map((p, i) => (
                <span key={i} className={`sentence-badge ${p.category}`}>
                    <span className="badge-label">{formatLabel(p.type)}</span>
                    {p.value && <span className="badge-value">{formatValue(p.value, p.unit)}</span>}
                    {p.count > 1 && <span className="badge-count">&times;{p.count}</span>}
                </span>
            ))}
        </div>
    );
}
