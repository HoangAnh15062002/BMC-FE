import React from 'react';
import { DocumentPreviewModal, DocumentPreviewModalProps } from './DocumentPreviewModal';

export interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfUrl?: string;
  fileUrl?: string;
  fileName?: string;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = (props) => {
  return (
    <DocumentPreviewModal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={props.title}
      fileUrl={props.fileUrl || props.pdfUrl}
      fileName={props.fileName}
    />
  );
};
