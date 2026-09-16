import React, { useEffect, useState } from 'react';
import { siteApi, projectApi, catalogsApi } from '../api';
import { Project } from '../types';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';
import { HardHat, DollarSign, Truck, Users, RefreshCw, Plus, X, Trash2 } from 'lucide-react';

export const SiteExecutionPage: React.FC = () => {
  const [tab, setTab] = useState<'labor' | 'machine'>('labor');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>();
  const [summary, setSummary] = useState<any | null>(null);
  const [laborEntries, setLaborEntries] = useState<any[]>([]);
  const [machineEntries, setMachineEntries] = useState<any[]>([]);
  const [availableLabors, setAvailableLabors] = useState<any[]>([]);
  const [availableMachines, setAvailableMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal: Create Labor Entry
  const [showLaborModal, setShowLaborModal] = useState(false);
  const [laborForm, setLaborForm] = useState({
    workDate: new Date().toISOString().slice(0, 10),
    teamName: '',
    laborId: '',
    quantity: '1',
    unitPrice: '350000',
    note: '',
  });

  // Modal: Create Machine Entry
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [machineForm, setMachineForm] = useState({
    workDate: new Date().toISOString().slice(0, 10),
    machineId: '',
    shiftQuantity: '1',
    fuelCost: '500000',
    operatorCost: '300000',
    depreciationCost: '400000',
    note: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const loadProjects = async () => {
    try {
      const [pList, lList, mList] = await Promise.all([
        projectApi.getAll().catch(() => []),
        catalogsApi.getLabors().catch(() => []),
        catalogsApi.getMachines().catch(() => []),
      ]);
      setProjects(pList);
      setAvailableLabors(lList);
      setAvailableMachines(mList);
      if (pList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(pList[0].id);
      }
      if (lList.length > 0 && !laborForm.laborId) {
        setLaborForm(prev => ({ ...prev, laborId: String(lList[0].id) }));
      }
      if (mList.length > 0 && !machineForm.machineId) {
        setMachineForm(prev => ({ ...prev, machineId: String(mList[0].id) }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSiteData = async (projId: number) => {
    setLoading(true);
    try {
      const [lList, mList, costSummary] = await Promise.all([
        siteApi.getLaborEntries(projId).catch(() => []),
        siteApi.getMachineEntries(projId).catch(() => []),
        siteApi.getCosts(projId).catch(() => null),
      ]);
      setLaborEntries(lList);
      setMachineEntries(mList);
      if (costSummary) {
        setSummary(costSummary);
      } else {
        const totalLabor = lList.reduce((acc: number, x: any) => acc + Number(x.amount || 0), 0);
        const totalMachine = mList.reduce((acc: number, x: any) => acc + Number(x.totalCost || 0), 0);
        setSummary({ totalLaborCost: totalLabor, totalMachineCost: totalMachine, totalActualCost: totalLabor + totalMachine });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);
  useEffect(() => { if (selectedProjectId) loadSiteData(selectedProjectId); }, [selectedProjectId]);

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
      setLaborForm(prev => ({ ...prev, teamName: '', quantity: '1', note: '' }));
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

  const handleCreateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    if (!machineForm.machineId) {
      alert('Vui lòng chọn loại máy thi công!');
      return;
    }
    setSubmitting(true);
    try {
      const fuelCost = Number(machineForm.fuelCost) || 0;
      const operatorCost = Number(machineForm.operatorCost) || 0;
      const depreciationCost = Number(machineForm.depreciationCost) || 0;
      await siteApi.createMachineEntry({
        projectId: selectedProjectId,
        workDate: machineForm.workDate,
        machineId: Number(machineForm.machineId),
        shiftQuantity: Number(machineForm.shiftQuantity),
        fuelCost,
        operatorCost,
        depreciationCost,
        note: machineForm.note.trim() || undefined,
      });
      setShowMachineModal(false);
      setMachineForm(prev => ({ ...prev, shiftQuantity: '1', note: '' }));
      alert('Ghi nhật ký ca máy thành công!');
      loadSiteData(selectedProjectId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi ghi nhật ký ca máy');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMachine = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa bản ghi nhật ký ca máy này?')) return;
    try {
      await siteApi.deleteMachineEntry(id);
      if (selectedProjectId) loadSiteData(selectedProjectId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa bản ghi ca máy');
    }
  };

  const laborAmount = (Number(laborForm.quantity) || 0) * (Number(laborForm.unitPrice) || 0);
  const machineTotalCost = (Number(machineForm.fuelCost) || 0) + (Number(machineForm.operatorCost) || 0) + (Number(machineForm.depreciationCost) || 0);

  return (
    <div>
      {/* Project Selector Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 24px' }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Chọn Công Trình / Dự Án:</span>
            <select className="form-select" value={selectedProjectId || ''} onChange={(e) => setSelectedProjectId(Number(e.target.value))} style={{ minWidth: '320px' }}>
              {projects.map((p) => <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>)}
            </select>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => selectedProjectId && loadSiteData(selectedProjectId)}>
            <RefreshCw size={14} /> Làm mới
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
            <Users size={24} />
          </div>
          <div>
            <div className="stat-val">{formatCurrency(summary?.totalLaborCost || 0)}</div>
            <div className="stat-label">Chi Phí Nhân Công Đã Phát Sinh</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--emerald-success)' }}>
            <Truck size={24} />
          </div>
          <div>
            <div className="stat-val">{formatCurrency(summary?.totalMachineCost || 0)}</div>
            <div className="stat-label">Chi Phí Ca Máy Đã Phát Sinh</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
            <HardHat size={24} />
          </div>
          <div>
            <div className="stat-val">{laborEntries.length + machineEntries.length}</div>
            <div className="stat-label">Tổng Số Lượt Ghi Nhật Ký</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-bar" style={{ marginBottom: '20px' }}>
        <button className={`tab-btn ${tab === 'labor' ? 'active' : ''}`} onClick={() => setTab('labor')}>
          <Users size={16} /> Nhật Ký Nhân Công ({laborEntries.length})
        </button>
        <button className={`tab-btn ${tab === 'machine' ? 'active' : ''}`} onClick={() => setTab('machine')}>
          <Truck size={16} /> Nhật Ký Ca Máy Thi Công ({machineEntries.length})
        </button>
      </div>

      {/* Tab 1: Labor Entries */}
      {tab === 'labor' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Nhật Ký Chấm Công & Chi Phí Nhân Công</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Chi tiết số công nhật của các tổ đội thợ thi công trực tiếp theo ngày
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowLaborModal(true)} disabled={!selectedProjectId}>
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
                  <th>Số Công (Ngày)</th>
                  <th>Đơn Giá / Công</th>
                  <th>Thành Tiền</th>
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
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{l.projectItemName || l.projectTaskName || '-'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--blue-tech)' }}>{formatNumber(l.quantity)} công</td>
                    <td>{formatCurrency(l.unitPrice)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--orange-primary)' }}>{formatCurrency(l.amount)}</td>
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

      {/* Tab 2: Machine Entries */}
      {tab === 'machine' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Nhật Ký Hoạt Động Ca Máy & Thiết Bị Thi Công</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Theo dõi số ca máy đào, cần cẩu, máy trộn, xe lu và chi phí nhiên liệu
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowMachineModal(true)} disabled={!selectedProjectId}>
              <Plus size={16} /> Ghi Nhật Ký Ca Máy
            </button>
          </div>
          <div className="table-container">
            <table className="bmc-table">
              <thead>
                <tr>
                  <th>Ngày Hoạt Động</th>
                  <th>Tên Máy & Thiết Bị</th>
                  <th>Số Ca Máy</th>
                  <th>Chi Phí Nhiên Liệu</th>
                  <th>Lương Thợ Lái</th>
                  <th>Khấu Hao / Thuê</th>
                  <th>Tổng Chi Phí Ca</th>
                  <th>Ghi Chú</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {machineEntries.map((m) => (
                  <tr key={m.id}>
                    <td>{formatDate(m.workDate)}</td>
                    <td style={{ fontWeight: 600 }}>{m.machineName || m.machineCode}</td>
                    <td style={{ fontWeight: 700, color: 'var(--blue-tech)' }}>{formatNumber(m.shiftQuantity)} ca</td>
                    <td>{formatCurrency(m.fuelCost)}</td>
                    <td>{formatCurrency(m.operatorCost)}</td>
                    <td>{formatCurrency(m.depreciationCost)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--orange-primary)' }}>{formatCurrency(m.totalCost)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{m.note || '-'}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteMachine(m.id)}
                        className="btn-icon"
                        title="Xóa bản ghi"
                        style={{ color: 'var(--crimson-danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {machineEntries.length === 0 && !loading && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Chưa có nhật ký ca máy. Bấm <strong>"Ghi Nhật Ký Ca Máy"</strong> để nhập mới.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Chấm công thực tế theo ngày làm việc tại công trường</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowLaborModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateLabor}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Ngày Làm Việc *</label>
                  <input type="date" className="form-input" value={laborForm.workDate} onChange={(e) => setLaborForm({ ...laborForm, workDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tổ Đội Thi Công</label>
                  <input type="text" className="form-input" value={laborForm.teamName} onChange={(e) => setLaborForm({ ...laborForm, teamName: e.target.value })} placeholder="VD: Tổ Thợ Xây - Anh Hùng" />
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
                  {availableLabors.map(l => (
                    <option key={l.id} value={l.id}>[{l.code}] {l.name} {l.grade ? `(${l.grade})` : ''}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Số Công (Ngày Công) *</label>
                  <input type="number" className="form-input" value={laborForm.quantity} onChange={(e) => setLaborForm({ ...laborForm, quantity: e.target.value })} placeholder="VD: 5" min="0.1" step="0.5" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Đơn Giá / Công (VNĐ) *</label>
                  <input type="number" className="form-input" value={laborForm.unitPrice} onChange={(e) => setLaborForm({ ...laborForm, unitPrice: e.target.value })} placeholder="VD: 350000" min="0" required />
                </div>
              </div>

              {/* Preview tổng tiền */}
              {laborAmount > 0 && (
                <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Thành Tiền Dự Tính:</span>
                  <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--orange-primary)' }}>{formatCurrency(laborAmount)}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Ghi Chú</label>
                <input type="text" className="form-input" value={laborForm.note} onChange={(e) => setLaborForm({ ...laborForm, note: e.target.value })} placeholder="Hạng mục thi công, địa điểm..." />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowLaborModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Ghi Nhật Ký'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: Create Machine Entry ===== */}
      {showMachineModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Ghi Nhật Ký Ca Máy Thi Công</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Ghi nhận số ca hoạt động và chi phí vận hành thiết bị thi công</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowMachineModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateMachine}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Ngày Hoạt Động *</label>
                  <input type="date" className="form-input" value={machineForm.workDate} onChange={(e) => setMachineForm({ ...machineForm, workDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Số Ca Máy *</label>
                  <input type="number" className="form-input" value={machineForm.shiftQuantity} onChange={(e) => setMachineForm({ ...machineForm, shiftQuantity: e.target.value })} placeholder="VD: 2" min="0.1" step="0.5" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Máy / Thiết Bị Thi Công *</label>
                <select
                  className="form-select"
                  value={machineForm.machineId}
                  onChange={(e) => setMachineForm({ ...machineForm, machineId: e.target.value })}
                  required
                >
                  <option value="">-- Chọn máy thi công --</option>
                  {availableMachines.map(m => (
                    <option key={m.id} value={m.id}>[{m.code}] {m.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Nhiên Liệu (VNĐ)</label>
                  <input type="number" className="form-input" value={machineForm.fuelCost} onChange={(e) => setMachineForm({ ...machineForm, fuelCost: e.target.value })} placeholder="0" min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Lương Lái Máy (VNĐ)</label>
                  <input type="number" className="form-input" value={machineForm.operatorCost} onChange={(e) => setMachineForm({ ...machineForm, operatorCost: e.target.value })} placeholder="0" min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Khấu Hao / Thuê (VNĐ)</label>
                  <input type="number" className="form-input" value={machineForm.depreciationCost} onChange={(e) => setMachineForm({ ...machineForm, depreciationCost: e.target.value })} placeholder="0" min="0" />
                </div>
              </div>

              {/* Preview tổng */}
              {machineTotalCost > 0 && (
                <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Tổng Chi Phí Ca Máy:</span>
                  <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--orange-primary)' }}>{formatCurrency(machineTotalCost)}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Ghi Chú</label>
                <input type="text" className="form-input" value={machineForm.note} onChange={(e) => setMachineForm({ ...machineForm, note: e.target.value })} placeholder="Công trình / hạng mục thi công..." />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMachineModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Ghi Nhật Ký Ca Máy'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
