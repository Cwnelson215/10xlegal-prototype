export function exportChartAsImage(containerEl: HTMLElement, filename: string): void {
    const svg = containerEl.querySelector('svg');
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 2; // retina
        canvas.width = svg.clientWidth * scale;
        canvas.height = svg.clientHeight * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(scale, scale);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
            if (!blob) return;
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${filename}.png`;
            a.click();
            URL.revokeObjectURL(a.href);
        }, 'image/png');
        URL.revokeObjectURL(url);
    };
    img.src = url;
}

export function exportDataAsCsv(data: Record<string, unknown>[], filename: string): void {
    if (data.length === 0) return;

    const first = data[0];
    if (!first) return;
    const headers = Object.keys(first);
    const rows = data.map((row) =>
        headers.map((h) => {
            const val = row[h];
            const str = val == null ? '' : String(val);
            return str.includes(',') || str.includes('"') || str.includes('\n')
                ? `"${str.replace(/"/g, '""')}"`
                : str;
        }).join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
}

export async function copyDataToClipboard(data: Record<string, unknown>[]): Promise<void> {
    if (data.length === 0) return;

    const first = data[0];
    if (!first) return;
    const headers = Object.keys(first);
    const rows = data.map((row) =>
        headers.map((h) => String(row[h] ?? '')).join('\t')
    );
    const text = [headers.join('\t'), ...rows].join('\n');
    await navigator.clipboard.writeText(text);
}
