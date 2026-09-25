import React, { useEffect, useState } from 'react';
import { siteApi, projectApi, catalogsApi, machineShiftApi, uploadApi } from '../api';
import { Project, ProjectItem, ProjectTask, MachineShiftLog, TaskProgressEntry } from '../types';
import { formatCurrency, formatNumber, formatDate, formatUnit } from '../utils/formatters';
import { HardHat, DollarSign, Truck, Users, RefreshCw, Plus, X, Trash2, Camera, Image, CheckCircle, Upload, Eye } from 'lucide-react';

export const SiteExecutionPage: React.FC = () => {
  const [tab, setTab] = useState<'shift' | 'progress' | 'labor'>('shift');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>();
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // WBS Items & Tasks for the selected project
  const [projectItems, setProjectItems] = useState<ProjectItem[]>([]);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [filterItemId, setFilterItemId] = useState<string>('');
  const [filterTaskId, setFilterTaskId] = useState<string>('');

  // Machine Shift Logs state (API machineShiftApi)
  const [shiftLogs, setShiftLogs] = useState<MachineShiftLog[]>([]);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftForm, setShiftForm] = useState({
    projectItemId: '',
    projectTaskId: '',
    logDate: new Date().toISOString().slice(0, 10),
    machineName: '',
    operatorName: '',
    shiftCount: '1',
    hoursWorked: '8',
    unitPrice: '1200000',
    fuelCost: '350000',
    notes: '',
  });

  // Progress Logs & Photos state
  const [progressLogs, setProgressLogs] = useState<TaskProgressEntry[]>([]);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressForm, setProgressForm] = useState({
    projectItemId: '',
    projectTaskId: '',
    progressDate: new Date().toISOString().slice(0, 10),
    completedQuantity: '',
    progressPercent: '',
    note: '',
  });
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Labor state (Site actual labor entries)
  const [laborEntries, setLaborEntries] = useState<any[]>([]);
  const [availableLabors, setAvailableLabors] = useState<any[]>([]);
  const [showLaborModal, setShowLaborModal] = useState(false);
  const [laborForm, setLaborForm] = useState({
    workDate: new Date().toISOString().slice(0, 10),
    teamName: '',
    laborId: '',
    quantity: '1',
    unitPrice: '350000',
    note: '',
  });

  const [submitting, setSubmitting] = useState(false);

  // Load initial projects and catalogs
  const loadProjects = async () => {
    try {
      const [pList, lList] = await Promise.all([
        projectApi.getAll().catch(() => []),
        catalogsApi.getLabors().catch(() => []),
      ]);
      setProjects(pList);
      setAvailableLabors(lList);
      if (pList.length > 0 && !selectedProjectId) {
        const savedId = localStorage.getItem('bmc_active_project_id');
        const matched = savedId ? pList.find((p: any) => p.id === Number(savedId)) : null;
        setSelectedProjectId(matched ? matched.id : pList[0].id);
      }
      if (lList.length > 0 && !laborForm.laborId) {
        setLaborForm((prev) => ({ ...prev, laborId: String(lList[0].id) }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load Items and Tasks when Project changes
  const loadWbsData = async (projId: number) => {
    try {
      const items = await projectApi.getItems(projId).catch(() => []);
      setProjectItems(items);

      // Collect all tasks across all items
      const tasksPromises = items.map((it) => projectApi.getTasks(projId, it.id).catch(() => []));
      const tasksArrays = await Promise.all(tasksPromises);
      const allTasks = tasksArrays.flat();
      setProjectTasks(allTasks);

      if (items.length > 0) {
        setFilterItemId(String(items[0].id));
        const itemTasks = allTasks.filter((t) => t.projectItemId === items[0].id);
        if (itemTasks.length > 0) {
          setFilterTaskId(String(itemTasks[0].id));
        } else {
          setFilterTaskId('');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load site logs for the selected project
  const loadSiteData = async (projId: number) => {
    setLoading(true);
    try {
      const [shifts, labors, costSummary] = await Promise.all([
        machineShiftApi.getAll(projId).catch(() => []),
        siteApi.getLaborEntries(projId).catch(() => []),
        siteApi.getCosts(projId).catch(() => null),
      ]);
      setShiftLogs(shifts);
      setLaborEntries(labors);

      const totalShift = shifts.reduce((acc, x) => acc + (x.totalCost || 0), 0);
      const totalLabor = labors.reduce((acc: number, x: any) => acc + Number(x.amount || 0), 0);
      setSummary({
        totalLaborCost: costSummary?.totalLaborCost || totalLabor,
        totalMachineCost: costSummary?.totalMachineCost || totalShift,
        totalActualCost: costSummary?.totalActualCost || (totalLabor + totalShift),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load progress logs for a specific task
  const loadProgressLogs = async (taskId?: number) => {
    try {
      if (taskId) {
        const data = await siteApi.getProgress(taskId);
        setProgressLogs(data);
      } else {
        const data = await siteApi.getProgress();
        setProgressLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem('bmc_active_project_id', String(selectedProjectId));
      loadWbsData(selectedProjectId);
      loadSiteData(selectedProjectId);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (tab === 'progress' && filterTaskId) {
      loadProgressLogs(Number(filterTaskId));
    }
  }, [tab, filterTaskId]);

  // Handle Cascading Filter changes
  const handleFilterItemChange = (itemIdStr: string) => {
    setFilterItemId(itemIdStr);
    const itemTasks = projectTasks.filter((t) => t.projectItemId === Number(itemIdStr));
    if (itemTasks.length > 0) {
      setFilterTaskId(String(itemTasks[0].id));
    } else {
      setFilterTaskId('');
    }
  };

  // Machine Shift Handlers
  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    if (!shiftForm.machineName.trim()) {
      alert('Vui lòng nhập tên máy thi công!');
      return;
    }
    setSubmitting(true);
    try {
      await machineShiftApi.create({
        projectId: selectedProjectId,
        projectItemId: shiftForm.projectItemId ? Number(shiftForm.projectItemId) : undefined,
        projectTaskId: shiftForm.projectTaskId ? Number(shiftForm.projectTaskId) : undefined,
        logDate: shiftForm.logDate,
        machineName: shiftForm.machineName.trim(),
        operatorName: shiftForm.operatorName.trim() || undefined,
        shiftCount: Number(shiftForm.shiftCount) || 1,
        hoursWorked: Number(shiftForm.hoursWorked) || 8,
        unitPrice: Number(shiftForm.unitPrice) || 0,
        fuelCost: Number(shiftForm.fuelCost) || 0,
        notes: shiftForm.notes.trim() || undefined,
      });
      setShowShiftModal(false);
      setShiftForm((prev) => ({
        ...prev,
        machineName: '',
        operatorName: '',
        notes: '',
      }));
      alert('Ghi nhật trình ca máy thành công!');
      loadSiteData(selectedProjectId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi ghi nhật trình ca máy');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteShift = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa bản ghi nhật trình ca máy này?')) return;
    try {
      await machineShiftApi.delete(id);
      if (selectedProjectId) loadSiteData(selectedProjectId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa nhật trình ca máy');
    }
  };

  // Progress & Photo Upload Handlers
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingPhotos(true);
    try {
      const fileList = Array.from(files);
      const res = await uploadApi.uploadMultiple(fileList);
      const urls = res.map((r) => r.url);
      setUploadedPhotos((prev) => [...prev, ...urls]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tải ảnh lên máy chủ');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const removeUploadedPhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    const taskId = progressForm.projectTaskId || filterTaskId;
    if (!taskId) {
      alert('Vui lòng chọn công tác cần cập nhật tiến độ!');
      return;
    }
    setSubmitting(true);
    try {
      await siteApi.createProgress({
        projectTaskId: Number(taskId),
        progressDate: progressForm.progressDate,
        completedQuantity: Number(progressForm.completedQuantity) || 0,
        progressPercent: progressForm.progressPercent ? Number(progressForm.progressPercent) : undefined,
        note: progressForm.note.trim() || undefined,
        photoUrls: uploadedPhotos.join(','),
      });
      setShowProgressModal(false);
      setProgressForm((prev) => ({
        ...prev,
        completedQuantity: '',
        progressPercent: '',
        note: '',
      }));
      setUploadedPhotos([]);
      alert('Cập nhật tiến độ và ảnh hiện trường thành công!');
      loadProgressLogs(Number(taskId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật tiến độ');
    } finally {
      setSubmitting(false);
    }
  };

  // Labor Handlers
  const handleCreateLabor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    if (!laborForm.laborId) {
      alert('Vui lòng chọn loại nhân công!');
      return;
    }
    setSubmitting(true);
    try {
      await siteApi.createLaborEntry({
        projectId: selectedProjectId,
        workDate: laborForm.workDate,
        teamName: laborForm.teamName.trim() || undefined,
        laborId: Number(laborForm.laborId),
        quantity: Number(laborForm.quantity),
        unitPrice: Number(laborForm.unitPrice),
        note: laborForm.note.trim() || undefined,
      });
      setShowLaborModal(false);
      setLaborForm((prev) => ({ ...prev, teamName: '', quantity: '1', note: '' }));
      alert('Ghi nhật ký nhân công thành công!');
      loadSiteData(selectedProjectId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi ghi nhật ký nhân công');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLabor = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa bản ghi nhật ký nhân công này?')) return;
    try {
      await siteApi.deleteLaborEntry(id);
      if (selectedProjectId) loadSiteData(selectedProjectId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa bản ghi nhân công');
    }
  };

  const laborAmount = (Number(laborForm.quantity) || 0) * (Number(laborForm.unitPrice) || 0);
  const shiftEstimatedCost = (Number(shiftForm.shiftCount) || 1) * (Number(shiftForm.unitPrice) || 0) + (Number(shiftForm.fuelCost) || 0);

  return (
    <div>
      {/* Project Selector Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 24px' }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Chọn Công Trình / Dự Án:</span>
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
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => selectedProjectId && loadSiteData(selectedProjectId)}
          >
            <RefreshCw size={14} /> Làm mới dữ liệu
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(249, 115, 22, 0.15)', color: 'var(--orange-primary)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div className="stat-val">{formatCurrency(summary?.totalActualCost || 0)}</div>
            <div className="stat-label">Tổng Chi Phí Hiện Trường Thực Tế</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(14, 165, 233, 0.15)', color: 'var(--blue-tech)' }}>
            <Truck size={24} />
          </div>
          <div>
            <div className="stat-val">{formatCurrency(summary?.totalMachineCost || 0)}</div>
            <div className="stat-label">Chi Phí Nhật Trình Ca Máy ({shiftLogs.length} ca)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--emerald-success)' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-val">{formatCurrency(summary?.totalLaborCost || 0)}</div>
            <div className="stat-label">Chi Phí Chấm Công Nhân Công</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
            <Camera size={24} />
          </div>
          <div>
            <div className="stat-val">{progressLogs.length}</div>
            <div className="stat-label">Lượt Báo Cáo Tiến Độ & Ảnh Hiện Trường</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-bar" style={{ marginBottom: '20px' }}>
        <button
          className={`tab-btn ${tab === 'shift' ? 'active' : ''}`}
          onClick={() => setTab('shift')}
        >
          <Truck size={16} /> Nhật Trình Ca Máy Thi Công ({shiftLogs.length})
        </button>
        <button
          className={`tab-btn ${tab === 'progress' ? 'active' : ''}`}
          onClick={() => setTab('progress')}
        >
          <Camera size={16} /> Báo Cáo Tiến Độ & 📸 Ảnh Hiện Trường ({progressLogs.length})
        </button>
        <button
          className={`tab-btn ${tab === 'labor' ? 'active' : ''}`}
          onClick={() => setTab('labor')}
        >
          <Users size={16} /> Nhật Ký Nhân Công & Tổ Đội ({laborEntries.length})
        </button>
      </div>

      {/* ==================== TAB 1: MACHINE SHIFT LOGS ==================== */}
      {tab === 'shift' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Nhật Trình Hoạt Động Ca Máy Hiện Trường</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Theo dõi nhật trình ca máy (máy đào, xe lu, cẩu tháp, máy trộn), thợ lái, giờ hoạt động, nhiên liệu và chi phí thực tế gắn trực tiếp vào công tác WBS
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setShiftForm((prev) => ({
                  ...prev,
                  projectItemId: filterItemId,
                  projectTaskId: filterTaskId,
                }));
                setShowShiftModal(true);
              }}
              disabled={!selectedProjectId}
            >
              <Plus size={16} /> Ghi Nhật Trình Ca Máy Mới
            </button>
          </div>

          <div className="table-container">
            <table className="bmc-table">
              <thead>
                <tr>
                  <th>Ngày Làm Việc</th>
                  <th>Máy / Thiết Bị Thi Công</th>
                  <th>Người Vận Hành / Lái Máy</th>
                  <th>Hạng Mục & Công Tác Thi Công</th>
                  <th style={{ textAlign: 'right' }}>Số Ca Máy</th>
                  <th style={{ textAlign: 'right' }}>Giờ Chạy</th>
                  <th style={{ textAlign: 'right' }}>Đơn Giá Ca (VNĐ)</th>
                  <th style={{ textAlign: 'right' }}>Tiền Nhiên Liệu (VNĐ)</th>
                  <th style={{ textAlign: 'right', fontWeight: 700 }}>Tổng Chi Phí (VNĐ)</th>
                  <th>Ghi Chú</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {shiftLogs.map((s) => (
                  <tr key={s.id}>
                    <td>{formatDate(s.logDate)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--blue-tech)' }}>{s.machineName}</td>
                    <td>{s.operatorName || 'Tài xế / Thợ lái'}</td>
                    <td>
                      {s.projectTaskName ? (
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.projectTaskName}</span>
                          {s.projectItemName && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              [{s.projectItemName}]
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Toàn công trình</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--orange-primary)' }}>
                      {formatNumber(s.shiftCount)} ca
                    </td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(s.hoursWorked)} h</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(s.unitPrice)}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(s.fuelCost)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--orange-primary)' }}>
                      {formatCurrency(s.totalCost)}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.notes || '-'}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteShift(s.id)}
                        className="btn-icon"
                        title="Xóa nhật trình ca máy"
                        style={{ color: 'var(--crimson-danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {shiftLogs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Chưa có nhật trình ca máy nào cho công trình này. Bấm <strong>"Ghi Nhật Trình Ca Máy Mới"</strong> để ghi nhận ca máy.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: PROGRESS & PHOTOS ==================== */}
      {tab === 'progress' && (
        <div>
          {/* Cascading Filter Header */}
          <div className="card" style={{ marginBottom: '20px', padding: '14px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr auto', gap: '14px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>1. Chọn Hạng Mục Công Trình</label>
                <select
                  className="form-select"
                  value={filterItemId}
                  onChange={(e) => handleFilterItemChange(e.target.value)}
                >
                  <option value="">-- Tất cả hạng mục --</option>
                  {projectItems.map((it) => (
                    <option key={it.id} value={it.id}>
                      [{it.code}] {it.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>2. Chọn Công Tác Cần Xem Tiến Độ</label>
                <select
                  className="form-select"
                  value={filterTaskId}
                  onChange={(e) => setFilterTaskId(e.target.value)}
                >
                  <option value="">-- Chọn công tác --</option>
                  {projectTasks
                    .filter((t) => !filterItemId || t.projectItemId === Number(filterItemId))
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        [{t.code}] {t.name} ({formatUnit(t.unitName)})
                      </option>
                    ))}
                </select>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => {
                  setProgressForm((prev) => ({
                    ...prev,
                    projectItemId: filterItemId,
                    projectTaskId: filterTaskId,
                  }));
                  setShowProgressModal(true);
                }}
                style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Camera size={16} /> Báo Cáo Tiến Độ & Tải Ảnh
              </button>
            </div>
          </div>

          {/* Progress Entries List with Photo Gallery */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <div>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={18} color="var(--emerald-success)" />
                  Lịch Sử Nghiệm Thu Khối Lượng & Ảnh Chụp Công Trường
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {filterTaskId
                    ? `Đang xem công tác: ${projectTasks.find((t) => t.id === Number(filterTaskId))?.name || '#' + filterTaskId}`
                    : 'Chọn công tác để xem chi tiết nhật trình và ảnh chụp'}
                </p>
              </div>
            </div>

            {progressLogs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {progressLogs.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: 'var(--bg-tertiary)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>
                          Ngày Báo Cáo: {formatDate(p.progressDate)}
                        </span>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Người ghi nhận: {p.createdByName || 'Kỹ sư hiện trường'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Khối lượng kỳ này:</span>
                          <div style={{ fontWeight: 700, color: 'var(--blue-tech)', fontSize: '14px' }}>
                            +{formatNumber(p.completedQuantity)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Lũy kế hoàn thành:</span>
                          <div style={{ fontWeight: 800, color: 'var(--emerald-success)', fontSize: '16px' }}>
                            {formatNumber(p.cumulativeCompletedQuantity || p.completedQuantity)} ({p.progressPercent}%)
                          </div>
                        </div>
                      </div>
                    </div>

                    {p.note && (
                      <div style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '12px', fontStyle: 'italic', backgroundColor: 'var(--bg-card)', padding: '8px 12px', borderRadius: '6px' }}>
                        Ghi chú hiện trường: {p.note}
                      </div>
                    )}

                    {/* Photo Thumbnails */}
                    {(() => {
                      const raw = p.photoUrls as any;
                      let photoList: string[] = [];
                      if (Array.isArray(raw)) {
                        photoList = raw.map(String);
                      } else if (typeof raw === 'string' && raw.trim().length > 0) {
                        const trimmed = raw.trim();
                        if (trimmed.startsWith('[')) {
                          try {
                            const parsed = JSON.parse(trimmed);
                            if (Array.isArray(parsed)) photoList = parsed.map(String);
                          } catch {}
                        } else {
                          photoList = trimmed.split(',').map((s: string) => s.trim()).filter(Boolean);
                        }
                      }

                      if (photoList.length === 0) return null;

                      return (
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Camera size={14} /> Ảnh Chụp Thực Tế ({photoList.length} ảnh):
                          </div>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {photoList.map((url: string, i: number) => (
                              <div
                                key={i}
                                onClick={() => setPreviewPhotoUrl(url)}
                                style={{
                                  width: '120px',
                                  height: '90px',
                                  borderRadius: '6px',
                                  overflow: 'hidden',
                                  border: '2px solid var(--border-color)',
                                  cursor: 'pointer',
                                  position: 'relative',
                                }}
                              >
                                <img
                                  src={url}
                                  alt="Ảnh hiện trường"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: 0,
                                    transition: 'opacity 0.2s',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                                >
                                  <Eye size={18} color="#fff" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Chưa có báo cáo nghiệm thu hoặc ảnh hiện trường cho công tác này. Bấm <strong>"Báo Cáo Tiến Độ & Tải Ảnh"</strong> để cập nhật.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: LABOR ENTRIES ==================== */}
      {tab === 'labor' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Nhật Ký Chấm Công & Chi Phí Nhân Công</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Chi tiết số công nhật của các tổ đội thợ thi công trực tiếp theo ngày
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowLaborModal(true)}
              disabled={!selectedProjectId}
            >
              <Plus size={16} /> Ghi Nhật Ký Nhân Công
            </button>
          </div>
          <div className="table-container">
            <table className="bmc-table">
              <thead>
                <tr>
                  <th>Ngày Làm Việc</th>
                  <th>Tổ Đội Thi Công</th>
                  <th>Loại Nhân Công / Bậc Thợ</th>
                  <th>Hạng Mục / Công Tác</th>
                  <th style={{ textAlign: 'right' }}>Số Công (Ngày)</th>
                  <th style={{ textAlign: 'right' }}>Đơn Giá / Công</th>
                  <th style={{ textAlign: 'right', fontWeight: 700 }}>Thành Tiền</th>
                  <th>Ghi Chú</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {laborEntries.map((l) => (
                  <tr key={l.id}>
                    <td>{formatDate(l.workDate)}</td>
                    <td style={{ fontWeight: 600 }}>{l.teamName || 'Tổ thợ xây tô'}</td>
                    <td>{l.laborName || l.laborCode || 'Thợ xây'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      {l.projectItemName || l.projectTaskName || '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--blue-tech)' }}>
                      {formatNumber(l.quantity)} công
                    </td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(l.unitPrice)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--orange-primary)' }}>
                      {formatCurrency(l.amount)}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{l.note || '-'}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteLabor(l.id)}
                        className="btn-icon"
                        title="Xóa bản ghi"
                        style={{ color: 'var(--crimson-danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {laborEntries.length === 0 && !loading && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Chưa có nhật ký nhân công. Bấm <strong>"Ghi Nhật Ký Nhân Công"</strong> để nhập mới.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== MODAL: Create Machine Shift Log ===== */}
      {showShiftModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Ghi Nhật Trình Ca Máy Mới</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Ghi nhận ca hoạt động, tài xế lái và chi phí máy thi công cho công tác WBS
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowShiftModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateShift}>
              {/* WBS Task Cascading Selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Hạng Mục Công Trình</label>
                  <select
                    className="form-select"
                    value={shiftForm.projectItemId}
                    onChange={(e) => setShiftForm((prev) => ({ ...prev, projectItemId: e.target.value }))}
                  >
                    <option value="">-- Chọn hạng mục --</option>
                    {projectItems.map((it) => (
                      <option key={it.id} value={it.id}>
                        [{it.code}] {it.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Công Tác Sử Dụng Máy</label>
                  <select
                    className="form-select"
                    value={shiftForm.projectTaskId}
                    onChange={(e) => setShiftForm((prev) => ({ ...prev, projectTaskId: e.target.value }))}
                  >
                    <option value="">-- Chọn công tác --</option>
                    {projectTasks
                      .filter((t) => !shiftForm.projectItemId || t.projectItemId === Number(shiftForm.projectItemId))
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          [{t.code}] {t.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Ngày Làm Việc *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={shiftForm.logDate}
                    onChange={(e) => setShiftForm({ ...shiftForm, logDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tên Máy & Thiết Bị *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={shiftForm.machineName}
                    onChange={(e) => setShiftForm({ ...shiftForm, machineName: e.target.value })}
                    placeholder="VD: Máy đào bánh xích Komatsu 0.8m3"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Tài Xế / Người Vận Hành</label>
                  <input
                    type="text"
                    className="form-input"
                    value={shiftForm.operatorName}
                    onChange={(e) => setShiftForm({ ...shiftForm, operatorName: e.target.value })}
                    placeholder="VD: Nguyễn Văn Lái"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Số Ca Máy *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={shiftForm.shiftCount}
                    onChange={(e) => setShiftForm({ ...shiftForm, shiftCount: e.target.value })}
                    min="0.1"
                    step="0.5"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Số Giờ Hoạt Động</label>
                  <input
                    type="number"
                    className="form-input"
                    value={shiftForm.hoursWorked}
                    onChange={(e) => setShiftForm({ ...shiftForm, hoursWorked: e.target.value })}
                    min="0.5"
                    step="0.5"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Đơn Giá Ca Máy (VNĐ)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={shiftForm.unitPrice}
                    onChange={(e) => setShiftForm({ ...shiftForm, unitPrice: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tiền Dầu / Nhiên Liệu (VNĐ)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={shiftForm.fuelCost}
                    onChange={(e) => setShiftForm({ ...shiftForm, fuelCost: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              {/* Cost Preview */}
              {shiftEstimatedCost > 0 && (
                <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', padding: '12px 16px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Tổng Chi Phí Ca Dự Tính:</span>
                  <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--orange-primary)' }}>
                    {formatCurrency(shiftEstimatedCost)}
                  </span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Ghi Chú Nhật Trình</label>
                <input
                  type="text"
                  className="form-input"
                  value={shiftForm.notes}
                  onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
                  placeholder="Vị trí đào, tình trạng thời tiết, sự cố hỏng hóc..."
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowShiftModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Lưu Nhật Trình Ca Máy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: Create Task Progress & Upload Photos ===== */}
      {showProgressModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Cập Nhật Tiến Độ & 📸 Tải Ảnh Hiện Trường</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Ghi nhận khối lượng hoàn thành thực tế và đính kèm album ảnh chụp tại công trường
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowProgressModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProgress}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Hạng Mục *</label>
                  <select
                    className="form-select"
                    value={progressForm.projectItemId}
                    onChange={(e) => setProgressForm((prev) => ({ ...prev, projectItemId: e.target.value }))}
                  >
                    <option value="">-- Chọn hạng mục --</option>
                    {projectItems.map((it) => (
                      <option key={it.id} value={it.id}>
                        [{it.code}] {it.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Công Tác WBS *</label>
                  <select
                    className="form-select"
                    value={progressForm.projectTaskId}
                    onChange={(e) => setProgressForm((prev) => ({ ...prev, projectTaskId: e.target.value }))}
                    required
                  >
                    <option value="">-- Chọn công tác --</option>
                    {projectTasks
                      .filter((t) => !progressForm.projectItemId || t.projectItemId === Number(progressForm.projectItemId))
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          [{t.code}] {t.name} ({formatUnit(t.unitName)})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Ngày Nghiệm Thu / Báo Cáo *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={progressForm.progressDate}
                    onChange={(e) => setProgressForm({ ...progressForm, progressDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Khối Lượng Kỳ Này *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={progressForm.completedQuantity}
                    onChange={(e) => setProgressForm({ ...progressForm, completedQuantity: e.target.value })}
                    placeholder="VD: 50"
                    min="0"
                    step="any"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tiến Độ Lũy Kế (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={progressForm.progressPercent}
                    onChange={(e) => setProgressForm({ ...progressForm, progressPercent: e.target.value })}
                    placeholder="VD: 75"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* Photo Upload Zone */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>📸 Tải Lên Ảnh Hiện Trường (Nhiều ảnh):</span>
                  {uploadingPhotos && <span style={{ color: 'var(--blue-tech)', fontSize: '12px' }}>Đang tải ảnh lên...</span>}
                </label>
                <div
                  style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    backgroundColor: 'var(--bg-tertiary)',
                  }}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    id="photoUploadInput"
                    style={{ display: 'none' }}
                    onChange={handlePhotoUpload}
                  />
                  <label
                    htmlFor="photoUploadInput"
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  >
                    <Upload size={14} /> Chọn Ảnh Chụp Hiện Trường
                  </label>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Hỗ trợ định dạng JPG, PNG, WEBP (chụp bằng điện thoại hoặc máy bay drone)
                  </div>
                </div>

                {/* Uploaded Photos Preview List */}
                {uploadedPhotos.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
                    {uploadedPhotos.map((url, i) => (
                      <div
                        key={i}
                        style={{
                          width: '90px',
                          height: '70px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          position: 'relative',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <img src={url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => removeUploadedPhoto(i)}
                          style={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            background: 'rgba(0,0,0,0.7)',
                            border: 'none',
                            color: '#fff',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Ghi Chú Nhật Ký Nghiệm Thu</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={progressForm.note}
                  onChange={(e) => setProgressForm({ ...progressForm, note: e.target.value })}
                  placeholder="Mô tả chất lượng hoàn thành, các lưu ý kỹ thuật hiện trường..."
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowProgressModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting || uploadingPhotos}>
                  {submitting ? 'Đang lưu...' : 'Lưu Báo Cáo Tiến Độ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: Create Labor Entry ===== */}
      {showLaborModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Ghi Nhật Ký Nhân Công</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Chấm công thực tế theo ngày làm việc tại công trường
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowLaborModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateLabor}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Ngày Làm Việc *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={laborForm.workDate}
                    onChange={(e) => setLaborForm({ ...laborForm, workDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tổ Đội Thi Công</label>
                  <input
                    type="text"
                    className="form-input"
                    value={laborForm.teamName}
                    onChange={(e) => setLaborForm({ ...laborForm, teamName: e.target.value })}
                    placeholder="VD: Tổ Thợ Xây - Anh Hùng"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Loại Nhân Công / Bậc Thợ *</label>
                <select
                  className="form-select"
                  value={laborForm.laborId}
                  onChange={(e) => setLaborForm({ ...laborForm, laborId: e.target.value })}
                  required
                >
                  <option value="">-- Chọn loại nhân công --</option>
                  {availableLabors.map((l) => (
                    <option key={l.id} value={l.id}>
                      [{l.code}] {l.name} {l.grade ? `(${l.grade})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Số Công (Ngày Công) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={laborForm.quantity}
                    onChange={(e) => setLaborForm({ ...laborForm, quantity: e.target.value })}
                    placeholder="VD: 5"
                    min="0.1"
                    step="0.5"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Đơn Giá / Công (VNĐ) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={laborForm.unitPrice}
                    onChange={(e) => setLaborForm({ ...laborForm, unitPrice: e.target.value })}
                    placeholder="VD: 350000"
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Preview tổng tiền */}
              {laborAmount > 0 && (
                <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Thành Tiền Dự Tính:</span>
                  <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--orange-primary)' }}>
                    {formatCurrency(laborAmount)}
                  </span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Ghi Chú</label>
                <input
                  type="text"
                  className="form-input"
                  value={laborForm.note}
                  onChange={(e) => setLaborForm({ ...laborForm, note: e.target.value })}
                  placeholder="Hạng mục thi công, địa điểm..."
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowLaborModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Ghi Nhật Ký'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== PHOTO LIGHTBOX PREVIEW MODAL ===== */}
      {previewPhotoUrl && (
        <div
          onClick={() => setPreviewPhotoUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '24px',
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              style={{
                position: 'absolute',
                top: -16,
                right: -16,
                backgroundColor: 'var(--crimson-danger)',
                border: 'none',
                color: '#fff',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}
            >
              <X size={18} />
            </button>
            <img
              src={previewPhotoUrl}
              alt="Ảnh phóng to hiện trường"
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
