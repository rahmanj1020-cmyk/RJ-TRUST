import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-[92vw] md:max-w-md w-full px-4"
        >
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl ${
              toast.type === 'error'
                ? 'bg-red-950/90 border-red-500/50 text-red-100 shadow-red-900/30'
                : toast.type === 'info'
                ? 'bg-blue-950/90 border-blue-500/50 text-blue-100 shadow-blue-900/30'
                : 'bg-[#14213D]/95 border-[#FCA311] text-amber-50 shadow-amber-500/20'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="w-5 h-5 text-blue-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-[#FCA311] shrink-0" />
            )}
            <p className="text-xs md:text-sm font-semibold tracking-wide flex-1 leading-snug">
              {toast.message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
