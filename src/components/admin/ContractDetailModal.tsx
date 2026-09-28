import React, { useState, useEffect } from 'react';
import { Contract, ContractAppendix } from '../../types';
import { adminApi } from '../../api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { X, FileText, Plus, Printer, CheckCircle, Calendar, DollarSign, Layers } from 'lucide-react';

interface ContractDetailModalProps {
  contractId: number;
  onClose: () => void;
  onUpdated?: () => void;
}

export const ContractDetailModal: React.FC<ContractDetailModalProps> = ({
  contractId,
  onClose,
  onUpdated,
}) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddAppendix, setShowAddAppendix] = useState(false);
  const [submittingAppendix, setSubmittingAppendix] = useState(false);

  // New appendix form
  const [appForm, setAppForm] = useState({
    appendixNo: '',
    signedDate: new Date().toISOString().slice(0, 10),
    valueChange: '',
    content: '',
  });

  const loadContract = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getContractById(contractId);
      setContract(data);
    } catch (err) {
      console.error('Failed to load contract:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContract();
  }, [contractId]);

  const handleAddAppendix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;
    setSubmittingAppendix(true);
    try {
      await adminApi.addAppendix(contract.id, {
        appendixNo: appForm.appendixNo.trim(),
        signedDate: appForm.signedDate || undefined,
        adjustmentValue: Number(appForm.valueChange) || 0,
        description: appForm.content.trim() || undefined,
      });
      alert('Đã bổ sung Phụ lục hợp đồng thành công!');
      setShowAddAppendix(false);
      setAppForm({
        appendixNo: '',
        signedDate: new Date().toISOString().slice(0, 10),
        valueChange: '',
        content: '',
      });
      await loadContract();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tạo phụ lục hợp đồng');
    } finally {
      setSubmittingAppendix(false);
    }
  };

  const handlePrint = () => {
    if (!contract) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Vui lòng cho phép mở popup để xem bản in!');
      return;
    }

    const appendicesHtml = (contract.appendices || []).length > 0
      ? (contract.appendices || [])
          .map(
            (app, idx) => `
          <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td style="font-weight: bold;">${app.appendixNo}</td>
            <td style="text-align: center;">${formatDate(app.signedDate)}</td>
            <td style="text-align: right; font-weight: bold; color: #ea580c;">${formatCurrency(app.valueChange || 0)}</td>
            <td>${app.content || 'Điều chỉnh hạng mục phát sinh theo thực tế công trường'}</td>
            <td style="text-align: center;">${app.status || 'APPROVED'}</td>
          </tr>
        `
          )
          .join('')
      : '<tr><td colspan="6" style="text-align: center; color: #64748b;">Chưa có phụ lục điều chỉnh</td></tr>';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Trích Yếu Hợp Đồng - ${contract.contractNo}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; color: #000; margin: 0; padding: 20px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
            .company { font-size: 11pt; font-weight: bold; }
            .national { text-align: center; font-size: 11pt; font-weight: bold; }
            .title { text-align: center; font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 25px 0 10px 0; }
            .subtitle { text-align: center; font-style: italic; font-size: 12pt; margin-bottom: 25px; }
            table.info { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            table.info td { padding: 6px 4px; vertical-align: top; }
            table.grid { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
            table.grid th, table.grid td { border: 1px solid #000; padding: 8px; font-size: 11pt; }
            table.grid th { background-color: #f1f5f9; text-align: center; font-weight: bold; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; margin-top: 40px; text-align: center; page-break-inside: avoid; }
            .sig-title { font-weight: bold; text-transform: uppercase; margin-bottom: 60px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">
              CÔNG TY CỔ PHẦN XÂY DỰNG KỸ THUẬT BMC<br>
              <span style="font-weight: normal; font-size: 10pt;">Hệ Thống Quản Trị Hợp Đồng & Thi Công ERP</span>
            </div>
            <div class="national">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>
              <span style="font-size: 10pt; font-weight: normal; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</span>
            </div>
          </div>

          <div class="title">TRÍCH YẾU HỢP ĐỒNG THI CÔNG XÂY DỰNG</div>
          <div class="subtitle">Số: <strong>${contract.contractNo}</strong> | Ngày ký: ${formatDate(contract.signedDate)}</div>

          <table class="info">
            <tr>
              <td style="width: 28%; font-weight: bold;">Tên gói thầu / Hợp đồng:</td>
              <td style="font-weight: bold; color: #1e293b;">${contract.contractName}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Dự án / Công trình:</td>
              <td>${contract.projectName || `Dự án #${contract.projectId}`} (${contract.projectCode || ''})</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Đơn vị thi công:</td>
              <td><strong>CÔNG TY CỔ PHẦN XÂY DỰNG KỸ THUẬT BMC</strong></td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Giá trị hợp đồng gốc:</td>
              <td><strong style="font-size: 13pt;">${formatCurrency(contract.contractValue)}</strong> (VAT: ${contract.vatRate || 10}%)</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Tổng giá trị sau điều chỉnh:</td>
              <td><strong style="font-size: 14pt; color: #ea580c;">${formatCurrency(contract.totalAdjustedValue || contract.contractValue)}</strong></td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Trạng thái thực hiện:</td>
              <td><strong>${contract.status === 'ACTIVE' ? 'Đang hiệu lực thi công' : contract.status}</strong></td>
            </tr>
          </table>

          <h3 style="margin-top: 30px; margin-bottom: 8px; font-size: 12pt; text-transform: uppercase;">
            Danh Sách Phụ Lục Hợp Đồng Bổ Sung / Điều Chỉnh
          </h3>
          <table class="grid">
            <thead>
              <tr>
                <th style="width: 40px;">STT</th>
                <th style="width: 140px;">Số Phụ Lục</th>
                <th style="width: 100px;">Ngày Ký</th>
                <th style="width: 140px;">Giá Trị Thay Đổi</th>
                <th>Nội Dung Điều Chỉnh</th>
                <th style="width: 100px;">Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              ${appendicesHtml}
            </tbody>
          </table>

          <div class="signatures">
            <div>
              <div class="sig-title">ĐẠI DIỆN CHỦ ĐẦU TƯ</div>
              <div><em>(Ký, ghi rõ họ tên và đóng dấu)</em></div>
            </div>
            <div>
              <div class="sig-title">ĐẠI DIỆN NHÀ THẦU THI CÔNG BMC</div>
              <div><em>(Ký, ghi rõ họ tên và đóng dấu)</em></div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
        <div className="card" style={{ padding: '30px', textAlign: 'center' }}>
          Đang tải thông tin hợp đồng...
        </div>
      </div>
    );
  }

  if (!contract) return null;

  const totalAppendixValue = (contract.appendices || []).reduce(
    (sum, a) => sum + (a.valueChange || 0),
    0
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: '880px',
          maxWidth: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          borderRadius: '16px',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(234, 88, 12, 0.08) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--blue-tech)',
              }}
            >
              <FileText size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: 'var(--blue-tech)',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    padding: '2px 10px',
                    borderRadius: '6px',
                  }}
                >
                  {contract.contractNo}
                </span>
                <span className="badge badge-active">{contract.status || 'ACTIVE'}</span>
              </div>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {contract.contractName}
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Dự án: <strong>{contract.projectName || `Dự án #${contract.projectId}`}</strong>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
              <Printer size={15} /> In Trích Yếu HĐ
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Key Metric Gauges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
            <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'var(--bg-card-subtle, #f8fafc)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <DollarSign size={14} /> Giá trị gốc ban đầu
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
                {formatCurrency(contract.contractValue)}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Thuế VAT: {contract.vatRate || 10}%</span>
            </div>

            <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(234, 88, 12, 0.05)', border: '1px solid rgba(234, 88, 12, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--orange-primary)' }}>
                <Layers size={14} /> Giá trị phát sinh (+/-)
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--orange-primary)', marginTop: '4px' }}>
                {formatCurrency(totalAppendixValue)}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{contract.appendices?.length || 0} đợt phụ lục</span>
            </div>

            <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--emerald-success)' }}>
                <CheckCircle size={14} /> Tổng sau điều chỉnh
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--emerald-success)', marginTop: '4px' }}>
                {formatCurrency(contract.totalAdjustedValue || contract.contractValue + totalAppendixValue)}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Giá trị quyết toán chuẩn</span>
            </div>

            <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'var(--bg-card-subtle, #f8fafc)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <Calendar size={14} /> Ngày ký kết
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
                {formatDate(contract.signedDate)}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hiệu lực ngay khi ký</span>
            </div>
          </div>

          {/* Appendices Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} style={{ color: 'var(--orange-primary)' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                  Danh Sách Phụ Lục Hợp Đồng Thi Công ({contract.appendices?.length || 0})
                </h3>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddAppendix(!showAddAppendix)}
              >
                <Plus size={15} /> {showAddAppendix ? 'Đóng Form' : 'Thêm Phụ Lục Điều Chỉnh'}
              </button>
            </div>

            {/* Inline Add Appendix Form */}
            {showAddAppendix && (
              <form
                onSubmit={handleAddAppendix}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(234, 88, 12, 0.04)',
                  border: '1px solid rgba(234, 88, 12, 0.25)',
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--orange-primary)' }}>
                  Lập Phụ Lục Hợp Đồng Mới (Điều chỉnh giá trị & tiến độ)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Số Phụ Lục *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={appForm.appendixNo}
                      onChange={(e) => setAppForm({ ...appForm, appendixNo: e.target.value })}
                      placeholder={`VD: PL0${(contract.appendices?.length || 0) + 1}/${contract.contractNo}`}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Ngày Ký *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={appForm.signedDate}
                      onChange={(e) => setAppForm({ ...appForm, signedDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Giá Trị Điều Chỉnh (VNĐ) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={appForm.valueChange}
                      onChange={(e) => setAppForm({ ...appForm, valueChange: e.target.value })}
                      placeholder="VD: 150000000 (Dương: tăng, Âm: giảm)"
                      required
                    />
                  </div>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Nội Dung / Lý Do Điều Chỉnh</label>
                  <input
                    type="text"
                    className="form-input"
                    value={appForm.content}
                    onChange={(e) => setAppForm({ ...appForm, content: e.target.value })}
                    placeholder="VD: Bổ sung hạng mục gia cố móng và hạ độ sâu đào đất theo phê duyệt phát sinh..."
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowAddAppendix(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={submittingAppendix}
                  >
                    {submittingAppendix ? 'Đang lưu...' : 'Lưu Phụ Lục'}
                  </button>
                </div>
              </form>
            )}

            {/* Appendices Table */}
            <div className="table-container" style={{ margin: 0 }}>
              <table className="bmc-table">
                <thead>
                  <tr>
                    <th>Số Phụ Lục</th>
                    <th>Ngày Ký</th>
                    <th>Giá Trị Thay Đổi (VNĐ)</th>
                    <th>Nội Dung Điều Chỉnh</th>
                    <th>Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  {(contract.appendices || []).map((app: ContractAppendix) => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 700, color: 'var(--blue-tech)' }}>{app.appendixNo}</td>
                      <td>{formatDate(app.signedDate)}</td>
                      <td style={{ fontWeight: 700, color: (app.valueChange || 0) >= 0 ? 'var(--orange-primary)' : 'var(--emerald-success)' }}>
                        {(app.valueChange || 0) >= 0 ? '+' : ''}
                        {formatCurrency(app.valueChange || 0)}
                      </td>
                      <td style={{ fontSize: '0.88rem' }}>{app.content || 'Điều chỉnh khối lượng theo thực tế công trình'}</td>
                      <td>
                        <span className="badge badge-active">{app.status || 'APPROVED'}</span>
                      </td>
                    </tr>
                  ))}
                  {(!contract.appendices || contract.appendices.length === 0) && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        Chưa có phụ lục hợp đồng nào. Nhấn <strong>"Thêm Phụ Lục Điều Chỉnh"</strong> để ghi nhận phát sinh.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-card-subtle, #f8fafc)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Hợp đồng xây dựng trực thuộc hệ sinh thái ERP BMC
          </div>
          <button className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
