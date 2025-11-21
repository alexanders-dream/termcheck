import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '../../../lib/utils';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

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
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-4 right-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={cn(
                            "pointer-events-auto flex items-center gap-3 p-4 rounded-lg shadow-lg border transition-all animate-in slide-in-from-bottom-5 fade-in duration-300",
                            t.type === 'error' && "bg-red-50 border-red-200 text-red-900",
                            t.type === 'success' && "bg-green-50 border-green-200 text-green-900",
                            t.type === 'info' && "bg-white border-slate-200 text-slate-900"
                        )}
                    >
                        {t.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
                        {t.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {t.type === 'info' && <Info className="h-5 w-5 text-blue-600" />}

                        <p className="text-sm font-medium flex-1">{t.message}</p>

                        <button
                            onClick={() => removeToast(t.id)}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
