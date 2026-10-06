import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectApi, adminApi, catalogsApi, procurementApi, uploadApi } from '../api';
import { Project, ProjectItem, ProjectTask, Contract, ProjectMember, ProjectDocument, Investor, Supplier, User } from '../types';
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
  UploadCloud,
  Download,
  FileCheck,
  FileEdit,
  ExternalLink,
  Scale,
  HardHat,
  Search,
  CheckCircle2,
  UserPlus,
  UserCog,
  Edit3,
} from 'lucide-react';
import { TaskBreakdownDrawer } from '../components/projects/TaskBreakdownDrawer';
import { BiddingFinancialTab } from '../components/projects/BiddingFinancialTab';
import { PdfViewerModal } from '../components/common/PdfViewerModal';
import { ContractDetailModal } from '../components/admin/ContractDetailModal';
import { parseContractMeta, ContractCategory } from '../utils/contractHelper';

export type DocumentFolderCategory = 'ALL' | 'LEGAL' | 'DESIGN' | 'CONTRACT' | 'QUALITY' | 'ASBUILT' | 'SITE';

const DOC_CATEGORIES = [
  { key: 'ALL', label: 'Tất Cả Hồ Sơ', icon: FolderOpen, color: '#2563eb' },
  { key: 'LEGAL', label: '1. Pháp Lý & Cấp Phép', icon: Scale, color: '#7c3aed' },
  { key: 'DESIGN', label: '2. Bản Vẽ Thiết Kế', icon: Layers, color: '#0284c7' },
  { key: 'CONTRACT', label: '3. Thầu & Hợp Đồng', icon: FileText, color: '#ea580c' },
  { key: 'QUALITY', label: '4. Nghiệm Thu & KCS', icon: CheckCircle2, color: '#16a34a' },
  { key: 'ASBUILT', label: '5. Hoàn Công & Quyết Toán', icon: Award, color: '#0891b2' },
  { key: 'SITE', label: '6. Nhật Ký Hiện Trường', icon: HardHat, color: '#b45309' },
];

const getDocCategoryKey = (docType: string): DocumentFolderCategory => {
  const t = (docType || '').toLowerCase();
  if (t.includes('pháp lý') || t.includes('giấy phép') || t.includes('cấp phép') || t.includes('chủ trương') || t.includes('pccc') || t.includes('legal')) return 'LEGAL';
  if (t.includes('bản vẽ') || t.includes('kiến trúc') || t.includes('kết cấu') || t.includes('mep') || t.includes('thiết kế') || t.includes('design') || t.includes('drawing')) return 'DESIGN';
  if (t.includes('hợp đồng') || t.includes('dự thầu') || t.includes('thương thảo') || t.includes('bidding') || t.includes('contract')) return 'CONTRACT';
  if (t.includes('nghiệm thu') || t.includes('thí nghiệm') || t.includes('chất lượng') || t.includes('co/cq') || t.includes('kcs') || t.includes('inspection')) return 'QUALITY';
  if (t.includes('hoàn công') || t.includes('bàn giao') || t.includes('quyết toán') || t.includes('as-built') || t.includes('asbuilt')) return 'ASBUILT';
  if (t.includes('nhật ký') || t.includes('hiện trường') || t.includes('sự cố') || t.includes('site') || t.includes('diary')) return 'SITE';
  return 'DESIGN';
};

