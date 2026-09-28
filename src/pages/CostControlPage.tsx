import React, { useEffect, useState } from 'react';
import { costControlApi, projectApi } from '../api';
import { ProjectAlert, Project } from '../types';
import { formatCurrency, formatDate, formatPercent, formatNumber } from '../utils/formatters';
import { BarChart3, AlertTriangle, CheckCircle, ShieldAlert, Check, RefreshCw, Scan, Layers } from 'lucide-react';

export const CostControlPage: React.FC = () => {
  const [tab, setTab] = useState<'variance' | 'alerts'>('variance');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>();
  const [variance, setVariance] = useState<any | null>(null);
  const [alerts, setAlerts] = useState<ProjectAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const loadProjects = async () => {
    try {
      const pList = await projectApi.getAll();
      setProjects(pList);
      if (pList.length > 0 && !selectedProjectId) {
        const savedId = localStorage.getItem('bmc_active_project_id');
        const matched = savedId ? pList.find((p) => p.id === Number(savedId)) : null;
        setSelectedProjectId(matched ? matched.id : pList[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadVariance = async (projId: number) => {
    try {
      const v = await costControlApi.getVariance(projId);
      setVariance(v);
    } catch (err) {
      console.error('Variance error:', err);
      setVariance(null);
    }
  };

  const loadAlerts = async () => {
    try {
      const data = await costControlApi.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Alerts error:', err);
    }
  };

  useEffect(() => {
    loadProjects();
    loadAlerts();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem('bmc_active_project_id', String(selectedProjectId));
      loadVariance(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleScanAlerts = async () => {
    if (!selectedProjectId) return;
    setScanning(true);
    try {
      const res = await costControlApi.scanAlerts(selectedProjectId);
      alert(`Đã quét xong cảnh báo! Phát hiện: ${res.newAlertsCount || 0} cảnh báo mới.`);
      loadAlerts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi quét cảnh báo');
    } finally {
      setScanning(false);
    }
  };

  const handleResolveAlert = async (id: number) => {
    const note = prompt('Nhập ghi chú biện pháp xử lý hoặc đóng cảnh báo:');
    if (!note) return;
    try {
      await costControlApi.resolveAlert(id, note);
      alert('Đã cập nhật trạng thái cảnh báo thành công!');
      loadAlerts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xử lý cảnh báo');
    }
  };

  return (
    <div>
      <div className="tabs-bar" style={{ marginBottom: '20px' }}>
        <button
          className={`tab-btn ${tab === 'variance' ? 'active' : ''}`}
          onClick={() => setTab('variance')}
        >
          <BarChart3 size={16} /> Kiểm Soát Phương Sai Chi Phí (Budget vs Actual)
        </button>
        <button
          className={`tab-btn ${tab === 'alerts' ? 'active' : ''}`}
          onClick={() => setTab('alerts')}
        >
          <AlertTriangle size={16} /> Trung Tâm Cảnh Báo Rủi Ro ({alerts.filter((a) => !a.isResolved && a.status !== 'CLOSED').length})
        </button>
      </div>

      {tab === 'variance' && (
        <div>
          <div className="card" style={{ marginBottom: '20px', padding: '16px 24px' }}>
            <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Chọn dự án kiểm soát:</span>
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
                  onClick={() => selectedProjectId && loadVariance(selectedProjectId)}
                >
                  <RefreshCw size={14} /> Làm mới
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleScanAlerts}
                  disabled={scanning}
                >
                  <Scan size={14} /> {scanning ? 'Đang quét...' : 'Quét Định Mức & Rủi Ro'}
                </button>
              </div>
            </div>
          </div>

          {variance ? (
            <div>
              {/* Stats Grid */}
              {/* Stats Grid */}
              {(() => {
                const budgetCost = variance.totalBudgetCost ?? variance.totalPlannedValue ?? 0;
                const actualCost = variance.totalActualCost ?? 0;
                const remainingBudget = budgetCost - actualCost;
                const spentPercent = budgetCost > 0 ? Math.round((actualCost / budgetCost) * 1000) / 10 : 0;
                const isOverBudget = remainingBudget < 0;

                return (
                  <div className="stats-grid" style={{ marginBottom: '24px' }}>
                    <div className="stat-card">
                      <div>
                        <div className="stat-val" style={{ color: 'var(--blue-tech)' }}>
                          {formatCurrency(budgetCost)}
                        </div>
                        <div className="stat-label">Tổng Ngân Sách Dự Toán (Budget)</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Hạn mức được duyệt ban đầu</div>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div>
                        <div className="stat-val" style={{ color: 'var(--orange-primary)' }}>
                          {formatCurrency(actualCost)}
                        </div>
                        <div className="stat-label">Chi Phí Thực Tế Đã Chi (Actual)</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Lũy kế nhân công, máy & vật tư</div>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div>
                        <div
                          className="stat-val"
                          style={{
                            color: isOverBudget ? 'var(--crimson-danger)' : 'var(--emerald-success)',
                          }}
                        >
                          {isOverBudget ? `-${formatCurrency(Math.abs(remainingBudget))}` : `+${formatCurrency(remainingBudget)}`}
                        </div>
                        <div className="stat-label">
                          {isOverBudget ? 'Vượt Ngân Sách (Bội Chi)' : 'Ngân Sách Còn Dư (Còn Lại)'}
                        </div>
                        <div style={{ fontSize: '11px', color: isOverBudget ? 'var(--crimson-danger)' : 'var(--emerald-success)', marginTop: '2px' }}>
                          {isOverBudget ? '⚠ Bội chi so với dự toán' : '✓ Nằm trong hạn mức an toàn'}
                        </div>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div>
                        <div
                          className="stat-val"
                          style={{
                            color: spentPercent > 100 ? 'var(--crimson-danger)' : 'var(--emerald-success)',
                          }}
                        >
                          {spentPercent}%
                        </div>
                        <div className="stat-label">Tỷ Lệ Tiêu Hao Ngân Sách</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Đã giải ngân {spentPercent}% tổng mức
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Resource Breakdown: Material, Labor, Machine */}
              {(variance.materialSummary || variance.laborSummary || variance.machineSummary) && (
                <div className="card" style={{ marginBottom: '24px' }}>
                  <div className="card-header" style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Phân Tích Chi Tiết Theo Nhóm Nguồn Lực</h3>
                  </div>
                  <div className="table-container">
                    <table className="bmc-table">
                      <thead>
                        <tr>
                          <th>Nhóm Nguồn Lực</th>
                          <th>Ngân Sách Dự Toán</th>
                          <th>Chi Phí Thực Tế</th>
                          <th>Ngân Sách Còn Dư</th>
                          <th>Tỷ Lệ Tiêu Hao</th>
                          <th>Đánh Giá</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[variance.materialSummary, variance.laborSummary, variance.machineSummary]
                          .filter(Boolean)
                          .map((r: any, idx) => {
                            const name = r.resourceType === 'MATERIAL' ? 'Vật Liệu Xây Dựng (V)'
                              : r.resourceType === 'LABOR' ? 'Nhân Công Thi Công (N)'
                              : 'Máy & Thiết Bị Thi Công (M)';
                            const bCost = r.budgetCost || 0;
                            const aCost = r.actualCost || 0;
                            const rem = bCost - aCost;
                            const isOver = rem < 0;
                            const rate = bCost > 0 ? Math.round((aCost / bCost) * 1000) / 10 : 0;

                            return (
                              <tr key={idx}>
                                <td style={{ fontWeight: 700 }}>{name}</td>
                                <td>{formatCurrency(bCost)}</td>
                                <td style={{ fontWeight: 600 }}>{formatCurrency(aCost)}</td>
                                <td style={{ fontWeight: 700, color: isOver ? 'var(--crimson-danger)' : 'var(--emerald-success)' }}>
                                  {isOver ? `-${formatCurrency(Math.abs(rem))}` : `+${formatCurrency(rem)}`}
                                </td>
                                <td style={{ fontWeight: 600 }}>{rate}%</td>
                                <td>
                                  <span className={`badge ${isOver ? 'badge-danger' : 'badge-active'}`}>
                                    {isOver ? 'Vượt Ngân Sách' : 'Trong Định Mức'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Records table if available */}
              {variance.records && variance.records.length > 0 && (
                <div className="card">
                  <div className="card-header" style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Hồ Sơ Bản Ghi Phương Sai Chi Tiết</h3>
                  </div>
                  <div className="table-container">
                    <table className="bmc-table">
                      <thead>
                        <tr>
                          <th>Ngày Phân Tích</th>
                          <th>Loại Nguồn Lực</th>
                          <th>Tên Vật Tư / Công Tác</th>
                          <th>SL Dự Toán</th>
                          <th>SL Thực Tế</th>
                          <th>Đơn Giá Dự Toán</th>
                          <th>Đơn Giá Thực Tế</th>
                          <th>Chênh Lệch</th>
                          <th>Trạng Thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variance.records.map((rec: any) => (
                          <tr key={rec.id}>
                            <td>{formatDate(rec.asOfDate)}</td>
                            <td><span className="badge badge-info">{rec.resourceType}</span></td>
                            <td style={{ fontWeight: 600 }}>{rec.resourceName || rec.resourceCode || '-'}</td>
                            <td>{formatNumber(rec.budgetQuantity)}</td>
                            <td>{formatNumber(rec.actualQuantity)}</td>
                            <td>{formatCurrency(rec.budgetUnitPrice)}</td>
                            <td>{formatCurrency(rec.actualUnitPrice)}</td>
                            <td style={{ fontWeight: 700, color: rec.totalVariance > 0 ? 'var(--crimson-danger)' : 'var(--emerald-success)' }}>
                              {formatCurrency(rec.totalVariance)}
                            </td>
                            <td>
                              <span className={`badge ${rec.totalVariance > 0 ? 'badge-danger' : 'badge-active'}`}>
                                {rec.totalVariance > 0 ? 'Vượt' : 'Đạt'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Chưa có số liệu phát sinh chi phí hoặc chưa có dự toán baseline để phân tích phương sai.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Alerts */}
      {tab === 'alerts' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h2 className="card-title">Trung Tâm Cảnh Báo Định Mức, Chi Phí & Tồn Kho</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Tự động phát hiện khi công trình vượt hao phí định mức hoặc chi phí thực tế vượt giá trúng thầu
              </p>
            </div>
          </div>

          <div className="table-container">
            <table className="bmc-table">
              <thead>
                <tr>
                  <th>Mức Độ</th>
                  <th>Phân Loại</th>
                  <th>Tiêu Đề Cảnh Báo</th>
                  <th>Nội Dung Chi Tiết</th>
                  <th>Ngày Phát Hiện</th>
                  <th>Trạng Thái</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => {
                  const isResolved = a.isResolved || a.status === 'RESOLVED' || a.status === 'CLOSED';
                  return (
                    <tr key={a.id}>
                      <td>
                        <span
                          className={`badge ${a.severity === 'CRITICAL' ? 'badge-danger' : a.severity === 'WARNING' ? 'badge-warning' : 'badge-info'}`}
                        >
                          {a.severity}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{a.alertType}</td>
                      <td style={{ fontWeight: 700 }}>{a.title}</td>
                      <td style={{ maxWidth: '350px' }}>{a.message}</td>
                      <td>{formatDate(a.createdAt)}</td>
                      <td>
                        <span className={`badge ${isResolved ? 'badge-approved' : 'badge-danger'}`}>
                          {isResolved ? 'Đã Xử Lý' : 'Chưa Xử Lý'}
                        </span>
                      </td>
                      <td>
                        {!isResolved && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleResolveAlert(a.id)}
                            title="Xử lý hoặc đóng cảnh báo"
                          >
                            <Check size={14} /> Xử lý
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {alerts.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--emerald-success)' }}>
                      Không có cảnh báo rủi ro nào. Toàn bộ chi phí trong ngưỡng an toàn.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
