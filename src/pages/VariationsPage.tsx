import React, { useEffect, useState } from 'react';
import { siteApi, projectApi } from '../api';
import { ProjectVariation, Project } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { GitPullRequestDraft, Plus, Check, X, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { VariationDetailModal } from '../components/variations/VariationDetailModal';

interface VariationItem {
  description: string;
  quantity: string;
  unitPrice: string;
}

export const VariationsPage: React.FC = () => {
  const [variations, setVariations] = useState<ProjectVariation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);

  // Modal: View & Approve Variation Detail
  const [selectedVariation, setSelectedVariation] = useState<ProjectVariation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Modal: Create Variation
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    projectId: '',
    title: '',
    variationType: 'ADDITION' as 'ADDITION' | 'DEDUCTION',
    reason: '',
  });
  const [varItems, setVarItems] = useState<VariationItem[]>([
    { description: '', quantity: '1', unitPrice: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pList, vList] = await Promise.all([
        projectApi.getAll().catch(() => []),
        siteApi.getVariations(selectedProjectId).catch(() => []),
      ]);
      setProjects(pList);
      setVariations(vList);
      if (pList.length > 0 && !createForm.projectId) {
        setCreateForm(prev => ({ ...prev, projectId: String(pList[0].id) }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedProjectId]);

  const handleViewDetail = async (v: ProjectVariation) => {
    try {
      const full = await siteApi.getVariationById(v.id);
      setSelectedVariation(full || v);
    } catch {
      setSelectedVariation(v);
    }
    setShowDetailModal(true);
  };

  const handleApprove = async (id: number, approvedVal: number) => {
    try {
      await siteApi.approveVariation(id, approvedVal);
      alert('Đã phê duyệt hồ sơ phát sinh thành công!');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi duyệt phát sinh');
    }
  };

  const handleReject = async (id: number, reason: string) => {
    try {
      await siteApi.rejectVariation(id, reason);
      alert('Đã từ chối hồ sơ phát sinh.');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi từ chối phát sinh');
    }
  };

  const addVarItem = () => {
    setVarItems(prev => [...prev, { description: '', quantity: '1', unitPrice: '' }]);
  };
  const removeVarItem = (index: number) => {
    setVarItems(prev => prev.filter((_, idx) => idx !== index));
  };
  const updateVarItem = (index: number, field: keyof VariationItem, value: string) => {
    setVarItems(prev => prev.map((it, idx) => idx === index ? { ...it, [field]: value } : it));
  };

  const calculatedTotal = varItems.reduce((acc, it) => {
    const q = Number(it.quantity) || 0;
    const p = Number(it.unitPrice) || 0;
    return acc + (q * p);
  }, 0);

  const handleCreateVariation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.projectId) {
      alert('Vui lòng chọn dự án!');
      return;
    }
    const validItems = varItems.filter(it => it.description.trim().length > 0);
    if (validItems.length === 0) {
      alert('Hồ sơ phát sinh phải có ít nhất 1 đầu việc / hạng mục phát sinh!');
      return;
    }
    setSubmitting(true);
    try {
      await siteApi.createVariation({
        projectId: Number(createForm.projectId),
        title: createForm.title.trim(),
        variationType: createForm.variationType,
        reason: createForm.reason.trim() || undefined,
        requestedDate: new Date().toISOString().slice(0, 10),
        items: validItems.map(it => {
          const qty = Number(it.quantity) || 1;
          const price = Number(it.unitPrice) || 0;
          return {
            description: it.description.trim(),
            quantity: qty,
            unitPrice: price,
            amount: qty * price,
          };
        }),
      });
      setShowCreateModal(false);
      setCreateForm({
        projectId: projects.length > 0 ? String(projects[0].id) : '',
        title: '',
        variationType: 'ADDITION',
        reason: '',
      });
      setVarItems([{ description: '', quantity: '1', unitPrice: '' }]);
      alert('Lập hồ sơ phát sinh thành công!');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tạo hồ sơ phát sinh');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to check variation direction
  const isTypeAddition = (type?: string) => {
    if (!type) return true;
    const t = type.toUpperCase();
    return t === 'ADDITION' || t === 'INCREASE' || t.includes('TĂNG');
  };

  // Summary stats
  const totalAddition = variations
    .filter(v => isTypeAddition(v.variationType) && v.status === 'APPROVED')
    .reduce((s, v) => s + (v.approvedValue || 0), 0);
  const totalDeduction = variations
    .filter(v => !isTypeAddition(v.variationType) && v.status === 'APPROVED')
    .reduce((s, v) => s + (v.approvedValue || 0), 0);
  const pendingCount = variations.filter(v => v.status !== 'APPROVED').length;

  return (
    <div>
      {/* Filter & Action Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 24px' }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Lọc theo Dự Án:</span>
            <select
              className="form-select"
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : undefined)}
              style={{ minWidth: '280px' }}
            >
              <option value="">-- Tất cả dự án --</option>
              {projects.map(p => <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Lập Hồ Sơ Phát Sinh Mới
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="stats-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--crimson-danger)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-val" style={{ color: 'var(--crimson-danger)' }}>{formatCurrency(totalAddition)}</div>
            <div className="stat-label">Phát Sinh Tăng (Đã Duyệt)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--emerald-success)' }}>
            <TrendingDown size={24} />
          </div>
          <div>
            <div className="stat-val" style={{ color: 'var(--emerald-success)' }}>{formatCurrency(totalDeduction)}</div>
            <div className="stat-label">Phát Sinh Giảm (Đã Duyệt)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: 'var(--amber-warning)' }}>
            <GitPullRequestDraft size={24} />
          </div>
          <div>
            <div className="stat-val">{pendingCount}</div>
            <div className="stat-label">Hồ Sơ Đang Chờ Phê Duyệt</div>
          </div>
        </div>
      </div>

      {/* Variations List */}
      <div className="card">
        <div className="card-header" style={{ marginBottom: '16px' }}>
          <div>
            <h2 className="card-title">Danh Sách Hồ Sơ Phát Sinh Khối Lượng & Chi Phí</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Theo dõi biến động ngân sách dự án do thay đổi thiết kế hoặc điều kiện địa chất công trường
            </p>
          </div>
        </div>

        <div className="table-container">
          <table className="bmc-table">
            <thead>
              <tr>
                <th>Số Hồ Sơ</th>
                <th>Công Trình</th>
                <th>Tiêu Đề Phát Sinh</th>
                <th>Phân Loại</th>
                <th>Ngày Lập</th>
                <th>Giá Trị Đề Xuất</th>
                <th>Giá Trị Phê Duyệt</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {variations.map((v) => {
                const isAddition = isTypeAddition(v.variationType);
                const statusCls = v.status === 'APPROVED' ? 'badge-active' : v.status === 'REJECTED' ? 'badge-danger' : 'badge-pending';
                const statusLabel = v.status === 'APPROVED' ? 'Đã Phê Duyệt' : v.status === 'REJECTED' ? 'Từ Chối' : 'Chờ Duyệt';

                return (
                  <tr key={v.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--blue-tech)', cursor: 'pointer' }} onClick={() => handleViewDetail(v)}>
                        {v.variationNo}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{v.projectName || `Dự án #${v.projectId}`}</td>
                    <td>
                      <div style={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => handleViewDetail(v)}>{v.title}</div>
                      {v.reason && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Lý do: {v.reason}</div>}
                    </td>
                    <td>
                      <span className={`badge ${isAddition ? 'badge-danger' : 'badge-active'}`}>
                        {isAddition ? '↑ Phát sinh TĂNG' : '↓ Phát sinh GIẢM'}
                      </span>
                    </td>
                    <td>{formatDate(v.requestedDate || v.createdAt)}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(v.requestedValue)}</td>
                    <td style={{ fontWeight: 800, color: isAddition ? 'var(--crimson-danger)' : 'var(--emerald-success)' }}>
                      {v.approvedValue !== undefined && v.approvedValue !== null && v.approvedValue > 0 ? formatCurrency(v.approvedValue) : '-'}
                    </td>
                    <td><span className={`badge ${statusCls}`}>{statusLabel}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleViewDetail(v)}
                          title="Xem chi tiết bóc tách khối lượng phát sinh"
                          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={13} /> Chi Tiết
                        </button>
                        {v.status !== 'APPROVED' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleViewDetail(v)}
                            title="Xem và phê duyệt giá trị phát sinh"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Check size={13} /> Duyệt
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {variations.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    Chưa có hồ sơ phát sinh nào. Bấm <strong>"Lập Hồ Sơ Phát Sinh Mới"</strong> để tạo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== MODAL: Create Variation ===== */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Lập Hồ Sơ Phát Sinh Mới</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Ghi nhận khối lượng / chi phí phát sinh ngoài hợp đồng gốc để trình chủ đầu tư phê duyệt
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCreateModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateVariation}>
              <div className="form-group">
                <label className="form-label">Công Trình / Dự Án *</label>
                <select className="form-select" value={createForm.projectId} onChange={(e) => setCreateForm({ ...createForm, projectId: e.target.value })} required>
                  <option value="">-- Chọn dự án --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tiêu Đề Hồ Sơ Phát Sinh *</label>
                <input
                  type="text"
                  className="form-input"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="VD: Phát sinh đào móng do gặp địa chất bất thường tầng 3"
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Loại Phát Sinh *</label>
                  <select className="form-select" value={createForm.variationType} onChange={(e) => setCreateForm({ ...createForm, variationType: e.target.value as any })} required>
                    <option value="ADDITION">↑ Phát Sinh Tăng (Tăng KL / CP)</option>
                    <option value="DEDUCTION">↓ Phát Sinh Giảm (Giảm KL / CP)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Lý Do / Căn Cứ Phát Sinh *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={createForm.reason}
                    onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                    placeholder="VD: Theo công văn số 12/2026/CV-BCH..."
                    required
                  />
                </div>
              </div>

              {/* Items Section */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Đầu Việc / Hạng Mục Phát Sinh *</label>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addVarItem}>
                    <Plus size={13} /> Thêm Đầu Việc
                  </button>
                </div>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Mô Tả Đầu Việc *</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, width: '90px' }}>Khối Lượng</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, width: '130px' }}>Đơn Giá (VNĐ)</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, width: '120px' }}>Thành Tiền</th>
                        <th style={{ width: '36px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {varItems.map((item, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="text"
                              className="form-input"
                              value={item.description}
                              onChange={(e) => updateVarItem(idx, 'description', e.target.value)}
                              placeholder="Mô tả công việc phát sinh..."
                              style={{ fontSize: '12px', padding: '6px 8px' }}
                              required
                            />
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="number"
                              className="form-input"
                              value={item.quantity}
                              onChange={(e) => updateVarItem(idx, 'quantity', e.target.value)}
                              min="0"
                              step="any"
                              style={{ fontSize: '12px', padding: '6px 8px' }}
                            />
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="number"
                              className="form-input"
                              value={item.unitPrice}
                              onChange={(e) => updateVarItem(idx, 'unitPrice', e.target.value)}
                              placeholder="0"
                              min="0"
                              style={{ fontSize: '12px', padding: '6px 8px' }}
                            />
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, fontSize: '12px', color: 'var(--orange-primary)' }}>
                            {formatCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                          </td>
                          <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                            {varItems.length > 1 && (
                              <button type="button" onClick={() => removeVarItem(idx)} style={{ background: 'none', border: 'none', color: 'var(--crimson-danger)', cursor: 'pointer', padding: '4px' }}>
                                <X size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Preview giá trị */}
              {calculatedTotal > 0 && (
                <div style={{
                  backgroundColor: createForm.variationType === 'ADDITION' ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                  border: `1px solid ${createForm.variationType === 'ADDITION' ? 'var(--crimson-danger)' : 'var(--emerald-success)'}`,
                  borderRadius: '8px', padding: '12px 16px', marginBottom: '16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {createForm.variationType === 'ADDITION' ? '↑ Tổng Giá Trị Phát Sinh Tăng:' : '↓ Tổng Giá Trị Phát Sinh Giảm:'}
                  </span>
                  <span style={{
                    fontWeight: 800, fontSize: '18px',
                    color: createForm.variationType === 'ADDITION' ? 'var(--crimson-danger)' : 'var(--emerald-success)'
                  }}>
                    {formatCurrency(calculatedTotal)}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <GitPullRequestDraft size={15} />
                  {submitting ? 'Đang lưu...' : 'Lập Hồ Sơ Phát Sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Detail Modal for Variation */}
      <VariationDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedVariation(null);
        }}
        variation={selectedVariation}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
};
