import { useState, useCallback } from 'react';
import { ToastProps } from '../components/ui/Toast';

type ToastType = 'info' | 'success' | 'warning' | 'error';

interface ToastOptions {
  title: string;
  message?: string;
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback((type: ToastType, options: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastProps = {
      id,
      type,
      ...options,
      onClose: (toastId: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== toastId));
      }
    };

    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const toast = {
    info: (options: ToastOptions) => addToast('info', options),
    success: (options: ToastOptions) => addToast('success', options),
    warning: (options: ToastOptions) => addToast('warning', options),
    error: (options: ToastOptions) => addToast('error', options),
  };

  return {
    toasts,
    toast,
    removeToast
  };
};