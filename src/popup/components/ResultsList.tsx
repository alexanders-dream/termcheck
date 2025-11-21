import { LegalFlag } from '../../lib/types';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

interface ResultsListProps {
    flags: LegalFlag[];
    onRescan: () => void;
}

export const ResultsList = ({ flags, onRescan }: ResultsListProps) => {
    const getSeverityIcon = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical': return <AlertCircle className="h-5 w-5 text-red-600" />;
            case 'high': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
            case 'medium': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case 'low': return <Info className="h-5 w-5 text-blue-500" />;
            default: return <Info className="h-5 w-5 text-slate-500" />;
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

    return (
        <div className="space-y-4 pb-4">
            <div className="flex justify-between items-center px-1">
                <h2 className="text-lg font-semibold text-slate-900">Findings ({flags.length})</h2>
                <button
                    onClick={onRescan}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                    Rescan Page
                </button>
            </div>

            <div className="space-y-3">
                {sortedFlags.map((flag, idx) => (
                    <Card key={idx} className="overflow-hidden transition-all hover:shadow-md">
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
        </div>
    );
};
