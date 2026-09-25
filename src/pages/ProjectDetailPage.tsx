import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectApi, adminApi, catalogsApi } from '../api';
import { Project, ProjectItem, ProjectTask, Contract, ProjectMember, ProjectDocument } from '../types';
import { formatCurrency, formatNumber, formatDate, getProjectStatusLabel, getItemStatusLabel, getStatusBadgeClass, formatUnit, formatQuantityWithUnit } from '../utils/formatters';
import {
  ArrowLeft,
  Layers,
  FileText,
  Users,
  FolderOpen,
  Plus,
  ChevronDown,
  ChevronRight,
  MapPin,
  Calendar,
  Building2,
  CheckCircle,
  X,
  Award,
  Eye,
} from 'lucide-react';
import { TaskBreakdownDrawer } from '../components/projects/TaskBreakdownDrawer';
import { BiddingFinancialTab } from '../components/projects/BiddingFinancialTab';
import { PdfViewerModal } from '../components/common/PdfViewerModal';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'wbs' | 'bidding' | 'contracts' | 'members' | 'documents'>('wbs');

  const [items, setItems] = useState<ProjectItem[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Task breakdown drawer & PDF viewer modal
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfModalUrl, setPdfModalUrl] = useState('');
  const [pdfModalTitle, setPdfModalTitle] = useState('');

  // WBS tasks expanded state: map itemId -> tasks
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [itemTasks, setItemTasks] = useState<Record<number, ProjectTask[]>>({});
  const [loadingTasks, setLoadingTasks] = useState<Record<number, boolean>>({});
  const [unitsMap, setUnitsMap] = useState<Record<number, string>>({});

  // New item modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [submittingItem, setSubmittingItem] = useState(false);

  const loadData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [p, itms, ctrs, mbrs, docs, unitsList] = await Promise.all([
        projectApi.getById(projectId),
        projectApi.getItems(projectId),
        adminApi.getContracts(projectId).catch(() => []),
        adminApi.getMembers(projectId).catch(() => []),
        adminApi.getDocuments(projectId).catch(() => []),
        catalogsApi.getUnits().catch(() => []),
      ]);
      setProject(p);
      setItems(itms);
      setContracts(ctrs);
      setMembers(mbrs);
      setDocuments(docs);
      if (Array.isArray(unitsList)) {
        const uMap: Record<number, string> = {};
        unitsList.forEach((u: any) => {
          if (u.id) {
            uMap[u.id] = u.symbol || u.code || u.name;
          }
        });
        setUnitsMap(uMap);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const toggleExpandItem = async (itemId: number) => {
    const nextState = !expandedItems[itemId];
    setExpandedItems(prev => ({ ...prev, [itemId]: nextState }));

    if (nextState && !itemTasks[itemId]) {
      setLoadingTasks(prev => ({ ...prev, [itemId]: true }));
      try {
        const tasks = await projectApi.getTasks(projectId, itemId);
        setItemTasks(prev => ({ ...prev, [itemId]: tasks }));
      } catch (err) {
        console.error('Error fetching tasks', err);
      } finally {
        setLoadingTasks(prev => ({ ...prev, [itemId]: false }));
      }
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingItem(true);
    try {
      await projectApi.createItem(projectId, {
        code: itemCode.trim(),
        name: itemName.trim(),
      });
      setShowItemModal(false);
      setItemCode('');
      setItemName('');
      const updatedItems = await projectApi.getItems(projectId);
      setItems(updatedItems);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tạo hạng mục');
    } finally {
      setSubmittingItem(false);
    }
  };

  if (loading && !project) {
    return <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải thông tin dự án...</div>;
  }

  if (!project) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <h3>Không tìm thấy dự án</h3>
        <button className="btn btn-secondary" style={{ marginTop: '16px' }} onClick={() => navigate('/projects')}>
          <ArrowLeft size={16} /> Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Back button & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')}>
          <ArrowLeft size={16} /> Danh Sách Dự Án
        </button>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ Chi tiết dự án</span>
      </div>

      {/* Project Overview Card */}
      <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--orange-primary)' }}>
                [{project.code}]
              </span>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
                {project.name}
              </h1>
              <span className={`badge ${getStatusBadgeClass(project.status)}`}>
                {getProjectStatusLabel(project.status)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span>
                <Building2 size={14} style={{ display: 'inline', marginRight: 4 }} />
                Chủ đầu tư: <strong style={{ color: 'var(--text-main)' }}>{project.investorName || 'Nội bộ BMC'}</strong>
              </span>
              <span>
                <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
                Địa điểm: <strong style={{ color: 'var(--text-main)' }}>{project.location || 'Chưa cập nhật'}</strong>
              </span>
              <span>
                <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                Thời gian: <strong style={{ color: 'var(--text-main)' }}>
                  {formatDate(project.startDate)} - {formatDate(project.plannedEndDate || project.endDate)}
                </strong>
              </span>
            </div>

            {project.description && (
              <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)', maxWidth: '800px', lineHeight: 1.5 }}>
                {project.description}
              </p>
            )}
          </div>

          <div style={{ textAlign: 'right', minWidth: '180px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Tiến Độ Dự Án</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--orange-primary)' }}>
              {project.progressPercent || 0}%
            </div>
            <div style={{
              width: '100%', height: '8px', backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '4px', overflow: 'hidden', marginTop: '6px'
            }}>
              <div style={{
                width: `${project.progressPercent || 0}%`,
                height: '100%', backgroundColor: 'var(--orange-primary)', borderRadius: '4px'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-bar" style={{ marginBottom: '20px' }}>
        <button
          className={`tab-btn ${activeTab === 'wbs' ? 'active' : ''}`}
          onClick={() => setActiveTab('wbs')}
        >
          <Layers size={16} /> Cấu Trúc WBS & Công Tác ({items.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'bidding' ? 'active' : ''}`}
          onClick={() => setActiveTab('bidding')}
        >
          <Award size={16} /> Hồ Sơ Đấu Thầu & Đánh Giá Lãi/Lỗ
        </button>
        <button
          className={`tab-btn ${activeTab === 'contracts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contracts')}
        >
          <FileText size={16} /> Hợp Đồng Dự Án ({contracts.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          <Users size={16} /> Ban Chỉ Huy Công Trường ({members.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <FolderOpen size={16} /> Hồ Sơ & Bản Vẽ ({documents.length})
        </button>
      </div>

      {/* Tab 1: WBS Tree */}
      {activeTab === 'wbs' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Cây Phân Chia Công Việc (WBS) & Công Tác Thi Công</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Bấm vào từng hạng mục để xem các đầu việc công tác, định mức và khối lượng thiết kế
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowItemModal(true)}>
              <Plus size={16} /> Thêm Hạng Mục Mới
            </button>
          </div>

          <div className="table-container">
            <table className="bmc-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>STT</th>
                  <th>Mã Hạng Mục</th>
                  <th>Tên Hạng Mục Công Trình</th>
                  <th>Tiến Độ</th>
                  <th>Trạng Thái</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const isExpanded = !!expandedItems[it.id];
                  const tasks = itemTasks[it.id] || [];
                  const isLoadingThis = !!loadingTasks[it.id];

                  return (
                    <React.Fragment key={it.id}>
                      <tr style={{ backgroundColor: isExpanded ? 'var(--bg-tertiary)' : undefined }}>
                        <td>
                          <button
                            className="btn-icon"
                            onClick={() => toggleExpandItem(it.id)}
                            title={isExpanded ? 'Thu gọn' : 'Mở rộng công tác'}
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </td>
                        <td>{idx + 1}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--orange-primary)' }}>{it.code}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{it.name}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '60px', height: '6px', backgroundColor: 'rgba(0,0,0,0.1)',
                              borderRadius: '3px', overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${it.progressPercent || 0}%`,
                                height: '100%', backgroundColor: 'var(--orange-primary)'
                              }} />
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {it.progressPercent || 0}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(it.status)}`}>
                            {getItemStatusLabel(it.status)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => toggleExpandItem(it.id)}
                          >
                            {isExpanded ? 'Đóng' : 'Xem công tác'}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Sub-table: Tasks */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px 24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                                Danh sách công tác thuộc hạng mục [{it.code}] {it.name}
                              </h4>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                {tasks.length} công tác đã thiết lập
                              </span>
                            </div>

                            {isLoadingThis ? (
                              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                Đang tải công tác...
                              </div>
                            ) : tasks.length === 0 ? (
                              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                                Chưa có công tác nào được lập cho hạng mục này.
                              </div>
                            ) : (
                              <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                                <table className="bmc-table" style={{ margin: 0, fontSize: '13px' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                      <th>Mã Hiệu</th>
                                      <th>Tên Công Tác Xây Dựng</th>
                                      <th>Khối Lượng Thiết Kế</th>
                                      <th>Tiến Độ Thực Hiện</th>
                                      <th>Trạng Thái</th>
                                      <th style={{ textAlign: 'right' }}>Thao Tác</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {tasks.map(t => {
                                      const taskUnit = t.unitName || (t.unitId ? unitsMap[t.unitId] : '') || '';
                                      const qtyInfo = formatQuantityWithUnit(t.quantity || t.plannedQuantity || 0, taskUnit);
                                      return (
                                        <tr key={t.id}>
                                          <td style={{ fontWeight: 700, color: 'var(--blue-tech)' }}>{t.code}</td>
                                          <td>{t.name}</td>
                                          <td style={{ fontWeight: 600 }}>
                                            <div>{qtyInfo.display}</div>
                                            {qtyInfo.converted && (
                                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>
                                                ≈ {qtyInfo.converted}
                                              </div>
                                            )}
                                          </td>
                                          <td>{t.progressPercent || 0}%</td>
                                          <td>
                                            <span className={`badge ${getStatusBadgeClass(t.status)}`}>
                                              {getItemStatusLabel(t.status)}
                                            </span>
                                          </td>
                                          <td style={{ textAlign: 'right' }}>
                                            <button
                                              className="btn btn-primary btn-sm"
                                              onClick={() => setSelectedTaskId(t.id)}
                                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 10px' }}
                                            >
                                              <Eye size={13} />
                                              <span>Chi tiết công tác</span>
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Chưa có hạng mục nào được tạo cho công trình này. Bấm nút "Thêm Hạng Mục Mới" để bắt đầu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Bidding & Profit/Loss Evaluation */}
      {activeTab === 'bidding' && (
        <BiddingFinancialTab
          projectId={projectId}
          onViewPdf={(url, title) => {
            setPdfModalUrl(url);
            setPdfModalTitle(title);
            setPdfModalOpen(true);
          }}
        />
      )}

      {/* Tab 2: Contracts */}
      {activeTab === 'contracts' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Hợp Đồng Dự Án & Các Phụ Lục Phát Sinh</h3>
          </div>
          <div className="table-container">
            <table className="bmc-table">
              <thead>
                <tr>
                  <th>Số Hợp Đồng</th>
                  <th>Tên Gói Thầu / Hợp Đồng</th>
                  <th>Ngày Ký</th>
                  <th>Giá Trị Ban Đầu</th>
                  <th>Tổng Giá Trị Sau Điều Chỉnh</th>
                  <th>Số Phụ Lục</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700, color: 'var(--blue-tech)' }}>{c.contractNo}</td>
                    <td style={{ fontWeight: 600 }}>{c.contractName}</td>
                    <td>{formatDate(c.signedDate)}</td>
                    <td>{formatCurrency(c.contractValue)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--orange-primary)' }}>
                      {formatCurrency(c.totalAdjustedValue)}
                    </td>
                    <td>{c.appendicesCount || 0} phụ lục</td>
                    <td>
                      <span className="badge badge-active">{c.status}</span>
                    </td>
                  </tr>
                ))}
                {contracts.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Chưa có hợp đồng nào được lưu trữ cho dự án này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Project Members */}
      {activeTab === 'members' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Ban Chỉ Huy Công Trường & Nhân Sự Dự Án</h3>
          </div>
          <div className="table-container">
            <table className="bmc-table">
              <thead>
                <tr>
                  <th>Họ & Tên Nhân Sự</th>
                  <th>Tên Tài Khoản</th>
                  <th>Chức Danh Ban Chỉ Huy</th>
                  <th>Ngày Tham Gia</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.userId}>
                    <td style={{ fontWeight: 600 }}>{m.fullName}</td>
                    <td>{m.username}</td>
                    <td>
                      <span className="badge badge-info">{m.roleName || 'Cán bộ kỹ thuật'}</span>
                    </td>
                    <td>{formatDate(m.joinedAt)}</td>
                    <td>
                      <span className={`badge ${m.isActive ? 'badge-active' : 'badge-danger'}`}>
                        {m.isActive ? 'Đang điều hành' : 'Đã rút lui'}
                      </span>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Chưa phân công nhân sự cho dự án này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Documents */}
      {activeTab === 'documents' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Hồ Sơ Thiết Kế, Bản Vẽ Thi Công & Nhật Ký</h3>
          </div>
          <div className="table-container">
            <table className="bmc-table">
              <thead>
                <tr>
                  <th>Mã Hồ Sơ</th>
                  <th>Loại Tài Liệu</th>
                  <th>Tiêu Đề Bản Vẽ / Hồ Sơ</th>
                  <th>Phiên Bản Hiện Tại</th>
                  <th>Cập Nhật Lần Cuối</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 700 }}>{d.documentNo}</td>
                    <td><span className="badge badge-info">{d.documentType}</span></td>
                    <td style={{ fontWeight: 600 }}>{d.title}</td>
                    <td><span className="badge badge-active">v{d.currentVersionNo}</span></td>
                    <td>{formatDate(d.updatedAt)}</td>
                    <td><span className="badge badge-approved">{d.status}</span></td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Chưa có tài liệu hoặc bản vẽ nào được lưu trữ cho công trình này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add Item */}
      {showItemModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '480px', position: 'relative' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Thêm Hạng Mục Công Trình Mới</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowItemModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateItem}>
              <div className="form-group">
                <label className="form-label">Mã Hạng Mục *</label>
                <input
                  type="text"
                  className="form-input"
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value)}
                  placeholder="VD: HM-01, HM-MONG"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tên Hạng Mục *</label>
                <input
                  type="text"
                  className="form-input"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="VD: Phần Móng, Thân Kết Cấu, Hoàn Thiện..."
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowItemModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingItem}>
                  {submittingItem ? 'Đang lưu...' : 'Lưu Hạng Mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Breakdown Drawer */}
      <TaskBreakdownDrawer
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        taskId={selectedTaskId}
      />

      {/* In-App PDF Viewer Modal */}
      <PdfViewerModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        title={pdfModalTitle}
        pdfUrl={pdfModalUrl}
      />
    </div>
  );
};
