/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastContextType {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    warning: (msg: string) => void;
    info: (msg: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentToast, setCurrentToast] = useState<ToastMessage | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastToastRef = useRef<{ type: string; message: string; timestamp: number } | null>(null);

  const removeToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setCurrentToast(null);
  }, []);

  const addToast = useCallback((type: ToastMessage['type'], message: string) => {
    if (!message) return;
    const now = Date.now();

    // Prevent spamming identical notification if triggered repeatedly within 300ms
    if (
      lastToastRef.current &&
      lastToastRef.current.type === type &&
      lastToastRef.current.message === message &&
      now - lastToastRef.current.timestamp < 300
    ) {
      // Just refresh the existing toast's timer
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setCurrentToast(null);
      }, 2500);
      return;
    }

    lastToastRef.current = { type, message, timestamp: now };

    // Clear any existing active toast auto-dismiss timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Generate unique ID and immediately replace any currently visible toast
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, message, duration: 2500 };
    
    // Set strictly single visible toast (replaces previous immediately)
    setCurrentToast(newToast);

    // Auto dismiss after 2.5s
    timerRef.current = setTimeout(() => {
      setCurrentToast(null);
      timerRef.current = null;
    }, 2500);
  }, []);

  const toast = {
    success: (msg: string) => addToast('success', msg),
    error: (msg: string) => addToast('error', msg),
    warning: (msg: string) => addToast('warning', msg),
    info: (msg: string) => addToast('info', msg),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast Container - Single notification only */}
      <div className="fixed top-4 right-4 z-50 max-w-sm w-full pointer-events-none">
        <AnimatePresence mode="wait">
          {currentToast && (
            (() => {
              let bgColor = 'bg-slate-900/95 text-white border-slate-800';
              let icon = <Info className="w-5 h-5 text-sky-400 shrink-0" />;
              let barColor = 'bg-sky-500';

              if (currentToast.type === 'success') {
                bgColor = 'bg-emerald-950/95 text-emerald-100 border-emerald-800/50';
                icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
                barColor = 'bg-emerald-500';
              } else if (currentToast.type === 'error') {
                bgColor = 'bg-rose-950/95 text-rose-100 border-rose-800/50';
                icon = <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
                barColor = 'bg-rose-500';
              } else if (currentToast.type === 'warning') {
                bgColor = 'bg-amber-950/95 text-amber-100 border-amber-800/50';
                icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
                barColor = 'bg-amber-500';
              }

              return (
                <motion.div
                  key={currentToast.id}
                  initial={{ opacity: 0, y: -16, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, y: -8, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.2 }}
                  className={`pointer-events-auto relative flex flex-col p-3.5 rounded-xl border shadow-xl backdrop-blur-md overflow-hidden ${bgColor}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{icon}</div>
                    <div className="flex-1 text-xs font-medium leading-relaxed pr-1 text-white">
                      {currentToast.message}
                    </div>
                    <button
                      onClick={removeToast}
                      className="p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {/* Visual Progress Bar */}
                  <motion.div
                    key={`bar-${currentToast.id}`}
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 2.5, ease: 'linear' }}
                    className={`absolute bottom-0 left-0 h-0.5 ${barColor}`}
                  />
                </motion.div>
              );
            })()
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