const getFileFormatBadge = (url?: string, name?: string) => {
  const str = (url || name || '').toLowerCase();
  if (str.includes('.pdf')) {
    return { label: 'PDF Scan', color: '#dc2626', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.25)', isPdf: true, canPreview: true };
  }
  if (str.includes('.doc') || str.includes('.docx')) {
    return { label: 'Word Soạn Thảo', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)', border: 'rgba(37, 99, 235, 0.25)', isWord: true, canPreview: true };
  }
  if (str.includes('.png') || str.includes('.jpg') || str.includes('.jpeg') || str.includes('.webp') || str.includes('.svg')) {
    return { label: 'Hình Ảnh', color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.25)', isImage: true, canPreview: true };
  }
  if (str.includes('.dwg') || str.includes('.dxf')) {
    return { label: 'Bản vẽ CAD', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.08)', border: 'rgba(124, 58, 237, 0.25)', isCad: true, canPreview: false };
  }
  if (str.includes('.xls') || str.includes('.xlsx')) {
    return { label: 'Bảng tính Excel', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.08)', border: 'rgba(22, 163, 74, 0.25)', isExcel: true, canPreview: false };
  }
  return { label: 'Tệp Đính Kèm', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', isOther: true, canPreview: false };
};

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
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Task breakdown drawer & Document viewer modal
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfModalUrl, setPdfModalUrl] = useState('');
  const [pdfModalTitle, setPdfModalTitle] = useState('');
  const [pdfModalFileName, setPdfModalFileName] = useState('');

  const openDocViewer = (url: string, titleStr: string, name?: string) => {
    setPdfModalUrl(url);
    setPdfModalTitle(titleStr);
    setPdfModalFileName(name || '');
    setPdfModalOpen(true);
  };

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

  // Catalog tasks list & units for task creation
  const [catalogTasks, setCatalogTasks] = useState<any[]>([]);
  const [unitsList, setUnitsList] = useState<any[]>([]);

  // Modal: Add Task to Project Item
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [targetItemForTask, setTargetItemForTask] = useState<ProjectItem | null>(null);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [taskMode, setTaskMode] = useState<'CATALOG' | 'CUSTOM'>('CATALOG');
  const [taskSearchKeyword, setTaskSearchKeyword] = useState('');
  const [loadingModalData, setLoadingModalData] = useState(false);
  const [taskForm, setTaskForm] = useState({
    taskCatalogId: '',
    code: '',
    name: '',
    unitId: '5',
    quantity: '10',
  });

  // Modal: Add Contract to Project
  const [showAddContractModal, setShowAddContractModal] = useState(false);
  const [submittingContract, setSubmittingContract] = useState(false);
  const [uploadingCtrPdf, setUploadingCtrPdf] = useState(false);
  const [ctrForm, setCtrForm] = useState({
    contractType: 'OWNER' as ContractCategory,
    partnerName: '',
    contractNo: '',
    contractName: '',
    signedDate: new Date().toISOString().slice(0, 10),
    contractValue: '',
    vatRate: '10',
    fileUrl: '',
    wordUrl: '',
    wordFileName: '',
  });

  // Modal: Add Document / Drawing to Project
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [submittingDoc, setSubmittingDoc] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docCategoryFilter, setDocCategoryFilter] = useState<DocumentFolderCategory>('ALL');
  const [docSearchTerm, setDocSearchTerm] = useState('');
  const [docForm, setDocForm] = useState({
    documentNo: '',
    title: '',
    documentType: 'Bản vẽ Kiến trúc',
  });

  // User list for BCH member assignment
  const [users, setUsers] = useState<User[]>([]);

  // Modal: Add Member to Ban Chỉ Huy
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [submittingMember, setSubmittingMember] = useState(false);
  const [memberForm, setMemberForm] = useState({
    userId: '',
    roleId: '6',
    joinedAt: new Date().toISOString().slice(0, 10),
  });

  // Quick Create User inline
  const [showQuickUserForm, setShowQuickUserForm] = useState(false);
  const [submittingQuickUser, setSubmittingQuickUser] = useState(false);
  const [quickUserForm, setQuickUserForm] = useState({
    fullName: '',
    username: '',
    password: '',
    phone: '',
    defaultRoleId: '6',
  });

  // Modal: Edit Project Details
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [submittingEditPrj, setSubmittingEditPrj] = useState(false);
  const [editProjectForm, setEditProjectForm] = useState({
    name: '',
    location: '',
    startDate: '',
    plannedEndDate: '',
    description: '',
    status: 'PREPARING',
    investorId: '',
  });

  const loadData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [p, itms, ctrs, mbrs, docs, unitsRes, invs, sups, usrs, normTasks] = await Promise.all([
        projectApi.getById(projectId),
        projectApi.getItems(projectId),
        adminApi.getContracts(projectId).catch(() => []),
        adminApi.getMembers(projectId).catch(() => []),
        adminApi.getDocuments(projectId).catch(() => []),
        catalogsApi.getUnits().catch(() => []),
        adminApi.getInvestors().catch(() => []),
        procurementApi.getSuppliers().catch(() => []),
        adminApi.getUsers().catch(() => []),
        catalogsApi.getNormTasks().catch(() => []),
      ]);
      setProject(p);
      setItems(itms);
      setContracts(ctrs);
      setMembers(mbrs);
      setDocuments(docs);
      setInvestors(invs);
      setSuppliers(sups);
      setUsers(usrs);
      setCatalogTasks(Array.isArray(normTasks) ? normTasks : []);
      if (Array.isArray(unitsRes)) {
        setUnitsList(unitsRes);
        const uMap: Record<number, string> = {};
        unitsRes.forEach((u: any) => {
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

  const handleQuickStatusChange = async (newStatus: string) => {
    if (!project || project.status === newStatus) return;
    try {
      await projectApi.update(project.id, { status: newStatus as any });
      setProject((prev) => (prev ? { ...prev, status: newStatus as any } : null));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái dự án');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !memberForm.userId) {
      alert('Vui lòng chọn nhân sự BMC!');
      return;
    }
    setSubmittingMember(true);
    try {
      await adminApi.addMember(projectId, {
        userId: Number(memberForm.userId),
        roleId: Number(memberForm.roleId) || 6,
        joinedAt: memberForm.joinedAt,
      });
      setShowMemberModal(false);
      setMemberForm({
        userId: '',
        roleId: '6',
        joinedAt: new Date().toISOString().slice(0, 10),
      });
      const mbrs = await adminApi.getMembers(projectId).catch(() => []);
      setMembers(mbrs);
      alert('Đã bổ nhiệm nhân sự vào Ban Chỉ Huy thành công!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi bổ nhiệm nhân sự');
    } finally {
      setSubmittingMember(false);
    }
  };

  const handleCreateQuickUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUserForm.username.trim() || !quickUserForm.password.trim() || !quickUserForm.fullName.trim()) {
      alert('Vui lòng điền đủ Họ tên, Tên đăng nhập và Mật khẩu');
      return;
    }
    if (quickUserForm.password.length < 6) {
      alert('Mật khẩu tối thiểu phải từ 6 ký tự trở lên');
      return;
    }
    setSubmittingQuickUser(true);
    try {
      const newUser = await adminApi.createUser({
        username: quickUserForm.username.trim(),
        password: quickUserForm.password,
        fullName: quickUserForm.fullName.trim(),
        phone: quickUserForm.phone.trim() || undefined,
        defaultRoleId: Number(quickUserForm.defaultRoleId) || 6,
        isActive: true,
      });
      alert(`Đã tạo tài khoản cán bộ "${quickUserForm.fullName}" thành công!`);
      const updatedUsers = await adminApi.getUsers().catch(() => []);
      setUsers(updatedUsers);
      setMemberForm((prev) => ({
        ...prev,
        userId: String(newUser.id || ''),
        roleId: quickUserForm.defaultRoleId,
      }));
      setShowQuickUserForm(false);
      setQuickUserForm({
        fullName: '',
        username: '',
        password: '',
        phone: '',
        defaultRoleId: '6',
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tạo tài khoản nhân sự');
    } finally {
      setSubmittingQuickUser(false);
    }
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !project) return;
    setSubmittingEditPrj(true);
    try {
      const updated = await projectApi.update(projectId, {
        name: editProjectForm.name.trim(),
        location: editProjectForm.location.trim() || undefined,
        startDate: editProjectForm.startDate || undefined,
        plannedEndDate: editProjectForm.plannedEndDate || undefined,
        description: editProjectForm.description.trim() || undefined,
        status: editProjectForm.status as any,
        investorId: editProjectForm.investorId ? Number(editProjectForm.investorId) : undefined,
      });
      setProject((prev) => (prev ? { ...prev, ...updated } : null));
      setShowEditProjectModal(false);
      alert('Đã cập nhật thông tin dự án thành công!');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật dự án');
    } finally {
      setSubmittingEditPrj(false);
    }
  };

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

  const handleOpenAddTaskModal = async (item: ProjectItem) => {
    setTargetItemForTask(item);
    setTaskMode('CATALOG');
    setTaskSearchKeyword('');
    setShowTaskModal(true);
    setLoadingModalData(true);

    let cats = catalogTasks;
    let uList = unitsList;

    try {
      if (!cats || cats.length === 0) {
        cats = await catalogsApi.getNormTasks().catch(() => []);
        setCatalogTasks(cats);
      }
      if (!uList || uList.length === 0) {
        uList = await catalogsApi.getUnits().catch(() => []);
        setUnitsList(uList);
      }
    } catch (e) {
      console.error('Error loading task catalog', e);
    } finally {
      setLoadingModalData(false);
    }

    const firstCat = cats && cats.length > 0 ? String(cats[0].id) : '';
    setTaskForm({
      taskCatalogId: firstCat,
      code: '',
      name: '',
      unitId: uList && uList.length > 0 ? String(uList[0].id) : '5',
      quantity: '10',
    });
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetItemForTask || !projectId) return;

    const qty = Number(taskForm.quantity);
    if (isNaN(qty) || qty <= 0) {
      alert('Vui lòng nhập khối lượng thiết kế lớn hơn 0!');
      return;
    }

    setSubmittingTask(true);
    try {
      if (taskMode === 'CATALOG') {
        if (!taskForm.taskCatalogId) {
          alert('Vui lòng chọn công tác từ danh mục!');
          setSubmittingTask(false);
          return;
        }
        const selectedCat = catalogTasks.find((c) => String(c.id) === String(taskForm.taskCatalogId));
        await projectApi.createTask(projectId, targetItemForTask.id, {
          taskCatalogId: Number(taskForm.taskCatalogId),
          normVersionId: selectedCat?.activeNormVersionId || undefined,
          quantity: qty,
        });
      } else {
        if (!taskForm.code.trim() || !taskForm.name.trim()) {
          alert('Vui lòng nhập đầy đủ Mã công tác và Tên công tác!');
          setSubmittingTask(false);
          return;
        }
        await projectApi.createTask(projectId, targetItemForTask.id, {
          code: taskForm.code.trim(),
          name: taskForm.name.trim(),
          unitId: Number(taskForm.unitId) || 5,
          quantity: qty,
        });
      }

      alert('Đã thêm công tác thi công thành công!');
      setShowTaskModal(false);

      // Refresh tasks for this item and make sure it is expanded
      const updatedTasks = await projectApi.getTasks(projectId, targetItemForTask.id);
      setItemTasks((prev) => ({ ...prev, [targetItemForTask.id]: updatedTasks }));
      setExpandedItems((prev) => ({ ...prev, [targetItemForTask.id]: true }));

      // Also reload project items in case count/progress changed
      const updatedItems = await projectApi.getItems(projectId);
      setItems(updatedItems);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tạo công tác');
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctrForm.contractNo.trim() || !ctrForm.contractName.trim()) {
      alert('Vui lòng nhập đầy đủ Số hợp đồng và Tên hợp đồng!');
      return;
    }
    setSubmittingContract(true);
    try {
      const descObj = JSON.stringify({
        contractType: ctrForm.contractType,
        partnerName: ctrForm.partnerName.trim() || undefined,
        wordUrl: ctrForm.wordUrl || undefined,
        fileName: ctrForm.wordFileName || undefined,
      });

      await adminApi.createContract({
        projectId,
        contractNo: ctrForm.contractNo.trim(),
        contractName: ctrForm.contractName.trim(),
        signedDate: ctrForm.signedDate || undefined,
        contractValue: Number(ctrForm.contractValue) || 0,
        vatRate: Number(ctrForm.vatRate) || 10,
        fileUrl: ctrForm.fileUrl || undefined,
        description: descObj,
      });

      alert('Đã thêm hợp đồng cho dự án thành công!');
      setShowAddContractModal(false);
      setCtrForm({
        contractType: 'OWNER',
        partnerName: '',
        contractNo: '',
        contractName: '',
        signedDate: new Date().toISOString().slice(0, 10),
        contractValue: '',
        vatRate: '10',
        fileUrl: '',
        wordUrl: '',
        wordFileName: '',
      });
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tạo hợp đồng');
    } finally {
      setSubmittingContract(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) {
      alert('Vui lòng chọn tệp bản vẽ hoặc hồ sơ đính kèm!');
      return;
    }
    if (!docForm.title.trim()) {
      alert('Vui lòng nhập tiêu đề bản vẽ / hồ sơ!');
      return;
    }
    setSubmittingDoc(true);
    try {
      const uploaded = await uploadApi.uploadFile(docFile);
      const docNo = docForm.documentNo.trim() || `BV-${Date.now().toString().slice(-4)}`;
      await adminApi.createDocument({
        projectId,
        title: docForm.title.trim(),
        documentType: docForm.documentType,
        documentNo: docNo,
        initialFileName: uploaded.fileName || docFile.name,
        initialFileUrl: uploaded.url,
        fileSize: uploaded.fileSize,
        mimeType: uploaded.mimeType,
      });

      alert('Đã tải lên và lưu trữ bản vẽ / hồ sơ công trình thành công!');
      setShowAddDocModal(false);
      setDocFile(null);
      setDocForm({
        documentNo: '',
        title: '',
        documentType: 'Bản vẽ Kiến trúc',
      });
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tải lên bản vẽ');
    } finally {
      setSubmittingDoc(false);
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--orange-primary)' }}>
                [{project.code}]
              </span>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
                {project.name}
              </h1>

              {/* Status Selector Dropdown */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <select
                  value={project.status}
                  onChange={(e) => handleQuickStatusChange(e.target.value)}
                  className="form-select form-select-sm"
                  style={{
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor:
                      project.status === 'IN_PROGRESS'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : project.status === 'PREPARING'
                        ? 'rgba(245, 158, 11, 0.15)'
                        : project.status === 'PAUSED'
                        ? 'rgba(234, 88, 12, 0.15)'
                        : project.status === 'COMPLETED'
                        ? 'rgba(37, 99, 235, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                    color:
                      project.status === 'IN_PROGRESS'
                        ? '#059669'
                        : project.status === 'PREPARING'
                        ? '#d97706'
                        : project.status === 'PAUSED'
                        ? '#ea580c'
                        : project.status === 'COMPLETED'
                        ? '#2563eb'
                        : '#dc2626',
                    border: `1px solid ${
                      project.status === 'IN_PROGRESS'
                        ? 'rgba(16, 185, 129, 0.4)'
                        : project.status === 'PREPARING'
                        ? 'rgba(245, 158, 11, 0.4)'
                        : project.status === 'PAUSED'
                        ? 'rgba(234, 88, 12, 0.4)'
                        : project.status === 'COMPLETED'
                        ? 'rgba(37, 99, 235, 0.4)'
                        : 'rgba(239, 68, 68, 0.4)'
                    }`,
                  }}
                  title="Nhấp để thay đổi trạng thái tiến độ dự án"
                >
                  <option value="PREPARING">🟡 Chuẩn bị</option>
                  <option value="IN_PROGRESS">🟢 Đang thi công</option>
                  <option value="PAUSED">🟠 Tạm dừng</option>
                  <option value="COMPLETED">🔵 Hoàn thành</option>
                  <option value="CANCELLED">🔴 Đã hủy</option>
                </select>
              </div>

              {/* Edit Project Button */}
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setEditProjectForm({
                    name: project.name,
                    location: project.location || '',
                    startDate: project.startDate ? project.startDate.slice(0, 10) : '',
                    plannedEndDate: project.plannedEndDate ? project.plannedEndDate.slice(0, 10) : (project.endDate ? project.endDate.slice(0, 10) : ''),
                    description: project.description || '',
                    status: project.status,
                    investorId: project.investorId ? String(project.investorId) : '',
                  });
                  setShowEditProjectModal(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.78rem',
                  padding: '4px 10px',
                  borderRadius: '6px',
                }}
                title="Chỉnh sửa thông tin, ngày tháng & phạm vi dự án"
              >
                <Edit3 size={13} /> Sửa Dự Án
              </button>
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
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => toggleExpandItem(it.id)}
                            >
                              {isExpanded ? 'Đóng' : 'Xem công tác'}
                            </button>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleOpenAddTaskModal(it)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', whiteSpace: 'nowrap' }}
                              title="Thêm công tác vào hạng mục này"
                            >
                              <Plus size={13} /> Thêm công tác
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Sub-table: Tasks */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px 24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                              <div>
                                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                                  Danh sách công tác thuộc hạng mục [{it.code}] {it.name}
                                </h4>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                  {tasks.length} công tác đã thiết lập
                                </span>
                              </div>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleOpenAddTaskModal(it)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}
                              >
                                <Plus size={14} /> + Thêm Công Tác Cho Hạng Mục
                              </button>
                            </div>

                            {isLoadingThis ? (
                              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                Đang tải công tác...
                              </div>
                            ) : tasks.length === 0 ? (
                              <div style={{ padding: '24px 16px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                                <p style={{ margin: '0 0 12px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                                  Chưa có công tác nào được lập cho hạng mục này.
                                </p>
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleOpenAddTaskModal(it)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                  <Plus size={14} /> + Thêm Công Tác Đầu Tiên
                                </button>
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
      {activeTab === 'contracts' && (() => {
        const ownerContracts = contracts.filter((c) => parseContractMeta(c).isRevenue);
        const costContracts = contracts.filter((c) => !parseContractMeta(c).isRevenue);
        const totalPrjRevenue = ownerContracts.reduce(
          (sum, c) => sum + (c.totalAdjustedValue || c.contractValue || 0),
          0
        );
        const totalPrjCost = costContracts.reduce(
          (sum, c) => sum + (c.totalAdjustedValue || c.contractValue || 0),
          0
        );
        const prjGrossProfit = totalPrjRevenue - totalPrjCost;
        const prjMargin = totalPrjRevenue > 0 ? (prjGrossProfit / totalPrjRevenue) * 100 : 0;

        return (
          <div className="card">
            <div className="card-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Hợp Đồng Dự Án & Các Phụ Lục Phát Sinh</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Tổng hợp tất cả các hợp đồng trực thuộc công trình: HĐ Doanh thu (Chủ đầu tư) & HĐ Chi phí (Thầu phụ, Cung ứng VLXD)
                </p>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const defaultNo = `HĐ-${project?.code || 'BMC'}-${contracts.length + 1}`;
                  setCtrForm({
                    contractType: 'OWNER',
                    partnerName: project?.investorName || '',
                    contractNo: defaultNo,
                    contractName: `Hợp đồng thi công dự án ${project?.name || ''}`,
                    signedDate: new Date().toISOString().slice(0, 10),
                    contractValue: '',
                    vatRate: '10',
                    fileUrl: '',
                    wordUrl: '',
                    wordFileName: '',
                  });
                  setShowAddContractModal(true);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> Thêm Hợp Đồng Mới
              </button>
            </div>

            {/* Financial Summary Dashboard */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  backgroundColor: 'rgba(37, 99, 235, 0.05)',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>
                  🏢 HĐ Chủ Đầu Tư (Doanh Thu)
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1d4ed8', marginTop: '4px' }}>
                  {formatCurrency(totalPrjRevenue)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {ownerContracts.length} Hợp đồng chính
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(234, 88, 12, 0.05)',
                  border: '1px solid rgba(234, 88, 12, 0.2)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>
                  🔨🚚 HĐ Thầu Phụ & Cung Ứng (Chi Phí)
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ea580c', marginTop: '4px' }}>
                  {formatCurrency(totalPrjCost)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {costContracts.length} Gói thầu phụ & vật tư
                </div>
              </div>

              <div
                style={{
                  backgroundColor: prjGrossProfit >= 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                  border: `1px solid ${prjGrossProfit >= 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                  borderRadius: '10px',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: prjGrossProfit >= 0 ? '#059669' : '#dc2626',
                      textTransform: 'uppercase',
                    }}
                  >
                    💰 Chênh Lệch Biên Lợi Nhuận
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: prjGrossProfit >= 0 ? '#059669' : '#dc2626',
                    }}
                  >
                    {prjMargin.toFixed(1)}%
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: prjGrossProfit >= 0 ? '#059669' : '#dc2626',
                    marginTop: '4px',
                  }}
                >
                  {prjGrossProfit >= 0 ? `+${formatCurrency(prjGrossProfit)}` : formatCurrency(prjGrossProfit)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Hiệu quả giao khoán dự án
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(147, 51, 234, 0.05)',
                  border: '1px solid rgba(147, 51, 234, 0.2)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7e22ce', textTransform: 'uppercase' }}>
                  📑 Tổng Hợp Đồng Dự Án
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#7e22ce', marginTop: '4px' }}>
                  {contracts.length} Hợp Đồng
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Đang theo dõi thực hiện
                </div>
              </div>
            </div>

            <div className="table-container">
              <table className="bmc-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '160px' }}>Số Hợp Đồng</th>
                    <th style={{ minWidth: '180px' }}>Phân Loại & Đối Tác</th>
                    <th>Tên Gói Thầu / Hạng Mục</th>
                    <th style={{ minWidth: '95px' }}>Ngày Ký</th>
                    <th style={{ minWidth: '130px' }}>Giá Trị Ban Đầu</th>
                    <th style={{ minWidth: '140px' }}>Sau Điều Chỉnh</th>
                    <th style={{ minWidth: '85px' }}>Số Phụ Lục</th>
                    <th style={{ minWidth: '90px' }}>Trạng Thái</th>
                    <th style={{ minWidth: '100px', textAlign: 'center' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c) => {
                    const meta = parseContractMeta(c);
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedContractId(c.id)}
                        style={{ cursor: 'pointer', transition: 'background-color 0.15s' }}
                        title="Nhấp vào để xem chi tiết hợp đồng, bản scan PDF và tệp Word"
                      >
                        <td style={{ fontWeight: 700, color: 'var(--blue-tech)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <FileText size={15} /> {c.contractNo}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 700,
                                fontSize: '0.72rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                width: 'fit-content',
                                backgroundColor:
                                  meta.contractType === 'OWNER'
                                    ? 'rgba(37, 99, 235, 0.1)'
                                    : meta.contractType === 'SUBCONTRACTOR'
                                    ? 'rgba(147, 51, 234, 0.1)'
                                    : meta.contractType === 'SUPPLIER'
                                    ? 'rgba(16, 185, 129, 0.1)'
                                    : 'rgba(100, 116, 139, 0.1)',
                                color:
                                  meta.contractType === 'OWNER'
                                    ? '#1d4ed8'
                                    : meta.contractType === 'SUBCONTRACTOR'
                                    ? '#7e22ce'
                                    : meta.contractType === 'SUPPLIER'
                                    ? '#047857'
                                    : '#334155',
                              }}
                            >
                              {meta.contractType === 'OWNER' ? '🏢 ' : meta.contractType === 'SUBCONTRACTOR' ? '🔨 ' : meta.contractType === 'SUPPLIER' ? '🚚 ' : '📐 '}
                              {meta.badgeText}
                            </span>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                              {meta.partnerName}
                            </div>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{c.contractName}</td>
                        <td>{formatDate(c.signedDate)}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{formatCurrency(c.contractValue)}</div>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: meta.isRevenue ? '#16a34a' : '#ea580c',
                            }}
                          >
                            {meta.isRevenue ? '(+ Doanh thu)' : '(- Chi phí)'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: meta.isRevenue ? 'var(--blue-tech)' : 'var(--orange-primary)' }}>
                          {formatCurrency(c.totalAdjustedValue || c.contractValue)}
                        </td>
                        <td>
                          <span className="badge badge-neutral" style={{ fontWeight: 600 }}>
                            {c.appendicesCount || 0} phụ lục
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-active">{c.status || 'ACTIVE'}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedContractId(c.id);
                            }}
                            title="Xem chi tiết & văn bản hợp đồng"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}
                          >
                            <Eye size={13} /> Xem
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {contracts.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        Chưa có hợp đồng nào được lưu trữ cho công trình này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Tab 3: Project Members */}
      {activeTab === 'members' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Ban Chỉ Huy Công Trường & Nhân Sự Dự Án</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Bổ nhiệm Chỉ huy trưởng, Kỹ sư giám sát hiện trường, Kỹ sư an toàn, KCS và Quản lý kho
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowMemberModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <UserPlus size={15} /> + Gán / Bổ Nhiệm Nhân Sự Mới
            </button>
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

      {/* Tab 4: Documents & Construction Project Document Hub */}
      {activeTab === 'documents' && (() => {
        // Filter by category and search
        const filteredDocs = documents.filter((d) => {
          const matchCat = docCategoryFilter === 'ALL' || getDocCategoryKey(d.documentType) === docCategoryFilter;
          const q = docSearchTerm.trim().toLowerCase();
          const matchSearch =
            !q ||
            d.documentNo.toLowerCase().includes(q) ||
            d.title.toLowerCase().includes(q) ||
            d.documentType.toLowerCase().includes(q);
          return matchCat && matchSearch;
        });

        // Category counts
        const countMap: Record<string, number> = {
          ALL: documents.length,
          LEGAL: documents.filter((d) => getDocCategoryKey(d.documentType) === 'LEGAL').length,
          DESIGN: documents.filter((d) => getDocCategoryKey(d.documentType) === 'DESIGN').length,
          CONTRACT: documents.filter((d) => getDocCategoryKey(d.documentType) === 'CONTRACT').length,
          QUALITY: documents.filter((d) => getDocCategoryKey(d.documentType) === 'QUALITY').length,
          ASBUILT: documents.filter((d) => getDocCategoryKey(d.documentType) === 'ASBUILT').length,
          SITE: documents.filter((d) => getDocCategoryKey(d.documentType) === 'SITE').length,
        };

        return (
          <div className="card">
            {/* Header */}
            <div className="card-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Kho Lưu Trữ & Phân Loại Hồ Sơ Công Trình</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Phân chia hồ sơ theo 6 nhóm chuyên đề chuẩn xây dựng: Pháp lý, Bản vẽ thiết kế, Hợp đồng, Nghiệm thu chất lượng, Hoàn công và Nhật ký
                </p>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setDocForm({
                    documentNo: `BV-${project?.code || 'BMC'}-${documents.length + 1}`,
                    title: '',
                    documentType: 'Bản vẽ Kiến trúc',
                  });
                  setDocFile(null);
                  setShowAddDocModal(true);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> Tải Lên Bản Vẽ / Hồ Sơ Mới
              </button>
            </div>

            {/* Construction Category Folder Pills */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                marginBottom: '18px',
              }}
            >
              {DOC_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = docCategoryFilter === cat.key;
                const count = countMap[cat.key] || 0;
                return (
                  <div
                    key={cat.key}
                    onClick={() => setDocCategoryFilter(cat.key as DocumentFolderCategory)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.08)' : '#f8fafc',
                      border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: isSelected ? '0 2px 6px rgba(37, 99, 235, 0.15)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          backgroundColor: isSelected ? '#2563eb' : cat.color + '18',
                          color: isSelected ? '#ffffff' : cat.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={15} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? 700 : 600, color: isSelected ? '#1d4ed8' : '#334155' }}>
                        {cat.label}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '1px 7px',
                        borderRadius: '10px',
                        backgroundColor: isSelected ? '#2563eb' : '#e2e8f0',
                        color: isSelected ? '#ffffff' : '#64748b',
                      }}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Search and Table Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', maxWidth: '380px', flex: 1 }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input form-input-sm"
                  placeholder="Tìm theo mã hiệu, tên bản vẽ hoặc loại hồ sơ..."
                  value={docSearchTerm}
                  onChange={(e) => setDocSearchTerm(e.target.value)}
                  style={{ paddingLeft: '32px' }}
                />
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Hiển thị: <strong style={{ color: 'var(--blue-tech)' }}>{filteredDocs.length}</strong> / {documents.length} hồ sơ công trình
              </div>
            </div>

            <div className="table-container">
              <table className="bmc-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '130px' }}>Mã Hồ Sơ</th>
                    <th style={{ minWidth: '160px' }}>Phân Nhóm & Thư Mục</th>
                    <th>Tiêu Đề Bản Vẽ / Hồ Sơ</th>
                    <th style={{ minWidth: '85px' }}>Phiên Bản</th>
                    <th style={{ minWidth: '130px' }}>Định Dạng Tệp</th>
                    <th style={{ minWidth: '110px' }}>Cập Nhật</th>
                    <th style={{ minWidth: '95px' }}>Trạng Thái</th>
                    <th style={{ minWidth: '130px', textAlign: 'center' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map((d) => {
                    const fileUrl = d.fileUrl || d.latestVersion?.fileUrl;
                    const fileName = d.latestVersion?.fileName || '';
                    const badge = getFileFormatBadge(fileUrl, fileName);

                    return (
                      <tr
                        key={d.id}
                        style={{ cursor: fileUrl ? 'pointer' : 'default', transition: 'background-color 0.15s' }}
                        onClick={() => {
                          if (!fileUrl) return;
                          if (badge.canPreview) {
                            openDocViewer(fileUrl, `[${d.documentNo}] ${d.title}`, fileName);
                          } else {
                            window.open(fileUrl, '_blank');
                          }
                        }}
                        title={badge.canPreview ? 'Nhấp để xem trực tiếp trên web' : 'Nhấp để tải tệp về máy tính'}
                      >
                        <td style={{ fontWeight: 700, color: 'var(--blue-tech)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <FolderOpen size={14} style={{ color: 'var(--blue-tech)' }} />
                            {d.documentNo}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(37, 99, 235, 0.08)',
                              color: '#1d4ed8',
                              border: '1px solid rgba(37, 99, 235, 0.2)',
                            }}
                          >
                            {d.documentType}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ color: 'var(--text-main)' }}>{d.title}</div>
                          {fileName && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Tệp: {fileName}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-active" style={{ fontSize: '0.75rem' }}>
                            v{d.currentVersionNo || 1}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td>{formatDate(d.updatedAt)}</td>
                        <td>
                          <span className="badge badge-approved" style={{ fontSize: '0.75rem' }}>
                            {d.status || 'APPROVED'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          {fileUrl ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              {badge.canPreview ? (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => openDocViewer(fileUrl, `[${d.documentNo}] ${d.title}`, fileName)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontSize: '0.75rem',
                                    padding: '4px 9px',
                                    color: badge.color,
                                    borderColor: badge.border,
                                    backgroundColor: badge.bg,
                                    fontWeight: 600,
                                  }}
                                  title={badge.isWord ? 'Xem trực tiếp tài liệu Word trên trình duyệt' : badge.isPdf ? 'Xem trực tiếp bản vẽ PDF' : 'Xem trực tiếp hình ảnh'}
                                >
                                  <Eye size={13} /> {badge.isWord ? 'Xem Word' : badge.isPdf ? 'Xem PDF' : 'Xem Ảnh'}
                                </button>
                              ) : null}
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                download={fileName || true}
                                className="btn btn-secondary btn-sm"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.75rem',
                                  padding: '4px 8px',
                                  textDecoration: 'none',
                                }}
                                title="Tải tệp về máy tính"
                              >
                                <Download size={13} /> {badge.canPreview ? '' : 'Tải Về'}
                              </a>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chưa có file</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredDocs.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        {documents.length === 0
                          ? 'Chưa có tài liệu hoặc bản vẽ nào được lưu trữ cho công trình này. Bấm "Tải Lên Bản Vẽ / Hồ Sơ Mới" để bắt đầu.'
                          : 'Không tìm thấy hồ sơ nào trong thư mục này phù hợp với từ khóa tìm kiếm.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

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

      {/* ===== MODAL: Thêm Công Tác Cho Hạng Mục ===== */}
      {showTaskModal && targetItemForTask && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div className="card" style={{ width: '640px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Thêm Công Tác Thi Công Mới</h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Hạng mục: <strong style={{ color: 'var(--orange-primary)' }}>[{targetItemForTask.code}] {targetItemForTask.name}</strong>
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowTaskModal(false)}>
                <X size={16} />
              </button>
            </div>

            {/* Switch Mode: Catalog vs Custom */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <button
                type="button"
                className={`btn btn-sm ${taskMode === 'CATALOG' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTaskMode('CATALOG')}
                style={{ flex: 1 }}
              >
                📚 Chọn Từ Thư Viện Định Mức BMC
              </button>
              <button
                type="button"
                className={`btn btn-sm ${taskMode === 'CUSTOM' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTaskMode('CUSTOM')}
                style={{ flex: 1 }}
              >
                ✏️ Tự Nhập Công Tác Mới
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              {taskMode === 'CATALOG' ? (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ position: 'relative' }}>
                      <Search
                        size={15}
                        style={{
                          position: 'absolute',
                          left: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-muted)',
                        }}
                      />
                      <input
                        type="text"
                        className="form-input form-input-sm"
                        placeholder="Tìm kiếm nhanh công tác (VD: đào, bê tông, móng, cọc...)"
                        value={taskSearchKeyword}
                        onChange={(e) => setTaskSearchKeyword(e.target.value)}
                        style={{ paddingLeft: '32px' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="form-label" style={{ margin: 0 }}>Chọn Công Tác Định Mức Chuẩn *</label>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {loadingModalData
                          ? 'Đang tải dữ liệu...'
                          : `${catalogTasks.filter((c) => !taskSearchKeyword || (c.name + ' ' + c.code).toLowerCase().includes(taskSearchKeyword.toLowerCase())).length} công tác`}
                      </span>
                    </div>
                    <select
                      className="form-select"
                      value={taskForm.taskCatalogId}
                      onChange={(e) => setTaskForm({ ...taskForm, taskCatalogId: e.target.value })}
                      required
                    >
                      <option value="">-- Chọn công tác trong thư viện định mức --</option>
                      {catalogTasks
                        .filter((cat) => {
                          if (!taskSearchKeyword.trim()) return true;
                          const kw = taskSearchKeyword.toLowerCase();
                          return (
                            (cat.code && cat.code.toLowerCase().includes(kw)) ||
                            (cat.name && cat.name.toLowerCase().includes(kw))
                          );
                        })
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            [{cat.code}] {cat.name} ({cat.unitSymbol || cat.unitName})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Selected Task Details preview */}
                  {(() => {
                    const sel = catalogTasks.find((c) => String(c.id) === String(taskForm.taskCatalogId));
                    if (!sel) return null;
                    return (
                      <div
                        style={{
                          backgroundColor: 'rgba(37, 99, 235, 0.05)',
                          border: '1px solid rgba(37, 99, 235, 0.2)',
                          borderRadius: '8px',
                          padding: '12px',
                          marginBottom: '16px',
                          fontSize: '0.85rem',
                        }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>Mã hiệu: <strong style={{ color: 'var(--blue-tech)' }}>{sel.code}</strong></div>
                          <div>Đơn vị tính: <strong>{sel.unitSymbol || sel.unitName}</strong></div>
                          <div>Nhóm công tác: <strong>{sel.taskGroupName || 'Công tác chung'}</strong></div>
                          <div>Định mức cơ sở: <strong>{sel.normBaseQuantity}</strong></div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="form-group">
                    <label className="form-label">Khối Lượng Thiết Kế *</label>
                    <input
                      type="number"
                      step="any"
                      min="0.0001"
                      className="form-input"
                      value={taskForm.quantity}
                      onChange={(e) => setTaskForm({ ...taskForm, quantity: e.target.value })}
                      placeholder="Nhập khối lượng thiết kế..."
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Mã Hiệu Công Tác *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="VD: CT.01, AF.22"
                        value={taskForm.code}
                        onChange={(e) => setTaskForm({ ...taskForm, code: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tên Công Tác Xây Dựng *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="VD: Gia công lắp dựng xà gồ thép..."
                        value={taskForm.name}
                        onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Đơn Vị Tính (ĐVT) *</label>
                      <select
                        className="form-select"
                        value={taskForm.unitId}
                        onChange={(e) => setTaskForm({ ...taskForm, unitId: e.target.value })}
                        required
                      >
                        {unitsList.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.symbol || u.code} ({u.name})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Khối Lượng Thiết Kế *</label>
                      <input
                        type="number"
                        step="any"
                        min="0.0001"
                        className="form-input"
                        value={taskForm.quantity}
                        onChange={(e) => setTaskForm({ ...taskForm, quantity: e.target.value })}
                        placeholder="VD: 50"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingTask}>
                  {submittingTask ? 'Đang thêm...' : 'Lưu Công Tác'}
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

      {/* In-App Document Viewer Modal */}
      <PdfViewerModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        title={pdfModalTitle}
        fileUrl={pdfModalUrl}
        fileName={pdfModalFileName}
      />

      {/* Contract Detail Modal */}
      {selectedContractId !== null && (
        <ContractDetailModal
          contractId={selectedContractId}
          onClose={() => setSelectedContractId(null)}
          onUpdated={loadData}
        />
      )}

      {/* ===== MODAL: Thêm Hợp Đồng Mới Cho Dự Án ===== */}
      {showAddContractModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '820px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Thêm Hợp Đồng Mới Cho Công Trình</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Gán hợp đồng mới vào dự án <strong>[{project?.code}] {project?.name}</strong>
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddContractModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateContract}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Loại Hợp Đồng *</label>
                  <select
                    className="form-select"
                    value={ctrForm.contractType}
                    onChange={(e) => {
                      const newType = e.target.value as ContractCategory;
                      let suggestedNo = ctrForm.contractNo;
                      if (!suggestedNo || suggestedNo.startsWith('HĐ')) {
                        if (newType === 'OWNER') suggestedNo = `HĐ-${project?.code || 'BMC'}-CĐT`;
                        else if (newType === 'SUBCONTRACTOR') suggestedNo = `HĐTP-${project?.code || 'BMC'}-${contracts.length + 1}`;
                        else if (newType === 'SUPPLIER') suggestedNo = `HĐCU-${project?.code || 'BMC'}-${contracts.length + 1}`;
                        else suggestedNo = `HĐTV-${project?.code || 'BMC'}-${contracts.length + 1}`;
                      }
                      setCtrForm({
                        ...ctrForm,
                        contractType: newType,
                        contractNo: suggestedNo,
                      });
                    }}
                    required
                  >
                    <option value="OWNER">🏢 HĐ Chủ Đầu Tư (Doanh Thu)</option>
                    <option value="SUBCONTRACTOR">🔨 HĐ Giao Thầu Phụ (Chi Phí)</option>
                    <option value="SUPPLIER">🚚 HĐ Cung Ứng Vật Tư & TB (Chi Phí)</option>
                    <option value="CONSULTING">📐 HĐ Tư Vấn & Dịch Vụ</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Đối Tác Ký Kết *</label>
                  {ctrForm.contractType === 'OWNER' ? (
                    <div>
                      <input
                        type="text"
                        className="form-input"
                        list="prj-investor-list"
                        value={ctrForm.partnerName}
                        onChange={(e) => setCtrForm({ ...ctrForm, partnerName: e.target.value })}
                        placeholder="Chọn hoặc nhập tên Chủ Đầu Tư..."
                        required
                      />
                      <datalist id="prj-investor-list">
                        {investors.map((inv) => (
                          <option key={inv.id} value={inv.name}>
                            {inv.code} - {inv.name}
                          </option>
                        ))}
                      </datalist>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        className="form-input"
                        list="prj-supplier-list"
                        value={ctrForm.partnerName}
                        onChange={(e) => setCtrForm({ ...ctrForm, partnerName: e.target.value })}
                        placeholder="Chọn hoặc nhập tên Thầu Phụ / Nhà Cung Cấp..."
                        required
                      />
                      <datalist id="prj-supplier-list">
                        {suppliers.map((sup) => (
                          <option key={sup.id} value={sup.name}>
                            [{sup.code}] {sup.name}
                          </option>
                        ))}
                      </datalist>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Số Hợp Đồng *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={ctrForm.contractNo}
                    onChange={(e) => setCtrForm({ ...ctrForm, contractNo: e.target.value })}
                    placeholder="VD: HĐ-2024/01/BMC"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tên Hợp Đồng / Gói Thầu *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={ctrForm.contractName}
                    onChange={(e) => setCtrForm({ ...ctrForm, contractName: e.target.value })}
                    placeholder="VD: Cung cấp bê tông thương phẩm M250, M300"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Ngày Ký</label>
                  <input
                    type="date"
                    className="form-input"
                    value={ctrForm.signedDate}
                    onChange={(e) => setCtrForm({ ...ctrForm, signedDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Giá Trị Gốc (VNĐ) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={ctrForm.contractValue}
                    onChange={(e) => setCtrForm({ ...ctrForm, contractValue: e.target.value })}
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Thuế VAT (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={ctrForm.vatRate}
                    onChange={(e) => setCtrForm({ ...ctrForm, vatRate: e.target.value })}
                    placeholder="10"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* Upload signed scan PDF */}
              <div className="form-group">
                <label className="form-label">Tệp Scan PDF Hợp Đồng (Ký & Đóng Dấu Đỏ)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="form-input"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingCtrPdf(true);
                      try {
                        const res = await uploadApi.uploadFile(file);
                        setCtrForm((prev) => ({ ...prev, fileUrl: res.url }));
                        alert('Đã tải lên tệp PDF scan hợp đồng thành công!');
                      } catch (err: any) {
                        alert(err.response?.data?.message || 'Lỗi khi tải lên tệp PDF');
                      } finally {
                        setUploadingCtrPdf(false);
                      }
                    }}
                  />
                  {ctrForm.fileUrl && (
                    <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      ✓ Đã đính kèm PDF
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddContractModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingContract || uploadingCtrPdf}>
                  {submittingContract ? 'Đang lưu...' : 'Lưu Hợp Đồng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: Tải Lên Hồ Sơ / Bản Vẽ Mới ===== */}
      {showAddDocModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '560px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Tải Lên Hồ Sơ / Bản Vẽ Thiết Kế</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Lưu trữ cho công trình <strong>[{project?.code}] {project?.name}</strong>
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddDocModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateDocument}>
              <div className="form-group">
                <label className="form-label">Loại Bản Vẽ / Tài Liệu *</label>
                <select
                  className="form-select"
                  value={docForm.documentType}
                  onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value })}
                  required
                >
                  <option value="Bản vẽ Kiến trúc">📐 Bản vẽ Kiến trúc (Architectural)</option>
                  <option value="Bản vẽ Kết cấu">🏗️ Bản vẽ Kết cấu (Structural)</option>
                  <option value="Bản vẽ Cơ điện MEP">⚡ Bản vẽ Cơ điện MEP</option>
                  <option value="Bản vẽ Hoàn công">📑 Bản vẽ Hoàn công (As-Built)</option>
                  <option value="Biên bản Nghiệm thu">✅ Biên bản Nghiệm thu (Inspection)</option>
                  <option value="Hồ sơ Pháp lý">⚖️ Hồ sơ Pháp lý & Cấp phép</option>
                  <option value="Hồ sơ Dự thầu">💼 Hồ sơ Dự thầu (Bidding)</option>
                  <option value="Nhật ký Thi công">📖 Nhật ký Thi công Hiện trường</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Mã Bản Vẽ / Số Hiệu Hồ Sơ *</label>
                <input
                  type="text"
                  className="form-input"
                  value={docForm.documentNo}
                  onChange={(e) => setDocForm({ ...docForm, documentNo: e.target.value })}
                  placeholder="VD: BV-KT-01, BV-KC-02..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tiêu Đề Bản Vẽ / Tên Hồ Sơ *</label>
                <input
                  type="text"
                  className="form-input"
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                  placeholder="VD: Bản vẽ thiết kế mặt bằng kết cấu móng trục 1-5"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tệp Đính Kèm (PDF, DWG, Ảnh, ZIP...) *</label>
                <input
                  type="file"
                  className="form-input"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  required
                />
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Hỗ trợ định dạng PDF, tệp CAD, hình ảnh hiện trường hoặc tệp nén nộp hồ sơ
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddDocModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingDoc}>
                  {submittingDoc ? 'Đang tải lên...' : 'Lưu Hồ Sơ / Bản Vẽ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: Bổ Nhiệm / Gán Nhân Sự Ban Chỉ Huy ===== */}
      {showMemberModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '620px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Bổ Nhiệm Nhân Sự Ban Chỉ Huy Công Trường</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Gán nhân sự vào công trình <strong>[{project?.code}] {project?.name}</strong>
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowMemberModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddMember}>
              {/* Quick Add User Toggle & Card */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ margin: 0 }}>Cán Bộ / Nhân Sự BMC Được Gán *</label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: '0.78rem',
                    padding: '3px 10px',
                    color: 'var(--orange-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    borderColor: 'rgba(234, 88, 12, 0.4)',
                    backgroundColor: showQuickUserForm ? 'rgba(234, 88, 12, 0.08)' : undefined,
                  }}
                  onClick={() => setShowQuickUserForm(!showQuickUserForm)}
                >
                  <UserPlus size={13} />
                  {showQuickUserForm ? 'Đóng form tạo nhanh' : '+ Tạo tài khoản mới ngay'}
                </button>
              </div>

              {/* Form Quick Add User */}
              {showQuickUserForm && (
                <div
                  style={{
                    backgroundColor: 'rgba(234, 88, 12, 0.04)',
                    border: '1px solid rgba(234, 88, 12, 0.3)',
                    borderRadius: '8px',
                    padding: '14px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--orange-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserCog size={16} /> Thêm nhanh cán bộ / nhân sự mới vào hệ thống BMC
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Họ và tên *</label>
                      <input
                        type="text"
                        className="form-input form-input-sm"
                        placeholder="VD: Trần Văn Nam"
                        value={quickUserForm.fullName}
                        onChange={(e) => setQuickUserForm({ ...quickUserForm, fullName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Tên đăng nhập (Username) *</label>
                      <input
                        type="text"
                        className="form-input form-input-sm"
                        placeholder="VD: nam.chihuy"
                        value={quickUserForm.username}
                        onChange={(e) => setQuickUserForm({ ...quickUserForm, username: e.target.value })}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Mật khẩu (tối thiểu 6 ký tự) *</label>
                      <input
                        type="password"
                        className="form-input form-input-sm"
                        placeholder="Mật khẩu khởi tạo"
                        value={quickUserForm.password}
                        onChange={(e) => setQuickUserForm({ ...quickUserForm, password: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Số điện thoại</label>
                      <input
                        type="text"
                        className="form-input form-input-sm"
                        placeholder="0912..."
                        value={quickUserForm.phone}
                        onChange={(e) => setQuickUserForm({ ...quickUserForm, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowQuickUserForm(false)}
                      style={{ fontSize: '0.78rem' }}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleCreateQuickUser}
                      disabled={submittingQuickUser}
                      style={{ fontSize: '0.78rem' }}
                    >
                      {submittingQuickUser ? 'Đang tạo...' : 'Tạo Tài Khoản & Gán Luôn'}
                    </button>
                  </div>
                </div>
              )}

              <div className="form-group">
                <select
                  className="form-select"
                  value={memberForm.userId}
                  onChange={(e) => setMemberForm({ ...memberForm, userId: e.target.value })}
                  required
                >
                  <option value="">-- Chọn nhân sự BMC --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.username} - {u.roleName || 'Cán bộ kỹ thuật'})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Chức Danh Ban Chỉ Huy *</label>
                  <select
                    className="form-select"
                    value={memberForm.roleId}
                    onChange={(e) => setMemberForm({ ...memberForm, roleId: e.target.value })}
                    required
                  >
                    <option value="6">👷 Chỉ huy trưởng (Site Manager)</option>
                    <option value="7">👷 Kỹ sư hiện trường / Giám sát</option>
                    <option value="5">📊 Kỹ sư dự toán (QS)</option>
                    <option value="4">💰 Kế toán công trình</option>
                    <option value="8">📦 Quản lý kho / Vật tư</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Ngày Nhận Nhiệm Vụ *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={memberForm.joinedAt}
                    onChange={(e) => setMemberForm({ ...memberForm, joinedAt: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingMember}>
                  {submittingMember ? 'Đang lưu...' : 'Lưu Bổ Nhiệm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: Chỉnh Sửa Thông Tin Dự Án ===== */}
      {showEditProjectModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '680px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Chỉnh Sửa Thông Tin Dự Án</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Mã dự án: <strong>[{project?.code}]</strong>
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowEditProjectModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleEditProject}>
              <div className="form-group">
                <label className="form-label">Tên Công Trình / Dự Án *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editProjectForm.name}
                  onChange={(e) => setEditProjectForm({ ...editProjectForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Trạng Thái Dự Án *</label>
                  <select
                    className="form-select"
                    value={editProjectForm.status}
                    onChange={(e) => setEditProjectForm({ ...editProjectForm, status: e.target.value })}
                    required
                  >
                    <option value="PREPARING">🟡 Chuẩn bị</option>
                    <option value="IN_PROGRESS">🟢 Đang thi công</option>
                    <option value="PAUSED">🟠 Tạm dừng</option>
                    <option value="COMPLETED">🔵 Hoàn thành</option>
                    <option value="CANCELLED">🔴 Đã hủy</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Chủ Đầu Tư</label>
                  <select
                    className="form-select"
                    value={editProjectForm.investorId}
                    onChange={(e) => setEditProjectForm({ ...editProjectForm, investorId: e.target.value })}
                  >
                    <option value="">-- Nội bộ BMC / Chưa chọn --</option>
                    {investors.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.code} - {inv.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Địa Điểm Thi Công</label>
                <input
                  type="text"
                  className="form-input"
                  value={editProjectForm.location}
                  onChange={(e) => setEditProjectForm({ ...editProjectForm, location: e.target.value })}
                  placeholder="VD: Khu đô thị Chánh Mỹ, TP. Thủ Dầu Một, Bình Dương"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Ngày Khởi Công</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editProjectForm.startDate}
                    onChange={(e) => setEditProjectForm({ ...editProjectForm, startDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ngày Hoàn Thành Kế Hoạch</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editProjectForm.plannedEndDate}
                    onChange={(e) => setEditProjectForm({ ...editProjectForm, plannedEndDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mô Tả / Phạm Vi Công Việc</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={editProjectForm.description}
                  onChange={(e) => setEditProjectForm({ ...editProjectForm, description: e.target.value })}
                  placeholder="Ghi chú về quy mô, gói thầu, tính chất công trình..."
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditProjectModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingEditPrj}>
                  {submittingEditPrj ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
