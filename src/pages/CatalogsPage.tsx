import React, { useEffect, useState } from 'react';
import { catalogsApi, procurementApi } from '../api';
import { SupplierQuote, Supplier, Material } from '../types';
import { formatCurrency, formatDate, formatUnit } from '../utils/formatters';
import { BookOpen, DollarSign, Users, Wrench, MapPin, Building2, Plus, X, Search, CheckCircle, Edit3, Layers } from 'lucide-react';
import { ProjectWBSNormsTab } from '../components/catalogs/ProjectWBSNormsTab';

export const CatalogsPage: React.FC = () => {
  const [tab, setTab] = useState<'project-norms' | 'norms' | 'quotes' | 'materials' | 'labors' | 'machines' | 'regions'>('project-norms');

  const [norms, setNorms] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [labors, setLabors] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<SupplierQuote[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [rawMaterials, setRawMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter for quotes
  const [filterMaterialId, setFilterMaterialId] = useState<string>('');
  const [filterSupplierId, setFilterSupplierId] = useState<string>('');

  // Modal: Upsert Quote
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    supplierId: '',
    materialId: '',
    unitPrice: '',
    leadTimeDays: '3',
    isPreferred: false,
    note: '',
  });

  // Modal: Create Custom Norm
  const [showNormModal, setShowNormModal] = useState(false);
  const [normForm, setNormForm] = useState({
    code: '',
    name: '',
    unit: 'm3',
    catalogName: 'Định mức nội bộ BMC',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [nList, mList, lList, macList, rList, qList, sList, rawMatList] = await Promise.all([
        catalogsApi.getNormTasks().catch(() => []),
        catalogsApi.getMaterialPrices().catch(() => []),
        catalogsApi.getLaborPrices().catch(() => []),
        catalogsApi.getMachinePrices().catch(() => []),
        catalogsApi.getRegions().catch(() => []),
        procurementApi.getQuotes().catch(() => []),
        procurementApi.getSuppliers().catch(() => []),
        catalogsApi.getMaterials().catch(() => []),
      ]);
      setNorms(nList);
      setMaterials(mList);
      setLabors(lList);
      setMachines(macList);
      setRegions(rList);
      setQuotes(qList);
      setSuppliers(sList);
      setRawMaterials(rawMatList);

      if (sList.length > 0 && !quoteForm.supplierId) {
        setQuoteForm((prev) => ({ ...prev, supplierId: String(sList[0].id) }));
      }
      if (rawMatList.length > 0 && !quoteForm.materialId) {
        setQuoteForm((prev) => ({ ...prev, materialId: String(rawMatList[0].id) }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const reloadQuotes = async () => {
    try {
      const qList = await procurementApi.getQuotes(
        filterMaterialId ? Number(filterMaterialId) : undefined,
        filterSupplierId ? Number(filterSupplierId) : undefined
      );
      setQuotes(qList);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (tab === 'quotes') {
      reloadQuotes();
    }
  }, [filterMaterialId, filterSupplierId, tab]);

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForm.supplierId || !quoteForm.materialId) {
      alert('Vui lòng chọn nhà cung cấp và vật tư!');
      return;
    }
    setSubmitting(true);
    try {
      await procurementApi.upsertQuote(Number(quoteForm.supplierId), {
        materialId: Number(quoteForm.materialId),
        unitPrice: Number(quoteForm.unitPrice) || 0,
        leadTimeDays: Number(quoteForm.leadTimeDays) || 3,
        isPreferred: quoteForm.isPreferred,
        note: quoteForm.note.trim() || undefined,
      });
      setShowQuoteModal(false);
      alert('Lưu báo giá nhà cung cấp thành công!');
      reloadQuotes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi lưu báo giá');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateNorm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!normForm.code.trim() || !normForm.name.trim()) {
      alert('Vui lòng nhập mã và tên công tác định mức!');
      return;
    }
    setSubmitting(true);
    try {
      await catalogsApi.createNormTask({
        code: normForm.code.trim(),
        name: normForm.name.trim(),
        unit: normForm.unit.trim(),
        normCatalogName: normForm.catalogName.trim(),
        description: normForm.description.trim() || undefined,
      });
      setShowNormModal(false);
      setNormForm({
        code: '',
        name: '',
        unit: 'm3',
        catalogName: 'Định mức nội bộ BMC',
        description: '',
      });
      alert('Tạo định mức công tác mới thành công!');
      const updated = await catalogsApi.getNormTasks();
      setNorms(updated);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tạo định mức');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="tabs-bar" style={{ marginBottom: '20px' }}>
        <button
          className={`tab-btn ${tab === 'project-norms' ? 'active' : ''}`}
          onClick={() => setTab('project-norms')}
        >
          <Layers size={16} /> Định Mức & Đơn Giá Dự Án Theo Thời Điểm
        </button>
        <button
          className={`tab-btn ${tab === 'norms' ? 'active' : ''}`}
          onClick={() => setTab('norms')}
        >
          <BookOpen size={16} /> Định Mức Công Tác ({norms.length})
        </button>
        <button
          className={`tab-btn ${tab === 'quotes' ? 'active' : ''}`}
          onClick={() => setTab('quotes')}
        >
          <Building2 size={16} /> Báo Giá Đa Nhà Cung Cấp ({quotes.length})
        </button>
        <button
          className={`tab-btn ${tab === 'materials' ? 'active' : ''}`}
          onClick={() => setTab('materials')}
        >
          <DollarSign size={16} /> Giá Vật Liệu Liên Sở ({materials.length})
        </button>
        <button
          className={`tab-btn ${tab === 'labors' ? 'active' : ''}`}
          onClick={() => setTab('labors')}
        >
          <Users size={16} /> Giá Nhân Công ({labors.length})
        </button>
        <button
          className={`tab-btn ${tab === 'machines' ? 'active' : ''}`}
          onClick={() => setTab('machines')}
        >
          <Wrench size={16} /> Giá Ca Máy Thi Công ({machines.length})
        </button>
        <button
          className={`tab-btn ${tab === 'regions' ? 'active' : ''}`}
          onClick={() => setTab('regions')}
        >
          <MapPin size={16} /> Vùng & Địa Bàn ({regions.length})
        </button>
      </div>

      {/* ==================== TAB 0: PROJECT WBS NORMS & MONTHLY PRICE HISTORY ==================== */}
      {tab === 'project-norms' && <ProjectWBSNormsTab />}

      {/* ==================== TAB 1: NORMS ==================== */}
      {tab === 'norms' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Định Mức Xây Dựng Cơ Sở & Doanh Nghiệp</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Tra cứu bộ định mức dự toán xây dựng công trình theo Thông tư BXD và định mức nội bộ doanh nghiệp BMC
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowNormModal(true)}>
              <Plus size={16} /> Tạo Định Mức Mới
            </button>
          </div>

          <div className="table-container">
            <table className="bmc-table">
              <thead>
                <tr>
                  <th>Mã Hiệu Công Tác</th>
                  <th>Tên Công Tác Xây Dựng</th>
                  <th>Đơn Vị Tính</th>
                  <th>Bộ Định Mức Ban Hành</th>
                </tr>
              </thead>
              <tbody>
                {norms.map((n) => (
                  <tr key={n.id}>
                    <td style={{ fontWeight: 700, color: 'var(--orange-primary)' }}>{n.code}</td>
                    <td style={{ fontWeight: 600 }}>{n.name}</td>
                    <td>{formatUnit(n.unitName || n.unit?.symbol || n.unit)}</td>
                    <td>
                      <span className="badge badge-info">
                        {n.normCatalogName || 'Thông tư 12/2021/TT-BXD'}
                      </span>
                    </td>
                  </tr>
                ))}
                {norms.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Chưa có dữ liệu công tác định mức.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: MULTI-SUPPLIER QUOTES ==================== */}
      {tab === 'quotes' && (
        <div>
          {/* Filter Bar */}
          <div className="card" style={{ marginBottom: '20px', padding: '14px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>1. Lọc Theo Vật Tư Cần So Sánh Giá</label>
                <select
                  className="form-select"
                  value={filterMaterialId}
                  onChange={(e) => setFilterMaterialId(e.target.value)}
                >
                  <option value="">-- Tất cả vật tư --</option>
                  {rawMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.code}] {m.name} ({formatUnit(m.unitName || m.unitCode) || 'ĐVT'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>2. Lọc Theo Nhà Cung Cấp</label>
                <select
                  className="form-select"
                  value={filterSupplierId}
                  onChange={(e) => setFilterSupplierId(e.target.value)}
                >
                  <option value="">-- Tất cả nhà cung cấp --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.code}] {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => {
                  setQuoteForm((prev) => ({
                    ...prev,
                    materialId: filterMaterialId || (rawMaterials[0] ? String(rawMaterials[0].id) : ''),
                    supplierId: filterSupplierId || (suppliers[0] ? String(suppliers[0].id) : ''),
                  }));
                  setShowQuoteModal(true);
                }}
                style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> Cập Nhật Báo Giá NCC
              </button>
            </div>
          </div>

          {/* Quotes Table */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <div>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={18} color="var(--orange-primary)" />
                  Bảng So Sánh Báo Giá Từ Nhiều Nhà Cung Cấp
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Quản lý giá chào thầu và điều kiện giao hàng từ các nhà cung ứng khác nhau cho cùng một loại vật liệu
                </p>
              </div>
            </div>

            <div className="table-container">
              <table className="bmc-table">
                <thead>
                  <tr>
                    <th>Mã & Tên Vật Tư</th>
                    <th>ĐVT</th>
                    <th>Nhà Cung Cấp</th>
                    <th>Người Liên Hệ & SĐT</th>
                    <th style={{ textAlign: 'right', color: 'var(--orange-primary)' }}>Đơn Giá Báo (VNĐ)</th>
                    <th>Ngày Báo Giá</th>
                    <th style={{ textAlign: 'center' }}>Thời Gian Giao</th>
                    <th style={{ textAlign: 'center' }}>Ưu Tiên</th>
                    <th>Ghi Chú</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q, idx) => (
                    <tr key={idx}>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--blue-tech)' }}>{q.materialCode}</span>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{q.materialName}</div>
                      </td>
                      <td>{formatUnit(q.unitName)}</td>
                      <td>
                        <span style={{ fontWeight: 700 }}>{q.supplierName}</span>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>[{q.supplierCode}]</div>
                      </td>
                      <td>
                        <div>{q.contactPerson || '-'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--blue-tech)' }}>{q.phone || ''}</div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '14px', color: 'var(--orange-primary)' }}>
                        {formatCurrency(q.unitPrice)}
                      </td>
                      <td>{formatDate(q.quotedDate)}</td>
                      <td style={{ textAlign: 'center' }}>
                        {q.leadTimeDays ? `${q.leadTimeDays} ngày` : 'Sẵn kho'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {q.isPreferred ? (
                          <span className="badge badge-approved" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={12} /> Ưu Tiên
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Dự phòng</span>
                        )}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{q.note || '-'}</td>
                      <td>
                        <button
                          className="btn-icon"
                          title="Cập nhật báo giá này"
                          onClick={() => {
                            setQuoteForm({
                              supplierId: String(q.supplierId),
                              materialId: String(q.materialId),
                              unitPrice: String(q.unitPrice || ''),
                              leadTimeDays: String(q.leadTimeDays || '3'),
                              isPreferred: q.isPreferred,
                              note: q.note || '',
                            });
                            setShowQuoteModal(true);
                          }}
                        >
                          <Edit3 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {quotes.length === 0 && !loading && (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        Chưa có báo giá nào từ nhà cung cấp cho tiêu chí đã chọn. Bấm <strong>"Cập Nhật Báo Giá NCC"</strong> để thêm báo giá.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: MATERIALS ==================== */}
      {tab === 'materials' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Đơn Giá Vật Liệu Theo Công Bố Liên Sở Xây Dựng - Tài Chính</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Bảng giá công bố định kỳ theo địa bàn phục vụ tính toán dự toán công trình
              </p>
            </div>
          </div>
          <div className="table-container">
            <table className="bmc-table">
              <thead>
                <tr>
                  <th>Mã Vật Liệu</th>
                  <th>Tên Vật Tư / Quy Cách</th>
                  <th>Đơn Vị</th>
                  <th>Kỳ Công Bố</th>
                  <th style={{ textAlign: 'right' }}>Đơn Giá Công Bố (VNĐ)</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 700, color: 'var(--blue-tech)' }}>{m.materialCode || m.code}</td>
                    <td style={{ fontWeight: 600 }}>{m.materialName || m.name}</td>
                    <td>{formatUnit(m.unitName || m.unitSymbol)}</td>
                    <td>{m.pricePeriodName || 'Tháng 03/2026'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--orange-primary)' }}>
                      {formatCurrency(m.price || m.unitPrice)}
                    </td>
                  </tr>
                ))}
                {materials.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Chưa có bảng giá vật liệu công bố.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: LABORS ==================== */}
      {tab === 'labors' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Đơn Giá Nhân Công Xây Dựng Theo Cấp Bậc</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Đơn giá ca làm việc 8h của thợ xây dựng theo vùng lương quy định
              </p>
            </div>
          </div>
          <div className="table-container">
            <table className="bmc-table">
              <thead>
                <tr>
                  <th>Mã Nhân Công</th>
                  <th>Nhóm / Cấp Bậc Thợ</th>
                  <th>Kỳ Công Bố</th>
                  <th style={{ textAlign: 'right' }}>Đơn Giá Ngày Công (8h)</th>
                </tr>
              </thead>
              <tbody>
                {labors.map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 700, color: 'var(--blue-tech)' }}>{l.laborCode || l.code}</td>
                    <td style={{ fontWeight: 600 }}>{l.laborName || l.name || 'Thợ bậc 3.5/7 Nhóm 1'}</td>
                    <td>{l.pricePeriodName || 'Quy chuẩn 2026'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--emerald-success)' }}>
                      {formatCurrency(l.price || l.dailyRate)}
                    </td>
                  </tr>
                ))}
                {labors.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Chưa có đơn giá nhân công công bố.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: MACHINES ==================== */}
      {tab === 'machines' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Bảng Giá Ca Máy & Thiết Bị Thi Công Chuẩn</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Đơn giá định mức 1 ca hoạt động của thiết bị xây dựng bao gồm chi phí khấu hao, sửa chữa và nhiên liệu
              </p>
            </div>
          </div>
          <div className="table-container">
            <table className="bmc-table">
              <thead>
                <tr>
                  <th>Mã Ca Máy</th>
                  <th>Loại Máy / Thiết Bị Thi Công</th>
                  <th>Công Suất / Thông Số</th>
                  <th style={{ textAlign: 'right' }}>Đơn Giá Ca Máy</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((mac) => (
                  <tr key={mac.id}>
                    <td style={{ fontWeight: 700, color: 'var(--blue-tech)' }}>{mac.machineCode || mac.code}</td>
                    <td style={{ fontWeight: 600 }}>{mac.machineName || mac.name}</td>
                    <td>{mac.specification || 'Theo Thông tư BXD'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--orange-primary)' }}>
                      {formatCurrency(mac.price || mac.shiftPrice)}
                    </td>
                  </tr>
                ))}
                {machines.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Chưa có đơn giá ca máy công bố.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 6: REGIONS ==================== */}
      {tab === 'regions' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Phân Vùng Lương & Địa Bàn Áp Dụng Dự Toán</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Bảng phân loại vùng lương tối thiểu theo Nghị định Chính phủ
              </p>
            </div>
          </div>
          <div className="table-container">
            <table className="bmc-table">
              <thead>
                <tr>
                  <th>Mã Vùng</th>
                  <th>Tên Vùng / Tỉnh Thành</th>
                  <th>Khu Vực Lương (Nghị Định)</th>
                  <th>Mô Tả Địa Bàn</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700 }}>{r.code}</td>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td><span className="badge badge-info">{r.salaryRegion || 'Vùng I'}</span></td>
                    <td>{r.description || 'Áp dụng mức lương tối thiểu vùng I'}</td>
                  </tr>
                ))}
                {regions.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Chưa có danh mục vùng lương.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== MODAL: Upsert Supplier Quote ===== */}
      {showQuoteModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Cập Nhật Báo Giá Nhà Cung Cấp</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Ghi nhận bảng giá chào từ nhà cung ứng cho vật liệu xây dựng
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowQuoteModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveQuote}>
              <div className="form-group">
                <label className="form-label">Nhà Cung Cấp *</label>
                <select
                  className="form-select"
                  value={quoteForm.supplierId}
                  onChange={(e) => setQuoteForm({ ...quoteForm, supplierId: e.target.value })}
                  required
                >
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.code}] {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Vật Tư Báo Giá *</label>
                <select
                  className="form-select"
                  value={quoteForm.materialId}
                  onChange={(e) => setQuoteForm({ ...quoteForm, materialId: e.target.value })}
                  required
                >
                  <option value="">-- Chọn vật tư --</option>
                  {rawMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.code}] {m.name} ({formatUnit(m.unitName || m.unitCode) || 'ĐVT'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Đơn Giá Chào Bán (VNĐ) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={quoteForm.unitPrice}
                    onChange={(e) => setQuoteForm({ ...quoteForm, unitPrice: e.target.value })}
                    placeholder="VD: 1450000"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Thời Gian Giao (Ngày)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={quoteForm.leadTimeDays}
                    onChange={(e) => setQuoteForm({ ...quoteForm, leadTimeDays: e.target.value })}
                    placeholder="VD: 3"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={quoteForm.isPreferred}
                    onChange={(e) => setQuoteForm({ ...quoteForm, isPreferred: e.target.checked })}
                  />
                  <strong>Đặt làm nhà cung cấp ưu tiên (Preferred Supplier) cho loại vật tư này</strong>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Ghi Chú Báo Giá</label>
                <input
                  type="text"
                  className="form-input"
                  value={quoteForm.note}
                  onChange={(e) => setQuoteForm({ ...quoteForm, note: e.target.value })}
                  placeholder="Điều kiện thanh toán, chiết khấu số lượng lớn, phí vận chuyển..."
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowQuoteModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Lưu Báo Giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: Create Custom Norm ===== */}
      {showNormModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Tạo Mới Định Mức Công Tác</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Thiết lập mã hiệu và tên công tác định mức xây dựng nội bộ
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowNormModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateNorm}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Mã Hiệu Định Mức *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={normForm.code}
                    onChange={(e) => setNormForm({ ...normForm, code: e.target.value })}
                    placeholder="VD: AF.11210-BMC"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Đơn Vị Tính *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={normForm.unit}
                    onChange={(e) => setNormForm({ ...normForm, unit: e.target.value })}
                    placeholder="VD: m3, m2, 100m, tấn"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tên Công Tác Xây Dựng *</label>
                <input
                  type="text"
                  className="form-input"
                  value={normForm.name}
                  onChange={(e) => setNormForm({ ...normForm, name: e.target.value })}
                  placeholder="VD: Bê tông móng, đá 1x2, mác 250 - thi công nội bộ BMC"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bộ Định Mức / Phân Loại</label>
                <input
                  type="text"
                  className="form-input"
                  value={normForm.catalogName}
                  onChange={(e) => setNormForm({ ...normForm, catalogName: e.target.value })}
                  placeholder="VD: Định mức nội bộ BMC 2026"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mô Tả Quy Cách & Biện Pháp Thi Công</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={normForm.description}
                  onChange={(e) => setNormForm({ ...normForm, description: e.target.value })}
                  placeholder="Thành phần hao phí vật liệu, nhân công, máy thi công tương ứng..."
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNormModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Lưu Định Mức'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
