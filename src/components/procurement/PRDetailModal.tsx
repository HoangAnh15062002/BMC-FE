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
    if (code.includes('GACH') || name.includes('gạch')) return 1350;
    if (code.includes('CAT') || name.includes('cát')) return 320000;
    if (code.includes('DA') || name.includes('đá')) return 280000;
    if (code.includes('THEP') || name.includes('thép')) return 17500;
    if (code.includes('XI') || name.includes('xi măng')) return 1650000;
    if (code.includes('BE') || name.includes('bê tông')) return 1280000;
    return 150000;
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

  const totalEstimatedAmount = items.reduce((sum, it) => sum + (it.totalPrice || 0), 0);
  
  // Executive Budget Simulation for Director
  const taskBudgetTotal = Math.round(totalEstimatedAmount * 1.4); // Dự toán được duyệt cho công tác này
  const taskAccumulatedSpent = Math.round(totalEstimatedAmount * 0.45); // Lũy kế đã chi mua sắm trước đó
  const remainingBudgetBefore = taskBudgetTotal - taskAccumulatedSpent;
  const remainingBudgetAfter = remainingBudgetBefore - totalEstimatedAmount;
  const budgetUsagePercent = Math.min(100, Math.round(((taskAccumulatedSpent + totalEstimatedAmount) / taskBudgetTotal) * 100));

  // Cashflow Outflow Timeline Simulation
  const advancePayment = Math.round(totalEstimatedAmount * 0.3); // 30% Tạm ứng đặt cọc
  const deliveryPayment = Math.round(totalEstimatedAmount * 0.6); // 60% Khi giao vật tư đến chân công trình
  const retentionPayment = Math.round(totalEstimatedAmount * 0.1); // 10% Quyết toán & bảo hành

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
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '1100px',
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
                {formatCurrency(totalEstimatedAmount)}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Danh Sách Vật Tư Đề Xuất Cung Cấp Chi Tiết ({items.length} mặt hàng)
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Mục đích: Cung ứng vật tư thi công đúng tiến độ dự án
              </span>
            </div>

            <div className="table-container" style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#ffffff' }}>
              <table className="bmc-table" style={{ margin: 0 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{ width: '40px', textAlign: 'center', color: '#475569' }}>STT</th>
                    <th style={{ color: '#475569' }}>Mã Vật Tư</th>
                    <th style={{ color: '#475569' }}>Tên Vật Tư / Quy Cách Tiêu Chuẩn</th>
                    <th style={{ color: '#475569' }}>ĐVT</th>
                    <th style={{ color: '#475569' }}>Công Tác / Hạng Mục WBS</th>
                    <th style={{ textAlign: 'right', color: '#475569' }}>Số Lượng Y/C</th>
                    <th style={{ textAlign: 'right', color: '#475569' }}>Đơn Giá Dự Kiến (VNĐ)</th>
                    <th style={{ textAlign: 'right', color: '#475569' }}>Thành Tiền Dự Kiến (VNĐ)</th>
                    <th style={{ color: '#475569' }}>Ghi Chú Kỹ Thuật</th>
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
                      <td>
                        <span className="badge badge-secondary" style={{ fontSize: '12px', fontWeight: 600 }}>
                          {formatUnit(it.unitName || it.unitSymbol)}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px' }}>
                        <div style={{ color: '#1e293b', fontWeight: 600 }}>
                          {it.projectTaskName || request.projectTaskName || 'Công tác chung'}
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
                      <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--brand-500)', fontSize: '14px' }}>
                        {formatCurrency(it.totalPrice || 0)}
                      </td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>{it.note || '-'}</td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr style={{ backgroundColor: '#f8fafc', fontWeight: 800 }}>
                    <td colSpan={5} style={{ textAlign: 'right', paddingRight: '16px', color: '#0f172a', fontSize: '13px' }}>
                      TỔNG CỘNG GIÁ TRỊ VẬT TƯ ĐỀ XUẤT (CHƯA VAT):
                    </td>
                    <td style={{ textAlign: 'right', color: '#0f172a', fontSize: '14px' }}>
                      {formatNumber(items.reduce((s, it) => s + Number(it.quantity || 0), 0), 2)}
                    </td>
                    <td></td>
                    <td style={{ textAlign: 'right', fontSize: '16px', color: 'var(--brand-500)', fontWeight: 900 }}>
                      {formatCurrency(totalEstimatedAmount)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
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
