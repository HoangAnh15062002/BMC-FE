import React, { useEffect, useState } from 'react';
import { adminApi, projectApi } from '../api';
import { Investor, Contract, Project } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Building2, FileText, Plus, X } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [tab, setTab] = useState<'investors' | 'contracts'>('investors');
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

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
  const [ctrForm, setCtrForm] = useState({
    projectId: '',
    contractNo: '',
    contractName: '',
    signedDate: new Date().toISOString().slice(0, 10),
    contractValue: '',
    vatRate: '10',
  });

  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invs, ctrs, prjs] = await Promise.all([
        adminApi.getInvestors().catch(() => []),
        adminApi.getContracts().catch(() => []),
        projectApi.getAll().catch(() => []),
      ]);
      setInvestors(invs);
      setContracts(ctrs);
      setProjects(prjs);
      if (prjs.length > 0 && !ctrForm.projectId) {
        setCtrForm(prev => ({ ...prev, projectId: String(prjs[0].id) }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      await adminApi.createContract({
        projectId: Number(ctrForm.projectId),
        contractNo: ctrForm.contractNo.trim(),
        contractName: ctrForm.contractName.trim(),
        signedDate: ctrForm.signedDate || undefined,
        contractValue: Number(ctrForm.contractValue) || 0,
        vatRate: Number(ctrForm.vatRate) || 10,
      });
      setShowCtrModal(false);
      setCtrForm({
        projectId: projects.length > 0 ? String(projects[0].id) : '',
        contractNo: '',
        contractName: '',
        signedDate: new Date().toISOString().slice(0, 10),
        contractValue: '',
        vatRate: '10',
      });
      alert('Thêm hợp đồng thi công thành công!');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi thêm hợp đồng');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="tabs-bar" style={{ marginBottom: '20px' }}>
        <button
          className={`tab-btn ${tab === 'investors' ? 'active' : ''}`}
          onClick={() => setTab('investors')}
        >
          <Building2 size={16} /> Danh Mục Chủ Đầu Tư ({investors.length})
        </button>
        <button
          className={`tab-btn ${tab === 'contracts' ? 'active' : ''}`}
          onClick={() => setTab('contracts')}
        >
          <FileText size={16} /> Hợp Đồng Thi Công ({contracts.length})
        </button>
      </div>

      {tab === 'investors' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h2 className="card-title">Danh Mục Chủ Đầu Tư & Khách Hàng</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Các đơn vị chủ đầu tư, ban quản lý dự án ký kết hợp đồng xây dựng với BMC
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowInvModal(true)}>
              <Plus size={16} /> Thêm Chủ Đầu Tư
            </button>
          </div>
          <div className="table-container">
            <table className="bmc-table">
              <thead>
                <tr>
                  <th>Mã Chủ Đầu Tư</th>
                  <th>Tên Doanh Nghiệp / Chủ Đầu Tư</th>
                  <th>Mã Số Thuế</th>
                  <th>Người Đại Diện</th>
                  <th>Số Điện Thoại</th>
                  <th>Số Dự Án Tham Gia</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {investors.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 700, color: 'var(--orange-primary)' }}>{inv.code}</td>
                    <td style={{ fontWeight: 600 }}>{inv.name}</td>
                    <td>{inv.taxCode || '-'}</td>
                    <td>{inv.representative || '-'}</td>
                    <td>{inv.phone || '-'}</td>
                    <td>{inv.projectsCount || 0} dự án</td>
                    <td>
                      <span className={`badge ${inv.isActive ? 'badge-active' : 'badge-danger'}`}>
                        {inv.isActive ? 'Đang hợp tác' : 'Tạm dừng'}
                      </span>
                    </td>
                  </tr>
                ))}
                {investors.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Chưa có chủ đầu tư nào. Bấm <strong>"Thêm Chủ Đầu Tư"</strong> để bắt đầu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'contracts' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h2 className="card-title">Danh Sách Hợp Đồng Thi Công</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Quản lý hợp đồng gốc, phụ lục điều chỉnh giá trị và điều khoản thi công
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCtrModal(true)}>
              <Plus size={16} /> Thêm Hợp Đồng Mới
            </button>
          </div>
          <div className="table-container">
            <table className="bmc-table">
              <thead>
                <tr>
                  <th>Số Hợp Đồng</th>
                  <th>Dự Án</th>
                  <th>Tên Hợp Đồng</th>
                  <th>Ngày Ký</th>
                  <th>Giá Trị Ban Đầu</th>
                  <th>Tổng Sau Điều Chỉnh</th>
                  <th>Số Phụ Lục</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700, color: 'var(--blue-tech)' }}>{c.contractNo}</td>
                    <td>{c.projectName || `Dự án #${c.projectId}`}</td>
                    <td style={{ fontWeight: 600 }}>{c.contractName}</td>
                    <td>{formatDate(c.signedDate)}</td>
                    <td>{formatCurrency(c.contractValue)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--orange-primary)' }}>
                      {formatCurrency(c.totalAdjustedValue || c.contractValue)}
                    </td>
                    <td>{c.appendicesCount || 0} phụ lục</td>
                    <td>
                      <span className="badge badge-active">{c.status || 'ACTIVE'}</span>
                    </td>
                  </tr>
                ))}
                {contracts.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Chưa có hợp đồng nào. Bấm <strong>"Thêm Hợp Đồng Mới"</strong> để bắt đầu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== MODAL: Create Investor ===== */}
      {showInvModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Thêm Chủ Đầu Tư Mới</h3>
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Thêm Hợp Đồng Thi Công Mới</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCtrModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateContract}>
              <div className="form-group">
                <label className="form-label">Công Trình / Dự Án *</label>
                <select className="form-select" value={ctrForm.projectId} onChange={(e) => setCtrForm({ ...ctrForm, projectId: e.target.value })} required>
                  <option value="">-- Chọn dự án --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Số Hợp Đồng *</label>
                  <input type="text" className="form-input" value={ctrForm.contractNo} onChange={(e) => setCtrForm({ ...ctrForm, contractNo: e.target.value })} placeholder="VD: HD-2026/01/BMC" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tên Hợp Đồng *</label>
                  <input type="text" className="form-input" value={ctrForm.contractName} onChange={(e) => setCtrForm({ ...ctrForm, contractName: e.target.value })} placeholder="VD: HĐ Thi công phần ngầm & móng" required />
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
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCtrModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Lưu Hợp Đồng'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
