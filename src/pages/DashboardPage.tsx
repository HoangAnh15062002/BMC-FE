import React, { useEffect, useState } from 'react';
import { projectApi, costControlApi, warehouseApi } from '../api';
import { Project, ProjectAlert, Warehouse, WarehouseStockItem } from '../types';
import { formatCurrency, formatDate, getProjectStatusLabel, getStatusBadgeClass } from '../utils/formatters';
import {
  FolderKanban,
  Calculator,
  AlertTriangle,
  Warehouse as WarehouseIcon,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [alerts, setAlerts] = useState<ProjectAlert[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [allStocks, setAllStocks] = useState<WarehouseStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, alertRes, whRes] = await Promise.all([
          projectApi.getAll(),
          costControlApi.getAlerts(undefined, false),
          warehouseApi.getAll(),
        ]);
        setProjects(projRes);
        setAlerts(alertRes);
        setWarehouses(whRes);

        if (whRes.length > 0) {
          const stockPromises = whRes.map((w: Warehouse) => warehouseApi.getStocks(w.id).catch(() => []));
          const stockResults = await Promise.all(stockPromises);
          setAllStocks(stockResults.flat());
        }
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalStockValue = warehouses.reduce((acc, w) => {
    const val = w.totalInventoryValue || w.totalStockValue || 0;
    return acc + Number(val);
  }, 0) || allStocks.reduce((acc, s) => {
    const val = s.totalValue || ((s.quantityOnHand || s.currentQuantity || 0) * (s.averageUnitCost || 0));
    return acc + Number(val);
  }, 0);

  const activeProjects = projects.filter(p => ['IN_PROGRESS', 'ACTIVE'].includes(p.status));

  return (
    <div>

      {/* ── Hero Banner ── */}
      <div className="hero-card mb-6">
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{
                width: '28px', height: '28px',
                background: 'linear-gradient(135deg, #f97316, #c2410c)',
                borderRadius: '7px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 12px rgba(249,115,22,0.4)',
                flexShrink: 0,
              }}>
                <BarChart3 size={15} color="white" />
              </div>
              <h1 style={{
                fontSize: '1.35rem', fontWeight: 800, color: '#f0f6ff',
                letterSpacing: '-0.02em', margin: 0,
              }}>
                Hệ Thống Quản Lý Thi Công &amp; Dự Toán BMC
              </h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0, paddingLeft: '38px' }}>
              Giám sát tiến độ dự án, bóc tách khối lượng, kiểm soát chi phí thực tế và quản lý định mức thi công
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            <button className="btn btn-primary" onClick={() => navigate('/projects')}>
              <FolderKanban size={15} /> Quản Lý Dự Án
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/estimates')}>
              <Calculator size={15} /> Dự Toán Công Trình
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Stats ── */}
      <div className="stats-grid mb-6">
        <div className="stat-card blue">
          <div className="stat-icon-wrapper" style={{ background: 'var(--blue-subtle)' }}>
            <FolderKanban size={22} color="var(--blue-400)" />
          </div>
          <div className="stat-content">
            <div className="stat-val">{projects.length}</div>
            <div className="stat-label">
              Tổng Dự Án
              <span style={{
                display: 'inline-block', marginLeft: '6px',
                padding: '1px 6px', borderRadius: '10px',
                background: 'rgba(59,130,246,0.15)',
                color: 'var(--blue-400)', fontSize: '0.68rem', fontWeight: 700,
              }}>{activeProjects.length} đang thi công</span>
            </div>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon-wrapper" style={{ background: 'var(--brand-subtle)' }}>
            <WarehouseIcon size={22} color="var(--brand-400)" />
          </div>
          <div className="stat-content">
            <div className="stat-val" style={{ fontSize: '1.25rem' }}>{formatCurrency(totalStockValue)}</div>
            <div className="stat-label">Tổng Giá Trị Tồn Kho</div>
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-icon-wrapper" style={{ background: 'var(--red-subtle)' }}>
            <AlertTriangle size={22} color="var(--red-400)" />
          </div>
          <div className="stat-content">
            <div className="stat-val" style={{ color: alerts.length > 0 ? 'var(--red-400)' : undefined }}>
              {alerts.length}
            </div>
            <div className="stat-label">Cảnh Báo Cần Xử Lý</div>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon-wrapper" style={{ background: 'var(--green-subtle)' }}>
            <CheckCircle2 size={22} color="var(--green-400)" />
          </div>
          <div className="stat-content">
            <div className="stat-val" style={{ color: 'var(--green-400)' }}>{warehouses.length}</div>
            <div className="stat-label">Kho Bãi Hoạt Động</div>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid-2-1">

        {/* Left: Projects Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <FolderKanban size={16} color="var(--brand-400)" />
              Danh Sách Công Trình &amp; Dự Án
            </h2>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')}>
              Xem tất cả <ArrowRight size={12} />
            </button>
          </div>

          <div className="table-container">
            <table className="bmc-table">
              <thead>
                <tr>
                  <th>Mã Dự Án</th>
                  <th>Tên Công Trình</th>
                  <th>Chủ Đầu Tư</th>
                  <th>Tiến Độ</th>
                  <th>Trạng Thái</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '28px' }}>
                      <div className="spinner" style={{ margin: '0 auto' }} />
                    </td>
                  </tr>
                )}
                {projects.slice(0, 6).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="table-code">{p.code}</span>
                    </td>
                    <td>
                      <div className="table-name truncate" style={{ maxWidth: '200px' }}>{p.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-dim)', fontSize: '0.7rem', marginTop: '2px' }}>
                        <Calendar size={10} style={{ flexShrink: 0 }} />
                        <span>{formatDate(p.startDate)}</span>
                        {(p.plannedEndDate || p.endDate) && <><span>→</span><span>{formatDate(p.plannedEndDate || p.endDate)}</span></>}
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-muted">{p.investorName || 'Nội bộ BMC'}</span>
                    </td>
                    <td>
                      <div className="progress-wrap">
                        <div className="progress-bar-track">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${p.progressPercent || 0}%` }}
                          />
                        </div>
                        <span className="progress-label">{p.progressPercent || 0}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(p.status)}`}>
                        {getProjectStatusLabel(p.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/projects/${p.id}`)}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <FolderKanban size={32} />
                        <div style={{ fontWeight: 600 }}>Chưa có dự án nào</div>
                        <div className="text-sm text-muted">Vui lòng tạo dự án mới để bắt đầu</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex-col gap-4">

          {/* Cảnh báo */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title" style={{ color: 'var(--red-400)' }}>
                <ShieldAlert size={15} />
                Cảnh Báo Rủi Ro
              </h2>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/cost-control')}>
                Xử lý
              </button>
            </div>

            {alerts.length === 0 ? (
              <div className="flex-center flex-col gap-2" style={{ padding: '24px 0' }}>
                <CheckCircle2 size={34} color="var(--green-400)" />
                <div style={{ fontWeight: 700, color: 'var(--green-400)', fontSize: '0.88rem' }}>
                  Không có cảnh báo rủi ro
                </div>
                <div className="text-xs text-muted" style={{ textAlign: 'center', lineHeight: 1.5 }}>
                  Tất cả dự toán, định mức và tồn kho<br />đều trong ngưỡng an toàn.
                </div>
              </div>
            ) : (
              <div>
                {alerts.slice(0, 5).map((a, i) => (
                  <div key={i} className="info-row">
                    <AlertTriangle size={14} color="var(--red-400)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{a.title || a.message}</div>
                      <div className="text-xs text-muted">{a.projectName || 'Toàn hệ thống'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tổng quan Kho */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <WarehouseIcon size={15} color="var(--brand-400)" />
                Tổng Quan Kho Bãi
              </h2>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/warehouses')}>
                Xem kho <ArrowRight size={11} />
              </button>
            </div>

            {warehouses.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px' }}>
                <div className="text-sm text-muted">Chưa có kho nào</div>
              </div>
            ) : (
              <div>
                {warehouses.slice(0, 3).map((w) => (
                  <div key={w.id} style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    gap: '10px', padding: '10px 0',
                    borderBottom: '1px solid var(--border-faint)',
                  }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</div>
                      <div className="text-xs text-muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.address || w.location || '—'}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--green-400)', whiteSpace: 'nowrap' }}>
                        {formatCurrency(w.totalInventoryValue || w.totalStockValue || 0)}
                      </div>
                      <span className={`badge ${w.isActive ? 'badge-active' : 'badge-danger'}`} style={{ fontSize: '0.6rem', marginTop: '3px' }}>
                        {w.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick shortcuts */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <TrendingUp size={15} color="var(--blue-400)" />
                Truy Cập Nhanh
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { label: 'Mua Sắm', icon: '🛒', path: '/procurement', color: 'var(--amber-subtle)', border: 'rgba(245,158,11,0.2)' },
                { label: 'Hiện Trường', icon: '🏗️', path: '/site-execution', color: 'var(--blue-subtle)', border: 'rgba(59,130,246,0.2)' },
                { label: 'Phát Sinh', icon: '📋', path: '/variations', color: 'var(--purple-subtle)', border: 'rgba(168,85,247,0.2)' },
                { label: 'Định Mức', icon: '📐', path: '/catalogs', color: 'var(--green-subtle)', border: 'rgba(16,185,129,0.2)' },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 12px',
                    background: item.color,
                    border: `1px solid ${item.border}`,
                    borderRadius: 'var(--r-md)',
                    cursor: 'pointer',
                    transition: 'all var(--ease-fast)',
                    fontSize: '0.8rem', fontWeight: 600,
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                >
                  <span>{item.icon}</span> {item.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
