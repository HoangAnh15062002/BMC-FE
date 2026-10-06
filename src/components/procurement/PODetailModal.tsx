import React, { useState } from 'react';
import { PurchaseOrder, PurchaseOrderItem } from '../../types';
import { formatCurrency, formatNumber, formatDate, getPurchaseStatusLabel, getStatusBadgeClass, formatUnit } from '../../utils/formatters';
import {
  X,
  FileCheck,
  Building2,
  Calendar,
  User,
  Layers,
  DollarSign,
  Printer,
  CheckCircle,
  Truck,
  CreditCard,
  Receipt,
  Phone,
  MapPin,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface PODetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
  onApprove?: (id: number) => void;
}

export const PODetailModal: React.FC<PODetailModalProps> = ({
  isOpen,
  onClose,
  order,
  onApprove,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !order) return null;

  // Mock or real items list
  const items: PurchaseOrderItem[] = (order.items && order.items.length > 0)
    ? order.items
    : [
        {
          id: 1,
          materialId: 101,
          materialCode: 'VL-THEP-D16',
          materialName: 'Thép thanh vằn CB400 D16 Hòa Phát',
          unitName: 'Kg',
          projectItemName: 'Hạng mục: Kết cấu phần thân',
          projectTaskName: 'Công tác: Lắp dựng cốt thép dầm sàn T1',
          quantity: 4500,
          unitPrice: 17200,
          totalAmount: 4500 * 17200,
          note: 'Giao tại kho bãi công trình, đầy đủ CO/CQ',
        },
        {
          id: 2,
          materialId: 102,
          materialCode: 'VL-XM-PCB40',
          materialName: 'Xi măng Vicem Hà Tiên PCB40 đóng bao 50kg',
          unitName: 'Tấn',
          projectItemName: 'Hạng mục: Kết cấu phần thân',
          projectTaskName: 'Công tác: Đổ bê tông dầm sàn T1',
          quantity: 35,
          unitPrice: 1650000,
          totalAmount: 35 * 1650000,
          note: 'Bao bì nguyên vẹn, chứng chỉ xuất xưởng',
        },
      ];

  const rawItemsTotal = items.reduce((s, it) => s + (it.totalAmount || (it.quantity * it.unitPrice)), 0);
  const subtotal = order.amountBeforeTax || rawItemsTotal;
  const shippingFee = (order.amountBeforeTax && order.amountBeforeTax > rawItemsTotal) 
    ? (order.amountBeforeTax - rawItemsTotal) 
    : 0;
  const vatRate = order.vatRate !== undefined ? order.vatRate : (order.vatAmount === 0 ? 0 : 10);
  const vatAmount = order.vatAmount !== undefined ? order.vatAmount : Math.round(subtotal * (vatRate / 100));
  const totalAmount = order.totalAmount || (subtotal + vatAmount);

  const handleApprove = async () => {
    if (onApprove) {
      setSubmitting(true);
      try {
        await onApprove(order.id);
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
          width: isFullscreen ? '100vw' : '96vw',
          maxWidth: isFullscreen ? '100vw' : '1600px',
          height: isFullscreen ? '100vh' : '95vh',
          maxHeight: isFullscreen ? '100vh' : '95vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          border: isFullscreen ? 'none' : '1px solid #e2e8f0',
          borderRadius: isFullscreen ? 0 : '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
          transition: 'all 0.15s ease',
        }}
      >
        {/* Header */}
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
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(37, 99, 235, 0.25)',
              }}
            >
              <FileCheck size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Đơn Đặt Hàng Mua Sắm (PO): {order.poNo || order.orderCode}
                </h2>
                <span className={`badge ${getStatusBadgeClass(order.status)}`} style={{ fontSize: '12px', padding: '4px 10px' }}>
                  {getPurchaseStatusLabel(order.status)}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Hợp đồng đặt hàng nhà cung cấp & kiểm soát giải ngân dòng tiền
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Thu nhỏ giao diện' : 'Toàn màn hình'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: 600,
                backgroundColor: isFullscreen ? 'rgba(37, 99, 235, 0.1)' : undefined,
                color: isFullscreen ? '#2563eb' : undefined,
              }}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <Printer size={15} /> In Đơn Hàng PO
            </button>
            <button
              className="btn-icon"
              onClick={onClose}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, backgroundColor: '#ffffff' }}>
          {/* Top Info Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            {/* Supplier Box */}
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#0f172a', fontWeight: 800 }}>
                <Building2 size={16} color="var(--brand-500)" />
                <span>Thông Tin Nhà Cung Cấp (Vendor)</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                {order.supplierName}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Mã NCC: <strong style={{ color: '#0f172a' }}>{order.supplierCode || `NCC-${order.supplierId}`}</strong></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} /> Địa chỉ giao: Giao tại chân công trường
                </div>
              </div>
            </div>

            {/* Project & Order Details Box */}
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#0f172a', fontWeight: 800 }}>
                <Layers size={16} color="#2563eb" />
                <span>Công Trình & Điều Kiện Giao Nhận</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                {order.projectName || `Dự án #${order.projectId}`}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Ngày đặt hàng: <strong style={{ color: '#0f172a' }}>{formatDate(order.poDate || order.orderDate)}</strong></div>
                <div>Hạn giao hàng: <strong style={{ color: '#0f172a' }}>{order.deliveryDate ? formatDate(order.deliveryDate) : 'Trong vòng 3 ngày làm việc'}</strong></div>
              </div>
            </div>
          </div>

          {/* Invoice & Payment Terms Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '14px',
              marginBottom: '24px',
              padding: '16px 18px',
              borderRadius: '12px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#1d4ed8', fontWeight: 800 }}>
                <Receipt size={16} />
                <span>HÓA ĐƠN TÀI CHÍNH (VAT)</span>
              </div>
              <div style={{ marginTop: '6px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                {order.invoiceNo ? `Số HĐ: ${order.invoiceNo}` : (order.invoiceStatus === 'NOT_REQUIRED' || vatRate === 0 ? 'Không lấy hóa đơn GTGT' : 'Chưa xuất hóa đơn')}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Trạng thái:{' '}
                {order.invoiceStatus === 'RECEIVED'
                  ? 'Đã nhận HĐ điện tử'
                  : (order.invoiceStatus === 'NOT_REQUIRED' || vatRate === 0)
                  ? 'Hóa đơn bán lẻ / Không thuế VAT'
                  : order.invoiceStatus === 'PENDING'
                  ? 'Chờ NCC xuất HĐ'
                  : 'Chưa có HĐ'}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#1d4ed8', fontWeight: 800 }}>
                <CreditCard size={16} />
                <span>HÌNH THỨC & TIẾN ĐỘ TT</span>
              </div>
              <div style={{ marginTop: '6px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                {order.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản Ngân hàng' : order.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản (Mặc định)'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Hạn thanh toán: 15-30 ngày sau nhận hàng
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#1d4ed8', fontWeight: 800 }}>
                <DollarSign size={16} />
                <span>TỔNG GIÁ TRỊ THANH TOÁN (CẢ VAT)</span>
              </div>
              <div style={{ marginTop: '4px', fontSize: '18px', fontWeight: 900, color: 'var(--brand-500)' }}>
                {formatCurrency(totalAmount)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {vatRate > 0 ? `Đã bao gồm thuế GTGT (${vatRate}%)` : 'Đơn hàng không chịu thuế VAT (0% / Mua lẻ)'}
              </div>
            </div>
          </div>

          {/* Material Items Table */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 12px 0', color: '#0f172a' }}>
              Danh Mục Vật Tư Đặt Hàng Chi Tiết
            </h3>

            <div className="table-container" style={{ borderRadius: '10px', overflowX: 'auto', border: '1px solid #e2e8f0', background: '#ffffff' }}>
              <table className="bmc-table" style={{ margin: 0, minWidth: '950px', width: '100%' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{ width: '40px', textAlign: 'center', color: '#475569' }}>STT</th>
                    <th style={{ color: '#475569' }}>Mã Vật Tư</th>
                    <th style={{ color: '#475569' }}>Tên Vật Tư / Tiêu Chuẩn Giao Hàng</th>
                    <th style={{ color: '#475569' }}>ĐVT</th>
                    <th style={{ textAlign: 'right', color: '#475569' }}>Số Lượng Đặt</th>
                    <th style={{ textAlign: 'right', color: '#475569' }}>Đơn Giá PO (VNĐ)</th>
                    <th style={{ textAlign: 'right', color: '#475569' }}>Thành Tiền (VNĐ)</th>
                    <th style={{ color: '#475569' }}>Ghi Chú Đơn Hàng</th>
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
                        {it.materialName || 'Vật tư thi công'}
                      </td>
                      <td>
                        <span className="badge badge-secondary" style={{ fontSize: '12px', fontWeight: 600 }}>
                          {formatUnit((it as any).unitCode || it.unitName || it.unitSymbol)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>
                        {formatNumber(it.quantity, 2)}
                      </td>
                      <td style={{ textAlign: 'right', color: '#2563eb', fontWeight: 700, fontSize: '13px' }}>
                        {formatCurrency(it.unitPrice)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--brand-500)', fontSize: '14px' }}>
                        {formatCurrency(it.totalAmount || (it.quantity * it.unitPrice))}
                      </td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>{it.note || '-'}</td>
                    </tr>
                  ))}
                  {/* Summary Rows */}
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <td colSpan={6} style={{ textAlign: 'right', fontWeight: 700, color: '#64748b', fontSize: '13px' }}>
                      Tiền hàng vật tư:
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>
                      {formatCurrency(rawItemsTotal)}
                    </td>
                    <td></td>
                  </tr>

                  {shippingFee > 0 && (
                    <tr style={{ backgroundColor: '#fffbeb' }}>
                      <td colSpan={6} style={{ textAlign: 'right', fontWeight: 700, color: '#b45309', fontSize: '13px' }}>
                        <Truck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }} />
                        Tiền xe bơm bê tông / Cước vận chuyển đi kèm:
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#b45309', fontSize: '14px' }}>
                        +{formatCurrency(shippingFee)}
                      </td>
                      <td style={{ fontSize: '12px', color: '#b45309', fontStyle: 'italic' }}>Theo thỏa thuận PO</td>
                    </tr>
                  )}

                  {shippingFee > 0 && (
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <td colSpan={6} style={{ textAlign: 'right', fontWeight: 700, color: '#64748b', fontSize: '13px' }}>
                        Cộng trước thuế (Tổng chi phí):
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>
                        {formatCurrency(subtotal)}
                      </td>
                      <td></td>
                    </tr>
                  )}

                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <td colSpan={6} style={{ textAlign: 'right', fontWeight: 700, color: '#64748b', fontSize: '13px' }}>
                      Tiền thuế GTGT ({vatRate > 0 ? `${vatRate}%` : '0% - Không tính VAT'}):
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: vatRate > 0 ? '#64748b' : '#10b981', fontSize: '14px' }}>
                      {vatRate > 0 ? formatCurrency(vatAmount) : '0 ₫ (Miễn/Không thuế)'}
                    </td>
                    <td></td>
                  </tr>
                  <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 800 }}>
                    <td colSpan={6} style={{ textAlign: 'right', fontSize: '14px', color: '#0f172a' }}>
                      TỔNG TIỀN THANH TOÁN ĐƠN ĐẶT HÀNG PO:
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '17px', color: 'var(--brand-500)', fontWeight: 900 }}>
                      {formatCurrency(totalAmount)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {order.note && (
            <div style={{ padding: '14px 18px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontWeight: 700, color: '#64748b', fontSize: '12px' }}>Ghi chú đơn hàng:</span>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#0f172a' }}>{order.note}</p>
            </div>
          )}
        </div>

        {/* Footer */}
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
            Trạng thái đơn hàng:{' '}
            <strong style={{ color: '#0f172a' }}>{getPurchaseStatusLabel(order.status)}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Đóng
            </button>

            {['SUBMITTED', 'DRAFT'].includes(order.status) && onApprove && (
              <button
                className="btn btn-success"
                onClick={handleApprove}
                disabled={submitting}
                style={{ fontWeight: 800 }}
              >
                <CheckCircle size={16} style={{ marginRight: 6 }} /> Phê Duyệt Đơn Đặt Hàng PO
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
