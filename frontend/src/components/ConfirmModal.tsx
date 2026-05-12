'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Info, CheckCircle2, AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info' | 'success';
  showCancel?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Evet, Devam Et',
  cancelText = 'İptal',
  type = 'danger',
  showCancel = true
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger': return <Trash2 className="w-8 h-8" />;
      case 'success': return <CheckCircle2 className="w-8 h-8" />;
      case 'info': return <Info className="w-8 h-8" />;
      default: return <AlertCircle className="w-8 h-8" />;
    }
  };

  const getThemeClasses = () => {
    switch (type) {
      case 'danger': return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400';
      case 'success': return 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400';
      case 'info': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
      default: return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
    }
  };

  const getButtonClasses = () => {
    switch (type) {
      case 'danger': return 'bg-red-600 hover:bg-red-700 shadow-xl shadow-red-600/20';
      case 'success': return 'bg-green-600 hover:bg-green-700 shadow-xl shadow-green-600/20';
      case 'info': return 'bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20';
      default: return 'bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20';
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-gray-950/70 backdrop-blur-md"
          />
          
          {/* Modal Box */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            transition={{ type: 'spring', duration: 0.6, bounce: 0.2 }}
            className="relative bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-10 max-w-sm w-full border border-gray-200 dark:border-gray-800 text-center"
          >
            {/* Icon Wrapper */}
            <div className={`flex items-center justify-center w-24 h-24 ${getThemeClasses()} rounded-[2.5rem] mx-auto mb-8 transition-transform duration-500 hover:scale-110`}>
              {getIcon()}
            </div>
            
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
              {title}
            </h3>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
              {message}
            </p>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={onConfirm}
                className={`w-full py-5 px-6 text-xs font-black uppercase tracking-widest text-white ${getButtonClasses()} rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]`}
              >
                {confirmText}
              </button>
              {showCancel && (
                <button
                  onClick={onCancel}
                  className="w-full py-5 px-6 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-2xl transition-all active:scale-[0.98]"
                >
                  {cancelText}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

