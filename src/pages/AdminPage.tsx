import React, { useEffect, useState } from 'react';
import { adminApi, projectApi, procurementApi, uploadApi } from '../api';
import { Investor, Contract, Project, ProjectMember, Supplier } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  Building2,
  FileText,
  Users,
  Handshake,
  Plus,
  X,
  Search,
  Eye,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  UserCheck,
  Layers,
  Sparkles,
  UploadCloud,
  FileCheck,
  Download,
  FileEdit,
  UserCog,
  UserPlus,
  Lock,
  Unlock,
} from 'lucide-react';
import { InvestorDetailModal } from '../components/admin/InvestorDetailModal';
import { ContractDetailModal } from '../components/admin/ContractDetailModal';
import { PdfViewerModal } from '../components/common/PdfViewerModal';
import { exportContractToWord } from '../utils/wordExport';
import { parseContractMeta, ContractCategory } from '../utils/contractHelper';

export const AdminPage: React.FC = () => {
  const [tab, setTab] = useState<'investors' | 'contracts' | 'members' | 'partners' | 'users'>('investors');
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal: Create User / Employee
  const [showUserModal, setShowUserModal] = useState(false);
  const [submittingUser, setSubmittingUser] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    defaultRoleId: '6',
  });

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [contractProjectFilter, setContractProjectFilter] = useState<string>('ALL');
  const [contractTypeFilter, setContractTypeFilter] = useState<'ALL' | ContractCategory>('ALL');

  // Selected project for Ban Chỉ Huy tab
  const [bchProjectId, setBchProjectId] = useState<number | null>(null);
  const [bchMembers, setBchMembers] = useState<ProjectMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Modals for detail views
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
  const [pdfModal, setPdfModal] = useState<{ isOpen: boolean; title: string; url: string }>({
    isOpen: false,
    title: '',
    url: '',
  });

  // Modal: Create Investor
  const [showInvModal, setShowInvModal] = useState(false);
  const [invForm, setInvForm] = useState({
    code: '',
    name: '',
    taxCode: '',
    representative: '',
    phone: '',
    email: '',
    address: '',
  });

  // Modal: Create Contract
  const [showCtrModal, setShowCtrModal] = useState(false);
  const [uploadingCtrPdf, setUploadingCtrPdf] = useState(false);
  const [uploadingCtrWord, setUploadingCtrWord] = useState(false);
  const [ctrForm, setCtrForm] = useState({
    projectId: '',
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

  // Modal: Add Member to Ban Chỉ Huy
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberForm, setMemberForm] = useState({
    userId: '',
    roleId: '6',
    joinedAt: new Date().toISOString().slice(0, 10),
  });

  // Modal: Create Supplier / Partner
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    code: '',
    name: '',
    taxCode: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invs, ctrs, prjs, sups, usrs] = await Promise.all([
        adminApi.getInvestors().catch(() => []),
        adminApi.getContracts().catch(() => []),
        projectApi.getAll().catch(() => []),
        procurementApi.getSuppliers().catch(() => []),
        adminApi.getUsers().catch(() => []),
      ]);
      setInvestors(invs);
      setContracts(ctrs);
      setProjects(prjs);
      setSuppliers(sups);
      setUsers(usrs);

      if (prjs.length > 0) {
        if (!ctrForm.projectId) {
          setCtrForm((prev) => ({ ...prev, projectId: String(prjs[0].id) }));
        }
        if (!bchProjectId) {
          const activePrj = prjs.find((p) => p.status === 'IN_PROGRESS') || prjs[0];
          setBchProjectId(activePrj.id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadBchMembers = async (pId: number) => {
    setLoadingMembers(true);
    try {
      const members = await adminApi.getMembers(pId);
      setBchMembers(members);
    } catch (err) {
      console.error('Failed to load project members:', err);
      setBchMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (bchProjectId) {
      loadBchMembers(bchProjectId);
    }
  }, [bchProjectId]);

  const handleCreateInvestor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminApi.createInvestor({
        code: invForm.code.trim(),
        name: invForm.name.trim(),
        taxCode: invForm.taxCode.trim() || undefined,
        representative: invForm.representative.trim() || undefined,
        phone: invForm.phone.trim() || undefined,
        email: invForm.email.trim() || undefined,
        address: invForm.address.trim() || undefined,
      });
      setShowInvModal(false);
      setInvForm({ code: '', name: '', taxCode: '', representative: '', phone: '', email: '', address: '' });
      alert('Thêm chủ đầu tư thành công!');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi thêm chủ đầu tư');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctrForm.projectId) {
      alert('Vui lòng chọn dự án!');
      return;
    }
    setSubmitting(true);
    try {
      const descObj = JSON.stringify({
        contractType: ctrForm.contractType,
        partnerName: ctrForm.partnerName.trim() || undefined,
        wordUrl: ctrForm.wordUrl || undefined,
        fileName: ctrForm.wordFileName || undefined,
      });

      await adminApi.createContract({
        projectId: Number(ctrForm.projectId),
        contractNo: ctrForm.contractNo.trim(),
        contractName: ctrForm.contractName.trim(),
        signedDate: ctrForm.signedDate || undefined,
        contractValue: Number(ctrForm.contractValue) || 0,
        vatRate: Number(ctrForm.vatRate) || 10,
        fileUrl: ctrForm.fileUrl || undefined,
        description: descObj,
      });
      setShowCtrModal(false);
      setCtrForm({
        projectId: projects.length > 0 ? String(projects[0].id) : '',
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
      alert('Thêm hợp đồng thi công thành công!');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi thêm hợp đồng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bchProjectId || !memberForm.userId) {
      alert('Vui lòng chọn nhân sự!');
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.addMember(bchProjectId, {
        userId: Number(memberForm.userId),
        roleId: Number(memberForm.roleId) || 6,
        joinedAt: memberForm.joinedAt,
      });
      setShowMemberModal(false);
      alert('Đã bổ nhiệm nhân sự vào Ban Chỉ Huy thành công!');
      loadBchMembers(bchProjectId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi bổ nhiệm nhân sự');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await procurementApi.createSupplier({
        code: supplierForm.code.trim(),
        name: supplierForm.name.trim(),
        taxCode: supplierForm.taxCode.trim() || undefined,
        contactPerson: supplierForm.contactPerson.trim() || undefined,
        phone: supplierForm.phone.trim() || undefined,
        email: supplierForm.email.trim() || undefined,
        address: supplierForm.address.trim() || undefined,
      });
      setShowSupplierModal(false);
      setSupplierForm({ code: '', name: '', taxCode: '', contactPerson: '', phone: '', email: '', address: '' });
      alert('Thêm đối tác / nhà cung cấp thành công!');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi thêm đối tác');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username.trim() || !userForm.password.trim() || !userForm.fullName.trim()) {
      alert('Vui lòng điền đầy đủ Tên đăng nhập, Mật khẩu và Họ tên!');
      return;
    }
    setSubmittingUser(true);
    try {
      await adminApi.createUser({
        username: userForm.username.trim(),
        password: userForm.password.trim(),
        fullName: userForm.fullName.trim(),
        email: userForm.email.trim() || undefined,
        phone: userForm.phone.trim() || undefined,
        defaultRoleId: Number(userForm.defaultRoleId) || 6,
        isActive: true,
      });
      setShowUserModal(false);
      setUserForm({
        username: '',
        password: '',
        fullName: '',
        email: '',
        phone: '',
        defaultRoleId: '6',
      });
      alert('Đã tạo tài khoản cán bộ nhân sự BMC thành công!');
      const usrs = await adminApi.getUsers();
      setUsers(usrs);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tạo tài khoản nhân viên');
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleToggleUser = async (userId: number) => {
    try {
      await adminApi.toggleUserStatus(userId);
      const usrs = await adminApi.getUsers();
      setUsers(usrs);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái tài khoản');
    }
  };

  // Calculations for overview KPI
  const totalContractValue = contracts.reduce(
    (sum, c) => sum + (c.totalAdjustedValue || c.contractValue || 0),
    0
  );

  // Filtered lists
  const filteredInvestors = investors.filter((inv) => {
    const q = searchTerm.toLowerCase();
    return (
      inv.name.toLowerCase().includes(q) ||
      inv.code.toLowerCase().includes(q) ||
      (inv.taxCode && inv.taxCode.toLowerCase().includes(q)) ||
      (inv.representative && inv.representative.toLowerCase().includes(q))
    );
  });

  const projectScopeContracts = contracts.filter((c) =>
    contractProjectFilter === 'ALL' ? true : String(c.projectId) === contractProjectFilter
  );

  const filteredContracts = projectScopeContracts.filter((c) => {
    const q = searchTerm.toLowerCase();
    const meta = parseContractMeta(c);
    const matchSearch =
      c.contractNo.toLowerCase().includes(q) ||
      c.contractName.toLowerCase().includes(q) ||
      (c.projectName && c.projectName.toLowerCase().includes(q)) ||
      (meta.partnerName && meta.partnerName.toLowerCase().includes(q));
    const matchType =
      contractTypeFilter === 'ALL' || meta.contractType === contractTypeFilter;
    return matchSearch && matchType;
  });

  const ownerScopeContracts = projectScopeContracts.filter(
    (c) => parseContractMeta(c).isRevenue
  );
  const costScopeContracts = projectScopeContracts.filter(
    (c) => !parseContractMeta(c).isRevenue
  );

  const totalRevenue = ownerScopeContracts.reduce(
    (sum, c) => sum + (c.totalAdjustedValue || c.contractValue || 0),
    0
  );
  const totalCost = costScopeContracts.reduce(
    (sum, c) => sum + (c.totalAdjustedValue || c.contractValue || 0),
    0
  );
  const grossProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const countAll = projectScopeContracts.length;
  const countOwner = projectScopeContracts.filter((c) => parseContractMeta(c).contractType === 'OWNER').length;
  const countSub = projectScopeContracts.filter((c) => parseContractMeta(c).contractType === 'SUBCONTRACTOR').length;
  const countSupplier = projectScopeContracts.filter((c) => parseContractMeta(c).contractType === 'SUPPLIER').length;
  const countConsulting = projectScopeContracts.filter((c) => parseContractMeta(c).contractType === 'CONSULTING').length;

  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
      (s.address && s.address.toLowerCase().includes(q))
    );
  });

  const currentProject = projects.find((p) => p.id === bchProjectId);

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* ===== EXECUTIVE KPI CARDS ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {/* Card 1: Chủ Đầu Tư */}
        <div
          className="card"
          style={{
            padding: '20px',
            borderLeft: '4px solid var(--orange-primary)',
            background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.04) 0%, #ffffff 100%)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Chủ Đầu Tư & Khách Hàng
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--orange-primary)', marginTop: '4px' }}>
                {investors.length}
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(234, 88, 12, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--orange-primary)',
              }}
            >
              <Building2 size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} style={{ color: 'var(--emerald-success)' }} /> 100% đối tác chiến lược
          </div>
        </div>

        {/* Card 2: Hợp Đồng Thi Công */}
        <div
          className="card"
          style={{
            padding: '20px',
            borderLeft: '4px solid var(--blue-tech)',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, #ffffff 100%)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Hợp Đồng & Phụ Lục
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--blue-tech)', marginTop: '4px' }}>
                {contracts.length}
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--blue-tech)',
              }}
            >
              <FileText size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DollarSign size={14} style={{ color: 'var(--blue-tech)' }} /> Tổng quy mô: <strong>{formatCurrency(totalContractValue)}</strong>
          </div>
        </div>

        {/* Card 3: Ban Chỉ Huy */}
        <div
          className="card"
          style={{
            padding: '20px',
            borderLeft: '4px solid #8b5cf6',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.04) 0%, #ffffff 100%)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Ban Chỉ Huy Công Trường
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#8b5cf6', marginTop: '4px' }}>
                {projects.length}
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(139, 92, 246, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8b5cf6',
              }}
            >
              <Users size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserCheck size={14} style={{ color: '#8b5cf6' }} /> Bộ máy chỉ huy & điều hành dự án
          </div>
        </div>

        {/* Card 4: Đối Tác Cung Ứng & Thầu Phụ */}
        <div
          className="card"
          style={{
            padding: '20px',
            borderLeft: '4px solid var(--emerald-success)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, #ffffff 100%)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Đối Tác Cung Ứng & Thầu Phụ
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--emerald-success)', marginTop: '4px' }}>
                {suppliers.length}
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--emerald-success)',
              }}
            >
              <Handshake size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} style={{ color: 'var(--emerald-success)' }} /> Chuỗi cung ứng VLXD & thầu phụ
          </div>
        </div>
      </div>

      {/* ===== TABS BAR ===== */}
      <div className="tabs-bar" style={{ marginBottom: '20px' }}>
        <button
          className={`tab-btn ${tab === 'investors' ? 'active' : ''}`}
          onClick={() => {
            setTab('investors');
            setSearchTerm('');
          }}
        >
          <Building2 size={16} /> Danh Mục Chủ Đầu Tư ({investors.length})
        </button>
        <button
          className={`tab-btn ${tab === 'contracts' ? 'active' : ''}`}
          onClick={() => {
            setTab('contracts');
            setSearchTerm('');
          }}
        >
          <FileText size={16} /> Hợp Đồng Thi Công ({contracts.length})
        </button>
        <button
          className={`tab-btn ${tab === 'members' ? 'active' : ''}`}
          onClick={() => {
            setTab('members');
            setSearchTerm('');
          }}
        >
          <Users size={16} /> Ban Chỉ Huy Công Trường
        </button>
        <button
          className={`tab-btn ${tab === 'partners' ? 'active' : ''}`}
          onClick={() => {
            setTab('partners');
            setSearchTerm('');
          }}
        >
          <Handshake size={16} /> Đối Tác & Nhà Thầu Phụ ({suppliers.length})
        </button>
        <button
          className={`tab-btn ${tab === 'users' ? 'active' : ''}`}
          onClick={() => {
            setTab('users');
            setSearchTerm('');
          }}
        >
          <UserCog size={16} /> Tài Khoản & Nhân Sự ({users.length})
        </button>
      </div>

      {/* ===== TAB 1: CHỦ ĐẦU TƯ ===== */}
      {tab === 'investors' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 className="card-title">Danh Mục Chủ Đầu Tư & Khách Hàng</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Các đơn vị chủ đầu tư, ban quản lý dự án ký kết hợp đồng xây dựng với BMC
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={16}
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  className="form-input form-input-sm"
                  placeholder="Tìm chủ đầu tư, MST..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '32px', width: '240px' }}
                />
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowInvModal(true)}>
                <Plus size={16} /> Thêm Chủ Đầu Tư
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="bmc-table">
              <thead>
                <tr>
                  <th>Mã CĐT</th>
                  <th>Tên Doanh Nghiệp / Chủ Đầu Tư</th>
                  <th>Mã Số Thuế</th>
                  <th>Người Đại Diện</th>
                  <th>Số Điện Thoại</th>
                  <th>Số Dự Án</th>
                  <th>Trạng Thái</th>
                  <th style={{ textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvestors.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => setSelectedInvestor(inv)}
                    style={{ cursor: 'pointer' }}
                    title="Nhấp để xem hồ sơ chủ đầu tư & các dự án"
                  >
                    <td>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvestor(inv);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          fontWeight: 700,
                          color: 'var(--orange-primary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          textDecoration: 'underline',
                        }}
                      >
                        <Eye size={13} /> {inv.code}
                      </button>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      <div>{inv.name}</div>
                      {inv.address && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {inv.address}
                        </div>
                      )}
                    </td>
                    <td>{inv.taxCode || '-'}</td>
                    <td>{inv.representative || '-'}</td>
                    <td>{inv.phone || '-'}</td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontWeight: 600 }}>
                        {projects.filter((p) => p.investorId === inv.id || p.investorName?.includes(inv.name)).length} dự án
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${inv.isActive ? 'badge-active' : 'badge-danger'}`}>
                        {inv.isActive ? 'Đang hợp tác' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvestor(inv);
                        }}
                        title="Xem chi tiết & dự án liên quan"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={14} /> Chi Tiết
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredInvestors.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Không tìm thấy chủ đầu tư nào phù hợp. Bấm <strong>"Thêm Chủ Đầu Tư"</strong> để bắt đầu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== TAB 2: HỢP ĐỒNG THI CÔNG ===== */}
      {tab === 'contracts' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 className="card-title">Danh Sách Hợp Đồng Thi Công</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Quản lý hợp đồng gốc, phụ lục điều chỉnh giá trị, VAT và tiến độ các gói thầu
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                className="form-select form-select-sm"
                value={contractProjectFilter}
                onChange={(e) => setContractProjectFilter(e.target.value)}
                style={{ minWidth: '220px' }}
              >
                <option value="ALL">-- Tất cả công trình --</option>
                {projects.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    [{p.code}] {p.name}
                  </option>
                ))}
              </select>

              <div style={{ position: 'relative' }}>
                <Search
                  size={16}
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  className="form-input form-input-sm"
                  placeholder="Tìm số HĐ, tên HĐ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '32px', width: '220px' }}
                />
              </div>

              <button className="btn btn-primary btn-sm" onClick={() => setShowCtrModal(true)}>
                <Plus size={16} /> Thêm Hợp Đồng Mới
              </button>
            </div>
          </div>

          {/* ===== MULTI-CONTRACT FINANCIAL SUMMARY DASHBOARD ===== */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            {/* Card 1: HĐ Chủ Đầu Tư (Doanh Thu) */}
            <div
              style={{
                backgroundColor: 'rgba(37, 99, 235, 0.05)',
                border: '1px solid rgba(37, 99, 235, 0.2)',
                borderRadius: '10px',
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>
                  🏢 HĐ Chủ Đầu Tư (Doanh Thu)
                </span>
                <span className="badge badge-neutral" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                  {countOwner} HĐ
                </span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1d4ed8', marginTop: '6px' }}>
                {formatCurrency(totalRevenue)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Doanh thu ký kết từ Chủ Đầu Tư
              </div>
            </div>

            {/* Card 2: HĐ Thầu Phụ & Cung Ứng (Chi Phí Giao Khoán) */}
            <div
              style={{
                backgroundColor: 'rgba(234, 88, 12, 0.05)',
                border: '1px solid rgba(234, 88, 12, 0.2)',
                borderRadius: '10px',
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>
                  🔨🚚 HĐ Thầu Phụ & Cung Ứng (Chi Phí)
                </span>
                <span className="badge badge-neutral" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                  {countSub + countSupplier + countConsulting} HĐ
                </span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ea580c', marginTop: '6px' }}>
                {formatCurrency(totalCost)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {countSub} HĐ Thầu phụ • {countSupplier} HĐ Cung ứng VLXD
              </div>
            </div>

            {/* Card 3: Biên Lợi Nhuận Giao Khoán Dự Kiến */}
            <div
              style={{
                backgroundColor: grossProfit >= 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                border: `1px solid ${grossProfit >= 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                borderRadius: '10px',
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: grossProfit >= 0 ? '#059669' : '#dc2626',
                    textTransform: 'uppercase',
                  }}
                >
                  💰 Chênh Lệch Biên Lợi Nhuận
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: grossProfit >= 0 ? '#059669' : '#dc2626',
                    backgroundColor: grossProfit >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {profitMargin.toFixed(1)}%
                </span>
              </div>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: grossProfit >= 0 ? '#059669' : '#dc2626',
                  marginTop: '6px',
                }}
              >
                {grossProfit >= 0 ? `+${formatCurrency(grossProfit)}` : formatCurrency(grossProfit)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {contractProjectFilter === 'ALL' ? 'Toàn bộ danh mục dự án' : 'Dự án đang chọn'}
              </div>
            </div>

            {/* Card 4: Tổng Số Hợp Đồng */}
            <div
              style={{
                backgroundColor: 'rgba(147, 51, 234, 0.05)',
                border: '1px solid rgba(147, 51, 234, 0.2)',
                borderRadius: '10px',
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7e22ce', textTransform: 'uppercase' }}>
                  📑 Tổng Hợp Đồng Dự Án
                </span>
                <span className="badge badge-neutral" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                  Active
                </span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7e22ce', marginTop: '6px' }}>
                {countAll} Hợp Đồng
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                1 công trình có thể gồm nhiều gói thầu
              </div>
            </div>
          </div>

          {/* ===== CONTRACT CATEGORY FILTER PILLS ===== */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '16px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '4px' }}>
              Lọc theo loại:
            </span>
            <button
              type="button"
              className={`btn btn-sm ${contractTypeFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setContractTypeFilter('ALL')}
              style={{ borderRadius: '20px', fontSize: '0.8rem', padding: '4px 12px' }}
            >
              Tất Cả ({countAll})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${contractTypeFilter === 'OWNER' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setContractTypeFilter('OWNER')}
              style={{ borderRadius: '20px', fontSize: '0.8rem', padding: '4px 12px' }}
            >
              🏢 HĐ Chủ Đầu Tư ({countOwner})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${contractTypeFilter === 'SUBCONTRACTOR' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setContractTypeFilter('SUBCONTRACTOR')}
              style={{ borderRadius: '20px', fontSize: '0.8rem', padding: '4px 12px' }}
            >
              🔨 HĐ Thầu Phụ ({countSub})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${contractTypeFilter === 'SUPPLIER' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setContractTypeFilter('SUPPLIER')}
              style={{ borderRadius: '20px', fontSize: '0.8rem', padding: '4px 12px' }}
            >
              🚚 HĐ Cung Ứng VLXD ({countSupplier})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${contractTypeFilter === 'CONSULTING' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setContractTypeFilter('CONSULTING')}
              style={{ borderRadius: '20px', fontSize: '0.8rem', padding: '4px 12px' }}
            >
              📐 HĐ Tư Vấn & Dịch Vụ ({countConsulting})
            </button>
          </div>

          {/* Quick Guide Alert */}
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: 'rgba(37, 99, 235, 0.05)',
              border: '1px solid rgba(37, 99, 235, 0.15)',
              borderRadius: '8px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.85rem',
              color: 'var(--blue-tech)',
            }}
          >
            <FileText size={18} style={{ flexShrink: 0 }} />
            <span>
              💡 <strong>Quản Lý Đa Hợp Đồng:</strong> 1 công trình gồm <strong>HĐ Chủ Đầu Tư</strong> (doanh thu) và các <strong>HĐ Thầu Phụ, Cung Ứng VLXD</strong> (chi phí). Click vào bất kỳ dòng nào để xem trọn vẹn văn bản hợp đồng, tải Word hoặc xem bản scan PDF dấu đỏ.
            </span>
          </div>

          <div className="table-container">
            <table className="bmc-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '170px' }}>Số Hợp Đồng</th>
                  <th style={{ minWidth: '190px' }}>Phân Loại & Đối Tác</th>
                  <th style={{ minWidth: '200px' }}>Công Trình / Dự Án</th>
                  <th>Tên Gói Thầu / Hạng Mục</th>
                  <th style={{ minWidth: '95px' }}>Ngày Ký</th>
                  <th style={{ minWidth: '140px' }}>Giá Trị Ký Ban Đầu</th>
                  <th style={{ minWidth: '150px' }}>Sau Điều Chỉnh</th>
                  <th style={{ minWidth: '85px' }}>Số Phụ Lục</th>
                  <th style={{ minWidth: '90px' }}>Trạng Thái</th>
                  <th style={{ minWidth: '150px', textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map((c) => {
                  const meta = parseContractMeta(c);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedContractId(c.id)}
                      style={{ cursor: 'pointer', transition: 'background-color 0.15s' }}
                      title="Nhấp vào để xem chi tiết hợp đồng & phụ lục"
                    >
                      <td>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedContractId(c.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            fontWeight: 700,
                            color: 'var(--blue-tech)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            textDecoration: 'underline',
                            fontSize: '0.9rem',
                          }}
                          title="Bấm để xem hợp đồng"
                        >
                          <Eye size={15} /> {c.contractNo}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: 700,
                              fontSize: '0.74rem',
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
                          <div
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: 'var(--text-main)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '180px',
                            }}
                            title={meta.partnerName}
                          >
                            {meta.partnerName}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {c.projectName || `Dự án #${c.projectId}`}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {c.projectCode || `ID: ${c.projectId}`}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.contractName}</div>
                        {c.fileUrl && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.72rem',
                              color: '#ef4444',
                              fontWeight: 700,
                              backgroundColor: 'rgba(239, 68, 68, 0.08)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              marginTop: '2px',
                            }}
                          >
                            <FileText size={10} /> Đã có tệp scan PDF
                          </span>
                        )}
                      </td>
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
                      <td>
                        <div style={{ fontWeight: 700, color: meta.isRevenue ? 'var(--blue-tech)' : '#ea580c' }}>
                          {formatCurrency(c.totalAdjustedValue || c.contractValue)}
                        </div>
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
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'nowrap' }}>
                          {/* Download Word draft */}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (c.description) {
                                try {
                                  const parsed = JSON.parse(c.description);
                                  if (parsed.wordUrl) {
                                    const link = document.createElement('a');
                                    link.href = parsed.wordUrl;
                                    link.download = parsed.fileName || `${c.contractNo}.docx`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    return;
                                  }
                                } catch {}
                              }
                              exportContractToWord(c);
                            }}
                            title="Tải về file Word (.doc/.docx) hợp đồng gốc để chỉnh sửa"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#2563eb',
                              borderColor: 'rgba(37, 99, 235, 0.35)',
                              backgroundColor: 'rgba(37, 99, 235, 0.06)',
                              whiteSpace: 'nowrap',
                              fontWeight: 600,
                            }}
                          >
                            <Download size={13} /> Tải Word
                          </button>

                          {/* View Scan PDF */}
                          {c.fileUrl && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPdfModal({
                                  isOpen: true,
                                  title: `Bản Scan Hợp Đồng: ${c.contractNo} (Có Dấu Đỏ)`,
                                  url: c.fileUrl!,
                                });
                              }}
                              title="Xem ngay bản scan PDF có dấu đỏ"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: '#ef4444',
                                borderColor: 'rgba(239, 68, 68, 0.35)',
                                backgroundColor: 'rgba(239, 68, 68, 0.06)',
                                whiteSpace: 'nowrap',
                                fontWeight: 600,
                              }}
                            >
                              <FileText size={13} /> Scan PDF
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedContractId(c.id);
                            }}
                            title="Xem toàn văn hợp đồng & phụ lục"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                          >
                            <Eye size={13} /> Chi Tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredContracts.length === 0 && !loading && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      Không tìm thấy hợp đồng nào phù hợp với điều kiện lọc hiện tại. Bấm <strong>"+ Thêm Hợp Đồng Mới"</strong> để khởi tạo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== TAB 3: BAN CHỈ HUY CÔNG TRƯỜNG ===== */}
      {tab === 'members' && (
        <div>
          {/* Project selector toolbar */}
          <div className="card" style={{ marginBottom: '20px', padding: '16px 24px' }}>
            <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Chọn công trình kiểm tra:</span>
                <select
                  className="form-select"
                  value={bchProjectId || ''}
                  onChange={(e) => setBchProjectId(Number(e.target.value))}
                  style={{ minWidth: '340px' }}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <button className="btn btn-primary btn-sm" onClick={() => setShowMemberModal(true)}>
                <Plus size={16} /> Bổ Nhiệm Nhân Sự BCH
              </button>
            </div>
          </div>

          {/* Site Management Team Overview */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <div>
                <h2 className="card-title">
                  Ban Chỉ Huy Công Trường: {currentProject?.name}
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Địa điểm: {currentProject?.location || 'Chưa cập nhật'} | Tiến độ dự án: {Number(currentProject?.progressPercent || 0).toFixed(0)}%
                </p>
              </div>
              <span className="badge badge-active" style={{ fontSize: '0.85rem' }}>
                {bchMembers.length} cán bộ chỉ huy
              </span>
            </div>

            {loadingMembers ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Đang tải danh sách nhân sự Ban Chỉ Huy...
              </div>
            ) : bchMembers.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-card-subtle, #f8fafc)', borderRadius: '12px' }}>
                <Users size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <h4 style={{ margin: '0 0 6px 0' }}>Chưa thiết lập Ban Chỉ Huy cho công trình này</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Bổ nhiệm Chỉ huy trưởng, Kỹ sư hiện trường, Kỹ sư dự toán và Giám sát để điều hành dự án.
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => setShowMemberModal(true)}>
                  <Plus size={16} /> Bổ Nhiệm Ngay
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {bchMembers.map((m) => (
                  <div
                    key={`${m.projectId}-${m.userId}`}
                    style={{
                      padding: '18px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-card-subtle, #ffffff)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '12px',
                          backgroundColor:
                            m.roleName?.includes('Chỉ huy trưởng')
                              ? 'rgba(234, 88, 12, 0.15)'
                              : m.roleName?.includes('dự toán')
                              ? 'rgba(37, 99, 235, 0.15)'
                              : 'rgba(16, 185, 129, 0.15)',
                          color:
                            m.roleName?.includes('Chỉ huy trưởng')
                              ? 'var(--orange-primary)'
                              : m.roleName?.includes('dự toán')
                              ? 'var(--blue-tech)'
                              : 'var(--emerald-success)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '1.1rem',
                        }}
                      >
                        {m.fullName.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{m.fullName}</h4>
                          <span className={`badge ${m.isActive ? 'badge-active' : 'badge-danger'}`} style={{ fontSize: '0.75rem' }}>
                            {m.isActive ? 'Đang điều hành' : 'Đã chuyển'}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            color: 'var(--orange-primary)',
                            marginTop: '2px',
                          }}
                        >
                          {m.roleName || 'Cán bộ kỹ thuật'}
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Briefcase size={14} /> Tài khoản: <strong style={{ color: 'var(--text-main)' }}>{m.username}</strong>
                      </div>
                      {m.joinedAt && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CheckCircle2 size={14} /> Ngày nhận nhiệm vụ: <strong style={{ color: 'var(--text-main)' }}>{formatDate(m.joinedAt)}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== TAB 4: ĐỐI TÁC CUNG ỨNG & THẦU PHỤ ===== */}
      {tab === 'partners' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 className="card-title">Mạng Lưới Đối Tác & Nhà Cung Cấp / Thầu Phụ</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Các đơn vị cung ứng vật tư, thiết bị thi công và tổ đội thầu phụ liên kết của BMC
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={16}
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  className="form-input form-input-sm"
                  placeholder="Tìm đối tác, người liên hệ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '32px', width: '240px' }}
                />
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowSupplierModal(true)}>
                <Plus size={16} /> Thêm Đối Tác / Thầu Phụ
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="bmc-table">
              <thead>
                <tr>
                  <th>Mã Đối Tác</th>
                  <th>Tên Nhà Cung Cấp / Nhà Thầu Phụ</th>
                  <th>Mã Số Thuế</th>
                  <th>Người Liên Hệ</th>
                  <th>Điện Thoại</th>
                  <th>Địa Chỉ</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 700, color: 'var(--emerald-success)' }}>{s.code}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.taxCode || '-'}</td>
                    <td>{s.contactPerson || '-'}</td>
                    <td>{s.phone || '-'}</td>
                    <td style={{ fontSize: '0.85rem', maxWidth: '280px' }}>{s.address || '-'}</td>
                    <td>
                      <span className={`badge ${s.isActive ? 'badge-active' : 'badge-danger'}`}>
                        {s.isActive ? 'Đang hợp tác' : 'Tạm dừng'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredSuppliers.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Không tìm thấy đối tác nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== TAB 5: TÀI KHOẢN & NHÂN SỰ ===== */}
      {tab === 'users' && (() => {
        const filteredUsers = users.filter((u) => {
          const q = searchTerm.toLowerCase();
          return (
            (u.fullName && u.fullName.toLowerCase().includes(q)) ||
            (u.username && u.username.toLowerCase().includes(q)) ||
            (u.roleName && u.roleName.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q)) ||
            (u.phone && u.phone.toLowerCase().includes(q))
          );
        });

        return (
          <div className="card">
            <div className="card-header" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Quản Lý Tài Khoản & Cán Bộ Nhân Sự BMC</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Danh sách tài khoản hệ thống dùng để phân công Ban Chỉ Huy công trường, Giám sát, Kế toán và Quản lý kho
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input form-input-sm"
                    placeholder="Tìm tên, tài khoản, chức vụ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '32px', width: '240px' }}
                  />
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowUserModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <UserPlus size={16} /> Thêm Tài Khoản Mới
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="bmc-table">
                <thead>
                  <tr>
                    <th>Họ & Tên Nhân Sự</th>
                    <th>Tên Tài Khoản</th>
                    <th>Chức Danh / Vai Trò</th>
                    <th>Email Liên Hệ</th>
                    <th>Số Điện Thoại</th>
                    <th>Trạng Thái</th>
                    <th style={{ textAlign: 'center' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(37, 99, 235, 0.1)',
                              color: 'var(--blue-tech)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                            }}
                          >
                            {u.fullName?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <span>{u.fullName}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--blue-tech)' }}>
                        @{u.username}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(234, 88, 12, 0.08)',
                            color: 'var(--orange-primary)',
                            border: '1px solid rgba(234, 88, 12, 0.25)',
                          }}
                        >
                          {u.roleName || 'Cán bộ kỹ thuật'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{u.email || '-'}</td>
                      <td style={{ fontSize: '0.85rem' }}>{u.phone || '-'}</td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-active' : 'badge-danger'}`}>
                          {u.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleToggleUser(u.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            padding: '3px 8px',
                            color: u.isActive ? '#dc2626' : '#16a34a',
                          }}
                          title={u.isActive ? 'Khóa tài khoản này' : 'Mở khóa tài khoản này'}
                        >
                          {u.isActive ? <Lock size={12} /> : <Unlock size={12} />}
                          {u.isActive ? 'Khóa' : 'Kích hoạt'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        Không tìm thấy tài khoản nhân sự nào phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ===== MODAL: Create User / Employee ===== */}
      {showUserModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '600px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Thêm Tài Khoản Cán Bộ / Nhân Sự Mới</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Tạo tài khoản đăng nhập và gán vào hệ thống nhân sự BMC
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowUserModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Tên Đăng Nhập (Username) *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    placeholder="VD: nam.kysu"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mật Khẩu Khởi Tạo *</label>
                  <input
                    type="password"
                    className="form-input"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="Tối thiểu 6 ký tự"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Họ và Tên Cán Bộ *</label>
                <input
                  type="text"
                  className="form-input"
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  placeholder="VD: Nguyễn Văn Nam"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Chức Danh / Vai Trò Chính *</label>
                  <select
                    className="form-select"
                    value={userForm.defaultRoleId}
                    onChange={(e) => setUserForm({ ...userForm, defaultRoleId: e.target.value })}
                    required
                  >
                    <option value="6">👷 Chỉ huy trưởng (Site Manager)</option>
                    <option value="7">👷 Kỹ sư hiện trường / Giám sát</option>
                    <option value="5">📊 Kỹ sư dự toán (QS)</option>
                    <option value="4">💰 Kế toán công trình</option>
                    <option value="8">📦 Quản lý kho / Vật tư</option>
                    <option value="1">🛡️ Quản trị hệ thống (Admin)</option>
                    <option value="2">🏢 Ban Giám Đốc</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Số Điện Thoại</label>
                  <input
                    type="text"
                    className="form-input"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    placeholder="VD: 0912345678"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Hòm Thư Điện Tử (Email)</label>
                <input
                  type="email"
                  className="form-input"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="VD: nam.nv@bmc.vn"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submittingUser}>
                  {submittingUser ? 'Đang tạo...' : 'Lưu Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: Create Investor ===== */}
      {showInvModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '800px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Thêm Chủ Đầu Tư / Khách Hàng Mới</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowInvModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateInvestor}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Mã Chủ Đầu Tư *</label>
                  <input type="text" className="form-input" value={invForm.code} onChange={(e) => setInvForm({ ...invForm, code: e.target.value })} placeholder="VD: CDT-NAMLONG" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tên Doanh Nghiệp *</label>
                  <input type="text" className="form-input" value={invForm.name} onChange={(e) => setInvForm({ ...invForm, name: e.target.value })} placeholder="VD: Tập đoàn Nam Long" required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Mã Số Thuế</label>
                  <input type="text" className="form-input" value={invForm.taxCode} onChange={(e) => setInvForm({ ...invForm, taxCode: e.target.value })} placeholder="VD: 0301234567" />
                </div>
                <div className="form-group">
                  <label className="form-label">Người Đại Diện</label>
                  <input type="text" className="form-input" value={invForm.representative} onChange={(e) => setInvForm({ ...invForm, representative: e.target.value })} placeholder="Họ và tên đại diện" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Điện Thoại</label>
                  <input type="text" className="form-input" value={invForm.phone} onChange={(e) => setInvForm({ ...invForm, phone: e.target.value })} placeholder="090..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={invForm.email} onChange={(e) => setInvForm({ ...invForm, email: e.target.value })} placeholder="contact@..." />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Địa Chỉ Trụ Sở</label>
                <input type="text" className="form-input" value={invForm.address} onChange={(e) => setInvForm({ ...invForm, address: e.target.value })} placeholder="Số nhà, đường, tỉnh thành..." />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowInvModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Lưu Chủ Đầu Tư'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: Create Contract ===== */}
      {showCtrModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '880px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Thêm Hợp Đồng Thi Công Mới</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCtrModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateContract}>
              <div className="form-group">
                <label className="form-label">Công Trình / Dự Án *</label>
                <select className="form-select" value={ctrForm.projectId} onChange={(e) => setCtrForm({ ...ctrForm, projectId: e.target.value })} required>
                  <option value="">-- Chọn dự án --</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>)}
                </select>
              </div>

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
                        if (newType === 'OWNER') suggestedNo = 'HĐ-2024/01/BMC-NL';
                        else if (newType === 'SUBCONTRACTOR') suggestedNo = 'HĐTP-2024/02/BMC-PM';
                        else if (newType === 'SUPPLIER') suggestedNo = 'HĐCU-2024/03/BMC-AL';
                        else suggestedNo = 'HĐTV-2024/04/BMC';
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
                        list="investor-list"
                        value={ctrForm.partnerName}
                        onChange={(e) => setCtrForm({ ...ctrForm, partnerName: e.target.value })}
                        placeholder="Chọn hoặc nhập tên Chủ Đầu Tư..."
                        required
                      />
                      <datalist id="investor-list">
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
                        list="supplier-list"
                        value={ctrForm.partnerName}
                        onChange={(e) => setCtrForm({ ...ctrForm, partnerName: e.target.value })}
                        placeholder="Chọn hoặc nhập tên Thầu Phụ / Nhà Cung Cấp..."
                        required
                      />
                      <datalist id="supplier-list">
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
                  <input type="text" className="form-input" value={ctrForm.contractNo} onChange={(e) => setCtrForm({ ...ctrForm, contractNo: e.target.value })} placeholder="VD: HĐ-2024/01/BMC" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tên Hợp Đồng / Gói Thầu *</label>
                  <input type="text" className="form-input" value={ctrForm.contractName} onChange={(e) => setCtrForm({ ...ctrForm, contractName: e.target.value })} placeholder="VD: Thi công phần móng và kết cấu ngầm" required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Ngày Ký</label>
                  <input type="date" className="form-input" value={ctrForm.signedDate} onChange={(e) => setCtrForm({ ...ctrForm, signedDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Giá Trị Gốc (VNĐ) *</label>
                  <input type="number" className="form-input" value={ctrForm.contractValue} onChange={(e) => setCtrForm({ ...ctrForm, contractValue: e.target.value })} placeholder="0" min="0" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Thuế VAT (%)</label>
                  <input type="number" className="form-input" value={ctrForm.vatRate} onChange={(e) => setCtrForm({ ...ctrForm, vatRate: e.target.value })} placeholder="10" min="0" max="100" />
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
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Bản scan PDF có chữ ký và con dấu đỏ pháp lý hai bên
                </div>
              </div>

              {/* Upload original editable Word file */}
              <div className="form-group">
                <label className="form-label">Tệp Word Hợp Đồng Gốc (.docx / .doc)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="file"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="form-input"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingCtrWord(true);
                      try {
                        const res = await uploadApi.uploadFile(file);
                        setCtrForm((prev) => ({
                          ...prev,
                          wordUrl: res.url,
                          wordFileName: file.name,
                        }));
                        alert('Đã tải lên tệp Word hợp đồng gốc thành công!');
                      } catch (err: any) {
                        alert(err.response?.data?.message || 'Lỗi khi tải lên tệp Word');
                      } finally {
                        setUploadingCtrWord(false);
                      }
                    }}
                  />
                  {ctrForm.wordUrl && (
                    <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      ✓ Đã đính kèm Word
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Bản mềm Word để lưu trữ và soạn thảo điều khoản hợp đồng
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCtrModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting || uploadingCtrPdf || uploadingCtrWord}>
                  {submitting ? 'Đang lưu...' : (uploadingCtrPdf || uploadingCtrWord) ? 'Đang tải file...' : 'Lưu Hợp Đồng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: Add BCH Member ===== */}
      {showMemberModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '700px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Bổ Nhiệm Nhân Sự Ban Chỉ Huy</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowMemberModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label className="form-label">Công Trình:</label>
                <div style={{ fontWeight: 600, color: 'var(--blue-tech)', padding: '8px 12px', backgroundColor: 'var(--bg-card-subtle, #f8fafc)', borderRadius: '6px' }}>
                  [{currentProject?.code}] {currentProject?.name}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Cán Bộ / Nhân Sự Được Bổ Nhiệm *</label>
                <select
                  className="form-select"
                  value={memberForm.userId}
                  onChange={(e) => setMemberForm({ ...memberForm, userId: e.target.value })}
                  required
                >
                  <option value="">-- Chọn nhân sự BMC --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.username} - {u.roleName})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Chức Danh Công Trường *</label>
                  <select
                    className="form-select"
                    value={memberForm.roleId}
                    onChange={(e) => setMemberForm({ ...memberForm, roleId: e.target.value })}
                    required
                  >
                    <option value="6">Chỉ huy trưởng</option>
                    <option value="5">Kỹ sư dự toán</option>
                    <option value="7">Kỹ sư hiện trường / Giám sát</option>
                    <option value="4">Kế toán công trình</option>
                    <option value="8">Quản lý kho / Vật tư</option>
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
                <button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Lưu Bổ Nhiệm'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: Create Supplier / Partner ===== */}
      {showSupplierModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '820px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Thêm Đối Tác / Nhà Cung Cấp / Thầu Phụ Mới</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowSupplierModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateSupplier}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Mã Đối Tác *</label>
                  <input type="text" className="form-input" value={supplierForm.code} onChange={(e) => setSupplierForm({ ...supplierForm, code: e.target.value })} placeholder="VD: NCC-BETONG-ANLOC" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tên Nhà Cung Cấp / Thầu Phụ *</label>
                  <input type="text" className="form-input" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} placeholder="VD: Công ty TNHH Bê tông tươi An Lộc" required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Mã Số Thuế</label>
                  <input type="text" className="form-input" value={supplierForm.taxCode} onChange={(e) => setSupplierForm({ ...supplierForm, taxCode: e.target.value })} placeholder="VD: 0312456789" />
                </div>
                <div className="form-group">
                  <label className="form-label">Người Đại Diện / Liên Hệ</label>
                  <input type="text" className="form-input" value={supplierForm.contactPerson} onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })} placeholder="VD: Lê Tấn Lực" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Điện Thoại</label>
                  <input type="text" className="form-input" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} placeholder="091..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} placeholder="contact@..." />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Địa Chỉ Kho / Trụ Sở</label>
                <input type="text" className="form-input" value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} placeholder="KCN Sóng Thần 2, TP. Dĩ An, Bình Dương..." />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSupplierModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Lưu Đối Tác'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: Investor Detail ===== */}
      {selectedInvestor && (
        <InvestorDetailModal
          investor={selectedInvestor}
          projects={projects}
          contracts={contracts}
          onClose={() => setSelectedInvestor(null)}
          onOpenContract={(c) => setSelectedContractId(c.id)}
        />
      )}

      {/* ===== MODAL: Contract Detail ===== */}
      {selectedContractId && (
        <ContractDetailModal
          contractId={selectedContractId}
          onClose={() => setSelectedContractId(null)}
          onUpdated={loadData}
        />
      )}

      {/* ===== MODAL: PDF Viewer ===== */}
      <PdfViewerModal
        isOpen={pdfModal.isOpen}
        onClose={() => setPdfModal({ isOpen: false, title: '', url: '' })}
        title={pdfModal.title}
        pdfUrl={pdfModal.url}
      />
    </div>
  );
};
