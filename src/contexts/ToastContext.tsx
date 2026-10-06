import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Global listener queue to allow invoking toast outside React tree
type ToastListener = (toast: ToastItem) => void;
let globalToastListener: ToastListener | null = null;

export const toast = {
  success: (message: string, title?: string, duration?: number) => {
    if (globalToastListener) {
      globalToastListener({
        id: Math.random().toString(36).substring(2, 9),
        type: 'success',
        title: title || 'Thành Công',
        message,
        duration: duration ?? 4000,
      });
    }
  },
  error: (message: string, title?: string, duration?: number) => {
    if (globalToastListener) {
      globalToastListener({
        id: Math.random().toString(36).substring(2, 9),
        type: 'error',
        title: title || 'Thông Báo Lỗi',
        message,
        duration: duration ?? 5000,
      });
    }
  },
  warning: (message: string, title?: string, duration?: number) => {
    if (globalToastListener) {
      globalToastListener({
        id: Math.random().toString(36).substring(2, 9),
        type: 'warning',
        title: title || 'Cảnh Báo Nghiệp Vụ',
        message,
        duration: duration ?? 4500,
      });
    }
  },
  info: (message: string, title?: string, duration?: number) => {
    if (globalToastListener) {
      globalToastListener({
        id: Math.random().toString(36).substring(2, 9),
        type: 'info',
        title: title || 'Thông Báo',
        message,
        duration: duration ?? 4000,
      });
    }
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (item: ToastItem) => {
      setToasts((prev) => [...prev, item]);

      const timerDuration = item.duration ?? 4000;
      if (timerDuration > 0) {
        setTimeout(() => {
          removeToast(item.id);
        }, timerDuration);
      }
    },
    [removeToast]
  );

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string, duration?: number) => {
      const defaultTitles: Record<ToastType, string> = {
        success: 'Thành Công',
        error: 'Thông Báo Lỗi',
        warning: 'Cảnh Báo Nghiệp Vụ',
        info: 'Thông Báo',
      };
      addToast({
        id: Math.random().toString(36).substring(2, 9),
        type,
        title: title || defaultTitles[type],
        message,
        duration,
      });
    },
    [addToast]
  );

  const success = useCallback((msg: string, title?: string, dur?: number) => showToast('success', msg, title, dur), [showToast]);
  const error = useCallback((msg: string, title?: string, dur?: number) => showToast('error', msg, title, dur), [showToast]);
  const warning = useCallback((msg: string, title?: string, dur?: number) => showToast('warning', msg, title, dur), [showToast]);
  const info = useCallback((msg: string, title?: string, dur?: number) => showToast('info', msg, title, dur), [showToast]);

  useEffect(() => {
    globalToastListener = (item) => {
      addToast(item);
    };

    // Intercept window.alert so all legacy alerts across the entire application
    // automatically transform into modern premium toast notifications
    const originalAlert = window.alert;
    window.alert = (msg: any) => {
      const text = String(msg ?? '');
      const lower = text.toLowerCase();

      if (lower.includes('thành công') || lower.includes('hoàn tất') || lower.includes('thành công!')) {
        toast.success(text, 'Thành Công');
      } else if (lower.includes('lỗi') || lower.includes('thất bại') || lower.includes('error')) {
        toast.error(text, 'Lỗi Hệ Thống');
      } else if (
        lower.includes('vui lòng') ||
        lower.includes('bắt buộc') ||
        lower.includes('quy định') ||
        lower.includes('chú ý') ||
        lower.includes('cảnh báo') ||
        lower.includes('chưa chọn')
      ) {
        toast.warning(text, 'Cảnh Báo Nghiệp Vụ');
      } else {
        toast.info(text, 'Thông Báo Hệ Thống');
      }
    };

    return () => {
      globalToastListener = null;
      window.alert = originalAlert;
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};

// ==========================================
// Toast UI Rendering Component
// ==========================================
interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '24px',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none',
        maxWidth: '420px',
        width: 'calc(100vw - 48px)',
      }}
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const duration = toast.duration ?? 4000;
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (duration <= 0) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [duration]);

  const config = {
    success: {
      borderColor: '#86efac',
      bgLight: '#ffffff',
      iconBg: '#dcfce7',
      accentColor: '#16a34a',
      icon: <CheckCircle2 size={20} color="#16a34a" />,
    },
    error: {
      borderColor: '#fca5a5',
      bgLight: '#ffffff',
      iconBg: '#fee2e2',
      accentColor: '#dc2626',
      icon: <AlertCircle size={20} color="#dc2626" />,
    },
    warning: {
      borderColor: '#fcd34d',
      bgLight: '#ffffff',
      iconBg: '#fef3c7',
      accentColor: '#d97706',
      icon: <AlertTriangle size={20} color="#d97706" />,
    },
    info: {
      borderColor: '#93c5fd',
      bgLight: '#ffffff',
      iconBg: '#dbeafe',
      accentColor: '#2563eb',
      icon: <Info size={20} color="#2563eb" />,
    },
  }[toast.type];

  return (
    <div
      style={{
        pointerEvents: 'auto',
        backgroundColor: config.bgLight,
        borderRadius: '12px',
        boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.16), 0 4px 10px -2px rgba(15, 23, 42, 0.08)',
        border: `1px solid ${config.borderColor}`,
        overflow: 'hidden',
        position: 'relative',
        animation: 'slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', padding: '14px 16px', gap: '12px' }}>
        {/* Icon Circle */}
        <div
          style={{
            flexShrink: 0,
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: config.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '1px',
          }}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: '4px' }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: '14px',
              color: '#0f172a',
              marginBottom: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{toast.title}</span>
          </div>
          <div
            style={{
              fontSize: '13px',
              color: '#334155',
              lineHeight: 1.5,
              wordBreak: 'break-word',
            }}
          >
            {toast.message}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onDismiss}
          style={{
            flexShrink: 0,
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s, background-color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#0f172a';
            e.currentTarget.style.backgroundColor = '#f1f5f9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Đóng thông báo"
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress Bar Timer */}
      {duration > 0 && (
        <div style={{ height: '3px', width: '100%', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: config.accentColor,
              transition: 'width 40ms linear',
            }}
          />
        </div>
      )}
    </div>
  );
};
