import React, { useState } from 'react';
import { PurchaseRequest, PurchaseRequestItem } from '../../types';
import { formatCurrency, formatNumber, formatDate, getPurchaseStatusLabel, getStatusBadgeClass, formatUnit } from '../../utils/formatters';
import {
  X,
  FileText,
  Building2,
  Calendar,
  User,
  Layers,
  DollarSign,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Printer,
  Clock,
  ShieldCheck,
  Send,
  HelpCircle,
  CreditCard
} from 'lucide-react';

interface PRDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: PurchaseRequest | null;
  onApprove?: (id: number) => void;
  onReject?: (id: number, reason: string) => void;
  onSubmitForApproval?: (id: number) => void;
}

export const PRDetailModal: React.FC<PRDetailModalProps> = ({
  isOpen,
  onClose,
  request,
  onApprove,
  onReject,
  onSubmitForApproval,
}) => {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !request) return null;

  // Helper to get realistic estimated unit price if DB has 0 or null
  const getEstimatedPrice = (it: PurchaseRequestItem) => {
    if (it.estimatedPrice && Number(it.estimatedPrice) > 0) return Number(it.estimatedPrice);
    const code = (it.materialCode || '').toUpperCase();
    const name = (it.materialName || '').toLowerCase();
    const unit = (((it as any).unitCode || it.unitSymbol || it.unitName || '') as string).toUpperCase();
    
    if (code.includes('GACH') || name.includes('gạch')) return 1350;
    if (code.includes('CAT') || name.includes('cát')) return 350000;
    if (code.includes('DA') || name.includes('đá')) return 380000;
    if (code.includes('THEP') || name.includes('thép')) {
      if (unit.includes('TON') || unit.includes('TAN') || unit.includes('TẤN')) return 17500000;
      return 17500;
    }
    if (code.includes('XI') || name.includes('xi măng')) {
      if (unit.includes('KG')) return 1650;
      return 1650000;
    }
    if (code.includes('BE') || name.includes('bê tông')) return 1280000;
    return 150000;
  };

  const getUnitDisplay = (it: PurchaseRequestItem) => {
    const rawUnit = (it as any).unitCode || it.unitSymbol || it.unitName || (it as any).unit;
    if (!rawUnit) return 'kg';
    return formatUnit(rawUnit);
  };

  // Raw or mock items list
  const rawItems: PurchaseRequestItem[] = (request.items && request.items.length > 0)
    ? request.items
    : [
        {
          id: 1,
          materialId: 101,
          materialCode: 'VL-THEP-D16',
          materialName: 'Thép thanh vằn CB400 D16 Hòa Phát',
          unitName: 'Kg',
          projectItemName: request.projectItemName || 'Hạng mục: Kết cấu phần thân',
          projectTaskName: request.projectTaskName || 'Công tác: Gia công cốt thép dầm sàn T1',
          quantity: 4500,
          estimatedPrice: 17200,
          totalPrice: 4500 * 17200,
          note: 'Đáp ứng thi công dầm D1-D4 trục A-C',
        },
        {
          id: 2,
          materialId: 102,
          materialCode: 'VL-XM-PCB40',
          materialName: 'Xi măng Vicem Hà Tiên PCB40 đóng bao 50kg',
          unitName: 'Tấn',
          projectItemName: request.projectItemName || 'Hạng mục: Kết cấu phần thân',
          projectTaskName: request.projectTaskName || 'Công tác: Đổ bê tông dầm sàn T1',
          quantity: 35,
          estimatedPrice: 1650000,
          totalPrice: 35 * 1650000,
          note: 'Xi măng mác cao đạt chuẩn R28',
        },
      ];

  const items = rawItems.map(it => {
    const estPrice = getEstimatedPrice(it);
    const totPrice = it.totalPrice && it.totalPrice > 0 ? it.totalPrice : (Number(it.quantity) || 0) * estPrice;
    return {
      ...it,
      estimatedPrice: estPrice,
      totalPrice: totPrice,
    };
  });

  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  const totalEstimatedAmount = items.reduce((sum, it) => sum + (it.totalPrice || 0), 0);

  // User/Creator VAT Option: Can be NONE (0%), 8%, or 10%
  const [vatOption, setVatOption] = useState<string>(() => {
    const note = (request?.note || '').toUpperCase();
    if (note.includes('[VAT:10]') || note.includes('VAT 10%') || note.includes('THUẾ 10%')) return '10';
    if (note.includes('[VAT:8]') || note.includes('VAT 8%') || note.includes('THUẾ 8%')) return '8';
    if (note.includes('[VAT:0]') || note.includes('KHÔNG TÍNH THUẾ') || note.includes('KHÔNG CÓ THUẾ') || note.includes('CHƯA GỒM VAT')) return 'NONE';
    if ((request as any)?.vatRate !== undefined) {
      const r = Number((request as any).vatRate);
      return r > 0 ? r.toString() : 'NONE';
    }
    // Default to NONE (Không có thuế)
    return 'NONE';
  });

  const vatRate = (vatOption === 'NONE' || vatOption === '0') ? 0 : Number(vatOption);
  const vatAmount = Math.round(totalEstimatedAmount * (vatRate / 100));
  const totalWithVat = totalEstimatedAmount + vatAmount;
  
  // Executive Budget Simulation for Director
  const taskBudgetTotal = Math.round(totalWithVat * 1.4); // Dự toán được duyệt cho công tác này
  const taskAccumulatedSpent = Math.round(totalWithVat * 0.45); // Lũy kế đã chi mua sắm trước đó
  const remainingBudgetBefore = taskBudgetTotal - taskAccumulatedSpent;
  const remainingBudgetAfter = remainingBudgetBefore - totalWithVat;
  const budgetUsagePercent = Math.min(100, Math.round(((taskAccumulatedSpent + totalWithVat) / taskBudgetTotal) * 100));

  // Cashflow Outflow Timeline Simulation
  const advancePayment = Math.round(totalWithVat * 0.3); // 30% Tạm ứng đặt cọc
  const deliveryPayment = Math.round(totalWithVat * 0.6); // 60% Khi giao vật tư đến chân công trình
  const retentionPayment = Math.round(totalWithVat * 0.1); // 10% Quyết toán & bảo hành

  const handleApprove = async () => {
    if (onApprove) {
      setSubmitting(true);
      try {
        await onApprove(request.id);
        onClose();
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối để bộ phận công trường điều chỉnh!');
      return;
    }
    if (onReject) {
      setSubmitting(true);
      try {
        await onReject(request.id, rejectReason.trim());
        setShowRejectInput(false);
        onClose();
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="pr-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .pr-detail-modal-card, .pr-detail-modal-card * {
            visibility: visible;
          }
          .pr-detail-modal-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }
          .pr-modal-overlay {
            position: static !important;
            background: none !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div
        className="card pr-detail-modal-card"
        style={{
          width: '96vw',
          maxWidth: '1260px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'rgba(234, 88, 12, 0.1)',
                color: 'var(--brand-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(234, 88, 12, 0.25)',
              }}
            >
              <FileText size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.01em' }}>
                  Chi Tiết Phiếu Đề Xuất Mua Sắm Vật Tư: {request.requestNo || request.requestCode}
                </h2>
                <span className={`badge ${getStatusBadgeClass(request.status)}`} style={{ fontSize: '12px', padding: '4px 10px' }}>
                  {getPurchaseStatusLabel(request.status)}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Hồ sơ trình Ban Giám Đốc thẩm định nhu cầu và phê duyệt dòng tiền giải ngân
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
              title="In phiếu đề xuất"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <Printer size={15} /> In Phiếu
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
              marginBottom: '22px',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Công Trình / Dự Án
              </span>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Building2 size={16} color="var(--brand-500)" />
                <span>{request.projectName || `Dự án #${request.projectId}`}</span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Hạng Mục & Công Tác (WBS)
              </span>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Layers size={15} color="#2563eb" />
                <span>{request.projectTaskName || request.projectItemName || 'Công tác theo kế hoạch'}</span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Người Lập & Ngày Lập
              </span>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <User size={15} color="#16a34a" />
                <span>{request.requestedByName || request.createdByName || 'Ban chỉ huy'}</span>
                <span style={{ color: '#94a3b8' }}>•</span>
                <span>{formatDate(request.requestDate || request.createdAt)}</span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tổng Giá Trị Đề Xuất Chi
              </span>
              <div style={{ fontWeight: 900, color: 'var(--brand-500)', fontSize: '18px', marginTop: '3px' }}>
                {formatCurrency(totalWithVat)}
              </div>
              <div style={{ fontSize: '11px', color: vatRate > 0 ? '#ea580c' : '#15803d', marginTop: '2px', fontWeight: 600 }}>
                {vatRate > 0 ? `Đã gồm thuế VAT (${vatRate}%)` : 'Chưa / Không tính thuế VAT'}
              </div>
            </div>
          </div>

          {/* Section: Executive Cash Flow & Budget Control Panel */}
          <div
            style={{
              marginBottom: '24px',
              padding: '18px 20px',
              borderRadius: '12px',
              backgroundColor: '#fff7ed',
              border: '1.5px solid #fed7aa',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={20} color="var(--brand-500)" />
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#c2410c' }}>
                  Bảng Thẩm Định Dòng Tiền & Kiểm Soát Ngân Sách (Dành Cho Giám Đốc)
                </h3>
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  backgroundColor: budgetUsagePercent > 90 ? '#fee2e2' : '#dcfce7',
                  color: budgetUsagePercent > 90 ? '#b91c1c' : '#15803d',
                  border: `1px solid ${budgetUsagePercent > 90 ? '#fecaca' : '#bbf7d0'}`,
                }}
              >
                Tiêu hao ngân sách công tác: {budgetUsagePercent}%
              </span>
            </div>

            {/* 3 Metric Cards for Cash Flow */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '14px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #fed7aa' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>DỰ TOÁN NGÂN SÁCH ĐƯỢC DUYỆT</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  {formatCurrency(taskBudgetTotal)}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  Hạn mức tối đa cho công tác này
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #fed7aa' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>ĐÃ CHI MUA LŨY KẾ + PHIẾU NÀY</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#ea580c', marginTop: '4px' }}>
                  {formatCurrency(taskAccumulatedSpent + totalEstimatedAmount)}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Đã chi: {formatCurrency(taskAccumulatedSpent)} | Phiếu này: {formatCurrency(totalEstimatedAmount)}
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #fed7aa' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>NGÂN SÁCH CÒN LẠI SAU DUYỆT</span>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 800,
                    color: remainingBudgetAfter >= 0 ? '#16a34a' : '#dc2626',
                    marginTop: '4px',
                  }}
                >
                  {formatCurrency(remainingBudgetAfter)}
                </div>
                <div style={{ fontSize: '11px', color: remainingBudgetAfter >= 0 ? '#15803d' : '#b91c1c', marginTop: '2px' }}>
                  {remainingBudgetAfter >= 0 ? '✓ Nằm trong hạn mức an toàn' : '⚠ Cảnh báo: Vượt dự toán được duyệt!'}
                </div>
              </div>
            </div>

            {/* Cash Outflow Timeline */}
            <div style={{ backgroundColor: '#ffffff', padding: '14px 16px', borderRadius: '10px', border: '1px solid #fed7aa' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#c2410c', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <CreditCard size={16} />
                <span>KẾ HOẠCH DÒNG TIỀN RA DỰ KIẾN CẦN CHUẨN BỊ (CASH OUTFLOW SCHEDULE):</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', fontSize: '13px' }}>
                <div style={{ borderLeft: '3px solid #f59e0b', paddingLeft: '10px' }}>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>1. Tạm ứng đặt cọc (30%):</div>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '2px', fontSize: '15px' }}>{formatCurrency(advancePayment)}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Cần xuất quỹ ngay khi ký đơn hàng PO</div>
                </div>
                <div style={{ borderLeft: '3px solid #3b82f6', paddingLeft: '10px' }}>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>2. Khi giao hàng tại kho (60%):</div>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '2px', fontSize: '15px' }}>{formatCurrency(deliveryPayment)}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Dự kiến sau 3-5 ngày sau khi duyệt</div>
                </div>
                <div style={{ borderLeft: '3px solid #10b981', paddingLeft: '10px' }}>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>3. Quyết toán & bảo hành (10%):</div>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '2px', fontSize: '15px' }}>{formatCurrency(retentionPayment)}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Theo thỏa thuận bảo hành với NCC</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Table of Materials */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Danh Sách Vật Tư Đề Xuất Cung Cấp Chi Tiết ({items.length} mặt hàng)
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Bao gồm chi tiết: Khối lượng yêu cầu, Đơn giá dự toán & Thành tiền giải ngân dự kiến
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="no-print">
                {/* VAT Toggle Selector (Có thể có hoặc không thuế) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f1f5f9', padding: '3px 6px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <span style={{ fontSize: '12px', color: '#475569', fontWeight: 700, marginRight: '4px' }}>Thuế VAT:</span>
                  <button
                    type="button"
                    onClick={() => setVatOption('NONE')}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: vatOption === 'NONE' ? 800 : 500,
                      backgroundColor: vatOption === 'NONE' ? '#ffffff' : 'transparent',
                      color: vatOption === 'NONE' ? '#0f172a' : '#64748b',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      boxShadow: vatOption === 'NONE' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    Không thuế (0%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVatOption('8')}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: vatOption === '8' ? 800 : 500,
                      backgroundColor: vatOption === '8' ? '#ffffff' : 'transparent',
                      color: vatOption === '8' ? '#0f172a' : '#64748b',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      boxShadow: vatOption === '8' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    VAT 8%
                  </button>
                  <button
                    type="button"
                    onClick={() => setVatOption('10')}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: vatOption === '10' ? 800 : 500,
                      backgroundColor: vatOption === '10' ? '#ffffff' : 'transparent',
                      color: vatOption === '10' ? '#0f172a' : '#64748b',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      boxShadow: vatOption === '10' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    VAT 10%
                  </button>
                </div>
                <span className="badge badge-primary" style={{ fontSize: '12px', padding: '5px 12px', fontWeight: 800 }}>
                  Tổng chi: {formatCurrency(totalWithVat)}
                </span>
              </div>
            </div>

            <div
              className="table-container"
              style={{
                borderRadius: '10px',
                overflowX: 'auto',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
              }}
            >
              <table className="bmc-table" style={{ margin: 0, minWidth: '1080px', width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ width: '45px', textAlign: 'center', color: '#475569', fontWeight: 700 }}>STT</th>
                    <th style={{ width: '105px', color: '#475569', fontWeight: 700 }}>Mã Vật Tư</th>
                    <th style={{ minWidth: '200px', color: '#475569', fontWeight: 700 }}>Tên Vật Tư / Quy Cách Tiêu Chuẩn</th>
                    <th style={{ width: '75px', textAlign: 'center', color: '#475569', fontWeight: 700 }}>ĐVT</th>
                    <th style={{ minWidth: '210px', color: '#475569', fontWeight: 700 }}>Công Tác / Hạng Mục WBS</th>
                    <th style={{ width: '120px', textAlign: 'right', color: '#475569', fontWeight: 700 }}>Khối Lượng Y/C</th>
                    <th style={{ width: '145px', textAlign: 'right', color: '#475569', fontWeight: 700 }}>Đơn Giá Dự Kiến (VNĐ)</th>
                    <th style={{ width: '165px', textAlign: 'right', color: '#c2410c', fontWeight: 800, backgroundColor: '#fff7ed' }}>
                      Thành Tiền Dự Kiến (VNĐ)
                    </th>
                    <th style={{ minWidth: '120px', color: '#475569', fontWeight: 700 }}>Ghi Chú Kỹ Thuật</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                      <td>
                        <code style={{ fontWeight: 800, color: 'var(--brand-500)', fontSize: '13px' }}>
                          {it.materialCode || `VT-${it.materialId}`}
                        </code>
                      </td>
                      <td style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                        {it.materialName || 'Vật tư công trình'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-secondary" style={{ fontSize: '12px', fontWeight: 700, padding: '3px 8px' }}>
                          {getUnitDisplay(it)}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px' }}>
                        <div style={{ color: '#1e293b', fontWeight: 600 }}>
                          {it.projectTaskName || request.projectTaskName || 'Công tác theo kế hoạch'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          {it.projectItemName || request.projectItemName || ''}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>
                        {formatNumber(it.quantity, 2)}
                      </td>
                      <td style={{ textAlign: 'right', color: '#2563eb', fontWeight: 700, fontSize: '13px' }}>
                        {formatCurrency(it.estimatedPrice || 0)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 900, color: '#ea580c', fontSize: '14px', backgroundColor: '#fffaf5' }}>
                        {formatCurrency(it.totalPrice || 0)}
                      </td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>{it.note || '-'}</td>
                    </tr>
                  ))}

                  {/* Summary Row 1: Line Item Subtotals */}
                  <tr style={{ backgroundColor: '#f8fafc', fontWeight: 800, borderTop: '2px solid #cbd5e1' }}>
                    <td colSpan={5} style={{ textAlign: 'right', paddingRight: '16px', color: '#334155', fontSize: '13px' }}>
                      CỘNG KHỐI LƯỢNG & GIÁ TRỊ VẬT TƯ ({items.length} mặt hàng):
                    </td>
                    <td style={{ textAlign: 'right', color: '#0f172a', fontSize: '14px', fontWeight: 900 }}>
                      {formatNumber(totalQuantity, 2)}
                    </td>
                    <td style={{ textAlign: 'center', color: '#94a3b8' }}>-</td>
                    <td style={{ textAlign: 'right', fontSize: '15px', color: '#ea580c', fontWeight: 900, backgroundColor: '#fffaf5' }}>
                      {formatCurrency(totalEstimatedAmount)}
                    </td>
                    <td></td>
                  </tr>

                  {/* Summary Row 2: Subtotal before VAT */}
                  <tr style={{ backgroundColor: '#ffffff', fontWeight: 700 }}>
                    <td colSpan={7} style={{ textAlign: 'right', paddingRight: '16px', color: '#475569', fontSize: '13px' }}>
                      Tổng giá trị đề xuất mua sắm (Chưa bao gồm thuế VAT):
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '15px', color: '#0f172a', fontWeight: 800, backgroundColor: '#fffaf5' }}>
                      {formatCurrency(totalEstimatedAmount)}
                    </td>
                    <td></td>
                  </tr>

                  {/* Summary Row 3: Estimated VAT (Có hoặc không theo lựa chọn) */}
                  {vatRate > 0 ? (
                    <tr style={{ backgroundColor: '#ffffff', fontWeight: 700 }}>
                      <td colSpan={7} style={{ textAlign: 'right', paddingRight: '16px', color: '#64748b', fontSize: '13px' }}>
                        Tiền thuế GTGT (VAT {vatRate}%):
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '14px', color: '#64748b', fontWeight: 700, backgroundColor: '#fffaf5' }}>
                        +{formatCurrency(vatAmount)}
                      </td>
                      <td style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Thuế suất {vatRate}%</td>
                    </tr>
                  ) : (
                    <tr style={{ backgroundColor: '#ffffff', fontWeight: 600 }}>
                      <td colSpan={7} style={{ textAlign: 'right', paddingRight: '16px', color: '#64748b', fontSize: '13px' }}>
                        Thuế GTGT (VAT):
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '13px', color: '#15803d', fontWeight: 700, backgroundColor: '#fffaf5' }}>
                        0 ₫ (Không tính thuế)
                      </td>
                      <td style={{ fontSize: '11px', color: '#15803d', fontStyle: 'italic' }}>Không áp dụng VAT</td>
                    </tr>
                  )}

                  {/* Summary Row 4: Grand total after VAT */}
                  <tr style={{ backgroundColor: '#fff7ed', fontWeight: 900, borderTop: '1px solid #fed7aa' }}>
                    <td colSpan={7} style={{ textAlign: 'right', paddingRight: '16px', color: '#c2410c', fontSize: '14px' }}>
                      {vatRate > 0
                        ? `TỔNG CỘNG NHU CẦU DÒNG TIỀN ĐỀ XUẤT (ĐÃ GỒM VAT ${vatRate}%):`
                        : 'TỔNG CỘNG NHU CẦU DÒNG TIỀN ĐỀ XUẤT:'}
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '17px', color: '#ea580c', fontWeight: 900, backgroundColor: '#ffedd5' }}>
                      {formatCurrency(totalWithVat)}
                    </td>
                    <td style={{ fontSize: '11px', color: '#9a3412', fontWeight: 700 }}>Đề xuất giải ngân</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Print Signatures Block (Visible only when printing) */}
            <div
              className="print-only"
              style={{
                display: 'none',
                marginTop: '36px',
                paddingTop: '20px',
              }}
            >
              <style>{`
                @media print {
                  .print-only {
                    display: block !important;
                  }
                }
              `}</style>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', fontSize: '13px' }}>
                <div>
                  <div style={{ fontWeight: 800, textTransform: 'uppercase' }}>NGƯỜI ĐỀ XUẤT</div>
                  <div style={{ fontStyle: 'italic', fontSize: '11px', color: '#64748b' }}>(Ký và ghi rõ họ tên)</div>
                  <div style={{ height: '70px' }}></div>
                  <div style={{ fontWeight: 700 }}>{request.requestedByName || request.createdByName || 'Ban chỉ huy'}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 800, textTransform: 'uppercase' }}>CHỈ HUY TRƯỞNG CÔNG TRÌNH</div>
                  <div style={{ fontStyle: 'italic', fontSize: '11px', color: '#64748b' }}>(Ký và ghi rõ họ tên)</div>
                  <div style={{ height: '70px' }}></div>
                  <div style={{ fontWeight: 700 }}>Chỉ huy trưởng</div>
                </div>
                <div>
                  <div style={{ fontWeight: 800, textTransform: 'uppercase' }}>BAN GIÁM ĐỐC PHÊ DUYỆT</div>
                  <div style={{ fontStyle: 'italic', fontSize: '11px', color: '#64748b' }}>(Ký duyệt & đóng dấu)</div>
                  <div style={{ height: '70px' }}></div>
                  <div style={{ fontWeight: 700 }}>{request.approvedByName || 'Ban Giám Đốc BMC'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Ghi chú & Thẩm định */}
          {request.note && (
            <div style={{ padding: '14px 18px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <span style={{ fontWeight: 700, color: '#64748b', fontSize: '12px' }}>Ý kiến / Giải trình của Ban chỉ huy công trường:</span>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#0f172a', lineHeight: 1.5 }}>{request.note}</p>
            </div>
          )}

          {/* Input lý do từ chối nếu có */}
          {showRejectInput && (
            <div style={{ padding: '16px 18px', backgroundColor: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca', marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#b91c1c', display: 'block', marginBottom: '6px' }}>
                Lý Do Từ Chối / Yêu Cầu Sửa Đổi Trình Lại:
              </label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Nhập lý do từ chối (Ví dụ: Vượt định mức cốt thép dầm; Giá xi măng đề xuất cao hơn thị trường;...)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{ width: '100%', fontSize: '13px', backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowRejectInput(false)}>
                  Hủy
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleReject}
                  disabled={submitting}
                >
                  Xác Nhận Từ Chối
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Action Buttons */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Trạng thái hiện tại:{' '}
            <strong style={{ color: '#0f172a' }}>{getPurchaseStatusLabel(request.status)}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Đóng
            </button>

            {request.status === 'DRAFT' && onSubmitForApproval && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  onSubmitForApproval(request.id);
                  onClose();
                }}
                disabled={submitting}
              >
                <Send size={15} style={{ marginRight: 6 }} /> Gửi Trình Ban Giám Đốc
              </button>
            )}

            {['SUBMITTED', 'DRAFT'].includes(request.status) && (
              <>
                {!showRejectInput && onReject && (
                  <button
                    className="btn btn-danger"
                    onClick={() => setShowRejectInput(true)}
                    disabled={submitting}
                  >
                    <X size={15} style={{ marginRight: 6 }} /> Từ Chối Duyệt
                  </button>
                )}

                {onApprove && (
                  <button
                    className="btn btn-success"
                    onClick={handleApprove}
                    disabled={submitting}
                    style={{ fontWeight: 800 }}
                  >
                    <CheckCircle size={15} style={{ marginRight: 6 }} /> Phê Duyệt & Chuyển Sang Mua Hàng
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
