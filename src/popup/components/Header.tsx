import { Settings } from 'lucide-react';
import { Button } from './ui/Button';

interface HeaderProps {
    providerName: string;
    modelName: string;
    onSettingsClick: () => void;
}

export const Header = ({ providerName, modelName, onSettingsClick }: HeaderProps) => {
    return (
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
            <div>
                <h1 className="text-xl font-bold text-blue-600 tracking-tight">TermCheck</h1>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{providerName}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="truncate max-w-[150px]">{modelName}</span>
                </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onSettingsClick} className="text-slate-500 hover:text-blue-600">
                <Settings className="h-5 w-5" />
            </Button>
        </header>
    );
};
