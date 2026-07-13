import { Settings, Sun, Moon } from 'lucide-react';
import { Button } from './ui/Button';
import { useTheme } from '../../lib/theme';
import { motion } from 'framer-motion';

interface HeaderProps {
    providerName: string;
    modelName: string;
    onSettingsClick: () => void;
}

export const Header = ({ providerName, modelName, onSettingsClick }: HeaderProps) => {
    const { resolvedTheme, toggleTheme } = useTheme();

    return (
        <motion.header 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-between px-5 py-4 bg-paper-surface/80 backdrop-blur-md border-b border-edge/50 sticky top-0 z-20"
        >
            <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                    <img src="/termcheck_icon32.png" alt="TermCheck" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                    <h1 className="text-base font-bold text-ink-primary leading-tight tracking-tight">TermCheck</h1>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-medium text-ink-secondary">{providerName}</span>
                        <span className="w-1 h-1 rounded-full bg-edge-light flex-shrink-0" />
                        <span className="text-[11px] font-mono text-ink-muted truncate max-w-[150px]" title={modelName}>
                            {modelName}
                        </span>
                    </div>
                    <a 
                        href="https://datagent.co.ke" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[10px] text-ink-muted hover:text-brand transition-colors mt-0.5 inline-block"
                    >
                        Powered by DataGent ↗
                    </a>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={toggleTheme} className="w-8 h-8 p-0 rounded-lg text-ink-muted hover:text-ink-primary" title="Toggle theme">
                    {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    <span className="sr-only">Toggle theme</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={onSettingsClick} className="w-8 h-8 p-0 rounded-lg text-ink-muted hover:text-ink-primary">
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Settings</span>
                </Button>
            </div>
        </motion.header>
    );
};
