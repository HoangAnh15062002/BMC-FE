import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { estimateApi, projectApi, catalogsApi } from '../api';
import { EstimateVersion, Project } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  Calculator,
  Download,
  Play,
  Plus,
  RefreshCw,
  Award,
  Eye,
  Send,
  CheckCircle,
  Star,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export const EstimatesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get('projectId') ? Number(searchParams.get('projectId')) : undefined;

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(initialProjectId);
  const [estimates, setEstimates] = useState<EstimateVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculatingId, setCalculatingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Regions & price periods for new estimate form
  const [regions, setRegions] = useState<any[]>([]);
  const [pricePeriods, setPricePeriods] = useState<any[]>([]);

  // Modal: Create new estimate version
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    versionName: '',
    description: '',
    regionCode: '',
    pricePeriodId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Modal: View detail
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailEst, setDetailEst] = useState<any | null>(null);

  const loadProjects = async () => {
    try {
      const projs = await projectApi.getAll();
      setProjects(projs);
      if (!selectedProjectId && projs.length > 0) {
        setSelectedProjectId(projs[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadEstimates = async (projId: number) => {
    setLoading(true);
    try {
      const data = await estimateApi.getByProject(projId);
      setEstimates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogs = async () => {
    try {
      const [rList, ppList] = await Promise.all([
        catalogsApi.getRegions().catch(() => []),
        catalogsApi.getPricePeriods().catch(() => []),
      ]);
      setRegions(rList);
      setPricePeriods(ppList);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProjects();
    loadCatalogs();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadEstimates(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleCalculate = async (id: number) => {
    if (!selectedProjectId) return;
    setCalculatingId(id);
    try {
      await estimateApi.calculate(selectedProjectId, id);
      alert('Đã chạy Engine tính toán chi phí tự động thành công!');
      await loadEstimates(selectedProjectId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tính toán dự toán');
    } finally {
      setCalculatingId(null);
    }
  };

  const handleExportExcel = async (id: number, versionName: string) => {
    if (!selectedProjectId) return;
    setDownloadingId(id);
    try {
      await estimateApi.downloadExcel(selectedProjectId, id, `DuToan_${versionName.replace(/\s+/g, '_')}.xlsx`);
    } catch (err: any) {
      alert('Lỗi khi tải file Excel dự toán');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSubmit = async (est: EstimateVersion) => {
    if (!selectedProjectId) return;
    if (!confirm(`Xác nhận trình duyệt phiên bản "${est.versionName}"?`)) return;
    try {
      await estimateApi.submit(selectedProjectId, est.id);
      alert('Đã trình duyệt dự toán thành công!');
      loadEstimates(selectedProjectId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi trình duyệt');
    }
  };

  const handleApprove = async (est: EstimateVersion) => {
    if (!selectedProjectId) return;
    if (!confirm(`Xác nhận PHÊ DUYỆT phiên bản "${est.versionName}"? Đây là thao tác chính thức!`)) return;
    try {
      await estimateApi.approve(selectedProjectId, est.id);
      alert('Đã phê duyệt dự toán thành công!');
      loadEstimates(selectedProjectId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi phê duyệt');
    }
  };

  const handleSetBaseline = async (est: EstimateVersion) => {
    if (!selectedProjectId) return;
    if (!confirm(`Đặt phiên bản "${est.versionName}" làm DỰ TOÁN MỐC (Baseline)? Baseline cũ sẽ bị thay thế.`)) return;
    try {
      await estimateApi.setBaseline(selectedProjectId, est.id);
      alert('Đã đặt baseline thành công!');
      loadEstimates(selectedProjectId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi đặt baseline');
    }
  };

  const handleViewDetail = async (est: EstimateVersion) => {
    if (!selectedProjectId) return;
    try {
      const detail = await estimateApi.getById(selectedProjectId, est.id);
      setDetailEst(detail);
      setShowDetailModal(true);
    } catch (err: any) {
      alert('Lỗi khi tải chi tiết dự toán');
    }
  };

  const handleCreateEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    setSubmitting(true);
    try {
      await estimateApi.create(selectedProjectId, {
        versionName: createForm.versionName.trim(),
        description: createForm.description.trim() || undefined,
        regionCode: createForm.regionCode || undefined,
        pricePeriodId: createForm.pricePeriodId ? Number(createForm.pricePeriodId) : undefined,
      });
      setShowCreateModal(false);
      setCreateForm({ versionName: '', description: '', regionCode: '', pricePeriodId: '' });
      alert('Tạo phiên bản dự toán mới thành công! Hãy bấm "Tính Toán" để chạy engine bóc tách khối lượng.');
      loadEstimates(selectedProjectId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tạo phiên bản dự toán');
    } finally {
      setSubmitting(false);
    }
  };

  const getWorkflowBtns = (est: EstimateVersion) => {
    const btns = [];

    // Calculate
    btns.push(
      <button
        key="calc"
        className="btn btn-primary btn-sm"
        onClick={() => handleCalculate(est.id)}
        disabled={calculatingId === est.id}
        title="Chạy Engine tính toán chi phí tự động"
      >
        <Play size={13} />
        {calculatingId === est.id ? 'Đang tính...' : 'Tính Toán'}
      </button>
    );

    // Submit if Draft or Calculated
    if (['DRAFT', 'CALCULATED'].includes(est.calculationStatus || '') && est.status !== 'APPROVED') {
      btns.push(
        <button
          key="submit"
          className="btn btn-secondary btn-sm"
          onClick={() => handleSubmit(est)}
          title="Trình duyệt lên cấp trên"
        >
          <Send size={13} /> Trình Duyệt
        </button>
      );
    }

    // Approve if submitted
    if (est.status === 'SUBMITTED' || (est.calculationStatus === 'CALCULATED' && est.status !== 'APPROVED')) {
      btns.push(
        <button
          key="approve"
          className="btn btn-success btn-sm"
          onClick={() => handleApprove(est)}
          title="Phê duyệt chính thức"
        >
          <CheckCircle size={13} /> Phê Duyệt
        </button>
      );
    }

    // Set Baseline if approved and not yet baseline
    if (est.status === 'APPROVED' && !est.isBaseline) {
      btns.push(
        <button
          key="baseline"
          className="btn btn-sm"
          style={{ background: 'var(--blue-tech)', color: '#fff' }}
          onClick={() => handleSetBaseline(est)}
          title="Đặt làm dự toán mốc (Baseline)"
        >
          <Star size={13} /> Đặt Baseline
        </button>
      );
    }

    // Export
    btns.push(
      <button
        key="export"
        className="btn btn-success btn-sm"
        onClick={() => handleExportExcel(est.id, est.versionName)}
        disabled={downloadingId === est.id}
        title="Xuất file Excel chuẩn Bộ Xây Dựng"
      >
        <Download size={13} />
        {downloadingId === est.id ? 'Đang tải...' : 'Xuất Excel'}
      </button>
    );

    // View Detail
    btns.push(
      <button
        key="view"
        className="btn btn-secondary btn-sm"
        onClick={() => handleViewDetail(est)}
        title="Xem chi tiết bóc tách"
      >
        <Eye size={13} /> Chi Tiết
      </button>
    );

    return btns;
  };

  const getStatusLabel = (est: EstimateVersion) => {
    if (est.status === 'APPROVED') return { label: 'Đã Phê Duyệt', cls: 'badge-approved' };
    if (est.status === 'SUBMITTED') return { label: 'Chờ Duyệt', cls: 'badge-warning' };
    if (est.calculationStatus === 'CALCULATED') return { label: 'Đã Tính Toán', cls: 'badge-info' };
    return { label: 'Dự Thảo', cls: 'badge-pending' };
  };

  return (
    <div>
      {/* Project Selector Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 24px' }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Chọn Dự Án Cần Xem Dự Toán:
            </span>
            <select
              className="form-select"
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
              style={{ minWidth: '320px' }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => selectedProjectId && loadEstimates(selectedProjectId)}
            >
              <RefreshCw size={14} /> Làm mới
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowCreateModal(true)}
              disabled={!selectedProjectId}
            >
              <Plus size={14} /> Tạo Phiên Bản Dự Toán Mới
            </button>
          </div>
        </div>
      </div>

      {/* Estimates Versions Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Danh Sách Các Phiên Bản Dự Toán</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Engine bóc tách khối lượng và áp giá theo định mức Bộ Xây Dựng (Thông tư 12/2021/TT-BXD)
            </p>
          </div>
        </div>

        <div className="table-container">
          <table className="bmc-table">
            <thead>
              <tr>
                <th>Phiên Bản</th>
                <th>Tên Phiên Bản Dự Toán</th>
                <th>Trực Tiếp (T)</th>
                <th>Gián Tiếp (GT)</th>
                <th>Thuế VAT</th>
                <th>Tổng Dự Toán Sau Thuế</th>
                <th>Trạng Thái</th>
                <th style={{ textAlign: 'center', minWidth: '340px' }}>Thao Tác Nghiệp Vụ</th>
              </tr>
            </thead>
            <tbody>
              {estimates.map((est) => {
                const { label, cls } = getStatusLabel(est);
                return (
                  <tr key={est.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge badge-info">v{est.versionNo}</span>
                        {est.isBaseline && (
                          <span className="badge badge-active" title="Dự toán mốc (Baseline)">
                            <Award size={10} style={{ display: 'inline', marginRight: 2 }} /> Baseline
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {est.versionName}
                      {est.description && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
                          {est.description}
                        </div>
                      )}
                    </td>
                    <td>{formatCurrency(est.totalDirectCost)}</td>
                    <td>{formatCurrency(est.totalIndirectCost)}</td>
                    <td>{formatCurrency(est.vatAmount)}</td>
                    <td style={{ fontWeight: 800, color: 'var(--orange-primary)', fontSize: '0.95rem' }}>
                      {formatCurrency(est.totalAfterTax)}
                    </td>
                    <td>
                      <span className={`badge ${cls}`}>{label}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {getWorkflowBtns(est)}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {estimates.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    Chưa có phiên bản dự toán nào. Bấm <strong>"Tạo Phiên Bản Dự Toán Mới"</strong> để bắt đầu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create New Estimate Version */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '540px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Tạo Phiên Bản Dự Toán Mới</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Sau khi tạo, bấm "Tính Toán" để engine bóc tách khối lượng từ WBS và áp giá định mức
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCreateModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateEstimate}>
              <div className="form-group">
                <label className="form-label">Tên Phiên Bản Dự Toán *</label>
                <input
                  type="text"
                  className="form-input"
                  value={createForm.versionName}
                  onChange={(e) => setCreateForm({ ...createForm, versionName: e.target.value })}
                  placeholder="VD: Dự Toán Gói Thầu Phần Thô - Lần 1"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mô Tả / Ghi Chú</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Mô tả phạm vi, phiên bản thiết kế hoặc ghi chú nghiệp vụ..."
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Vùng Giá Áp Dụng</label>
                  <select
                    className="form-select"
                    value={createForm.regionCode}
                    onChange={(e) => {
                      setCreateForm({ ...createForm, regionCode: e.target.value, pricePeriodId: '' });
                      if (e.target.value) catalogsApi.getPricePeriods(e.target.value).then(setPricePeriods).catch(() => {});
                    }}
                  >
                    <option value="">-- Chọn vùng giá --</option>
                    {regions.map((r: any) => (
                      <option key={r.code || r.id} value={r.code || r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Kỳ Bảng Giá Vật Liệu</label>
                  <select
                    className="form-select"
                    value={createForm.pricePeriodId}
                    onChange={(e) => setCreateForm({ ...createForm, pricePeriodId: e.target.value })}
                    disabled={!createForm.regionCode && pricePeriods.length === 0}
                  >
                    <option value="">-- Chọn kỳ giá --</option>
                    {pricePeriods.map((pp: any) => (
                      <option key={pp.id} value={pp.id}>
                        {pp.periodName || pp.name} {pp.year ? `(${pp.year})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px',
                padding: '12px 16px', marginBottom: '20px', fontSize: '12px',
                color: 'var(--text-muted)', lineHeight: 1.6
              }}>
                <strong style={{ color: 'var(--text-main)' }}>💡 Quy trình:</strong>{' '}
                Tạo phiên bản → Tính Toán (engine bóc tách WBS) → Trình Duyệt → Phê Duyệt → Đặt Baseline → Xuất Excel
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <FileSpreadsheet size={15} />
                  {submitting ? 'Đang tạo...' : 'Tạo Phiên Bản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Estimate Detail */}
      {showDetailModal && detailEst && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '820px', maxHeight: '88vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0 }}>
                  Chi Tiết Dự Toán — v{detailEst.versionNo}: {detailEst.versionName}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Bóc tách khối lượng theo WBS · Định mức Thông tư 12/2021/TT-BXD
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowDetailModal(false)}>
                <X size={16} />
              </button>
            </div>

            {/* Summary KPIs */}
            <div className="stats-grid" style={{ marginBottom: '20px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {[
                { label: 'Chi Phí Trực Tiếp (T)', val: detailEst.totalDirectCost, color: 'var(--blue-tech)' },
                { label: 'Chi Phí Gián Tiếp (GT)', val: detailEst.totalIndirectCost, color: 'var(--orange-primary)' },
                { label: 'Thuế VAT (10%)', val: detailEst.vatAmount, color: 'var(--text-muted)' },
                { label: 'Tổng Sau Thuế', val: detailEst.totalAfterTax, color: 'var(--crimson-danger)' },
              ].map((kpi, i) => (
                <div key={i} className="stat-card" style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{kpi.label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: kpi.color }}>
                    {formatCurrency(kpi.val || 0)}
                  </div>
                </div>
              ))}
            </div>

            {/* WBS Cost Breakdown Table */}
            {detailEst.items && detailEst.items.length > 0 ? (
              <div className="table-container">
                <table className="bmc-table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Mã Hạng Mục</th>
                      <th>Tên Hạng Mục</th>
                      <th>Chi Phí V (Vật Liệu)</th>
                      <th>Chi Phí N (Nhân Công)</th>
                      <th>Chi Phí M (Máy)</th>
                      <th>Tổng Trực Tiếp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailEst.items.map((item: any) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 700, color: 'var(--orange-primary)' }}>{item.code}</td>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td>{formatCurrency(item.materialCost || 0)}</td>
                        <td>{formatCurrency(item.laborCost || 0)}</td>
                        <td>{formatCurrency(item.machineCost || 0)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--blue-tech)' }}>
                          {formatCurrency((item.materialCost || 0) + (item.laborCost || 0) + (item.machineCost || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                Chưa có số liệu bóc tách. Hãy bấm <strong>"Tính Toán"</strong> để engine tự động bóc tách từ WBS.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
