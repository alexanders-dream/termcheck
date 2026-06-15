import { LegalFlag } from '../../lib/types';
import { Button } from './ui/Button';
import { ResultsList } from './ResultsList';
import { FileText, Search, FileWarning } from 'lucide-react';

interface AnalyzeViewProps {
    loading: boolean;
    flags: LegalFlag[];
    onAnalyze: () => void;
    pageUrl: string;
    pageTitle: string;
}

export const AnalyzeView = ({ loading, flags, onAnalyze, pageUrl, pageTitle }: AnalyzeViewProps) => {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 py-12 text-center space-y-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                    <div className="relative bg-white p-4 rounded-full shadow-sm border border-blue-100">
                        <Search className="h-8 w-8 text-blue-600 animate-pulse" />
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-medium text-slate-900">Analyzing Document</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-[200px]">
                        Scanning for legal terms and potential risks...
                    </p>
                </div>
            </div>
        );
    }

    if (flags.length > 0) {
        return <ResultsList flags={flags} onRescan={onAnalyze} pageUrl={pageUrl} pageTitle={pageTitle} />;
    }

    return (
        <div className="flex flex-col items-center justify-center flex-1 py-12 text-center space-y-6" role="region" aria-label="Ready to scan">
            <div className="bg-blue-50 p-6 rounded-full">
                <FileText className="h-12 w-12 text-blue-600" />
            </div>

            <div className="space-y-2 max-w-[280px]">
                <h2 className="text-xl font-semibold text-slate-900">Ready to Scan</h2>
                <p className="text-sm text-slate-500">
                    Navigate to a Terms of Service, Privacy Policy, or Contract page and click analyze.
                </p>
                <div className="flex items-center gap-2 text-amber-600 text-xs">
                    <FileWarning className="h-4 w-4 flex-shrink-0" />
                    <span>Supports web pages and browser-opened PDFs</span>
                </div>
            </div>

            <Button
                size="lg"
                onClick={onAnalyze}
                className="w-full max-w-[200px] shadow-lg shadow-blue-600/20"
                aria-label="Analyze current page"
            >
                Analyze Page
            </Button>
        </div>
    );
};
