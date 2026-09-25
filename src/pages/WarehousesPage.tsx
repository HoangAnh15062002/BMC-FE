import React, { useEffect, useState } from 'react';
import { warehouseApi, catalogsApi } from '../api';
import { Warehouse, WarehouseStockItem, WarehouseTransaction, StockCard, Material } from '../types';
import { formatCurrency, formatNumber, formatDate, formatUnit } from '../utils/formatters';
import { Warehouse as WarehouseIcon, PackageCheck, History, Eye, Plus, X, FileSpreadsheet, ArrowDownRight, ArrowUpRight, Search, Layers } from 'lucide-react';
import { WBSStockTab } from '../components/warehouses/WBSStockTab';

export const WarehousesPage: React.FC = () => {
  const [tab, setTab] = useState<'warehouses' | 'stocks' | 'project-stocks' | 'transactions' | 'stock-card'>('warehouses');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | undefined>();
  const [stocks, setStocks] = useState<WarehouseStockItem[]>([]);
  const [transactions, setTransactions] = useState<WarehouseTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Stock Card state
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stockCardWarehouseId, setStockCardWarehouseId] = useState<number | undefined>();
  const [stockCardMaterialId, setStockCardMaterialId] = useState<number | undefined>();
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [stockCardData, setStockCardData] = useState<StockCard | null>(null);
  const [loadingStockCard, setLoadingStockCard] = useState(false);

  // New warehouse modal
  const [showWhModal, setShowWhModal] = useState(false);
  const [whForm, setWhForm] = useState({ code: '', name: '', address: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadWarehouses = async () => {
    setLoading(true);
    try {
      const wList = await warehouseApi.getAll();
      setWarehouses(wList);
      if (wList.length > 0 && !selectedWarehouseId) {
        setSelectedWarehouseId(wList[0].id);
        setStockCardWarehouseId(wList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async () => {
    try {
      const mats = await catalogsApi.getMaterials();
      setMaterials(mats);
      if (mats.length > 0 && !stockCardMaterialId) {
        setStockCardMaterialId(mats[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadStockCard = async () => {
    if (!stockCardWarehouseId || !stockCardMaterialId) return;
    setLoadingStockCard(true);
    try {
      const data = await warehouseApi.getStockCard(
        stockCardWarehouseId,
        stockCardMaterialId,
        fromDate || undefined,
        toDate || undefined
      );
      setStockCardData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStockCard(false);
    }
  };

  const loadStocks = async (whId: number) => {
    try {
      const data = await warehouseApi.getStocks(whId);
      setStocks(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await warehouseApi.getTransactions();
      setTransactions(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadWarehouses();
    loadTransactions();
    loadMaterials();
  }, []);

  useEffect(() => {
    if (tab === 'stock-card' && stockCardWarehouseId && stockCardMaterialId) {
      loadStockCard();
    }
  }, [tab, stockCardWarehouseId, stockCardMaterialId]);

  useEffect(() => {
    if (selectedWarehouseId) {
      loadStocks(selectedWarehouseId);
    }
  }, [selectedWarehouseId]);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await warehouseApi.create({
        code: whForm.code.trim(),
        name: whForm.name.trim(),
        address: whForm.address.trim() || undefined,
        isActive: true,
      });
      setShowWhModal(false);
      setWhForm({ code: '', name: '', address: '' });
      loadWarehouses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tạo kho mới');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="tabs-bar" style={{ marginBottom: '20px' }}>
        <button
          className={`tab-btn ${tab === 'warehouses' ? 'active' : ''}`}
          onClick={() => setTab('warehouses')}
        >
          <WarehouseIcon size={16} /> Danh Mục Kho Bãi ({warehouses.length})
        </button>
        <button
          className={`tab-btn ${tab === 'stocks' ? 'active' : ''}`}
          onClick={() => setTab('stocks')}
        >
          <PackageCheck size={16} /> Bảng Tồn Kho Thời Gian Thực
        </button>
        <button
          className={`tab-btn ${tab === 'project-stocks' ? 'active' : ''}`}
          onClick={() => setTab('project-stocks')}
        >
          <Layers size={16} /> Tồn Kho Theo Dự Án & Công Tác (WBS)
        </button>
        <button
          className={`tab-btn ${tab === 'transactions' ? 'active' : ''}`}
          onClick={() => setTab('transactions')}
        >
          <History size={16} /> Lịch Sử Nhập / Xuất Kho ({transactions.length})
        </button>
        <button
          className={`tab-btn ${tab === 'stock-card' ? 'active' : ''}`}
          onClick={() => setTab('stock-card')}
        >
          <FileSpreadsheet size={16} /> Thẻ Kho Chi Tiết (Stock Card)
        </button>
      </div>

      {/* Tab 1: Warehouses */}
      {tab === 'warehouses' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h2 className="card-title">Hệ Thống Kho Tổng & Kho Công Trường</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Quản lý kho trung tâm BMC và các bãi tập kết vật tư tại từng công trình
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowWhModal(true)}>
              <Plus size={16} /> Thêm Kho Mới
            </button>
          </div>

          <div className="table-container">
            <table className="bmc-table">
              <thead>
                <tr>
                  <th>Mã Kho</th>
                  <th>Tên Kho</th>
                  <th>Phân Loại</th>
                  <th>Địa Điểm Bãi Kho</th>
                  <th>Thủ Kho Phụ Trách</th>
                  <th>Tổng Mặt Hàng</th>
                  <th>Tổng Giá Trị Tồn Kho</th>
                  <th>Trạng Thái</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map((w) => (
                  <tr key={w.id}>
                    <td style={{ fontWeight: 700, color: 'var(--orange-primary)' }}>{w.code}</td>
                    <td style={{ fontWeight: 600 }}>{w.name}</td>
                    <td>
                      <span className={`badge ${w.projectId ? 'badge-info' : 'badge-warning'}`}>
                        {w.projectId ? 'Kho Công Trường' : 'Kho Tổng BMC'}
                      </span>
                    </td>
                    <td>{w.address || w.location || '-'}</td>
                    <td>{w.keeperName || 'Thủ kho'}</td>
                    <td>{w.totalItemsCount || 0} mặt hàng</td>
                    <td style={{ fontWeight: 700, color: 'var(--emerald-success)' }}>
                      {formatCurrency(w.totalInventoryValue || w.totalStockValue || 0)}
                    </td>
                    <td>
                      <span className={`badge ${w.isActive ? 'badge-active' : 'badge-danger'}`}>
                        {w.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setSelectedWarehouseId(w.id);
                          setTab('stocks');
                        }}
                      >
                        <Eye size={14} /> Xem tồn kho
                      </button>
                    </td>
                  </tr>
                ))}
                {warehouses.length === 0 && !loading && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Chưa có kho nào được thiết lập.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Real-time Stocks */}
      {tab === 'stocks' && (
        <div>
          <div className="card" style={{ marginBottom: '20px', padding: '14px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '13px' }}>Chọn kho cần xem tồn:</span>
              <select
                className="form-select"
                value={selectedWarehouseId || ''}
                onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
                style={{ minWidth: '300px' }}
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    [{w.code}] {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="card">
            <div className="table-container">
              <table className="bmc-table">
                <thead>
                  <tr>
                    <th>Mã Vật Tư</th>
                    <th>Tên Vật Tư / Quy Cách</th>
                    <th>Đơn Vị Tính</th>
                    <th>Số Lượng Tồn Thực Tế</th>
                    <th>Đơn Giá BQ Di Động</th>
                    <th>Tổng Giá Trị Tồn Kho</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((s, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, color: 'var(--blue-tech)' }}>{s.materialCode}</td>
                      <td style={{ fontWeight: 600 }}>{s.materialName}</td>
                      <td>{formatUnit(s.unitCode || s.unitName)}</td>
                      <td style={{ fontWeight: 700, color: (s.quantityOnHand || s.currentQuantity || 0) < 0 ? 'var(--crimson-danger)' : 'var(--text-main)' }}>
                        {formatNumber(s.quantityOnHand ?? s.currentQuantity ?? 0)}
                      </td>
                      <td>{formatCurrency(s.averageUnitCost)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--orange-primary)' }}>
                        {formatCurrency(s.totalValue || ((s.quantityOnHand ?? s.currentQuantity ?? 0) * (s.averageUnitCost || 0)))}
                      </td>
                    </tr>
                  ))}
                  {stocks.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        Kho này hiện chưa có số liệu phát sinh tồn vật tư.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Project & WBS Stock Allocation */}
      {tab === 'project-stocks' && <WBSStockTab />}

      {/* Tab 3: Transactions */}
      {tab === 'transactions' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h2 className="card-title">Nhật Ký Nhập Xuất Kho Bãi</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Phiếu nhập kho từ PO và phiếu xuất kho cấp phát thi công hiện trường
              </p>
            </div>
          </div>

          <div className="table-container">
            <table className="bmc-table">
              <thead>
                <tr>
                  <th>Mã Phiếu Giao Dịch</th>
                  <th>Kho Bãi</th>
                  <th>Loại Giao Dịch</th>
                  <th>Ngày Lập Phiếu</th>
                  <th>Tổng Giá Trị Phiếu</th>
                  <th>Ghi Chú</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--orange-primary)' }}>{t.transactionCode}</span>
                    </td>
                    <td>{t.warehouseName || `Kho #${t.warehouseId}`}</td>
                    <td>
                      <span className={`badge ${t.transactionType?.startsWith('IN') ? 'badge-approved' : 'badge-warning'}`}>
                        {t.transactionType?.startsWith('IN') ? 'Nhập Kho' : 'Xuất Kho'}
                      </span>
                    </td>
                    <td>{formatDate(t.transactionDate)}</td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(t.totalValue)}</td>
                    <td>{t.note || '-'}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Chưa có giao dịch nhập xuất nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Detailed Stock Card */}
      {tab === 'stock-card' && (
        <div>
          <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr 1fr auto', gap: '14px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>1. Kho Vật Tư *</label>
                <select
                  className="form-select"
                  value={stockCardWarehouseId || ''}
                  onChange={(e) => setStockCardWarehouseId(Number(e.target.value))}
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>[{w.code}] {w.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>2. Danh Mục Vật Tư *</label>
                <select
                  className="form-select"
                  value={stockCardMaterialId || ''}
                  onChange={(e) => setStockCardMaterialId(Number(e.target.value))}
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>[{m.code}] {m.name} ({formatUnit(m.unitName || m.unitCode) || 'ĐVT'})</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>Từ Ngày</label>
                <input
                  type="date"
                  className="form-input"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>Đến Ngày</label>
                <input
                  type="date"
                  className="form-input"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={loadStockCard}
                disabled={loadingStockCard}
                style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Search size={15} /> {loadingStockCard ? 'Đang tải...' : 'Tra Cứu'}
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          {stockCardData && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--blue-tech)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Tồn Đầu Kỳ</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--blue-tech)' }}>
                  {formatNumber(stockCardData.openingBalance)}
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '6px' }}>
                    {formatUnit(stockCardData.unitName)}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Số dư đầu kỳ tra cứu</div>
              </div>

              <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--emerald-success)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Tổng Nhập Trong Kỳ</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--emerald-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ArrowDownRight size={20} />
                  +{formatNumber(stockCardData.totalIn)}
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '4px' }}>
                    {formatUnit(stockCardData.unitName)}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Nhập từ PO & điều chuyển</div>
              </div>

              <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--crimson-danger)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Tổng Xuất Trong Kỳ</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--crimson-danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ArrowUpRight size={20} />
                  -{formatNumber(stockCardData.totalOut)}
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '4px' }}>
                    {formatUnit(stockCardData.unitName)}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Xuất cấp phát thi công WBS</div>
              </div>

              <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--orange-primary)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Tồn Cuối Kỳ</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--orange-primary)' }}>
                  {formatNumber(stockCardData.closingBalance)}
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '6px' }}>
                    {formatUnit(stockCardData.unitName)}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Tồn sổ sách thực tế hiện tại</div>
              </div>
            </div>
          )}

          {/* Ledger Table */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <div>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileSpreadsheet size={18} color="var(--orange-primary)" />
                  Sổ Thẻ Kho: {stockCardData?.materialName ? `[${stockCardData.materialCode}] ${stockCardData.materialName}` : 'Chi tiết nhập xuất'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Kho: <strong>{stockCardData?.warehouseName || warehouses.find(w => w.id === stockCardWarehouseId)?.name || 'Kho đã chọn'}</strong> | ĐVT: <strong>{formatUnit(stockCardData?.unitName) || 'Đơn vị'}</strong>
                </p>
              </div>
            </div>

            <div className="table-container">
              <table className="bmc-table">
                <thead>
                  <tr>
                    <th style={{ width: '100px' }}>Ngày Giao Dịch</th>
                    <th style={{ width: '130px' }}>Số Chứng Từ</th>
                    <th style={{ width: '110px' }}>Loại Phiếu</th>
                    <th>Dự Án / Hạng Mục / Công Tác Nhận</th>
                    <th style={{ width: '110px', textAlign: 'right' }}>Đơn Giá (VNĐ)</th>
                    <th style={{ width: '90px', textAlign: 'right', color: 'var(--emerald-success)' }}>SL Nhập</th>
                    <th style={{ width: '90px', textAlign: 'right', color: 'var(--crimson-danger)' }}>SL Xuất</th>
                    <th style={{ width: '100px', textAlign: 'right', fontWeight: 700 }}>Tồn Lũy Kế</th>
                    <th style={{ width: '130px', textAlign: 'right' }}>Thành Tiền</th>
                    <th>Ghi Chú</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Opening balance row */}
                  {stockCardData && (
                    <tr style={{ backgroundColor: 'var(--bg-tertiary)', fontWeight: 600 }}>
                      <td colSpan={7} style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                        Số dư tồn kho đầu kỳ
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--blue-tech)' }}>
                        {formatNumber(stockCardData.openingBalance)}
                      </td>
                      <td style={{ textAlign: 'right' }}>-</td>
                      <td style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Số dư chuyển tiếp</td>
                    </tr>
                  )}

                  {stockCardData?.entries.map((entry, i) => (
                    <tr key={i}>
                      <td>{formatDate(entry.transactionDate)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--orange-primary)' }}>{entry.transactionNo}</td>
                      <td>
                        <span className={`badge ${entry.transactionType?.startsWith('IN') ? 'badge-approved' : 'badge-warning'}`}>
                          {entry.transactionType?.startsWith('IN') ? 'Nhập Kho' : 'Xuất Kho'}
                        </span>
                      </td>
                      <td>
                        {entry.projectName ? (
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{entry.projectName}</span>
                            {entry.taskName && (
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Công tác: {entry.taskName}
                              </div>
                            )}
                          </div>
                        ) : entry.referenceDoc ? (
                          <span style={{ color: 'var(--blue-tech)' }}>Chứng từ: {entry.referenceDoc}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Kho bãi nội bộ</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(entry.unitPrice)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--emerald-success)' }}>
                        {entry.inQuantity > 0 ? `+${formatNumber(entry.inQuantity)}` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--crimson-danger)' }}>
                        {entry.outQuantity > 0 ? `-${formatNumber(entry.outQuantity)}` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-main)' }}>
                        {formatNumber(entry.balanceAfter)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(entry.totalAmount)}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{entry.note || '-'}</td>
                    </tr>
                  ))}

                  {(!stockCardData || stockCardData.entries.length === 0) && (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        {loadingStockCard ? 'Đang trích xuất dữ liệu thẻ kho...' : 'Chưa có biến động nhập xuất nào cho mặt hàng này trong kỳ tra cứu.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Warehouse */}
      {showWhModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '480px', position: 'relative' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Thêm Kho Bãi Mới</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowWhModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateWarehouse}>
              <div className="form-group">
                <label className="form-label">Mã Kho *</label>
                <input
                  type="text"
                  className="form-input"
                  value={whForm.code}
                  onChange={(e) => setWhForm({ ...whForm, code: e.target.value })}
                  placeholder="VD: KHO-CT-BINHDUONG"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tên Kho Bãi *</label>
                <input
                  type="text"
                  className="form-input"
                  value={whForm.name}
                  onChange={(e) => setWhForm({ ...whForm, name: e.target.value })}
                  placeholder="VD: Kho Vật Tư Công Trường Bình Dương"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Địa Chỉ Bãi Kho</label>
                <input
                  type="text"
                  className="form-input"
                  value={whForm.address}
                  onChange={(e) => setWhForm({ ...whForm, address: e.target.value })}
                  placeholder="Địa chỉ vị trí kho bãi tập kết"
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowWhModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Lưu Kho Bãi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
