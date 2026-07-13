import { Button } from './ui/Button';
import { motion } from 'framer-motion';
import { FileText, Search, FileWarning, Shield } from 'lucide-react';

interface AnalyzeViewProps {
  loading: boolean;
  onAnalyze: () => void;
  pageUrl: string;
  pageTitle: string;
}

export const AnalyzeView = ({ loading, onAnalyze }: AnalyzeViewProps) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 text-center space-y-6">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 bg-brand/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-0 bg-brand/10 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
          <div className="relative w-full h-full bg-paper-surface border border-edge rounded-full flex items-center justify-center shadow-card overflow-hidden">
            <img src="/termcheck_icon48.png" alt="TermCheck" className="h-12 w-12 object-contain animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-ink-primary">Analyzing Document</h3>
          <p className="text-sm text-ink-muted max-w-[220px] mx-auto">
            Scanning for legal terms and potential risks...
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center flex-1 py-16 text-center space-y-8 px-6"
      role="region" 
      aria-label="Ready to scan"
    >
      <motion.div 
        className="relative w-24 h-24"
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 bg-brand/10 rounded-full blur-2xl" />
        <div className="relative w-full h-full bg-paper-elevated border border-edge rounded-full flex items-center justify-center shadow-card overflow-hidden">
          <img src="/termcheck_icon48.png" alt="TermCheck" className="h-12 w-12 object-contain" />
        </div>
      </motion.div>

      <div className="space-y-3 max-w-[280px]">
        <h2 className="text-xl font-bold text-ink-primary tracking-tight">Ready to Scan</h2>
        <p className="text-sm text-ink-secondary leading-relaxed">
          Navigate to a Terms of Service, Privacy Policy, or Contract page and click analyze.
        </p>
        <div className="flex items-center justify-center gap-2 text-severity-medium text-xs font-medium bg-severity-medium/5 px-3 py-1.5 rounded-full w-fit mx-auto">
          <FileWarning className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Supports web pages and browser-opened PDFs</span>
        </div>
      </div>

      <Button
        size="lg"
        onClick={onAnalyze}
        className="w-full max-w-[240px] shadow-glow hover:shadow-glow-lg transition-shadow"
        leftIcon={<Search className="h-4 w-4" />}
      >
        Analyze Page
      </Button>
    </motion.div>
  );
};
