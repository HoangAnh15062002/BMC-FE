import React, { useState } from 'react';
import { X, ExternalLink, Download, Maximize2, Minimize2, FileText } from 'lucide-react';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfUrl: string;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  pdfUrl,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  if (!isOpen || !pdfUrl) return null;

  // Ensure url is accessible
  const normalizedUrl = pdfUrl.startsWith('http')
    ? pdfUrl
    : `${window.location.origin}${pdfUrl.startsWith('/') ? '' : '/'}${pdfUrl}`;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isFullScreen ? 0 : '24px',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          width: isFullScreen ? '100vw' : '90vw',
          maxWidth: isFullScreen ? '100vw' : '1200px',
          height: isFullScreen ? '100vh' : '90vh',
          backgroundColor: '#ffffff',
          borderRadius: isFullScreen ? 0 : '12px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#f8fafc',
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                flexShrink: 0,
              }}
            >
              <FileText size={18} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {title || 'Tài Liệu PDF'}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Trình xem trước tài liệu trực tiếp
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Open in new tab */}
            <a
              href={normalizedUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Mở trong tab mới"
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid #cbd5e1',
                transition: 'background-color 0.2s',
              }}
            >
              <ExternalLink size={14} />
              <span>Tab mới</span>
            </a>

            {/* Download */}
            <a
              href={normalizedUrl}
              download
              title="Tải xuống tệp PDF"
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: 'var(--brand-500)',
                color: '#ffffff',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                transition: 'background-color 0.2s',
              }}
            >
              <Download size={14} />
              <span>Tải về</span>
            </a>

            {/* Toggle Fullscreen */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? 'Thu nhỏ' : 'Toàn màn hình'}
              style={{
                padding: '6px',
                borderRadius: '6px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              title="Đóng (Esc)"
              style={{
                padding: '6px',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                marginLeft: '4px',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PDF Viewer Body */}
        <div style={{ flex: 1, position: 'relative', backgroundColor: '#525659' }}>
          <iframe
            src={`${normalizedUrl}#toolbar=1&navpanes=1`}
            title={title}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
};
