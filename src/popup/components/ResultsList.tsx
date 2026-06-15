import { LegalFlag } from '../../lib/types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';
import { AlertTriangle, Info, AlertCircle, RefreshCw, ShieldCheck, ShieldAlert, ShieldOff, FileText, FileOutput } from 'lucide-react';
import { downloadWordReport, downloadPDFReport } from '../../lib/reports';
import { cn } from '../../lib/utils';

interface ResultsListProps {
    flags: LegalFlag[];
    onRescan: () => void;
    pageUrl: string;
    pageTitle: string;
}

export const ResultsList = ({ flags, onRescan, pageUrl, pageTitle }: ResultsListProps) => {
    const getSeverityIcon = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical': return <AlertCircle className="h-5 w-5 text-severity-critical" />;
            case 'high': return <AlertTriangle className="h-5 w-5 text-severity-high" />;
            case 'medium': return <AlertTriangle className="h-5 w-5 text-severity-medium" />;
            case 'low': return <Info className="h-5 w-5 text-severity-low" />;
            default: return <Info className="h-5 w-5 text-ink-muted" />;
        }
    };

    const SeverityBadge = ({ severity }: { severity: string }) => {
      const styles = {
        critical: 'bg-severity-critical/10 text-severity-critical border-severity-critical/30 shadow-[0_0_12px_rgba(239,68,68,0.15)]',
        high: 'bg-severity-high/10 text-severity-high border-severity-high/30',
        medium: 'bg-severity-medium/10 text-severity-medium border-severity-medium/30',
        low: 'bg-severity-low/10 text-severity-low border-severity-low/30',
      };
      const severityKey = severity.toLowerCase() as keyof typeof styles;
      
      return (
        <span className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest',
          styles[severityKey] || styles.low
        )}>
          {severity}
        </span>
      );
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
    const mediumCount = flags.filter(f => f.severity === 'Medium').length;
    const lowCount = flags.filter(f => f.severity === 'Low').length;
    
    const overallRisk = criticalCount > 0 ? 'Critical' : highCount > 0 ? 'High' : mediumCount > 0 ? 'Medium' : 'Low';
    
    const containerVariants = {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: { staggerChildren: 0.08 }
      }
    };
    
    const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
          initial="hidden"
          animate="show"
          variants={containerVariants}
          className="space-y-5 pb-6" 
          role="region" 
          aria-label="Analysis results"
        >
            <div className="flex justify-between items-center px-1">
                <h2 className="text-lg font-bold text-ink-primary tracking-tight" id="findings-heading">Findings ({flags.length})</h2>
                <Button variant="ghost" size="sm" onClick={onRescan} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
                    Rescan
                </Button>
            </div>

            <motion.div 
              variants={itemVariants}
              className="p-5 rounded-2xl border border-edge bg-paper-surface shadow-sm relative overflow-hidden"
            >
                <div className={cn(
                  "absolute inset-0 opacity-[0.03] dark:opacity-[0.05]",
                  overallRisk === 'Critical' ? 'bg-severity-critical' : 
                  overallRisk === 'High' ? 'bg-severity-high' : 
                  overallRisk === 'Medium' ? 'bg-severity-medium' : 
                  'bg-severity-low'
                )} />
                <div className="relative z-10 flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {overallRisk === 'Critical' && <ShieldOff className="h-6 w-6 text-severity-critical" />}
                        {overallRisk === 'High' && <ShieldAlert className="h-6 w-6 text-severity-high" />}
                        {overallRisk === 'Medium' && <ShieldAlert className="h-6 w-6 text-severity-medium" />}
                        {overallRisk === 'Low' && <ShieldCheck className="h-6 w-6 text-severity-low" />}
                        <div>
                          <p className="text-sm font-medium text-ink-secondary">Overall Risk</p>
                          <p className={cn("text-xl font-bold uppercase tracking-tight",
                            overallRisk === 'Critical' ? 'text-severity-critical' : 
                            overallRisk === 'High' ? 'text-severity-high' : 
                            overallRisk === 'Medium' ? 'text-severity-medium' : 
                            'text-severity-low'
                          )}>
                            {overallRisk}
                          </p>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'Critical', count: criticalCount, color: 'bg-severity-critical' },
                    { label: 'High', count: highCount, color: 'bg-severity-high' },
                    { label: 'Medium', count: mediumCount, color: 'bg-severity-medium' },
                    { label: 'Low', count: lowCount, color: 'bg-severity-low' },
                  ].map(item => (
                    <div key={item.label} className="bg-paper-elevated rounded-lg p-2 border border-edge">
                      <div className={cn("h-1 w-full rounded-full mb-2", item.color, item.count === 0 ? 'opacity-20' : 'opacity-100')} />
                      <p className="text-[10px] text-ink-muted uppercase tracking-wider font-medium">{item.label}</p>
                      <p className="text-sm font-bold text-ink-primary mt-0.5">{item.count}</p>
                    </div>
                  ))}
                </div>
            </motion.div>

            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => downloadWordReport(flags, pageUrl, pageTitle)} className="flex-1" leftIcon={<FileText className="h-3.5 w-3.5" />}>
                    Export Word
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadPDFReport(flags, pageUrl, pageTitle)} className="flex-1" leftIcon={<FileOutput className="h-3.5 w-3.5" />}>
                    Export PDF
                </Button>
            </div>

            <motion.div className="space-y-3" role="list" aria-labelledby="findings-heading">
                {sortedFlags.map((flag, idx) => (
                    <motion.div key={idx} variants={itemVariants}>
                      <Card isHoverable className="overflow-hidden">
                        <div className="p-5">
                            <div className="flex items-start gap-3.5">
                                <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-paper-elevated border border-edge">
                                    {getSeverityIcon(flag.severity)}
                                </div>
                                <div className="flex-1 min-w-0 space-y-3">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                                            {flag.category}
                                        </span>
                                        <SeverityBadge severity={flag.severity} />
                                    </div>

                                    <p className="text-sm font-medium text-ink-primary leading-snug break-words">
                                        {flag.summary}
                                    </p>

                                    <div className="relative rounded-lg bg-paper-elevated border border-edge p-3.5 text-xs text-ink-secondary leading-relaxed break-words font-mono">
                                        "{flag.quote}"
                                    </div>
                                </div>
                            </div>
                        </div>
                      </Card>
                    </motion.div>
                ))}
            </motion.div>

            <div className="pt-6 border-t border-edge/50 text-center">
                <p className="text-xs text-ink-muted">
                    Find this tool useful? <a href="https://www.buymeacoffee.com/oguso" target="_blank" rel="noopener noreferrer" className="text-brand hover:text-brand-400 transition-colors underline decoration-brand/30 underline-offset-2">Support its development</a>
                </p>
            </div>
        </motion.div>
    );
};
