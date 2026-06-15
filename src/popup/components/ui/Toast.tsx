import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '../../../lib/utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type } ]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none" role="region" aria-label="Notifications">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={cn(
                "pointer-events-auto flex items-center gap-3 p-3.5 rounded-xl shadow-xl border backdrop-blur-sm",
                t.type === 'error' && "bg-severity-critical/10 border-severity-critical/20 text-ink-primary",
                t.type === 'success' && "bg-green-500/10 border-green-500/20 text-ink-primary",
                t.type === 'warning' && "bg-severity-medium/10 border-severity-medium/20 text-ink-primary",
                t.type === 'info' && "bg-brand-500/10 border-brand-500/20 text-ink-primary"
              )}
              role="alert"
            >
              {t.type === 'error' && <AlertCircle className="h-5 w-5 text-severity-critical flex-shrink-0" />}
              {t.type === 'success' && <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />}
              {t.type === 'warning' && <AlertTriangle className="h-5 w-5 text-severity-medium flex-shrink-0" />}
              {t.type === 'info' && <Info className="h-5 w-5 text-brand-400 flex-shrink-0" />}

              <p className="text-sm font-medium flex-1">{t.message}</p>

              <button
                onClick={() => removeToast(t.id)}
                className="text-ink-muted hover:text-ink-primary transition-colors p-0.5 rounded-md"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
