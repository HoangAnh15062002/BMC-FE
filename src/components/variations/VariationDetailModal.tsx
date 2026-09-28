import React, { useState } from 'react';
import { ProjectVariation, ProjectVariationItem } from '../../types';
import { formatCurrency, formatNumber, formatDate, formatUnit } from '../../utils/formatters';
import {
  X,
  GitPullRequestDraft,
  Building2,
  Calendar,
  User,
  Layers,
  Printer,
  CheckCircle,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface VariationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  variation: ProjectVariation | null;
  onApprove?: (id: number, approvedValue: number) => void;
  onReject?: (id: number, reason: string) => void;
}

export const VariationDetailModal: React.FC<VariationDetailModalProps> = ({
  isOpen,
  onClose,
  variation,
  onApprove,
  onReject,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [approvedValInput, setApprovedValInput] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [showApproveBox, setShowApproveBox] = useState(false);

  if (!isOpen || !variation) return null;

  const isAddition = (variation.variationType || '').toUpperCase().includes('ADDITION')
    || (variation.variationType || '').toUpperCase().includes('INCREASE')
    || (variation.variationType || '').toUpperCase().includes('TĂNG');

  // Fallback items if array is empty
  const rawItems: ProjectVariationItem[] = (variation.items && variation.items.length > 0)
    ? variation.items
    : [
        {
          id: 1,
          description: variation.title,
          quantity: 1,
          unitCode: 'Gói',
          unitPrice: variation.requestedValue,
          amount: variation.requestedValue,
        }
      ];

  const itemsTotal = rawItems.reduce((sum, it) => sum + (it.amount || ((it.quantity || 0) * (it.unitPrice || 0))), 0);

  const handleApproveSubmit = async () => {
    const val = Number(approvedValInput || variation.requestedValue);
    if (isNaN(val) || val <= 0) {
      alert('Vui lòng nhập giá trị phê duyệt hợp lệ (> 0)!');
      return;
    }
    if (onApprove) {
      setSubmitting(true);
      try {
        await onApprove(variation.id, val);
        setShowApproveBox(false);
        onClose();
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối để công trường tiếp nhận!');
      return;
    }
    if (onReject) {
      setSubmitting(true);
      try {
        await onReject(variation.id, rejectReason.trim());
        setShowRejectBox(false);
        onClose();
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handlePrint = () => {
    const voNo = variation.variationNo || `VO-${variation.id}`;
    const reqDate = formatDate(variation.requestedDate || variation.createdAt);
    const projectName = variation.projectName || `Dự án #${variation.projectId}`;
    const approver = 'Ban Giám Đốc BMC';
    const statusLabel = variation.status === 'APPROVED' ? 'Đã Phê Duyệt' : variation.status === 'REJECTED' ? 'Từ Chối' : 'Chờ Phê Duyệt';

    // Ngày phê duyệt: Lấy ngày thực tế phiếu đã được duyệt
    let approvalDateFormatted = '';
    const dateSource = variation.approvedDate || (variation.status === 'APPROVED' ? (variation.requestedDate || variation.createdAt) : null);
    if (dateSource) {
      const parsed = new Date(dateSource);
      if (!isNaN(parsed.getTime())) {
        const d = String(parsed.getDate()).padStart(2, '0');
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const y = parsed.getFullYear();
        approvalDateFormatted = `Ngày ${d} tháng ${m} năm ${y}`;
      }
    }
    if (!approvalDateFormatted) {
      if (variation.status === 'APPROVED') {
        const now = new Date();
        approvalDateFormatted = `Ngày ${String(now.getDate()).padStart(2, '0')} tháng ${String(now.getMonth() + 1).padStart(2, '0')} năm ${now.getFullYear()}`;
      } else {
        approvalDateFormatted = 'Ngày ..... tháng ..... năm 20...';
      }
    }

    const rowsHtml = rawItems.map((it, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td style="font-weight: 600;">${it.description}</td>
        <td style="text-align: center;">${it.unitCode || 'Gói'}</td>
        <td style="text-align: right; font-weight: 600;">${formatNumber(it.quantity || 1)}</td>
        <td style="text-align: right;">${formatCurrency(it.unitPrice || it.amount)}</td>
        <td style="text-align: right; font-weight: 700;">${formatCurrency(it.amount || ((it.quantity || 1) * (it.unitPrice || 0)))}</td>
      </tr>
    `).join('');

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Hồ Sơ Phát Sinh Khối Lượng - ${voNo}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 14mm 12mm 14mm 12mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            font-family: "Times New Roman", Times, serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 13px;
            line-height: 1.4;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
          }
          .header-table td {
            vertical-align: top;
            padding: 0;
          }
          .company-name {
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            color: #1e3a8a;
          }
          .company-sub {
            font-size: 11px;
            color: #475569;
            margin-top: 3px;
          }
          .form-badge {
            text-align: right;
            font-size: 11.5px;
          }
          .doc-header {
            text-align: center;
            margin: 16px 0 16px 0;
          }
          .doc-title {
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0;
            letter-spacing: 0.5px;
          }
          .doc-subtitle {
            font-size: 12px;
            font-style: italic;
            color: #475569;
            margin-top: 4px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
          }
          .info-table td {
            padding: 3px 4px;
            font-size: 12px;
            vertical-align: top;
          }
          .info-label {
            font-weight: bold;
            color: #334155;
            white-space: nowrap;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
          }
          .items-table th, .items-table td {
            border: 1px solid #334155;
            padding: 6px 6px;
            font-size: 12px;
          }
          .items-table th {
            background-color: #f1f5f9 !important;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
            font-size: 11px;
          }
          .total-row td {
            font-weight: bold;
            background-color: #f8fafc !important;
          }
          .signatures-container {
            margin-top: 24px;
            page-break-inside: avoid;
          }
          .date-location {
            text-align: right;
            font-style: italic;
            font-size: 12px;
            margin-bottom: 10px;
          }
          .sig-table {
            width: 100%;
            border-collapse: collapse;
            text-align: center;
          }
          .sig-table td {
            width: 33.33%;
            vertical-align: top;
            padding: 0 10px;
          }
          .sig-role {
            font-weight: bold;
            font-size: 11.5px;
            text-transform: uppercase;
          }
          .sig-caption {
            font-style: italic;
            font-size: 10.5px;
            color: #64748b;
            margin-top: 2px;
          }
          .sig-space {
            height: 70px;
          }
          .sig-name {
            font-weight: bold;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width: 60%;">
              <div class="company-name">CÔNG TY CỔ PHẦN XÂY DỰNG KỸ THUẬT BMC</div>
              <div class="company-sub">Hệ Thống Quản Lý Kỹ Thuật & Chi Phí Dự Án Xây Dựng</div>
              <div class="company-sub">Ban Quản Lý Dự Án - Ban Chỉ Huy Công Trường</div>
            </td>
            <td class="form-badge" style="width: 40%;">
              <div><strong>Mẫu:</strong> 03-HSTS/BMC</div>
              <div style="margin-top: 2px;"><strong>Số hồ sơ:</strong> <span style="font-family: monospace; font-size: 13px; font-weight: bold;">${voNo}</span></div>
              <div style="margin-top: 2px;"><strong>Ngày lập:</strong> ${reqDate}</div>
              <div style="margin-top: 2px;"><strong>Trạng thái:</strong> ${statusLabel}</div>
            </td>
          </tr>
        </table>

        <div class="doc-header">
          <div class="doc-title">BIÊN BẢN XÁC NHẬN KHỐI LƯỢNG & CHI PHÍ PHÁT SINH</div>
          <div class="doc-subtitle">(Căn cứ điều chỉnh giá trị hợp đồng / Phụ lục bổ sung)</div>
        </div>

        <table class="info-table">
          <tr>
            <td class="info-label" style="width: 18%;">Công trình / Dự án:</td>
            <td style="width: 45%; font-weight: bold;">${projectName}</td>
            <td class="info-label" style="width: 16%;">Phân loại phát sinh:</td>
            <td style="width: 21%; font-weight: bold; color: ${isAddition ? '#b91c1c' : '#15803d'};">
              ${isAddition ? 'Phát sinh TĂNG (+)' : 'Phát sinh GIẢM (-)'}
            </td>
          </tr>
          <tr>
            <td class="info-label">Tiêu đề phát sinh:</td>
            <td colspan="3" style="font-weight: bold;">${variation.title}</td>
          </tr>
          <tr>
            <td class="info-label">Căn cứ / Lý do:</td>
            <td colspan="3" style="font-style: italic;">${variation.reason || 'Theo biên bản xử lý hiện trường và yêu cầu điều chỉnh thiết kế thi công'}</td>
          </tr>
        </table>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 35px;">STT</th>
              <th>Nội dung công việc / Khối lượng phát sinh</th>
              <th style="width: 55px;">ĐVT</th>
              <th style="width: 80px;">Khối lượng</th>
              <th style="width: 110px;">Đơn giá (VNĐ)</th>
              <th style="width: 125px;">Thành tiền (VNĐ)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="total-row">
              <td colspan="5" style="text-align: right; text-transform: uppercase;">Tổng giá trị đề xuất:</td>
              <td style="text-align: right; color: #1e3a8a;">${formatCurrency(variation.requestedValue || itemsTotal)}</td>
            </tr>
            <tr class="total-row" style="background-color: #f1f5f9 !important;">
              <td colspan="5" style="text-align: right; text-transform: uppercase; font-weight: bold;">Giá trị phê duyệt chính thức:</td>
              <td style="text-align: right; color: #b91c1c; font-size: 13px; font-weight: bold;">
                ${variation.approvedValue !== undefined && variation.approvedValue !== null && variation.approvedValue > 0 ? formatCurrency(variation.approvedValue) : formatCurrency(variation.requestedValue)}
              </td>
            </tr>
          </tbody>
        </table>

        <div class="signatures-container">
          <div class="date-location">${approvalDateFormatted}</div>
          <table class="sig-table">
            <tr>
              <td>
                <div class="sig-role">ĐẠI DIỆN NHÀ THẦU</div>
                <div class="sig-caption">(Kỹ sư / Chỉ huy trưởng)</div>
                <div class="sig-space"></div>
                <div class="sig-name">Ban Chỉ Huy Công Trường</div>
              </td>
              <td>
                <div class="sig-role">TƯ VẤN GIÁM SÁT</div>
                <div class="sig-caption">(Ký và xác nhận khối lượng)</div>
                <div class="sig-space"></div>
                <div class="sig-name">Đơn Vị TVGS</div>
              </td>
              <td>
                <div class="sig-role">BAN GIÁM ĐỐC PHÊ DUYỆT</div>
                <div class="sig-caption">(Ký duyệt & đóng dấu)</div>
                <div class="sig-space"></div>
                <div class="sig-name">${approver}</div>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc) return;

    frameDoc.open();
    frameDoc.write(printHtml);
    frameDoc.close();

    printFrame.contentWindow?.focus();
    setTimeout(() => {
      printFrame.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 1000);
    }, 300);
  };

  const isApproved = variation.status === 'APPROVED';
  const isRejected = variation.status === 'REJECTED';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="card"
        style={{
          width: '95vw',
          maxWidth: '1100px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: isAddition ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                color: isAddition ? 'var(--crimson-danger)' : 'var(--emerald-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${isAddition ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
              }}
            >
              {isAddition ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Hồ Sơ Phát Sinh Khối Lượng: {variation.variationNo || `VO-${variation.id}`}
                </h2>
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '20px',
                    backgroundColor: isAddition ? '#fee2e2' : '#dcfce7',
                    color: isAddition ? '#b91c1c' : '#15803d',
                  }}
                >
                  {isAddition ? '↑ Phát sinh TĂNG (+)' : '↓ Phát sinh GIẢM (-)'}
                </span>
                <span
                  className={`badge ${isApproved ? 'badge-active' : isRejected ? 'badge-danger' : 'badge-pending'}`}
                  style={{ fontSize: '11.5px', padding: '3px 10px' }}
                >
                  {isApproved ? 'Đã Phê Duyệt' : isRejected ? 'Từ Chối' : 'Chờ Phê Duyệt'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                {variation.title}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <Printer size={15} /> In Hồ Sơ VO
            </button>
            <button
              className="btn-icon"
              onClick={onClose}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, backgroundColor: '#ffffff' }}>
          {/* Metadata Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '14px',
              marginBottom: '20px',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Công Trình / Dự Án
              </span>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13.5px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={15} color="var(--brand-500)" />
                <span>{variation.projectName || `Dự án #${variation.projectId}`}</span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Ngày Lập & Đơn Vị Đề Xuất
              </span>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} color="#2563eb" />
                <span>{formatDate(variation.requestedDate || variation.createdAt)}</span>
                <span style={{ color: '#94a3b8' }}>•</span>
                <span>Ban chỉ huy</span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Giá Trị Đề Xuất Ban Đầu
              </span>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '16px', marginTop: '3px' }}>
                {formatCurrency(variation.requestedValue)}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Theo bóc tách kỹ sư hiện trường
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Giá Trị Phê Duyệt Chính Thức
              </span>
              <div
                style={{
                  fontWeight: 900,
                  color: isAddition ? 'var(--crimson-danger)' : 'var(--emerald-success)',
                  fontSize: '18px',
                  marginTop: '3px',
                }}
              >
                {variation.approvedValue !== undefined && variation.approvedValue !== null && variation.approvedValue > 0
                  ? formatCurrency(variation.approvedValue)
                  : 'Chưa chốt duyệt'}
              </div>
              {variation.approvedDate && (
                <div style={{ fontSize: '11px', color: '#15803d', marginTop: '2px' }}>
                  Duyệt ngày: {formatDate(variation.approvedDate)}
                </div>
              )}
            </div>
          </div>

          {/* Legal basis & reason */}
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: '#fffbeb',
              borderRadius: '10px',
              border: '1px solid #fef3c7',
              marginBottom: '22px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#b45309', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
              <FileText size={16} />
              <span>Căn Cứ Pháp Lý & Lý Do Phát Sinh Khối Lượng:</span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#0f172a', lineHeight: 1.5 }}>
              {variation.reason || 'Phát sinh trong quá trình thi công thực tế tại hiện trường công trình. Đã được Tư vấn giám sát và Ban chỉ huy đo đạc, lập biên bản xử lý hiện trường để làm căn cứ bổ sung phụ lục hợp đồng.'}
            </p>
          </div>

          {/* Table of items */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Bảng Chi Tiết Bóc Tách Khối Lượng & Chi Phí Phát Sinh ({rawItems.length} hạng mục)
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Chi tiết từng công tác, khối lượng thực tế và đơn giá dự toán được áp dụng
                </span>
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'center', width: '45px', fontWeight: 700, color: '#475569' }}>STT</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Nội Dung Công Việc / Hạng Mục Phát Sinh</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', width: '70px', fontWeight: 700, color: '#475569' }}>ĐVT</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', width: '100px', fontWeight: 700, color: '#475569' }}>Khối Lượng</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', width: '140px', fontWeight: 700, color: '#475569' }}>Đơn Giá (VNĐ)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', width: '160px', fontWeight: 700, color: '#475569' }}>Thành Tiền (VNĐ)</th>
                  </tr>
                </thead>
                <tbody>
                  {rawItems.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>{item.description}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{ backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                          {item.unitCode || 'Gói'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{formatNumber(item.quantity || 1)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#475569' }}>{formatCurrency(item.unitPrice || item.amount)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {formatCurrency(item.amount || ((item.quantity || 1) * (item.unitPrice || 0)))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                    <td colSpan={5} style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, textTransform: 'uppercase', color: '#334155' }}>
                      Tổng Cộng Giá Trị Phát Sinh:
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, fontSize: '15px', color: isAddition ? 'var(--crimson-danger)' : 'var(--emerald-success)' }}>
                      {formatCurrency(variation.requestedValue || itemsTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Action Boxes for Approval / Reject */}
          {showApproveBox && (
            <div style={{ padding: '16px 20px', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '20px' }}>
              <div style={{ fontWeight: 800, color: '#15803d', fontSize: '14px', marginBottom: '8px' }}>
                Xác Nhận Phê Duyệt Giá Trị Hồ Sơ Phát Sinh:
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <label style={{ fontSize: '12px', color: '#374151', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Giá trị chốt phê duyệt chính thức (VNĐ):
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={approvedValInput}
                    onChange={(e) => setApprovedValInput(e.target.value)}
                    placeholder={String(variation.requestedValue)}
                    style={{ fontSize: '14px', fontWeight: 700 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowApproveBox(false)}>
                    Hủy
                  </button>
                  <button type="button" className="btn btn-success btn-sm" onClick={handleApproveSubmit} disabled={submitting}>
                    {submitting ? 'Đang duyệt...' : '✓ Xác Nhận Phê Duyệt'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showRejectBox && (
            <div style={{ padding: '16px 20px', backgroundColor: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca', marginBottom: '20px' }}>
              <div style={{ fontWeight: 800, color: '#b91c1c', fontSize: '14px', marginBottom: '8px' }}>
                Nhập Lý Do Từ Chối Hồ Sơ Phát Sinh:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <textarea
                  className="form-input"
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ghi rõ lý do không chấp thuận (ví dụ: khối lượng chưa đủ cơ sở nghiệm thu, đơn giá vượt định mức...)"
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowRejectBox(false)}>
                    Hủy
                  </button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={handleRejectSubmit} disabled={submitting}>
                    {submitting ? 'Đang xử lý...' : 'Xác Nhận Từ Chối'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '12.5px', color: '#64748b' }}>
            Trạng thái hiện tại: <strong style={{ color: '#0f172a' }}>{isApproved ? 'Đã Phê Duyệt' : isRejected ? 'Từ Chối' : 'Chờ Phê Duyệt'}</strong>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {!isApproved && !isRejected && onReject && !showRejectBox && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setShowRejectBox(true);
                  setShowApproveBox(false);
                }}
                style={{ color: '#b91c1c' }}
              >
                Từ Chối
              </button>
            )}
            {!isApproved && onApprove && !showApproveBox && (
              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={() => {
                  setApprovedValInput(String(variation.requestedValue));
                  setShowApproveBox(true);
                  setShowRejectBox(false);
                }}
              >
                <Check size={14} /> Phê Duyệt Phát Sinh
              </button>
            )}
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
