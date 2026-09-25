import React, { useState, useEffect } from 'react';
import {
  FileText,
  DollarSign,
  TrendingUp,
  Award,
  Upload,
  Eye,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Edit3,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck
} from 'lucide-react';
import { projectApi, adminApi, uploadApi } from '../../api';
import { ProjectFinancialSummary, ProjectDocument } from '../../types';
import { formatCurrency, formatPercent, formatDate } from '../../utils/formatters';

interface BiddingFinancialTabProps {
  projectId: number;
  onViewPdf: (url: string, title: string) => void;
}

export const BiddingFinancialTab: React.FC<BiddingFinancialTabProps> = ({
  projectId,
  onViewPdf,
}) => {
  const [data, setData] = useState<ProjectFinancialSummary | null>(null);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Edit form state
  const [ownerEstimate, setOwnerEstimate] = useState<number>(0);
  const [biddingPrice, setBiddingPrice] = useState<number>(0);
  const [biddingStatus, setBiddingStatus] = useState<string>('Đã trúng thầu & Ký HĐ');

  // Upload form state
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('BIDDING_PACKAGE');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryRes, docsRes] = await Promise.all([
        projectApi.getFinancialSummary(projectId),
        adminApi.getDocuments(projectId),
      ]);
      setData(summaryRes);
      setDocuments(docsRes);
      if (summaryRes) {
        setOwnerEstimate(summaryRes.ownerEstimate || 0);
        setBiddingPrice(summaryRes.biddingPrice || 0);
        setBiddingStatus(summaryRes.biddingStatus || 'Đã trúng thầu & Ký HĐ');
      }
    } catch (err) {
      console.error('Failed to load financial summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBidding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await projectApi.update(projectId, {
        ownerEstimate,
        biddingPrice,
        biddingStatus,
      } as any);
      setIsEditModalOpen(false);
      await loadData();
    } catch (err) {
      alert('Không thể cập nhật hồ sơ đấu thầu.');
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Vui lòng chọn tệp PDF.');
      return;
    }

    setUploading(true);
    try {
      // 1. Upload to storage
      const uploaded = await uploadApi.uploadFile(uploadFile);
      
      // 2. Attach to project documents
      await adminApi.createDocument({
        projectId,
        title: docTitle || uploadFile.name,
        documentType: docType,
        documentNo: `DOC-${Date.now().toString().slice(-4)}`,
        initialFileName: uploaded.fileName,
        initialFileUrl: uploaded.url,
        fileSize: uploaded.fileSize,
        mimeType: uploaded.mimeType,
      });

      // 3. If it's bidding doc, update project bidding_document_url
      if (docType === 'BIDDING_PACKAGE') {
        await projectApi.update(projectId, {
          biddingDocumentUrl: uploaded.url,
        } as any);
      }

      setIsUploadModalOpen(false);
      setDocTitle('');
      setUploadFile(null);
      await loadData();
    } catch (err) {
      alert('Tải lên tài liệu thất bại.');
    } finally {
      setUploading(false);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
        Đang phân tích dữ liệu Đấu thầu & Đánh giá Lãi/Lỗ...
      </div>
    );
  }

  const plannedMargin = data?.plannedProfitMarginPercent ?? 0;
  const currentMargin = data?.currentProfitMarginPercent ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner / Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Award size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Hồ Sơ Đấu Thầu & Đánh Giá Hiệu Quả Tài Chính (Lãi / Lỗ)
              </h3>
              <span
                style={{
                  padding: '2px 8px',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                {data?.biddingStatus || 'Đã trúng thầu'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Chủ đầu tư: <strong>{data?.investorName || 'Chưa cập nhật'}</strong> • Theo dõi thời gian thực so sánh Giá thầu vs Dự toán vs Chi tiêu
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <Edit3 size={15} />
            <span>Cập nhật Giá Thầu</span>
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <Upload size={15} />
            <span>Tải Lên Hồ Sơ PDF</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Financial Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}
      >
        {/* Card 1: Owner Estimate */}
        <div
          style={{
            padding: '18px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>
            <Building size={16} />
            <span>Giá Gói Thầu Chủ Đầu Tư</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#334155', marginTop: '8px' }}>
            {data?.ownerEstimate ? formatCurrency(data.ownerEstimate) : 'Chưa nhập'}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            Dự toán phê duyệt của CĐT
          </div>
        </div>

        {/* Card 2: Bidding Contract Amount */}
        <div
          style={{
            padding: '18px',
            borderRadius: '12px',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369a1', fontSize: '12px', fontWeight: 700 }}>
            <Award size={16} />
            <span>Giá Trúng Thầu (Ký Hợp Đồng)</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#0284c7', marginTop: '8px' }}>
            {data?.biddingPrice ? formatCurrency(data.biddingPrice) : 'Chưa nhập'}
          </div>
          <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '4px' }}>
            Doanh thu hợp đồng cam kết
          </div>
        </div>

        {/* Card 3: Baseline Total Estimate */}
        <div
          style={{
            padding: '18px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>
            <DollarSign size={16} />
            <span>Dự Toán Thi Công (Baseline)</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
            {formatCurrency(data?.baselineTotalEstimate)}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Sau VAT: <strong>{formatCurrency(data?.baselineTotalWithVat)}</strong>
          </div>
        </div>

        {/* Card 4: Actual Spent */}
        <div
          style={{
            padding: '18px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>
            <TrendingUp size={16} />
            <span>Chi Phí Thực Tế Đã Tiêu Hao</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#2563eb', marginTop: '8px' }}>
            {formatCurrency(data?.totalActualCost)}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Vật tư, Nhân công, Ca máy & Khác
          </div>
        </div>
      </div>

      {/* 2-Level Profit/Loss Gauge & Deep Analysis */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
        }}
      >
        {/* Level 1: Planned Profit (Lãi Dự Kiến Kế Hoạch) */}
        <div
          style={{
            padding: '24px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
              CẤP ĐỘ 1: LÃI GỘP DỰ KIẾN KẾ HOẠCH
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 700,
                color: (data?.plannedProfit || 0) >= 0 ? '#16a34a' : '#dc2626',
              }}
            >
              {(data?.plannedProfit || 0) >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              Tỷ suất: {formatPercent(plannedMargin)}
            </span>
          </div>

          <div
            style={{
              fontSize: '28px',
              fontWeight: 900,
              color: (data?.plannedProfit || 0) >= 0 ? '#15803d' : '#b91c1c',
              marginTop: '12px',
            }}
          >
            {data?.plannedProfit !== null && data?.plannedProfit !== undefined
              ? formatCurrency(data.plannedProfit)
              : 'Chưa có giá thầu'}
          </div>

          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            Công thức: <code>Giá trúng thầu ({formatCurrency(data?.biddingPrice)}) - Tổng dự toán ({formatCurrency(data?.baselineTotalEstimate)})</code>
          </div>

          <div style={{ marginTop: '16px', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, Math.max(0, plannedMargin * 3))}%`,
                height: '100%',
                backgroundColor: plannedMargin >= 10 ? '#10b981' : plannedMargin > 0 ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
            <span>0% Hòa vốn</span>
            <span>Mục tiêu: 10% - 15%</span>
            <span>30% Tối ưu</span>
          </div>
        </div>

        {/* Level 2: Real-time Actual Profit (Lãi / Lỗ Thực Tế Thời Gian Thực) */}
        <div
          style={{
            padding: '24px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
              CẤP ĐỘ 2: LÃI THỰC TẾ THỜI GIAN THỰC (TỚI HIỆN TẠI)
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 700,
                color: (data?.currentProfit || 0) >= 0 ? '#16a34a' : '#dc2626',
              }}
            >
              {(data?.currentProfit || 0) >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              Tỷ suất còn lại: {formatPercent(currentMargin)}
            </span>
          </div>

          <div
            style={{
              fontSize: '28px',
              fontWeight: 900,
              color: (data?.currentProfit || 0) >= 0 ? '#2563eb' : '#dc2626',
              marginTop: '12px',
            }}
          >
            {data?.currentProfit !== null && data?.currentProfit !== undefined
              ? formatCurrency(data.currentProfit)
              : 'Chưa có giá thầu'}
          </div>

          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            Công thức: <code>Giá trúng thầu ({formatCurrency(data?.biddingPrice)}) - Chi phí thực tế đã chi ({formatCurrency(data?.totalActualCost)})</code>
          </div>

          <div style={{ marginTop: '16px', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, (data?.totalActualCost || 0) / (data?.biddingPrice || 1) * 100)}%`,
                height: '100%',
                backgroundColor: (data?.totalActualCost || 0) > (data?.biddingPrice || 0) ? '#ef4444' : '#3b82f6',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
            <span>Đã giải ngân: {formatCurrency(data?.totalActualCost)}</span>
            <span>Hạn mức HĐ: {formatCurrency(data?.biddingPrice)}</span>
          </div>
        </div>
      </div>

      {/* PDF Management Section */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#ef4444" />
              <span>📄 Hồ Sơ Đấu Thầu, Hợp Đồng & Tài Liệu Bản Vẽ PDF</span>
            </h3>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Tất cả tài liệu định dạng PDF được lưu trữ bảo mật và hỗ trợ trình xem trực tiếp ngay trên trang web.
            </div>
          </div>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <Plus size={15} />
            <span>Thêm File PDF</span>
          </button>
        </div>

        {/* Project Bidding Document if pinned */}
        {data?.biddingDocumentUrl && (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#eff6ff',
              borderRadius: '10px',
              border: '1px solid #bfdbfe',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#dbeafe',
                  color: '#1d4ed8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={20} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e3a8a' }}>
                  Hợp Đồng Thi Công / Hồ Sơ Thầu Chính Thức (Đã ghim)
                </div>
                <div style={{ fontSize: '12px', color: '#3b82f6' }}>
                  {data.biddingDocumentUrl}
                </div>
              </div>
            </div>

            <button
              onClick={() => onViewPdf(data.biddingDocumentUrl!, 'Hợp Đồng Thi Công Chính Thức')}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <Eye size={15} />
              <span>Xem PDF Trực Tiếp</span>
            </button>
          </div>
        )}

        {/* Documents Table */}
        {documents.length === 0 && !data?.biddingDocumentUrl ? (
          <div style={{ padding: '36px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#94a3b8' }}>
            Chưa có tài liệu hồ sơ thầu hay hợp đồng PDF nào được tải lên.
          </div>
        ) : (
          <div className="table-container">
            <table className="table" style={{ width: '100%', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Mã TL</th>
                  <th>Tiêu đề tài liệu</th>
                  <th>Phân loại</th>
                  <th>Phiên bản</th>
                  <th>Ngày tải lên</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const latestUrl = doc.latestVersion?.fileUrl || (doc as any).fileUrl;
                  return (
                    <tr key={doc.id}>
                      <td><code style={{ fontSize: '12px' }}>{doc.documentNo || `DOC-${doc.id}`}</code></td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FileText size={15} color="#ef4444" />
                          <span>{doc.title}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', padding: '2px 8px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}>
                          {doc.documentType}
                        </span>
                      </td>
                      <td>v{doc.currentVersionNo || 1}</td>
                      <td>{formatDate(doc.updatedAt)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            if (latestUrl) {
                              onViewPdf(latestUrl, doc.title);
                            } else {
                              alert('Tài liệu chưa có đường dẫn tệp tin.');
                            }
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={13} />
                          <span>Xem PDF</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Bidding Modal */}
      {isEditModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(2px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '500px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 600, fontSize: '15px' }}>
              Cập Nhật Hồ Sơ & Giá Trúng Thầu
            </div>
            <form onSubmit={handleUpdateBidding} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Giá Gói Thầu CĐT Phê Duyệt (VNĐ)
                </label>
                <input
                  type="number"
                  value={ownerEstimate}
                  onChange={(e) => setOwnerEstimate(Number(e.target.value))}
                  className="form-control"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Giá Trúng Thầu / Ký Hợp Đồng (VNĐ)
                </label>
                <input
                  type="number"
                  value={biddingPrice}
                  onChange={(e) => setBiddingPrice(Number(e.target.value))}
                  className="form-control"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Trạng Thái Đấu Thầu
                </label>
                <select
                  value={biddingStatus}
                  onChange={(e) => setBiddingStatus(e.target.value)}
                  className="form-control"
                  style={{ width: '100%' }}
                >
                  <option value="Đang chuẩn bị hồ sơ">Đang chuẩn bị hồ sơ</option>
                  <option value="Đã nộp dự thầu">Đã nộp dự thầu</option>
                  <option value="Đã trúng thầu & Ký HĐ">Đã trúng thầu & Ký HĐ</option>
                  <option value="Không trúng thầu">Không trúng thầu</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload PDF Modal */}
      {isUploadModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(2px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '520px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 600, fontSize: '15px' }}>
              Tải Lên Hồ Sơ / Hợp Đồng / Bản Vẽ (PDF)
            </div>
            <form onSubmit={handleUploadDocument} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Tiêu Đề Tài Liệu *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hợp đồng thi công móng M02B, Bản vẽ kết cấu..."
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="form-control"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Loại Tài Liệu
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="form-control"
                  style={{ width: '100%' }}
                >
                  <option value="BIDDING_PACKAGE">Hồ sơ mời thầu / dự thầu</option>
                  <option value="CONTRACT">Hợp đồng thi công xây dựng</option>
                  <option value="DESIGN_DRAWING">Bản vẽ thiết kế & thi công</option>
                  <option value="ACCEPTANCE">Biên bản nghiệm thu kỹ thuật</option>
                  <option value="LEGAL">Pháp lý dự án</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Chọn Tệp Tin PDF *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                      if (!docTitle) setDocTitle(e.target.files[0].name.replace('.pdf', ''));
                    }
                  }}
                  className="form-control"
                  style={{ width: '100%', padding: '8px' }}
                />
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  Hỗ trợ định dạng PDF (dung lượng tối đa 50MB)
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" disabled={uploading} className="btn btn-primary">
                  {uploading ? 'Đang tải lên...' : 'Tải Lên & Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
