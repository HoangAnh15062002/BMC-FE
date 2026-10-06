import React, { useEffect, useState } from 'react';
import { projectApi } from '../api';
import { Project } from '../types';
import { formatDate, getProjectStatusLabel, getStatusBadgeClass } from '../utils/formatters';
import { Plus, Search, Eye, X, MapPin, Calendar, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Pagination } from '../components/common/Pagination';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Create project form state
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await projectApi.getAll(search, statusFilter || undefined);
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    const t = setTimeout(loadProjects, 300);
    return () => clearTimeout(t);
  }, [search, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await projectApi.create({
        code: newCode.trim(),
        name: newName.trim(),
        location: newLocation.trim() || undefined,
        startDate: newStartDate || undefined,
        plannedEndDate: newEndDate || undefined,
        description: newDesc.trim() || undefined,
        status: 'PREPARING',
      });
      setShowModal(false);
      setNewCode('');
      setNewName('');
      setNewLocation('');
      setNewStartDate('');
      setNewEndDate('');
      setNewDesc('');
      loadProjects();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tạo dự án');
    } finally {
      setSubmitting(false);
    }
  };

  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'PREPARING', label: 'Chuẩn bị' },
    { value: 'IN_PROGRESS', label: 'Đang thi công' },
    { value: 'PAUSED', label: 'Tạm dừng' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' },
  ];

  const paginatedProjects = projects.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: 0 }}>
          <div className="search-input-wrapper" style={{ flex: 1, maxWidth: '400px' }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Tìm theo mã hoặc tên công trình..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-input"
            style={{ width: '180px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Thêm Dự Án Mới
        </button>
      </div>

      <div className="table-container">
        <table className="bmc-table">
          <thead>
            <tr>
              <th>Mã Dự Án</th>
              <th>Tên Công Trình</th>
              <th>Chủ Đầu Tư</th>
              <th>Địa Điểm Thi Công</th>
              <th>Ngày Khởi Công</th>
              <th>Ngày Hoàn Thành</th>
              <th>Tiến Độ</th>
              <th>Trạng Thái</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Đang tải...</td></tr>
            ) : projects.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                Không tìm thấy dự án nào.
              </td></tr>
            ) : paginatedProjects.map((p) => (
              <tr key={p.id}>
                <td>
                  <span style={{ fontWeight: 700, color: 'var(--orange-primary)' }}>{p.code}</span>
                </td>
                <td style={{ fontWeight: 600, maxWidth: '240px' }}>{p.name}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  <Building2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                  {p.investorName || 'Nội bộ BMC'}
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '200px' }}>
                  <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
                  {p.location || '-'}
                </td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '13px' }}>
                    <Calendar size={12} />
                    {formatDate(p.startDate)}
                  </span>
                </td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '13px' }}>
                    <Calendar size={12} />
                    {formatDate(p.plannedEndDate || p.endDate)}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '70px', height: '6px', backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: '3px', overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${p.progressPercent || 0}%`,
                        height: '100%', backgroundColor: 'var(--orange-primary)', borderRadius: '3px'
                      }} />
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '30px' }}>
                      {p.progressPercent || 0}%
                    </span>
                  </div>
                </td>
                <td>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      backgroundColor:
                        p.status === 'IN_PROGRESS'
                          ? 'rgba(16, 185, 129, 0.12)'
                          : p.status === 'PREPARING'
                          ? 'rgba(245, 158, 11, 0.12)'
                          : p.status === 'PAUSED'
                          ? 'rgba(234, 88, 12, 0.12)'
                          : p.status === 'COMPLETED'
                          ? 'rgba(37, 99, 235, 0.12)'
                          : 'rgba(239, 68, 68, 0.12)',
                      color:
                        p.status === 'IN_PROGRESS'
                          ? '#059669'
                          : p.status === 'PREPARING'
                          ? '#d97706'
                          : p.status === 'PAUSED'
                          ? '#ea580c'
                          : p.status === 'COMPLETED'
                          ? '#2563eb'
                          : '#dc2626',
                      border: `1px solid ${
                        p.status === 'IN_PROGRESS'
                          ? 'rgba(16, 185, 129, 0.3)'
                          : p.status === 'PREPARING'
                          ? 'rgba(245, 158, 11, 0.3)'
                          : p.status === 'PAUSED'
                          ? 'rgba(234, 88, 12, 0.3)'
                          : p.status === 'COMPLETED'
                          ? 'rgba(37, 99, 235, 0.3)'
                          : 'rgba(239, 68, 68, 0.3)'
                      }`,
                    }}
                  >
                    {getProjectStatusLabel(p.status)}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    <Eye size={14} /> Chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalItems={projects.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10, 20, 50]}
          itemName="công trình"
        />
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '560px', maxHeight: '90vh', overflow: 'auto', position: 'relative' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <h2 className="card-title">Thêm Dự Án / Công Trình Mới</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Mã Dự Án *</label>
                <input className="form-input" value={newCode}
                  onChange={e => setNewCode(e.target.value)} required
                  placeholder="VD: PRJ-CTRINHXXX-2024" />
              </div>
              <div className="form-group">
                <label className="form-label">Tên Công Trình *</label>
                <input className="form-input" value={newName}
                  onChange={e => setNewName(e.target.value)} required
                  placeholder="Tên đầy đủ của công trình" />
              </div>
              <div className="form-group">
                <label className="form-label">Địa Điểm Thi Công</label>
                <input className="form-input" value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  placeholder="Xã/Phường, Huyện/Quận, Tỉnh/TP" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Ngày Khởi Công</label>
                  <input type="date" className="form-input" value={newStartDate}
                    onChange={e => setNewStartDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Ngày Dự Kiến Hoàn Thành</label>
                  <input type="date" className="form-input" value={newEndDate}
                    onChange={e => setNewEndDate(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Ghi Chú / Mô Tả</label>
                <textarea className="form-input" value={newDesc}
                  onChange={e => setNewDesc(e.target.value)} rows={3}
                  placeholder="Mô tả phạm vi gói thầu, quy mô..." style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang tạo...' : 'Lưu Dự Án'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
