import React, { useState, useEffect } from 'react';
import { Contract, ContractAppendix } from '../../types';
import { adminApi } from '../../api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  X,
  FileText,
  Plus,
  Printer,
  CheckCircle,
  Calendar,
  DollarSign,
  Layers,
  BookOpen,
  Building2,
  Shield,
  Clock,
  Download,
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'agreement' | 'appendices'>('agreement');
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
            <td>${app.content || 'Điều chỉnh khối lượng theo thực tế công trường'}</td>
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
          <title>Hợp Đồng Thi Công Xây Dựng - ${contract.contractNo}</title>
          <style>
            @page { size: A4; margin: 18mm 15mm; }
            body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.45; color: #000; margin: 0; padding: 10px; }
            .national-header { text-align: center; margin-bottom: 25px; }
            .national-header .country { font-weight: bold; font-size: 12pt; text-transform: uppercase; }
            .national-header .motto { font-size: 12pt; font-weight: bold; }
            .national-header hr { width: 140px; border: 0.5px solid #000; margin: 4px auto 0 auto; }
            .contract-title { text-align: center; margin: 25px 0 15px 0; }
            .contract-title h1 { font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 0; }
            .contract-title .sub { font-size: 12pt; font-style: italic; margin-top: 4px; }
            .legal-base { font-style: italic; font-size: 11pt; margin-bottom: 20px; line-height: 1.4; text-align: justify; }
            .party-box { margin-bottom: 16px; }
            .party-title { font-weight: bold; text-transform: uppercase; font-size: 12pt; margin-bottom: 4px; }
            .party-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
            .party-table td { padding: 3px 0; vertical-align: top; font-size: 12pt; }
            .section-title { font-weight: bold; font-size: 12.5pt; text-transform: uppercase; margin: 18px 0 8px 0; }
            p { margin: 6px 0; text-align: justify; }
            table.grid { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 20px; }
            table.grid th, table.grid td { border: 1px solid #000; padding: 6px 8px; font-size: 11pt; }
            table.grid th { background-color: #f1f5f9; text-align: center; font-weight: bold; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; margin-top: 40px; text-align: center; page-break-inside: avoid; }
            .sig-title { font-weight: bold; text-transform: uppercase; margin-bottom: 70px; font-size: 12pt; }
          </style>
        </head>
        <body>
          <div class="national-header">
            <div class="country">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div class="motto">Độc lập - Tự do - Hạnh phúc</div>
            <hr>
          </div>

          <div class="contract-title">
            <h1>HỢP ĐỒNG THI CÔNG XÂY DỰNG CÔNG TRÌNH</h1>
            <div class="sub">Số: <strong>${contract.contractNo}</strong></div>
            <div style="font-size: 11.5pt; margin-top: 4px;">Gói thầu: <strong>${contract.contractName}</strong></div>
            <div style="font-size: 11pt;">Công trình: <strong>${contract.projectName || `Dự án #${contract.projectId}`}</strong></div>
          </div>

          <div class="legal-base">
            - Căn cứ Bộ Luật Dân sự số 91/2015/QH13 đã được Quốc hội nước CHXHCN Việt Nam thông qua ngày 24/11/2015;<br>
            - Căn cứ Luật Xây dựng số 50/2014/QH13 ngày 18/06/2014 và Luật Xây dựng sửa đổi số 62/2020/QH14;<br>
            - Căn cứ Nghị định số 37/2015/NĐ-CP ngày 22/04/2015 của Chính phủ quy định chi tiết về hợp đồng xây dựng;<br>
            - Căn cứ vào hồ sơ dự thầu, hồ sơ thiết kế bản vẽ thi công và thỏa thuận giữa hai bên.
          </div>

          <p>Hôm nay, ngày ${formatDate(contract.signedDate)}, tại văn phòng điều hành công trình, hai bên gồm có:</p>

          <div class="party-box">
            <div class="party-title">BÊN GIAO THẦU (CHỦ ĐẦU TƯ - BÊN A):</div>
            <table class="party-table">
              <tr>
                <td style="width: 25%; font-weight: bold;">Tên đơn vị:</td>
                <td><strong>${contract.projectName?.includes('Móng M02B') ? 'TẬP ĐOÀN NAM LONG GROUP' : 'BAN QUẢN LÝ DỰ ÁN ĐẦU TƯ XÂY DỰNG'}</strong></td>
              </tr>
              <tr>
                <td style="font-weight: bold;">Đại diện:</td>
                <td>Ông/Bà Đại diện theo ủy quyền của Chủ Đầu Tư</td>
              </tr>
              <tr>
                <td style="font-weight: bold;">Địa chỉ:</td>
                <td>Địa chỉ trụ sở Ban Quản lý / Chủ đầu tư dự án</td>
              </tr>
            </table>
          </div>

          <div class="party-box">
            <div class="party-title">BÊN NHẬN THẦU (NHÀ THẦU THI CÔNG - BÊN B):</div>
            <table class="party-table">
              <tr>
                <td style="width: 25%; font-weight: bold;">Tên doanh nghiệp:</td>
                <td><strong>CÔNG TY CỔ PHẦN XÂY DỰNG KỸ THUẬT BMC</strong></td>
              </tr>
              <tr>
                <td style="font-weight: bold;">Đại diện pháp luật:</td>
                <td>Ban Giám Đốc Công Ty</td>
              </tr>
              <tr>
                <td style="font-weight: bold;">Mã số thuế:</td>
                <td>3700148567</td>
              </tr>
              <tr>
                <td style="font-weight: bold;">Địa chỉ:</td>
                <td>Khu đô thị sinh thái Chánh Mỹ, Phường Chánh Mỹ, TP. Thủ Dầu Một, Tỉnh Bình Dương</td>
              </tr>
            </table>
          </div>

          <div class="section-title">Điều 1: Phạm Vi Công Việc & Đối Tượng Hợp Đồng</div>
          <p>Bên A đồng ý giao và Bên B đồng ý nhận thi công trọn gói hạng mục công trình: <strong>${contract.contractName}</strong> trực thuộc công trình <strong>${contract.projectName || `Dự án #${contract.projectId}`}</strong> đúng theo hồ sơ thiết kế kỹ thuật, bản vẽ thi công và tiêu chuẩn quy chuẩn xây dựng hiện hành.</p>

          <div class="section-title">Điều 2: Giá Trị Hợp Đồng & Phương Thức Thanh Toán</div>
          <p>1. Giá trị hợp đồng ban đầu (đã bao gồm thuế GTGT ${contract.vatRate || 10}%): <strong>${formatCurrency(contract.contractValue)}</strong>.</p>
          <p>2. Tổng giá trị sau các phụ lục điều chỉnh phát sinh: <strong style="color: #ea580c;">${formatCurrency(contract.totalAdjustedValue || contract.contractValue)}</strong>.</p>
          <p>3. Phương thức thanh toán:</p>
          <p style="padding-left: 18px;">
            - <strong>Tạm ứng:</strong> Bên A tạm ứng 20% giá trị hợp đồng sau khi ký hợp đồng và nhận được bảo lãnh tạm ứng hợp lệ từ Bên B.<br>
            - <strong>Thanh toán định kỳ:</strong> Bên A thanh toán theo từng đợt tương ứng với khối lượng công việc thực tế hoàn thành đã được hai bên nghiệm thu (A-B).<br>
            - <strong>Bảo hành công trình:</strong> Bên A giữ lại 5% giá trị hợp đồng để bảo hành công trình trong thời hạn 12 đến 24 tháng theo quy định.
          </p>

          <div class="section-title">Điều 3: Tiến Độ & Thời Gian Thực Hiện</div>
          <p>- Ngày khởi công và ký kết hợp đồng: <strong>${formatDate(contract.signedDate)}</strong>.</p>
          <p>- Bên B cam kết thi công đúng tiến độ được phê duyệt, đảm bảo an toàn lao động, vệ sinh môi trường và chất lượng kỹ mỹ thuật công trình.</p>

          <div class="section-title">Điều 4: Phụ Lục Hợp Đồng Kèm Theo</div>
          <p>Các phụ lục hợp đồng phát sinh sau đây là bộ phận không thể tách rời của Hợp đồng này:</p>
          <table class="grid">
            <thead>
              <tr>
                <th style="width: 35px;">STT</th>
                <th style="width: 140px;">Số Phụ Lục</th>
                <th style="width: 95px;">Ngày Ký</th>
                <th style="width: 135px;">Giá Trị Thay Đổi</th>
                <th>Nội Dung Bổ Sung</th>
                <th style="width: 95px;">Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              ${appendicesHtml}
            </tbody>
          </table>

          <div class="signatures">
            <div>
              <div class="sig-title">ĐẠI DIỆN CHỦ ĐẦU TƯ (BÊN A)</div>
              <div><em>(Ký tên, ghi rõ họ tên và đóng dấu)</em></div>
            </div>
            <div>
              <div class="sig-title">ĐẠI DIỆN NHÀ THẦU BMC (BÊN B)</div>
              <div><em>(Ký tên, ghi rõ họ tên và đóng dấu)</em></div>
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
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: '980px',
          maxWidth: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          borderRadius: '16px',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(234, 88, 12, 0.08) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--blue-tech)',
              }}
            >
              <FileText size={24} />
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
              <h2 style={{ margin: '4px 0 0 0', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {contract.contractName}
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Công trình: <strong>{contract.projectName || `Dự án #${contract.projectId}`}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="btn btn-primary btn-sm" onClick={handlePrint} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={15} /> In Hợp Đồng (A4)
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

        {/* Financial KPI bar */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: 'var(--bg-card-subtle, #f8fafc)',
            borderBottom: '1px solid var(--border-color)',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Giá Trị Ký Ban Đầu:</span>
            <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>{formatCurrency(contract.contractValue)}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Phát Sinh Từ Phụ Lục:</span>
            <strong style={{ fontSize: '1.05rem', color: 'var(--orange-primary)' }}>+{formatCurrency(totalAppendixValue)}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Tổng Giá Trị Sau Điều Chỉnh:</span>
            <strong style={{ fontSize: '1.15rem', color: 'var(--emerald-success)' }}>
              {formatCurrency(contract.totalAdjustedValue || contract.contractValue + totalAppendixValue)}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Ngày Ký & Thời Hạn:</span>
            <strong style={{ fontSize: '0.95rem' }}>{formatDate(contract.signedDate)} (VAT: {contract.vatRate || 10}%)</strong>
          </div>
        </div>

        {/* Tab switch within modal */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 24px', backgroundColor: '#ffffff' }}>
          <button
            onClick={() => setActiveTab('agreement')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: activeTab === 'agreement' ? 'var(--blue-tech)' : 'var(--text-muted)',
              borderBottom: activeTab === 'agreement' ? '3px solid var(--blue-tech)' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <BookOpen size={16} /> Toàn Văn Hợp Đồng Xây Dựng
          </button>
          <button
            onClick={() => setActiveTab('appendices')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: activeTab === 'appendices' ? 'var(--orange-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'appendices' ? '3px solid var(--orange-primary)' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Layers size={16} /> Danh Sách Phụ Lục Hợp Đồng ({contract.appendices?.length || 0})
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: TOÀN VĂN HỢP ĐỒNG */}
          {activeTab === 'agreement' && (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '32px 40px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                fontFamily: "'Times New Roman', serif",
                fontSize: '15px',
                lineHeight: 1.6,
                color: '#1e293b',
              }}
            >
              {/* National Banner */}
              <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', textTransform: 'uppercase' }}>
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>
                  Độc lập - Tự do - Hạnh phúc
                </div>
                <div style={{ width: '130px', height: '1px', backgroundColor: '#334155', margin: '4px auto 0 auto' }} />
              </div>

              {/* Title */}
              <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, textTransform: 'uppercase' }}>
                  HỢP ĐỒNG THI CÔNG XÂY DỰNG CÔNG TRÌNH
                </h3>
                <div style={{ fontStyle: 'italic', fontSize: '14px', marginTop: '4px' }}>
                  Số: <strong>{contract.contractNo}</strong>
                </div>
                <div style={{ fontSize: '14px', marginTop: '2px' }}>
                  Gói thầu: <strong>{contract.contractName}</strong>
                </div>
              </div>

              {/* Parties */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: 700, fontSize: '15px', textTransform: 'uppercase', marginBottom: '4px' }}>
                  BÊN GIAO THẦU (CHỦ ĐẦU TƯ - BÊN A):
                </div>
                <div style={{ paddingLeft: '16px' }}>
                  <div>- Đơn vị: <strong>{contract.projectName?.includes('Móng M02B') ? 'TẬP ĐOÀN NAM LONG GROUP' : 'BAN QUẢN LÝ DỰ ÁN ĐẦU TƯ XÂY DỰNG'}</strong></div>
                  <div>- Dự án / Công trình: <strong>{contract.projectName}</strong></div>
                  <div>- Địa điểm thi công: <strong>Bình Dương / Theo hồ sơ mời thầu</strong></div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: 700, fontSize: '15px', textTransform: 'uppercase', marginBottom: '4px' }}>
                  BÊN NHẬN THẦU (NHÀ THẦU THI CÔNG - BÊN B):
                </div>
                <div style={{ paddingLeft: '16px' }}>
                  <div>- Tên doanh nghiệp: <strong>CÔNG TY CỔ PHẦN XÂY DỰNG KỸ THUẬT BMC</strong></div>
                  <div>- Người đại diện: <strong>Ban Giám Đốc Công Ty</strong></div>
                  <div>- Mã số thuế: <strong>3700148567</strong></div>
                  <div>- Trụ sở: <strong>Khu đô thị sinh thái Chánh Mỹ, Phường Chánh Mỹ, TP. Thủ Dầu Một, Tỉnh Bình Dương</strong></div>
                </div>
              </div>

              {/* Articles */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '16px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, textTransform: 'uppercase' }}>
                  Điều 1: Phạm Vi Công Việc & Khối Lượng Thi Công
                </h4>
                <p style={{ margin: '0 0 12px 0', textIndent: '24px' }}>
                  Bên A giao cho Bên B thực hiện thi công xây dựng trọn gói hạng mục <strong>{contract.contractName}</strong> trực thuộc công trình <strong>{contract.projectName}</strong> đúng theo hồ sơ thiết kế bản vẽ thi công đã được phê duyệt, tiêu chuẩn kỹ thuật xây dựng Việt Nam và cam kết an toàn lao động.
                </p>

                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, textTransform: 'uppercase' }}>
                  Điều 2: Giá Trị Hợp Đồng & Điều Khoản Thanh Toán
                </h4>
                <p style={{ margin: '0 0 8px 0', textIndent: '24px' }}>
                  1. Giá trị hợp đồng gốc: <strong>{formatCurrency(contract.contractValue)}</strong> (Thuế VAT: {contract.vatRate || 10}%).
                </p>
                <p style={{ margin: '0 0 8px 0', textIndent: '24px' }}>
                  2. Tổng giá trị sau các phụ lục bổ sung: <strong style={{ color: 'var(--orange-primary)' }}>{formatCurrency(contract.totalAdjustedValue || contract.contractValue)}</strong>.
                </p>
                <p style={{ margin: '0 0 8px 0', textIndent: '24px' }}>
                  3. <strong>Tạm ứng:</strong> Bên A tạm ứng 20% giá trị hợp đồng sau khi ký kết và nhận chứng thư bảo lãnh tạm ứng hợp lệ.
                </p>
                <p style={{ margin: '0 0 8px 0', textIndent: '24px' }}>
                  4. <strong>Thanh toán đợt:</strong> Thanh toán định kỳ hàng tháng theo khối lượng nghiệm thu hoàn thành thực tế được chỉ huy trưởng và tư vấn giám sát ký xác nhận (A-B).
                </p>
                <p style={{ margin: '0 0 12px 0', textIndent: '24px' }}>
                  5. <strong>Bảo hành công trình:</strong> Bên A giữ lại 5% giá trị quyết toán hợp đồng làm tiền bảo hành công trình trong thời hạn 12 - 24 tháng theo quy định.
                </p>

                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, textTransform: 'uppercase' }}>
                  Điều 3: Tiến Độ Thực Hiện & Bàn Giao
                </h4>
                <p style={{ margin: '0 0 12px 0', textIndent: '24px' }}>
                  Hợp đồng có hiệu lực thi công kể từ ngày <strong>{formatDate(contract.signedDate)}</strong>. Bên B có trách nhiệm bố trí đầy đủ nhân lực, vật tư và thiết bị máy móc đạt chuẩn để hoàn thành đúng tiến độ đã cam kết với Chủ Đầu Tư.
                </p>

                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, textTransform: 'uppercase' }}>
                  Điều 4: Phụ Lục Hợp Đồng
                </h4>
                <p style={{ margin: '0 0 20px 0', textIndent: '24px' }}>
                  Mọi thay đổi về phạm vi công việc, khối lượng phát sinh hoặc điều chỉnh đơn giá sẽ được hai bên xác lập bằng các <strong>Phụ lục hợp đồng</strong> và là bộ phận không thể tách rời của văn bản hợp đồng này.
                </p>
              </div>

              {/* Signatures */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginTop: '30px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '14px' }}>ĐẠI DIỆN CHỦ ĐẦU TƯ (BÊN A)</div>
                  <div style={{ fontStyle: 'italic', fontSize: '13px', marginTop: '2px' }}>(Ký tên và đóng dấu)</div>
                  <div style={{ height: '70px' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '14px' }}>ĐẠI DIỆN NHÀ THẦU BMC (BÊN B)</div>
                  <div style={{ fontStyle: 'italic', fontSize: '13px', marginTop: '2px' }}>(Ký tên và đóng dấu)</div>
                  <div style={{ height: '70px' }} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DANH SÁCH PHỤ LỤC */}
          {activeTab === 'appendices' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                    Phụ Lục Hợp Đồng & Phát Sinh Khối Lượng ({contract.appendices?.length || 0})
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Quản lý các đợt bổ sung chi phí, gia hạn thời gian và điều chỉnh gói thầu
                  </p>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAddAppendix(!showAddAppendix)}
                >
                  <Plus size={15} /> {showAddAppendix ? 'Đóng Form' : 'Thêm Phụ Lục Điều Chỉnh'}
                </button>
              </div>

              {/* Add form */}
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

              {/* Table */}
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
          )}
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
