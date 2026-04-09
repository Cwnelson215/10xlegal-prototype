import { useRef, useState, type ReactNode } from 'react';
import { exportChartAsImage, exportDataAsCsv, copyDataToClipboard } from './export';

interface ChartCardProps {
    title: string;
    subtitle?: string;
    span?: 4 | 6 | 8 | 12;
    exportData?: Record<string, unknown>[];
    highlighted?: boolean;
    children: ReactNode;
}

export function ChartCard({ title, subtitle, span = 6, exportData, highlighted, children }: ChartCardProps) {
    const chartRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);

    const slug = title.toLowerCase().replace(/\s+/g, '-');

    function handleExportImage() {
        if (chartRef.current) exportChartAsImage(chartRef.current, slug);
    }

    function handleExportCsv() {
        if (exportData) exportDataAsCsv(exportData, slug);
    }

    async function handleCopy() {
        if (exportData) {
            await copyDataToClipboard(exportData);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    const hasExport = exportData !== undefined || chartRef.current !== null;

    return (
        <div className={`chart-card span-${span}${highlighted ? ' chart-card--highlighted' : ''}`}>
            <div className="chart-card-header">
                <div className="chart-card-title-row">
                    <div>
                        <h3>{title}</h3>
                        {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
                    </div>
                    {hasExport && (
                        <div className="chart-export-btns">
                            <button
                                className="chart-export-btn"
                                onClick={handleExportImage}
                                title="Download as PNG"
                                aria-label="Download chart as PNG"
                            >
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H2zm4 4.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm7 6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.354-.854l3-3a.5.5 0 0 1 .708 0L7 9.293l2.146-2.147a.5.5 0 0 1 .708 0l3.5 3.5a.5.5 0 0 1 .146.354z" />
                                </svg>
                            </button>
                            {exportData && (
                                <>
                                    <button
                                        className="chart-export-btn"
                                        onClick={handleExportCsv}
                                        title="Download as CSV"
                                        aria-label="Download data as CSV"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                                            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
                                        </svg>
                                    </button>
                                    <button
                                        className="chart-export-btn"
                                        onClick={handleCopy}
                                        title={copied ? 'Copied!' : 'Copy to clipboard'}
                                        aria-label="Copy data to clipboard"
                                    >
                                        {copied ? (
                                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                                            </svg>
                                        ) : (
                                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
                                                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
                                            </svg>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div ref={chartRef}>
                {children}
            </div>
        </div>
    );
}
