import React, { useEffect, useState } from 'react';
import { siteApi, projectApi, catalogsApi, machineShiftApi, uploadApi } from '../api';
import { Project, ProjectItem, ProjectTask, MachineShiftLog, TaskProgressEntry } from '../types';
import { toast } from '../contexts/ToastContext';
import { confirmDialog } from '../contexts/ConfirmContext';
import { formatCurrency, formatNumber, formatDate, formatUnit } from '../utils/formatters';
import { HardHat, DollarSign, Truck, Users, RefreshCw, Plus, X, Trash2, Camera, Image, CheckCircle, Upload, Eye, Calendar, Info, AlertTriangle, FileText, CheckCircle2, Layers, ArrowUpRight, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

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
  const [selectedProgressDetail, setSelectedProgressDetail] = useState<TaskProgressEntry | null>(null);
  const [taskProgressSummary, setTaskProgressSummary] = useState<any | null>(null);
  const [modalTaskSummary, setModalTaskSummary] = useState<any | null>(null);
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

  // Photo Gallery Lightbox state
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    photos: string[];
    currentIndex: number;
    title?: string;
  }>({
    isOpen: false,
    photos: [],
    currentIndex: 0,
    title: '',
  });

  const openLightbox = (photos: string[], index: number = 0, title?: string) => {
    if (!photos || photos.length === 0) return;
    setLightboxState({
      isOpen: true,
      photos,
      currentIndex: Math.max(0, Math.min(index, photos.length - 1)),
      title: title || 'Hình ảnh hiện trường',
    });
  };

  const closeLightbox = () => {
    setLightboxState((prev) => ({ ...prev, isOpen: false }));
  };

  const nextLightboxPhoto = () => {
    setLightboxState((prev) => {
      if (prev.photos.length <= 1) return prev;
      return {
        ...prev,
        currentIndex: (prev.currentIndex + 1) % prev.photos.length,
      };
    });
  };

  const prevLightboxPhoto = () => {
    setLightboxState((prev) => {
      if (prev.photos.length <= 1) return prev;
      return {
        ...prev,
        currentIndex: (prev.currentIndex - 1 + prev.photos.length) % prev.photos.length,
      };
    });
  };

  // Keyboard navigation for Lightbox (ArrowLeft, ArrowRight, Escape)
  useEffect(() => {
    if (!lightboxState.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        nextLightboxPhoto();
      } else if (e.key === 'ArrowLeft') {
        prevLightboxPhoto();
      } else if (e.key === 'Escape') {
        closeLightbox();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxState.isOpen]);

  // Labor state (Site actual labor entries)
  const [laborEntries, setLaborEntries] = useState<any[]>([]);
  const [availableLabors, setAvailableLabors] = useState<any[]>([]);
  const [showLaborModal, setShowLaborModal] = useState(false);
  const [laborForm, setLaborForm] = useState({
    projectItemId: '',
    projectTaskId: '',
    workDate: new Date().toISOString().slice(0, 10),
    teamName: '',
    laborId: '',
    quantity: '',
    unitPrice: '',
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
        const [data, sum] = await Promise.all([
          siteApi.getProgress(taskId),
          siteApi.getProgressSummary(taskId).catch(() => null),
        ]);
        setProgressLogs(data);
        setTaskProgressSummary(sum);
      } else {
        const data = await siteApi.getProgress();
        setProgressLogs(data);
        setTaskProgressSummary(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProgress = async (id: number) => {
    const ok = await confirmDialog({
      title: 'Xác Nhận Xóa Nghiệm Thu',
      message: 'Bạn có chắc chắn muốn xóa bản ghi nghiệm thu này? Hệ thống sẽ tự động tính lại khối lượng lũy kế và tiến độ công tác.',
      confirmText: 'Xác Nhận Xóa',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await siteApi.deleteProgress(id);
      toast.success('Đã xóa bản ghi nghiệm thu tiến độ thành công!');
      if (selectedProgressDetail?.id === id) {
        setSelectedProgressDetail(null);
      }
      const curTask = progressForm.projectTaskId || filterTaskId;
      if (curTask) {
        loadProgressLogs(Number(curTask));
      }
      if (selectedProjectId) {
        loadWbsData(selectedProjectId);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa bản ghi tiến độ');
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

  // Load summary for the active task in progress modal whenever task changes
  useEffect(() => {
    const tId = progressForm.projectTaskId || filterTaskId;
    if (showProgressModal && tId) {
      siteApi.getProgressSummary(Number(tId))
        .then((sum) => setModalTaskSummary(sum))
        .catch(() => setModalTaskSummary(null));
    } else if (!showProgressModal) {
      setModalTaskSummary(null);
    }
  }, [showProgressModal, progressForm.projectTaskId]);

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
      toast.warning('Vui lòng nhập tên máy thi công!');
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
      toast.success('Ghi nhật trình ca máy thành công!');
      loadSiteData(selectedProjectId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi ghi nhật trình ca máy');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteShift = async (id: number) => {
    const ok = await confirmDialog({
      title: 'Xác Nhận Xóa Nhật Trình',
      message: 'Bạn có chắc muốn xóa bản ghi nhật trình ca máy thi công này không?',
      confirmText: 'Xác Nhận Xóa',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await machineShiftApi.delete(id);
      toast.success('Đã xóa bản ghi nhật trình ca máy thành công!');
      if (selectedProjectId) loadSiteData(selectedProjectId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa nhật trình ca máy');
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
      toast.success(`Đã tải lên thành công ${urls.length} ảnh hiện trường!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi tải ảnh lên máy chủ');
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
      toast.warning('Vui lòng chọn công tác cần cập nhật tiến độ!');
      return;
    }
    if (uploadedPhotos.length === 0) {
      toast.warning('Quy định nghiệm thu hiện trường: Bắt buộc phải tải lên ít nhất 1 ảnh chụp thực tế tại công trường làm bằng chứng nghiệm thu mới được phép lưu báo cáo!');
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
      toast.success('Cập nhật tiến độ và ảnh hiện trường thành công!');
      loadProgressLogs(Number(taskId));
      if (selectedProjectId) loadWbsData(selectedProjectId);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join('\n') : '') ||
        err.message ||
        'Lỗi khi cập nhật tiến độ';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Labor Handlers
  const handleCreateLabor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    if (!laborForm.teamName.trim()) {
      toast.warning('Vui lòng nhập tên Tổ đội thi công (VD: Tổ thợ nề Bác Bình, Tổ sắt Bác Hải...)!');
      return;
    }
    if (!laborForm.laborId) {
      toast.warning('Vui lòng chọn loại nhân công / bậc thợ!');
      return;
    }
    const qty = Number(laborForm.quantity);
    if (!laborForm.quantity || isNaN(qty) || qty <= 0) {
      toast.warning('Vui lòng nhập số công (ngày công) hợp lệ lớn hơn 0!');
      return;
    }
    const price = Number(laborForm.unitPrice);
    if (!laborForm.unitPrice || isNaN(price) || price <= 0) {
      toast.warning('Vui lòng nhập đơn giá một ngày công hợp lệ!');
      return;
    }
    setSubmitting(true);
    try {
      await siteApi.createLaborEntry({
        projectId: selectedProjectId,
        projectItemId: laborForm.projectItemId ? Number(laborForm.projectItemId) : undefined,
        projectTaskId: laborForm.projectTaskId ? Number(laborForm.projectTaskId) : undefined,
        workDate: laborForm.workDate,
        teamName: laborForm.teamName.trim(),
        laborId: Number(laborForm.laborId),
        quantity: qty,
        unitPrice: price,
        note: laborForm.note.trim() || undefined,
      });
      setShowLaborModal(false);
      setLaborForm({
        projectItemId: '',
        projectTaskId: '',
        workDate: new Date().toISOString().slice(0, 10),
        teamName: '',
        laborId: '',
        quantity: '',
        unitPrice: '',
        note: '',
      });
      toast.success('Ghi nhật ký nhân công thành công!');
      loadSiteData(selectedProjectId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi ghi nhật ký nhân công');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLabor = async (id: number) => {
    const ok = await confirmDialog({
      title: 'Xác Nhận Xóa Nhật Ký Nhân Công',
      message: 'Bạn có chắc muốn xóa bản ghi nhật ký nhân công & tổ đội thi công này không?',
      confirmText: 'Xác Nhận Xóa',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await siteApi.deleteLaborEntry(id);
      toast.success('Đã xóa bản ghi nhật ký nhân công thành công!');
      if (selectedProjectId) loadSiteData(selectedProjectId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa bản ghi nhân công');
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'flex-end' }}>
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
            </div>
          </div>

          {/* Task Summary Banner (When task is selected) */}
          {filterTaskId && (() => {
            const curTask = projectTasks.find((t) => t.id === Number(filterTaskId));
            if (!curTask) return null;
            const curItem = projectItems.find((it) => it.id === curTask.projectItemId);
            const plannedQty = curTask.quantity || 0;
            const latestLog = progressLogs.length > 0 ? progressLogs[progressLogs.length - 1] : null;
            const currentCumulative = Number(latestLog?.cumulativeCompletedQuantity ?? (taskProgressSummary?.cumulativeCompletedQuantity ?? 0));
            const currentPercent = curTask.progressPercent || (plannedQty > 0 ? Math.min(100, Math.round((currentCumulative / plannedQty) * 100)) : 0);
            const isCompleted = currentPercent >= 100;
            const isOver = plannedQty > 0 && currentCumulative > plannedQty;

            return (
              <div
                className="card"
                style={{
                  marginBottom: '16px',
                  background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-tertiary) 100%)',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span className="badge badge-secondary" style={{ fontSize: '11px' }}>
                        {curItem ? `[${curItem.code}] ${curItem.name}` : 'Hạng mục'}
                      </span>
                      <span className={`badge ${isCompleted ? 'badge-success' : 'badge-primary'}`} style={{ fontSize: '11px' }}>
                        {isCompleted ? '✓ Đã hoàn thành' : '⚡ Đang triển khai'}
                      </span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                      [{curTask.code}] {curTask.name}
                    </h3>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setProgressForm((prev) => ({
                        ...prev,
                        projectItemId: String(curTask.projectItemId || filterItemId),
                        projectTaskId: String(curTask.id),
                      }));
                      setShowProgressModal(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={16} /> Nghiệm Thu Đợt Mới & Tải Ảnh
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Khối lượng thiết kế:</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                      {formatNumber(plannedQty)} <span style={{ fontSize: '12px', fontWeight: 500 }}>{formatUnit(curTask.unitName)}</span>
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Lũy kế hoàn thành:</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--emerald-success)', marginTop: '2px' }}>
                      {formatNumber(currentCumulative)} <span style={{ fontSize: '12px', fontWeight: 500 }}>{formatUnit(curTask.unitName)}</span>
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tiến độ tổng thể:</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: isCompleted ? 'var(--emerald-success)' : 'var(--blue-tech)', marginTop: '2px' }}>
                      {currentPercent}%
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Số đợt nghiệm thu:</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                      {progressLogs.length} <span style={{ fontSize: '12px', fontWeight: 500 }}>lần</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>
                    <span>Đã thực hiện: {formatNumber(currentCumulative)} / {formatNumber(plannedQty)} {formatUnit(curTask.unitName)}</span>
                    <span style={{ fontWeight: 700, color: isCompleted ? 'var(--emerald-success)' : 'var(--blue-tech)' }}>
                      {isOver ? `Vượt thiết kế +${formatNumber(currentCumulative - plannedQty)} ${formatUnit(curTask.unitName)} (100%)` : `${currentPercent}%`}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, currentPercent)}%`,
                        background: isCompleted
                          ? 'linear-gradient(90deg, #10b981, #059669)'
                          : 'linear-gradient(90deg, var(--blue-tech), #2563eb)',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

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
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>
                            Ngày Báo Cáo: {formatDate(p.progressDate)}
                          </span>
                          <span className={`badge ${(p.progressPercent ?? 0) >= 100 ? 'badge-success' : 'badge-primary'}`} style={{ fontSize: '11px' }}>
                            {(p.progressPercent ?? 0) >= 100 ? '✓ Đã hoàn thành' : '⚡ Đang thực hiện'}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Người ghi nhận: <strong>{p.createdByName || 'Chỉ huy trưởng / Kỹ sư'}</strong> • Đợt nghiệm thu #{p.id}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Khối lượng kỳ này:</span>
                          <div style={{ fontWeight: 700, color: 'var(--blue-tech)', fontSize: '15px' }}>
                            +{formatNumber(p.completedQuantity)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Lũy kế hoàn thành:</span>
                          <div style={{ fontWeight: 800, color: 'var(--emerald-success)', fontSize: '16px' }}>
                            {formatNumber(p.cumulativeCompletedQuantity || p.completedQuantity)} ({p.progressPercent ?? 0}%)
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginLeft: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedProgressDetail(p)}
                            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                            title="Xem chi tiết đầy đủ hồ sơ nghiệm thu này"
                          >
                            <Eye size={14} /> Xem Chi Tiết
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => p.id && handleDeleteProgress(p.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 8px' }}
                            title="Xóa bản ghi nghiệm thu này"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {p.note && (
                      <div style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '12px', fontStyle: 'italic', backgroundColor: 'var(--bg-card)', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid var(--blue-tech)' }}>
                        <strong>Ghi chú hiện trường:</strong> {p.note}
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

                      if (photoList.length === 0) {
                        return (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Camera size={14} /> Chưa đính kèm ảnh hiện trường cho đợt này.
                          </div>
                        );
                      }

                      return (
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Camera size={14} /> Ảnh Chụp Thực Tế ({photoList.length} ảnh):
                          </div>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {photoList.map((url: string, i: number) => (
                              <div
                                key={i}
                                onClick={() => openLightbox(photoList, i, `Ảnh nghiệm thu đợt #${p.id} (${formatDate(p.progressDate)})`)}
                                style={{
                                  width: '120px',
                                  height: '90px',
                                  borderRadius: '6px',
                                  overflow: 'hidden',
                                  border: '2px solid var(--border-color)',
                                  cursor: 'pointer',
                                  position: 'relative',
                                  backgroundColor: '#000',
                                }}
                                onMouseEnter={(e) => {
                                  const eye = e.currentTarget.querySelector('.photo-eye-overlay') as HTMLElement;
                                  if (eye) eye.style.opacity = '1';
                                }}
                                onMouseLeave={(e) => {
                                  const eye = e.currentTarget.querySelector('.photo-eye-overlay') as HTMLElement;
                                  if (eye) eye.style.opacity = '0';
                                }}
                              >
                                <img
                                  src={url}
                                  alt="Ảnh hiện trường"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80';
                                  }}
                                />
                                <div
                                  className="photo-eye-overlay"
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    backgroundColor: 'rgba(0,0,0,0.35)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: 0,
                                    transition: 'opacity 0.2s',
                                    pointerEvents: 'none',
                                  }}
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
                    <td style={{ fontWeight: 600 }}>{l.teamName || '---'}</td>
                    <td>{l.laborName || l.laborCode || '---'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      {l.projectItemName || l.projectTaskName ? (
                        <span>
                          {l.projectItemName && <span>[{l.projectItemName}] </span>}
                          {l.projectTaskName}
                        </span>
                      ) : (
                        '-'
                      )}
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
                    min="0.01"
                    step="any"
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
                    min="0"
                    step="any"
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
      {showProgressModal && (() => {
        const activeTaskId = progressForm.projectTaskId || filterTaskId;
        const activeTask = projectTasks.find((t) => t.id === Number(activeTaskId));
        const plannedQty = activeTask?.quantity || 0;

        // Calculate existing cumulative strictly for the selected active task
        const isMatchingSummary = modalTaskSummary && Number(modalTaskSummary.projectTaskId) === activeTask?.id;
        const isMatchingTabSummary = taskProgressSummary && Number(taskProgressSummary.projectTaskId) === activeTask?.id;

        let existingCumulative = 0;
        if (isMatchingSummary && modalTaskSummary.cumulativeCompletedQuantity !== undefined && modalTaskSummary.cumulativeCompletedQuantity !== null) {
          const apiCumulative = Number(modalTaskSummary.cumulativeCompletedQuantity);
          if (apiCumulative === 0 && activeTask && (activeTask.progressPercent ?? 0) > 0) {
            existingCumulative = Math.round(((plannedQty * (activeTask.progressPercent ?? 0)) / 100) * 100) / 100;
          } else {
            existingCumulative = apiCumulative;
          }
        } else if (isMatchingTabSummary && taskProgressSummary.cumulativeCompletedQuantity !== undefined && taskProgressSummary.cumulativeCompletedQuantity !== null) {
          const tabCumulative = Number(taskProgressSummary.cumulativeCompletedQuantity);
          if (tabCumulative === 0 && activeTask && (activeTask.progressPercent ?? 0) > 0) {
            existingCumulative = Math.round(((plannedQty * (activeTask.progressPercent ?? 0)) / 100) * 100) / 100;
          } else {
            existingCumulative = tabCumulative;
          }
        } else if (activeTask) {
          // If no logs recorded yet, estimate from current task progressPercent or 0
          existingCumulative = (activeTask.progressPercent ?? 0) > 0
            ? Math.round(((plannedQty * (activeTask.progressPercent ?? 0)) / 100) * 100) / 100
            : 0;
        }

        const remainingToComplete = Math.max(0, plannedQty - existingCumulative);

        const qtyInput = Number(progressForm.completedQuantity) || 0;
        const projectedCumulative = existingCumulative + qtyInput;
        const autoCalculatedPercent = plannedQty > 0
          ? Math.min(100, Math.round((projectedCumulative / plannedQty) * 100))
          : (activeTask?.progressPercent || 0);
        const isOver = plannedQty > 0 && projectedCumulative > plannedQty;

        return (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
            <div className="card" style={{ width: '700px', maxHeight: '92vh', overflowY: 'auto', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
              <div className="card-header" style={{ marginBottom: '18px' }}>
                <div>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Camera size={20} color="var(--blue-tech)" /> Cập Nhật Tiến Độ & Nghiệm Thu Hiện Trường
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Ghi nhận khối lượng thực tế hoàn thành kỳ này và đính kèm album ảnh chụp tại công trường
                  </p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowProgressModal(false)}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateProgress}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Hạng Mục Công Trình *</label>
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
                    <label className="form-label">Công Tác WBS Cần Nghiệm Thu *</label>
                    <select
                      className="form-select"
                      value={progressForm.projectTaskId}
                      onChange={(e) => {
                        const tId = e.target.value;
                        const match = projectTasks.find((t) => t.id === Number(tId));
                        setProgressForm((prev) => ({
                          ...prev,
                          projectTaskId: tId,
                          projectItemId: match?.projectItemId ? String(match.projectItemId) : prev.projectItemId,
                        }));
                      }}
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

                {/* Active Task Info Box */}
                {activeTask && (
                  <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Công tác:</span>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                          [{activeTask.code}] {activeTask.name}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Khối lượng thiết kế kế hoạch:</span>
                        <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--blue-tech)' }}>
                          {formatNumber(plannedQty)} <span style={{ fontSize: '12px', fontWeight: 500 }}>{formatUnit(activeTask.unitName)}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)', paddingTop: '6px', borderTop: '1px dashed var(--border-color)' }}>
                      <span>Lũy kế đã nghiệm thu: <strong style={{ color: 'var(--emerald-success)' }}>{formatNumber(existingCumulative)} {formatUnit(activeTask.unitName)}</strong> ({activeTask.progressPercent}%)</span>
                      <span>Còn lại cần hoàn thiện: <strong style={{ color: remainingToComplete === 0 ? 'var(--emerald-success)' : 'var(--orange-primary)' }}>{formatNumber(remainingToComplete)} {formatUnit(activeTask.unitName)}</strong></span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '14px', marginBottom: '8px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Ngày Nghiệm Thu / Báo Cáo *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={progressForm.progressDate}
                      onChange={(e) => setProgressForm({ ...progressForm, progressDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">
                      Khối Lượng Kỳ Này * {activeTask?.unitName ? `(${formatUnit(activeTask.unitName)})` : ''}
                    </label>
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
                  <div className="form-group" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label">Tiến Độ Lũy Kế (%)</label>
                      {qtyInput > 0 && (
                        <button
                          type="button"
                          onClick={() => setProgressForm((prev) => ({ ...prev, progressPercent: String(autoCalculatedPercent) }))}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: 'var(--blue-tech)',
                            fontSize: '11px',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            padding: 0,
                          }}
                          title="Tự động điền phần trăm tính theo khối lượng"
                        >
                          Tự tính ({autoCalculatedPercent}%)
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      className="form-input"
                      value={progressForm.progressPercent}
                      onChange={(e) => setProgressForm({ ...progressForm, progressPercent: e.target.value })}
                      placeholder={`Tự động: ${autoCalculatedPercent}%`}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                {/* Realtime Auto Calculation Box */}
                {qtyInput > 0 && (
                  <div style={{ marginTop: '10px', marginBottom: '14px', padding: '10px 14px', backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.25)', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>
                        Dự kiến tổng lũy kế sau kỳ này: <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>{formatNumber(projectedCumulative)}</strong> / {formatNumber(plannedQty)} {formatUnit(activeTask?.unitName)}
                      </span>
                      <span style={{ fontWeight: 700, color: autoCalculatedPercent >= 100 ? 'var(--emerald-success)' : 'var(--blue-tech)', fontSize: '13px' }}>
                        Tự động tính: {autoCalculatedPercent}%
                      </span>
                    </div>
                    {isOver ? (
                      <div style={{ color: 'var(--emerald-success)', marginTop: '4px', fontWeight: 600 }}>
                        ✓ Khối lượng phát sinh vượt thiết kế ban đầu +{formatNumber(projectedCumulative - plannedQty)} {formatUnit(activeTask?.unitName)}. Hệ thống sẽ ghi nhận 100% hoàn thành.
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                        Khối lượng còn lại sau đợt này: {formatNumber(plannedQty - projectedCumulative)} {formatUnit(activeTask?.unitName)}.
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                      💡 Bạn có thể để trống ô "Tiến Độ Lũy Kế (%)", hệ thống sẽ tự động đồng bộ theo tỉ lệ chuẩn ({autoCalculatedPercent}%).
                    </div>
                  </div>
                )}

                {/* Photo Upload Zone */}
                <div className="form-group" style={{ marginTop: '14px' }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>📸 Tải Lên Album Ảnh Hiện Trường <strong style={{ color: '#ef4444' }}>* (Bắt buộc tối thiểu 1 ảnh bằng chứng)</strong>:</span>
                    {uploadingPhotos && <span style={{ color: 'var(--blue-tech)', fontSize: '12px' }}>Đang tải ảnh lên...</span>}
                  </label>
                  <div
                    style={{
                      border: uploadedPhotos.length === 0 ? '2px dashed #f87171' : '2px dashed var(--border-color)',
                      borderRadius: '8px',
                      padding: '16px',
                      textAlign: 'center',
                      backgroundColor: uploadedPhotos.length === 0 ? 'rgba(239, 68, 68, 0.03)' : 'var(--bg-tertiary)',
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
                      <Upload size={14} /> Chọn Ảnh Chụp Hiện Trường (Điện thoại / Drone)
                    </label>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Hỗ trợ định dạng JPG, PNG, WEBP. Bắt buộc có hình ảnh thi công thực tế tại công trường.
                    </div>
                  </div>

                  {/* Warning if no photo */}
                  {uploadedPhotos.length === 0 && (
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        borderRadius: '6px',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: 'var(--red-primary, #ef4444)',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <AlertTriangle size={15} />
                      <span>Chưa có ảnh hiện trường. Quy định nghiệm thu bắt buộc phải có tối thiểu 1 ảnh bằng chứng để lưu & duyệt báo cáo.</span>
                    </div>
                  )}

                  {/* Uploaded Photos Preview List */}
                  {uploadedPhotos.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
                      {uploadedPhotos.map((url, i) => (
                        <div
                          key={i}
                          onClick={() => openLightbox(uploadedPhotos, i, 'Ảnh nghiệm thu vừa tải lên')}
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
                  <label className="form-label">Ghi Chú & Nhật Ký Nghiệm Thu</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={progressForm.note}
                    onChange={(e) => setProgressForm({ ...progressForm, note: e.target.value })}
                    placeholder="Mô tả chất lượng hoàn thành, các lưu ý kỹ thuật hiện trường, thời tiết..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowProgressModal(false)}>
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting || uploadingPhotos || uploadedPhotos.length === 0}
                    title={uploadedPhotos.length === 0 ? 'Bắt buộc tải lên ít nhất 1 ảnh chụp hiện trường để lưu báo cáo' : ''}
                  >
                    {submitting ? 'Đang lưu...' : 'Lưu Báo Cáo Tiến Độ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ===== MODAL: Chi Tiết Báo Cáo Nghiệm Thu Hiện Trường ===== */}
      {selectedProgressDetail && (() => {
        const p = selectedProgressDetail;
        const task = projectTasks.find((t) => t.id === p.projectTaskId);
        const item = projectItems.find((it) => it.id === task?.projectItemId);
        const plannedQty = task?.quantity || 0;
        const cumulativeQty = Number(p.cumulativeCompletedQuantity || p.completedQuantity);
        const isOver = plannedQty > 0 && cumulativeQty > plannedQty;

        // Parse photos
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

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1100,
              backdropFilter: 'blur(3px)',
            }}
          >
            <div
              className="card"
              style={{
                width: '780px',
                maxHeight: '92vh',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              }}
            >
              <div className="card-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="badge badge-secondary" style={{ fontSize: '11px' }}>
                      Báo Cáo Nghiệm Thu #{p.id}
                    </span>
                    <span className={`badge ${(p.progressPercent ?? 0) >= 100 ? 'badge-success' : 'badge-primary'}`} style={{ fontSize: '11px' }}>
                      {(p.progressPercent ?? 0) >= 100 ? '✓ Đã hoàn thành' : '⚡ Đang thực hiện'}
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
                    [{task?.code || 'WBS'}] {task?.name || 'Chi tiết công tác'}
                  </h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Hạng mục: <strong>{item ? `[${item.code}] ${item.name}` : 'Chưa phân loại'}</strong>
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedProgressDetail(null)}>
                  <X size={18} />
                </button>
              </div>

              {/* 4 Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '18px' }}>
                <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Khối lượng kỳ này:</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--blue-tech)', marginTop: '4px' }}>
                    +{formatNumber(p.completedQuantity)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Đơn vị: {formatUnit(task?.unitName)}
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Lũy kế hoàn thành:</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--emerald-success)', marginTop: '4px' }}>
                    {formatNumber(cumulativeQty)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    / {formatNumber(plannedQty)} {formatUnit(task?.unitName)}
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tiến độ lũy kế:</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: (p.progressPercent ?? 0) >= 100 ? 'var(--emerald-success)' : 'var(--blue-tech)', marginTop: '4px' }}>
                    {p.progressPercent ?? 0}%
                  </div>
                  <div style={{ fontSize: '11px', color: isOver ? 'var(--emerald-success)' : 'var(--text-muted)', marginTop: '2px', fontWeight: isOver ? 600 : 400 }}>
                    {isOver ? `Vượt: +${formatNumber(cumulativeQty - plannedQty)}` : 'Theo kế hoạch'}
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ngày nghiệm thu:</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginTop: '6px' }}>
                    {formatDate(p.progressDate)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Bởi: {p.createdByName || 'Hiện trường'}
                  </div>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Tiến độ thực hiện so với khối lượng thiết kế:</span>
                  <span style={{ fontWeight: 700, color: (p.progressPercent ?? 0) >= 100 ? 'var(--emerald-success)' : 'var(--blue-tech)' }}>
                    {formatNumber(cumulativeQty)} / {formatNumber(plannedQty)} {formatUnit(task?.unitName)} ({p.progressPercent ?? 0}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '5px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, p.progressPercent ?? 0)}%`,
                      background: (p.progressPercent ?? 0) >= 100
                        ? 'linear-gradient(90deg, #10b981, #059669)'
                        : 'linear-gradient(90deg, var(--blue-tech), #2563eb)',
                      borderRadius: '5px',
                    }}
                  />
                </div>
              </div>

              {/* Thông tin chi tiết */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '12px 14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Người lập báo cáo:</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.createdByName || 'Chỉ huy trưởng / Kỹ sư'}</div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '12px 14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Thời gian ghi nhận hệ thống:</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.createdAt ? new Date(p.createdAt).toLocaleString('vi-VN') : '---'}</div>
                </div>
              </div>

              {/* Ghi chú hiện trường */}
              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={15} /> Ghi Chú & Nhật Ký Nghiệm Thu:
                </h4>
                <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', lineHeight: 1.6, color: 'var(--text-main)', fontStyle: p.note ? 'normal' : 'italic' }}>
                  {p.note || 'Không có ghi chú thêm cho đợt nghiệm thu này.'}
                </div>
              </div>

              {/* Album ảnh hiện trường */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={15} /> Album Ảnh Chụp Hiện Trường ({photoList.length} ảnh):
                </h4>
                {photoList.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                    {photoList.map((url, i) => (
                      <div
                        key={i}
                        onClick={() => openLightbox(photoList, i, `Chi tiết đợt nghiệm thu #${p.id} (${formatDate(p.progressDate)})`)}
                        style={{
                          height: '120px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '2px solid var(--border-color)',
                          cursor: 'pointer',
                          position: 'relative',
                          backgroundColor: '#000',
                        }}
                      >
                        <img
                          src={url}
                          alt={`Ảnh ${i + 1}`}
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
                          <Eye size={22} color="#fff" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    Chưa đính kèm hình ảnh hiện trường cho đợt báo cáo này.
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => p.id && handleDeleteProgress(p.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={15} /> Xóa Báo Cáo Này
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedProgressDetail(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
              {/* Select WBS Item & Task */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Hạng Mục Công Trình</label>
                  <select
                    className="form-select"
                    value={laborForm.projectItemId}
                    onChange={(e) => {
                      setLaborForm({ ...laborForm, projectItemId: e.target.value, projectTaskId: '' });
                    }}
                  >
                    <option value="">-- Toàn bộ dự án / Chung --</option>
                    {projectItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        [{item.code || (item as any).itemCode || 'HM'}] {item.name || (item as any).itemName || 'Hạng mục'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Công Tác Thi Công</label>
                  <select
                    className="form-select"
                    value={laborForm.projectTaskId}
                    onChange={(e) => setLaborForm({ ...laborForm, projectTaskId: e.target.value })}
                    disabled={!laborForm.projectItemId}
                  >
                    <option value="">-- Chọn công tác WBS --</option>
                    {projectTasks
                      .filter((t) => !laborForm.projectItemId || t.projectItemId === Number(laborForm.projectItemId))
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          [{t.code || (t as any).taskCode || 'CT'}] {t.name || (t as any).taskName || 'Công tác'}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

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
                  <label className="form-label">Tổ Đội Thi Công *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={laborForm.teamName}
                    onChange={(e) => setLaborForm({ ...laborForm, teamName: e.target.value })}
                    placeholder="VD: Tổ thợ nề Bác Bình, Tổ sắt..."
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Loại Nhân Công / Bậc Thợ *</label>
                <select
                  className="form-select"
                  value={laborForm.laborId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const matched = availableLabors.find((l) => String(l.id) === selectedId);
                    setLaborForm((prev) => ({
                      ...prev,
                      laborId: selectedId,
                      unitPrice: prev.unitPrice || (matched?.baseSalary ? String(matched.baseSalary) : prev.unitPrice),
                    }));
                  }}
                  required
                >
                  <option value="">-- Chọn loại nhân công / bậc thợ --</option>
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
                    placeholder="VD: 5 hoặc 10.5"
                    min="0.01"
                    step="any"
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
                    step="any"
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

      {/* ===== PHOTO GALLERY LIGHTBOX MODAL WITH NEXT / PREV / THUMBNAILS ===== */}
      {lightboxState.isOpen && lightboxState.photos.length > 0 && (
        <div
          onClick={closeLightbox}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            zIndex: 99999,
            padding: '16px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {/* Top Bar Header */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#fff',
              padding: '10px 18px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>{lightboxState.title}</span>
              <span
                style={{
                  backgroundColor: 'var(--brand-500, #ea580c)',
                  color: '#fff',
                  padding: '3px 12px',
                  borderRadius: '14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                }}
              >
                Ảnh {lightboxState.currentIndex + 1} / {lightboxState.photos.length}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <a
                href={lightboxState.photos[lightboxState.currentIndex]}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: '#e2e8f0',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.22)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)')}
                title="Mở ảnh gốc độ phân giải cao trong tab mới"
              >
                <ExternalLink size={14} /> Mở ảnh gốc
              </a>
              <button
                onClick={closeLightbox}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.95)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.95)')}
                title="Đóng (Phím Esc)"
              >
                <X size={16} /> Đóng (Esc)
              </button>
            </div>
          </div>

          {/* Main Photo Center with Next & Previous Navigators */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 0',
              overflow: 'hidden',
            }}
          >
            {/* Prev Button */}
            {lightboxState.photos.length > 1 && (
              <button
                onClick={prevLightboxPhoto}
                style={{
                  position: 'absolute',
                  left: '20px',
                  zIndex: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.22)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: '50%',
                  width: '54px',
                  height: '54px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.22)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Ảnh trước (Phím mũi tên trái ←)"
              >
                <ChevronLeft size={32} />
              </button>
            )}

            {/* Current Image */}
            <div style={{ maxHeight: '72vh', maxWidth: '85vw', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img
                key={lightboxState.currentIndex}
                src={lightboxState.photos[lightboxState.currentIndex]}
                alt={`Ảnh hiện trường ${lightboxState.currentIndex + 1}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '72vh',
                  borderRadius: '10px',
                  objectFit: 'contain',
                  boxShadow: '0 12px 48px rgba(0,0,0,0.7)',
                  animation: 'fadeIn 0.25s ease',
                  userSelect: 'none',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80';
                }}
              />
            </div>

            {/* Next Button */}
            {lightboxState.photos.length > 1 && (
              <button
                onClick={nextLightboxPhoto}
                style={{
                  position: 'absolute',
                  right: '20px',
                  zIndex: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.22)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: '50%',
                  width: '54px',
                  height: '54px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.22)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Ảnh tiếp theo (Phím mũi tên phải →)"
              >
                <ChevronRight size={32} />
              </button>
            )}
          </div>

          {/* Bottom Thumbnail Gallery Strip */}
          {lightboxState.photos.length > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 16px',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '14px',
                backdropFilter: 'blur(10px)',
                overflowX: 'auto',
                maxWidth: '92vw',
                margin: '0 auto',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {lightboxState.photos.map((pUrl, idx) => {
                const isActive = idx === lightboxState.currentIndex;
                return (
                  <div
                    key={idx}
                    onClick={() => setLightboxState((prev) => ({ ...prev, currentIndex: idx }))}
                    style={{
                      width: '68px',
                      height: '50px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: isActive ? '3px solid #ea580c' : '1px solid rgba(255,255,255,0.35)',
                      opacity: isActive ? 1 : 0.55,
                      transform: isActive ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                      boxShadow: isActive ? '0 0 12px rgba(234, 88, 12, 0.6)' : 'none',
                    }}
                    title={`Chuyển đến ảnh ${idx + 1}`}
                  >
                    <img src={pUrl} alt={`Thumb ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
