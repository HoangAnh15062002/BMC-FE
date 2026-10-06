import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AlertTriangle, Trash2, Info, X, HelpCircle } from 'lucide-react';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

let globalConfirmFn: ((options: ConfirmOptions | string) => Promise<boolean>) | null = null;

export const confirmDialog = (options: ConfirmOptions | string): Promise<boolean> => {
  if (globalConfirmFn) {
    return globalConfirmFn(options);
  }
  return Promise.resolve(window.confirm(typeof options === 'string' ? options : options.message));
};

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      const parsedOptions: ConfirmOptions =
        typeof options === 'string'
          ? {
              title: options.toLowerCase().includes('xóa') ? 'Xác Nhận Xóa' : 'Xác Nhận Thao Tác',
              message: options,
              type: options.toLowerCase().includes('xóa') ? 'danger' : 'warning',
              confirmText: options.toLowerCase().includes('xóa') ? 'Xác Nhận Xóa' : 'Đồng Ý',
              cancelText: 'Hủy Bỏ',
            }
          : {
              title: options.title || (options.type === 'danger' ? 'Xác Nhận Xóa' : 'Xác Nhận'),
              message: options.message,
              confirmText: options.confirmText || (options.type === 'danger' ? 'Xác Nhận Xóa' : 'Đồng Ý'),
              cancelText: options.cancelText || 'Hủy Bỏ',
              type: options.type || 'warning',
            };

      setModalState({
        isOpen: true,
        options: parsedOptions,
        resolve,
      });
    });
  }, []);

  useEffect(() => {
    globalConfirmFn = confirm;
    return () => {
      globalConfirmFn = null;
    };
  }, [confirm]);

  const handleConfirm = () => {
    if (modalState) {
      modalState.resolve(true);
      setModalState(null);
    }
  };

  const handleCancel = () => {
    if (modalState) {
      modalState.resolve(false);
      setModalState(null);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {modalState?.isOpen && (
        <div
          onClick={handleCancel}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999999,
            padding: '20px',
            animation: 'fadeIn 0.18s ease-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05)',
              width: '100%',
              maxWidth: '440px',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Modal Body */}
            <div style={{ padding: '24px 24px 20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                {/* Icon Circle */}
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    backgroundColor:
                      modalState.options.type === 'danger'
                        ? '#fee2e2'
                        : modalState.options.type === 'info'
                        ? '#e0e7ff'
                        : '#fef3c7',
                    color:
                      modalState.options.type === 'danger'
                        ? '#dc2626'
                        : modalState.options.type === 'info'
                        ? '#4f46e5'
                        : '#d97706',
                  }}
                >
                  {modalState.options.type === 'danger' ? (
                    <Trash2 size={24} />
                  ) : modalState.options.type === 'info' ? (
                    <Info size={24} />
                  ) : (
                    <AlertTriangle size={24} />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#0f172a',
                      marginBottom: '6px',
                    }}
                  >
                    {modalState.options.title}
                  </div>
                  <div
                    style={{
                      fontSize: '13.5px',
                      color: '#475569',
                      lineHeight: 1.55,
                      wordBreak: 'break-word',
                    }}
                  >
                    {modalState.options.message}
                  </div>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                padding: '14px 24px',
                backgroundColor: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                style={{
                  padding: '9px 18px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                {modalState.options.cancelText}
              </button>
              <button
                type="button"
                className={`btn ${modalState.options.type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleConfirm}
                autoFocus
                style={{
                  padding: '9px 20px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: modalState.options.type === 'danger' ? '#dc2626' : undefined,
                  boxShadow:
                    modalState.options.type === 'danger'
                      ? '0 2px 8px rgba(220, 38, 38, 0.35)'
                      : undefined,
                }}
              >
                {modalState.options.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return ctx;
};
