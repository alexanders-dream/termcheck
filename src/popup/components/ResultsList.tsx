import { LegalFlag } from '../../lib/types';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { AlertTriangle, Info, AlertCircle, Download, RefreshCw } from 'lucide-react';
import { downloadMarkdownReport, downloadJSONReport } from '../../lib/reports';

interface ResultsListProps {
    flags: LegalFlag[];
    onRescan: () => void;
    pageUrl: string;
    pageTitle: string;
}

export const ResultsList = ({ flags, onRescan, pageUrl, pageTitle }: ResultsListProps) => {
    const getSeverityIcon = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical': return <AlertCircle className="h-5 w-5 text-red-700" aria-label="Critical severity" />;
            case 'high': return <AlertTriangle className="h-5 w-5 text-orange-500" aria-label="High severity" />;
            case 'medium': return <AlertTriangle className="h-5 w-5 text-yellow-500" aria-label="Medium severity" />;
            case 'low': return <Info className="h-5 w-5 text-blue-500" aria-label="Low severity" />;
            default: return <Info className="h-5 w-5 text-slate-500" aria-label="Unknown severity" />;
        }
    };

    const getSeverityBadgeVariant = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical': return 'destructive';
            case 'high': return 'destructive';
            case 'medium': return 'warning';
            case 'low': return 'info';
            default: return 'secondary';
        }
    };

    const getSeverityWeight = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical': return 4;
            case 'high': return 3;
            case 'medium': return 2;
            case 'low': return 1;
            default: return 0;
        }
    };

    const sortedFlags = [...flags].sort((a, b) => {
        return getSeverityWeight(b.severity) - getSeverityWeight(a.severity);
    });

    const criticalCount = flags.filter(f => f.severity === 'Critical').length;
    const highCount = flags.filter(f => f.severity === 'High').length;
    const overallRisk = criticalCount > 0 ? 'Critical' : highCount > 0 ? 'High' : flags.some(f => f.severity === 'Medium') ? 'Medium' : 'Low';

    return (
        <div className="space-y-4 pb-4" role="region" aria-label="Analysis results">
            <div className="flex justify-between items-center px-1">
                <h2 className="text-lg font-semibold text-slate-900" id="findings-heading">Findings ({flags.length})</h2>
                <button
                    onClick={onRescan}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                    aria-label="Rescan current page"
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Rescan Page
                </button>
            </div>

            {/* Overall Risk Summary */}
            <div className={`p-3 rounded-lg border ${overallRisk === 'Critical' ? 'bg-red-50 border-red-200 text-red-800' : overallRisk === 'High' ? 'bg-orange-50 border-orange-200 text-orange-800' : overallRisk === 'Medium' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Overall Risk:</span>
                    <span className="text-sm font-bold uppercase">{overallRisk}</span>
                </div>
                <div className="flex gap-4 mt-2 text-xs">
                    <span>Critical: {criticalCount}</span>
                    <span>High: {highCount}</span>
                    <span>Medium: {flags.filter(f => f.severity === 'Medium').length}</span>
                    <span>Low: {flags.filter(f => f.severity === 'Low').length}</span>
                </div>
            </div>

            {/* Download Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={() => downloadMarkdownReport(flags, pageUrl, pageTitle)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    aria-label="Download Markdown report"
                >
                    <Download className="h-3.5 w-3.5" />
                    Export Markdown
                </button>
                <button
                    onClick={() => downloadJSONReport(flags, pageUrl, pageTitle)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    aria-label="Download JSON report"
                >
                    <Download className="h-3.5 w-3.5" />
                    Export JSON
                </button>
            </div>

            <div className="space-y-3" role="list" aria-labelledby="findings-heading">
                {sortedFlags.map((flag, idx) => (
                    <Card key={idx} className="overflow-hidden transition-all hover:shadow-md" role="listitem">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex-shrink-0">
                                    {getSeverityIcon(flag.severity)}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            {flag.category}
                                        </span>
                                        <Badge variant={getSeverityBadgeVariant(flag.severity)} className="capitalize">
                                            {flag.severity}
                                        </Badge>
                                    </div>

                                    <p className="text-sm font-medium text-slate-900 leading-snug">
                                        {flag.summary}
                                    </p>

                                    <div className="relative rounded bg-slate-50 p-3 text-xs text-slate-600 italic border-l-2 border-slate-300">
                                        "{flag.quote}"
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="text-center space-y-4">
                    <p className="text-sm text-slate-500">
                        Find this tool useful? Support its development!
                    </p>
                    <div className="flex justify-center">
                        <a href="https://www.buymeacoffee.com/oguso" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105" aria-label="Support the developer on Buy Me A Coffee">
                            <img
                                src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png"
                                alt="Buy Me A Coffee"
                                style={{ height: '50px', width: '180px' }}
                            />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
