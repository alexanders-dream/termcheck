import { LegalFlag } from '../../lib/types';
import { Button } from './ui/Button';
import { ResultsList } from './ResultsList';
import { FileText, Search } from 'lucide-react';

interface AnalyzeViewProps {
    loading: boolean;
    flags: LegalFlag[];
    onAnalyze: () => void;
}

export const AnalyzeView = ({ loading, flags, onAnalyze }: AnalyzeViewProps) => {
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
        return <ResultsList flags={flags} onRescan={onAnalyze} />;
    }

    return (
        <div className="flex flex-col items-center justify-center flex-1 py-12 text-center space-y-6">
            <div className="bg-blue-50 p-6 rounded-full">
                <FileText className="h-12 w-12 text-blue-600" />
            </div>

            <div className="space-y-2 max-w-[280px]">
                <h2 className="text-xl font-semibold text-slate-900">Ready to Scan</h2>
                <p className="text-sm text-slate-500">
                    Navigate to a Terms of Service or Privacy Policy page and click analyze.
                </p>
            </div>

            <Button
                size="lg"
                onClick={onAnalyze}
                className="w-full max-w-[200px] shadow-lg shadow-blue-600/20"
            >
                Analyze Page
            </Button>
        </div>
    );
};
