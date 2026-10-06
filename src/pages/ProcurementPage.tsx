import React, { useEffect, useState } from 'react';
import { procurementApi, projectApi, catalogsApi } from '../api';
import { Supplier, PurchaseRequest, PurchaseOrder, Project } from '../types';
import { formatCurrency, formatDate, getPurchaseStatusLabel, getStatusBadgeClass } from '../utils/formatters';
import { ShoppingCart, Truck, FileCheck, Plus, Check, X, Building2, Send, Eye } from 'lucide-react';
import { confirmDialog } from '../contexts/ConfirmContext';
import { PRDetailModal } from '../components/procurement/PRDetailModal';
import { PODetailModal } from '../components/procurement/PODetailModal';

interface PRItem {
  materialId: number | '';
  unitId: number | '';
  quantity: string;
  note: string;
}

interface POItem {
  materialId: number | '';
  unitId: number | '';
  quantity: string;
  unitPrice: string;
}

export const ProcurementPage: React.FC = () => {
  const [tab, setTab] = useState<'requests' | 'orders' | 'suppliers'>('requests');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<any[]>([]);
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal: Add Supplier
  const [showSupModal, setShowSupModal] = useState(false);
  const [supForm, setSupForm] = useState({ code: '', name: '', taxCode: '', contactPerson: '', phone: '', email: '', address: '' });

  // Modal: Create Purchase Request
  const [showPRModal, setShowPRModal] = useState(false);
  const [prForm, setPrForm] = useState({ projectId: '', projectItemId: '', projectTaskId: '', requestNo: '', note: '', vatOption: 'NONE' });
  const [prItemsList, setPrItemsList] = useState<any[]>([]);
  const [prTasksList, setPrTasksList] = useState<any[]>([]);
  const [prItems, setPrItems] = useState<PRItem[]>([
    { materialId: '', unitId: '', quantity: '', note: '' }
  ]);

  // Modal: Create Purchase Order
  const [showPOModal, setShowPOModal] = useState(false);
  const [poForm, setPoForm] = useState({
    projectId: '', projectItemId: '', projectTaskId: '', supplierId: '', poNo: '', poDate: '', note: '',
    invoiceNo: '', invoiceDate: '', invoiceStatus: 'PENDING', paymentMethod: '',
    deliveryDate: '',
    vatOption: '10',
    shippingFee: '',
    shippingNote: '',
  });
  const [poItemsList, setPoItemsList] = useState<any[]>([]);
  const [poTasksList, setPoTasksList] = useState<any[]>([]);
  const [poItems, setPoItems] = useState<POItem[]>([
    { materialId: '', unitId: '', quantity: '', unitPrice: '' }
  ]);

  // Executive Modals: PR & PO Details
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);
  const [showPRDetailModal, setShowPRDetailModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [showPODetailModal, setShowPODetailModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sList, rList, oList, pList, mList, uList] = await Promise.all([
        procurementApi.getSuppliers().catch(() => []),
        procurementApi.getPurchaseRequests().catch(() => []),
        procurementApi.getPurchaseOrders().catch(() => []),
        projectApi.getAll().catch(() => []),
        catalogsApi.getMaterials().catch(() => []),
        catalogsApi.getUnits().catch(() => []),
      ]);
      setSuppliers(sList);
      setRequests(rList);
      setOrders(oList);
      setProjects(pList);
      setAvailableMaterials(mList);
      setAvailableUnits(uList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleViewPRDetail = async (pr: PurchaseRequest) => {
    try {
      const fullPR = await procurementApi.getPurchaseRequestById(pr.id);
      setSelectedPR(fullPR || pr);
    } catch {
      setSelectedPR(pr);
    }
    setShowPRDetailModal(true);
  };

  const handleViewPODetail = async (po: PurchaseOrder) => {
    try {
      const fullPO = await procurementApi.getPurchaseOrderById(po.id);
      setSelectedPO(fullPO || po);
    } catch {
      setSelectedPO(po);
    }
    setShowPODetailModal(true);
  };

  const handleApproveRequest = async (id: number) => {
    if (!await confirmDialog({
      title: 'Phê Duyệt Phiếu Yêu Cầu',
      message: 'Xác nhận phê duyệt phiếu yêu cầu vật tư này?',
      confirmText: 'Phê Duyệt',
      type: 'info',
    })) return;
    try {
      await procurementApi.approvePurchaseRequest(id);
      alert('Đã phê duyệt phiếu yêu cầu vật tư thành công!');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi duyệt phiếu yêu cầu');
    }
  };

  const handleRejectRequest = async (id: number, reason: string) => {
    try {
      await procurementApi.rejectPurchaseRequest(id, reason);
      alert('Đã từ chối phiếu yêu cầu vật tư.');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi từ chối phiếu yêu cầu');
    }
  };

  const handleSubmitRequest = async (id: number) => {
    if (!await confirmDialog({
      title: 'Gửi Duyệt Phiếu Yêu Cầu',
      message: 'Xác nhận gửi phiếu yêu cầu này lên cấp quản lý duyệt?',
      confirmText: 'Gửi Duyệt',
      type: 'info',
    })) return;
    try {
      await procurementApi.submitPurchaseRequest(id);
      alert('Đã gửi phiếu yêu cầu thành công!');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi gửi phiếu');
    }
  };

  const handleApproveOrder = async (id: number) => {
    if (!await confirmDialog({
      title: 'Phê Duyệt Đơn Đặt Hàng',
      message: 'Xác nhận phê duyệt đơn đặt hàng PO này?',
      confirmText: 'Phê Duyệt PO',
      type: 'info',
    })) return;
    try {
      await procurementApi.approvePurchaseOrder(id);
      alert('Đã phê duyệt đơn đặt hàng PO thành công!');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi duyệt đơn PO');
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await procurementApi.createSupplier({
        code: supForm.code.trim(),
        name: supForm.name.trim(),
        taxCode: supForm.taxCode.trim() || undefined,
        representative: supForm.contactPerson.trim() || undefined,
        phone: supForm.phone.trim() || undefined,
        email: supForm.email.trim() || undefined,
        address: supForm.address.trim() || undefined,
        isActive: true,
      });
      setShowSupModal(false);
      setSupForm({ code: '', name: '', taxCode: '', contactPerson: '', phone: '', email: '', address: '' });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi thêm nhà cung cấp');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectMaterialPR = (index: number, materialIdStr: string) => {
    const mId = Number(materialIdStr);
    const found = availableMaterials.find(m => m.id === mId);
    setPrItems(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        materialId: mId || '',
        unitId: found?.standardUnitId || next[index].unitId || (availableUnits[0]?.id || ''),
      };
      return next;
    });
  };

  const handleSelectMaterialPO = (index: number, materialIdStr: string) => {
    const mId = Number(materialIdStr);
    const found = availableMaterials.find(m => m.id === mId);
    setPoItems(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        materialId: mId || '',
        unitId: found?.standardUnitId || next[index].unitId || (availableUnits[0]?.id || ''),
      };
      return next;
    });
  };

  const handlePRProjectChange = async (projId: string) => {
    setPrForm(prev => ({ ...prev, projectId: projId, projectItemId: '', projectTaskId: '' }));
    setPrItemsList([]);
    setPrTasksList([]);
    if (projId) {
      try {
        const itms = await projectApi.getItems(Number(projId));
        setPrItemsList(itms);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handlePRItemChange = async (itemId: string) => {
    setPrForm(prev => ({ ...prev, projectItemId: itemId, projectTaskId: '' }));
    setPrTasksList([]);
    if (prForm.projectId && itemId) {
      try {
        const tsks = await projectApi.getTasks(Number(prForm.projectId), Number(itemId));
        setPrTasksList(tsks);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handlePOProjectChange = async (projId: string) => {
    setPoForm(prev => ({ ...prev, projectId: projId, projectItemId: '', projectTaskId: '' }));
    setPoItemsList([]);
    setPoTasksList([]);
    if (projId) {
      try {
        const itms = await projectApi.getItems(Number(projId));
        setPoItemsList(itms);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handlePOItemChange = async (itemId: string) => {
    setPoForm(prev => ({ ...prev, projectItemId: itemId, projectTaskId: '' }));
    setPoTasksList([]);
    if (poForm.projectId && itemId) {
      try {
        const tsks = await projectApi.getTasks(Number(poForm.projectId), Number(itemId));
        setPoTasksList(tsks);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleCreatePR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prForm.projectId) {
      alert('Vui lòng chọn công trình / dự án!');
      return;
    }
    const validItems = prItems.filter(it => it.materialId && Number(it.quantity) > 0);
    if (validItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 loại vật tư và nhập số lượng lớn hơn 0!');
      return;
    }
    setSubmitting(true);
    try {
      const vatNote = prForm.vatOption === 'NONE' || prForm.vatOption === '0'
        ? '[VAT:0] Không tính thuế VAT'
        : `[VAT:${prForm.vatOption}] Có thuế GTGT ${prForm.vatOption}%`;
      const combinedNote = [prForm.note.trim(), vatNote].filter(Boolean).join(' | ');

      await procurementApi.createPurchaseRequest({
        projectId: Number(prForm.projectId),
        requestNo: prForm.requestNo.trim() || undefined,
        note: combinedNote || undefined,
        items: validItems.map(it => ({
          projectItemId: prForm.projectItemId ? Number(prForm.projectItemId) : undefined,
          projectTaskId: prForm.projectTaskId ? Number(prForm.projectTaskId) : undefined,
          materialId: Number(it.materialId),
          unitId: Number(it.unitId) || 1,
          quantity: Number(it.quantity),
          note: it.note.trim() || undefined,
        })),
      });
      setShowPRModal(false);
      setPrForm({ projectId: '', projectItemId: '', projectTaskId: '', requestNo: '', note: '', vatOption: 'NONE' });
      setPrItems([{ materialId: '', unitId: '', quantity: '', note: '' }]);
      alert('Tạo phiếu yêu cầu vật tư thành công!');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tạo phiếu yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poForm.projectId) {
      alert('Vui lòng chọn công trình / dự án!');
      return;
    }
    if (!poForm.supplierId) {
      alert('Vui lòng chọn nhà cung cấp!');
      return;
    }
    const validItems = poItems.filter(it => it.materialId && Number(it.quantity) > 0);
    if (validItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 loại vật tư và nhập số lượng lớn hơn 0!');
      return;
    }
    setSubmitting(true);
    try {
      const rawItemsTotal = validItems.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
      const shippingFeeNum = Number(poForm.shippingFee) || 0;
      const poSubtotal = rawItemsTotal + shippingFeeNum;
      const vatRateNum = (poForm.vatOption === 'NONE' || poForm.vatOption === '0') ? 0 : Number(poForm.vatOption);
      const poVatAmount = Math.round(poSubtotal * (vatRateNum / 100));
      const poGrandTotal = poSubtotal + poVatAmount;

      await procurementApi.createPurchaseOrder({
        projectId: Number(poForm.projectId),
        supplierId: Number(poForm.supplierId),
        poNo: poForm.poNo.trim() || undefined,
        poDate: poForm.poDate || undefined,
        note: [
          poForm.note.trim(),
          shippingFeeNum > 0 ? `Tiền xe bơm/vận chuyển: ${formatCurrency(shippingFeeNum)} (${poForm.shippingNote || 'Ca xe bơm bê tông/vận chuyển'})` : '',
          vatRateNum === 0 ? 'Đơn hàng không chịu thuế VAT / Mua lẻ' : ''
        ].filter(Boolean).join(' | ') || undefined,
        vatRate: vatRateNum,
        vatAmount: poVatAmount,
        amountBeforeTax: poSubtotal,
        totalAmount: poGrandTotal,
        invoiceNo: poForm.invoiceNo.trim() || undefined,
        invoiceDate: poForm.invoiceDate || undefined,
        invoiceStatus: (poForm.vatOption === 'NONE' || poForm.vatOption === '0') ? 'NOT_REQUIRED' : poForm.invoiceStatus,
        paymentMethod: poForm.paymentMethod || undefined,
        deliveryDate: poForm.deliveryDate || undefined,
        items: validItems.map(it => ({
          projectItemId: poForm.projectItemId ? Number(poForm.projectItemId) : undefined,
          projectTaskId: poForm.projectTaskId ? Number(poForm.projectTaskId) : undefined,
          materialId: Number(it.materialId),
          unitId: Number(it.unitId) || 1,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice) || 0,
        })),
      });
      setShowPOModal(false);
      setPoForm({
        projectId: '', projectItemId: '', projectTaskId: '', supplierId: '', poNo: '', poDate: '', note: '',
        invoiceNo: '', invoiceDate: '', invoiceStatus: 'PENDING', paymentMethod: '', deliveryDate: '',
        vatOption: '10', shippingFee: '', shippingNote: '',
      });
      setPoItems([{ materialId: '', unitId: '', quantity: '', unitPrice: '' }]);
      alert('Tạo đơn đặt hàng PO thành công!');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tạo đơn PO');
    } finally {
      setSubmitting(false);
    }
  };

  const addPRItem = () => {
    const defaultUnitId = availableMaterials[0]?.standardUnitId || availableUnits[0]?.id || '';
    setPrItems(prev => [...prev, { materialId: '', unitId: defaultUnitId, quantity: '', note: '' }]);
  };
  const removePRItem = (i: number) => setPrItems(prev => prev.filter((_, idx) => idx !== i));
  const updatePRItem = (i: number, field: keyof PRItem, val: any) =>
    setPrItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

  const addPOItem = () => {
    const defaultUnitId = availableMaterials[0]?.standardUnitId || availableUnits[0]?.id || '';
    setPoItems(prev => [...prev, { materialId: '', unitId: defaultUnitId, quantity: '', unitPrice: '' }]);
  };
  const removePOItem = (i: number) => setPoItems(prev => prev.filter((_, idx) => idx !== i));
  const updatePOItem = (i: number, field: keyof POItem, val: any) =>
    setPoItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

  const rawItemsTotal = poItems.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const shippingFeeNum = Number(poForm.shippingFee) || 0;
  const poSubtotal = rawItemsTotal + shippingFeeNum;
  const vatRateNum = (poForm.vatOption === 'NONE' || poForm.vatOption === '0') ? 0 : Number(poForm.vatOption);
  const poVatAmount = Math.round(poSubtotal * (vatRateNum / 100));
  const poGrandTotal = poSubtotal + poVatAmount;

  return (
    <div>
      {/* Tabs */}
      <div className="tabs-bar" style={{ marginBottom: '20px' }}>
        <button className={`tab-btn ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
          <FileCheck size={16} /> Phiếu Yêu Cầu Vật Tư ({requests.length})
        </button>
        <button className={`tab-btn ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>
          <ShoppingCart size={16} /> Đơn Đặt Hàng PO ({orders.length})
        </button>
        <button className={`tab-btn ${tab === 'suppliers' ? 'active' : ''}`} onClick={() => setTab('suppliers')}>
          <Truck size={16} /> Danh Mục Nhà Cung Cấp ({suppliers.length})
        </button>
      </div>

      {/* Tab 1: Purchase Requests */}
      {tab === 'requests' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h2 className="card-title">Danh Sách Phiếu Yêu Cầu Vật Tư Công Trường</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Yêu cầu cung ứng vật tư từ Ban chỉ huy công trường trình phòng Vật tư - Mua sắm
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowPRModal(true)}>
              <Plus size={16} /> Tạo Phiếu Yêu Cầu Mới
            </button>
          </div>

          <div className="table-container">
            <table className="bmc-table">
              <thead>
                <tr>
                  <th>Mã Phiếu Y/C</th>
                  <th>Công Trình / Dự Án</th>
                  <th>Ngày Đề Nghị</th>
                  <th>Người Lập Phiếu</th>
                  <th>Số Mặt Hàng</th>
                  <th>Ghi Chú</th>
                  <th>Trạng Thái</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--orange-primary)' }}>
                        {r.requestNo || r.requestCode}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.projectName || `Dự án #${r.projectId}`}</td>
                    <td>{formatDate(r.requestDate || r.createdAt)}</td>
                    <td>{r.requestedByName || r.createdByName || '-'}</td>
                    <td>{r.itemsCount || 1} mặt hàng</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{r.note || '-'}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(r.status)}`}>
                        {getPurchaseStatusLabel(r.status)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleViewPRDetail(r)}
                          title="Xem chi tiết danh mục vật tư đề xuất & thẩm định dòng tiền"
                          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={13} /> Chi Tiết
                        </button>
                        {r.status === 'DRAFT' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleSubmitRequest(r.id)}
                            title="Gửi lên để duyệt"
                          >
                            <Send size={13} /> Gửi Duyệt
                          </button>
                        )}
                        {['SUBMITTED', 'DRAFT'].includes(r.status) && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleApproveRequest(r.id)}
                            title="Phê duyệt phiếu yêu cầu"
                          >
                            <Check size={13} /> Duyệt
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Chưa có phiếu yêu cầu vật tư nào. Bấm <strong>"Tạo Phiếu Yêu Cầu Mới"</strong> để bắt đầu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Purchase Orders */}
      {tab === 'orders' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h2 className="card-title">Đơn Đặt Hàng Mua Sắm (Purchase Orders - PO)</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Quản lý hợp đồng cung cấp vật tư với các nhà cung cấp được duyệt
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowPOModal(true)}>
              <Plus size={16} /> Tạo Đơn Đặt Hàng PO
            </button>
          </div>

          <div className="table-container">
            <table className="bmc-table">
              <thead>
                <tr>
                  <th>Số Đơn Hàng PO</th>
                  <th>Công Trình Nhận</th>
                  <th>Nhà Cung Cấp</th>
                  <th>Ngày Đặt</th>
                  <th>Tổng Giá Trị PO</th>
                  <th>Hóa Đơn</th>
                  <th>TT Hóa Đơn</th>
                  <th>Hình Thức TT</th>
                  <th>Trạng Thái</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--blue-tech)' }}>
                        {o.poNo || o.orderCode}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{o.projectName || `Dự án #${o.projectId}`}</td>
                    <td>
                      <Building2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                      {o.supplierName}
                    </td>
                    <td>{formatDate(o.poDate || o.orderDate)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--orange-primary)' }}>
                      {formatCurrency(o.totalAmount)}
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {o.invoiceNo
                        ? <span style={{ fontWeight: 600 }}>{o.invoiceNo}<br/><span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{o.invoiceDate ? formatDate(o.invoiceDate) : ''}</span></span>
                        : <span style={{ color: 'var(--text-muted)' }}>Chưa có</span>
                      }
                    </td>
                    <td>
                      {o.invoiceStatus === 'RECEIVED' && <span className="badge badge-active">Đã nhận HĐ</span>}
                      {o.invoiceStatus === 'PENDING' && <span className="badge badge-warning">Chờ HĐ</span>}
                      {o.invoiceStatus === 'NOT_REQUIRED' && <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>Không cần</span>}
                      {!o.invoiceStatus && <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>}
                    </td>
                    <td>
                      {o.paymentMethod === 'BANK_TRANSFER' && <span className="badge" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>Chuyển khoản</span>}
                      {o.paymentMethod === 'CASH' && <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>Tiền mặt</span>}
                      {!o.paymentMethod && <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(o.status)}`}>
                        {getPurchaseStatusLabel(o.status)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleViewPODetail(o)}
                          title="Xem chi tiết đơn hàng PO & tiến độ dòng tiền"
                          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={13} /> Chi Tiết
                        </button>
                        {['SUBMITTED', 'DRAFT'].includes(o.status) && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleApproveOrder(o.id)}
                            title="Phê duyệt đơn PO"
                          >
                            <Check size={13} /> Duyệt PO
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && !loading && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Chưa có đơn đặt hàng PO nào. Bấm <strong>"Tạo Đơn Đặt Hàng PO"</strong> để tạo mới.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Suppliers */}
      {tab === 'suppliers' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h2 className="card-title">Danh Sách Nhà Cung Cấp Vật Tư & Thiết Bị</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Các đơn vị cung ứng vật liệu xi măng, sắt thép, cát đá, thiết bị cơ giới
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowSupModal(true)}>
              <Plus size={16} /> Thêm Nhà Cung Cấp
            </button>
          </div>

          <div className="table-container">
            <table className="bmc-table">
              <thead>
                <tr>
                  <th>Mã NCC</th>
                  <th>Tên Nhà Cung Cấp</th>
                  <th>Mã Số Thuế</th>
                  <th>Người Liên Hệ</th>
                  <th>Điện Thoại</th>
                  <th>Email</th>
                  <th>Địa Chỉ</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--orange-primary)' }}>{s.code}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.taxCode || '-'}</td>
                    <td>{s.representative || s.contactPerson || '-'}</td>
                    <td>{s.phone || '-'}</td>
                    <td>{s.email || '-'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{s.address || '-'}</td>
                    <td>
                      <span className={`badge ${s.isActive ? 'badge-active' : 'badge-danger'}`}>
                        {s.isActive ? 'Hợp tác' : 'Ngừng'}
                      </span>
                    </td>
                  </tr>
                ))}
                {suppliers.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      Chưa có nhà cung cấp nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== MODAL: Add Supplier ===== */}
      {showSupModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Thêm Nhà Cung Cấp Mới</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowSupModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateSupplier}>
              <div className="form-group">
                <label className="form-label">Mã Nhà Cung Cấp *</label>
                <input type="text" className="form-input" value={supForm.code} onChange={(e) => setSupForm({ ...supForm, code: e.target.value })} placeholder="VD: NCC-HOAPHAT" required />
              </div>
              <div className="form-group">
                <label className="form-label">Tên Nhà Cung Cấp *</label>
                <input type="text" className="form-input" value={supForm.name} onChange={(e) => setSupForm({ ...supForm, name: e.target.value })} placeholder="Tên công ty hoặc doanh nghiệp" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Mã Số Thuế</label>
                  <input type="text" className="form-input" value={supForm.taxCode} onChange={(e) => setSupForm({ ...supForm, taxCode: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Người Liên Hệ</label>
                  <input type="text" className="form-input" value={supForm.contactPerson} onChange={(e) => setSupForm({ ...supForm, contactPerson: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Số Điện Thoại</label>
                  <input type="text" className="form-input" value={supForm.phone} onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={supForm.email} onChange={(e) => setSupForm({ ...supForm, email: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Địa Chỉ</label>
                <input type="text" className="form-input" value={supForm.address} onChange={(e) => setSupForm({ ...supForm, address: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSupModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Lưu Nhà Cung Cấp'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: Create Purchase Request ===== */}
      {showPRModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Tạo Phiếu Yêu Cầu Vật Tư Mới</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Ban chỉ huy công trường lập phiếu yêu cầu vật tư gửi phòng mua sắm</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowPRModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreatePR}>
              {/* WBS Cascading Selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">1. Công Trình / Dự Án *</label>
                  <select
                    className="form-select"
                    value={prForm.projectId}
                    onChange={(e) => handlePRProjectChange(e.target.value)}
                    required
                  >
                    <option value="">-- Chọn dự án --</option>
                    {projects.map(p => <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">2. Hạng Mục Công Trình</label>
                  <select
                    className="form-select"
                    value={prForm.projectItemId}
                    onChange={(e) => handlePRItemChange(e.target.value)}
                    disabled={!prForm.projectId}
                  >
                    <option value="">-- Chọn hạng mục --</option>
                    {prItemsList.map(it => <option key={it.id} value={it.id}>[{it.code}] {it.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">3. Công Tác Sử Dụng</label>
                  <select
                    className="form-select"
                    value={prForm.projectTaskId}
                    onChange={(e) => setPrForm(prev => ({ ...prev, projectTaskId: e.target.value }))}
                    disabled={!prForm.projectItemId}
                  >
                    <option value="">-- Toàn bộ hạng mục --</option>
                    {prTasksList.map(t => <option key={t.id} value={t.id}>[{t.code}] {t.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Số Phiếu Y/C</label>
                  <input type="text" className="form-input" value={prForm.requestNo} onChange={(e) => setPrForm({ ...prForm, requestNo: e.target.value })} placeholder="VD: PR-2026-001" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Thuế GTGT (VAT)</label>
                  <select
                    className="form-select"
                    value={prForm.vatOption}
                    onChange={(e) => setPrForm({ ...prForm, vatOption: e.target.value })}
                  >
                    <option value="NONE">Không tính thuế (0%)</option>
                    <option value="10">Có thuế VAT (10%)</option>
                    <option value="8">Có thuế VAT (8%)</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Ghi Chú Yêu Cầu</label>
                  <input type="text" className="form-input" value={prForm.note} onChange={(e) => setPrForm({ ...prForm, note: e.target.value })} placeholder="Ghi chú yêu cầu đặc biệt, vị trí tập kết..." />
                </div>
              </div>

              {/* Items */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Danh Sách Vật Tư Cần Mua *</label>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addPRItem}>
                    <Plus size={13} /> Thêm Dòng
                  </button>
                </div>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Vật Tư Chọn Từ Danh Mục *</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, width: '100px' }}>ĐVT</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, width: '110px' }}>Số Lượng *</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Ghi Chú</th>
                        <th style={{ width: '36px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {prItems.map((item, i) => (
                        <tr key={i} style={{ borderTop: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '6px 8px' }}>
                            <select
                              className="form-select"
                              value={item.materialId}
                              onChange={(e) => handleSelectMaterialPR(i, e.target.value)}
                              style={{ fontSize: '12px', padding: '6px 8px' }}
                              required
                            >
                              <option value="">-- Chọn vật tư --</option>
                              {availableMaterials.map(m => (
                                <option key={m.id} value={m.id}>[{m.code}] {m.name} {m.specification ? `(${m.specification})` : ''}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <select
                              className="form-select"
                              value={item.unitId}
                              onChange={(e) => updatePRItem(i, 'unitId', Number(e.target.value))}
                              style={{ fontSize: '12px', padding: '6px 8px' }}
                            >
                              {availableUnits.map(u => (
                                <option key={u.id} value={u.id}>{u.symbol || u.name}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="number"
                              className="form-input"
                              value={item.quantity}
                              onChange={(e) => updatePRItem(i, 'quantity', e.target.value)}
                              placeholder="0"
                              min="0.001"
                              step="any"
                              style={{ fontSize: '12px', padding: '6px 8px' }}
                              required
                            />
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="text"
                              className="form-input"
                              value={item.note}
                              onChange={(e) => updatePRItem(i, 'note', e.target.value)}
                              placeholder="Ghi chú..."
                              style={{ fontSize: '12px', padding: '6px 8px' }}
                            />
                          </td>
                          <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                            {prItems.length > 1 && (
                              <button type="button" onClick={() => removePRItem(i)} style={{ background: 'none', border: 'none', color: 'var(--crimson-danger)', cursor: 'pointer', padding: '4px' }}>
                                <X size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPRModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Tạo Phiếu Yêu Cầu'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: Create Purchase Order ===== */}
      {showPOModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '860px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Tạo Đơn Đặt Hàng PO Mới</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Phòng mua sắm phát hành đơn đặt hàng chính thức cho nhà cung cấp</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowPOModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreatePO}>
              {/* WBS Cascading Selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">1. Công Trình / Dự Án *</label>
                  <select
                    className="form-select"
                    value={poForm.projectId}
                    onChange={(e) => handlePOProjectChange(e.target.value)}
                    required
                  >
                    <option value="">-- Chọn dự án --</option>
                    {projects.map(p => <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">2. Hạng Mục Công Trình</label>
                  <select
                    className="form-select"
                    value={poForm.projectItemId}
                    onChange={(e) => handlePOItemChange(e.target.value)}
                    disabled={!poForm.projectId}
                  >
                    <option value="">-- Chọn hạng mục --</option>
                    {poItemsList.map(it => <option key={it.id} value={it.id}>[{it.code}] {it.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">3. Công Tác Sử Dụng</label>
                  <select
                    className="form-select"
                    value={poForm.projectTaskId}
                    onChange={(e) => setPoForm(prev => ({ ...prev, projectTaskId: e.target.value }))}
                    disabled={!poForm.projectItemId}
                  >
                    <option value="">-- Toàn bộ hạng mục --</option>
                    {poTasksList.map(t => <option key={t.id} value={t.id}>[{t.code}] {t.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Nhà Cung Cấp *</label>
                  <select className="form-select" value={poForm.supplierId} onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })} required>
                    <option value="">-- Chọn NCC --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>[{s.code}] {s.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Số PO</label>
                  <input type="text" className="form-input" value={poForm.poNo} onChange={(e) => setPoForm({ ...poForm, poNo: e.target.value })} placeholder="PO-2026-001" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Ngày Đặt Hàng</label>
                  <input type="date" className="form-input" value={poForm.poDate} onChange={(e) => setPoForm({ ...poForm, poDate: e.target.value })} />
                </div>
              </div>

              {/* === Thông tin Hóa đơn & Thuế VAT === */}
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
                <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)' }}>📋 Thuế Suất VAT &amp; Hóa Đơn Chứng Từ</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Chính Sách Thuế VAT *</label>
                    <select
                      className="form-select"
                      value={poForm.vatOption}
                      onChange={(e) => {
                        const opt = e.target.value;
                        setPoForm(prev => ({
                          ...prev,
                          vatOption: opt,
                          invoiceStatus: (opt === 'NONE' || opt === '0') ? 'NOT_REQUIRED' : prev.invoiceStatus
                        }));
                      }}
                    >
                      <option value="10">10% - Hóa đơn GTGT 10% (Thép, xi măng, bê tông...)</option>
                      <option value="8">8% - Hóa đơn GTGT 8% (Chính sách ưu đãi giảm thuế)</option>
                      <option value="0">0% - Thuế suất 0%</option>
                      <option value="NONE">Không có thuế (0%) - Mua lẻ / Hộ kinh doanh / Không HĐ</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Số Hóa Đơn VAT</label>
                    <input
                      type="text"
                      className="form-input"
                      value={poForm.invoiceNo}
                      onChange={(e) => setPoForm({ ...poForm, invoiceNo: e.target.value })}
                      placeholder="VD: 1C26TLP.122"
                      disabled={poForm.vatOption === 'NONE'}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Ngày Hóa Đơn</label>
                    <input
                      type="date"
                      className="form-input"
                      value={poForm.invoiceDate}
                      onChange={(e) => setPoForm({ ...poForm, invoiceDate: e.target.value })}
                      disabled={poForm.vatOption === 'NONE'}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Trạng Thái HĐ</label>
                    <select
                      className="form-select"
                      value={poForm.invoiceStatus}
                      onChange={(e) => setPoForm({ ...poForm, invoiceStatus: e.target.value })}
                    >
                      <option value="PENDING">⏳ Chờ hóa đơn</option>
                      <option value="RECEIVED">✅ Đã nhận HĐ</option>
                      <option value="NOT_REQUIRED">➖ Không cần HĐ</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '12px', marginTop: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Hình Thức TT</label>
                    <select className="form-select" value={poForm.paymentMethod} onChange={(e) => setPoForm({ ...poForm, paymentMethod: e.target.value })}>
                      <option value="">-- Chọn --</option>
                      <option value="BANK_TRANSFER">🏦 Chuyển khoản</option>
                      <option value="CASH">💵 Tiền mặt</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Ngày Giao Hàng TT</label>
                    <input type="date" className="form-input" value={poForm.deliveryDate} onChange={(e) => setPoForm({ ...poForm, deliveryDate: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Ghi Chú PO</label>
                    <input type="text" className="form-input" value={poForm.note} onChange={(e) => setPoForm({ ...poForm, note: e.target.value })} placeholder="Điều kiện đặc biệt, vị trí nhận hàng công trường..." />
                  </div>
                </div>
              </div>

              {/* === Chi phí Dịch vụ Xe bơm bê tông / Vận chuyển đi kèm === */}
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Truck size={16} color="var(--brand-500)" />
                    <span>Chi Phí Xe Bơm Bê Tông &amp; Vận Chuyển Đi Kèm (Nếu có)</span>
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Ví dụ: Ca xe bơm cần 37m/52m, xe bơm tĩnh, phụ phí cước bồn...</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Nội dung chi phí xe bơm / vận chuyển</label>
                    <input
                      type="text"
                      className="form-input"
                      value={poForm.shippingNote}
                      onChange={(e) => setPoForm({ ...poForm, shippingNote: e.target.value })}
                      placeholder="VD: Ca xe bơm cần 37m đổ bê tông đài móng BT-C1 (2 ca)"
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Tiền xe bơm / cước xe (VNĐ)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={poForm.shippingFee}
                      onChange={(e) => setPoForm({ ...poForm, shippingFee: e.target.value })}
                      placeholder="VD: 3500000"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* PO Items */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Danh Sách Hàng Hóa *</label>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addPOItem}>
                    <Plus size={13} /> Thêm Dòng
                  </button>
                </div>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Vật Tư *</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, width: '90px' }}>ĐVT</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, width: '100px' }}>Số Lượng</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, width: '140px' }}>Đơn Giá (VNĐ)</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, width: '130px' }}>Thành Tiền</th>
                        <th style={{ width: '36px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {poItems.map((item, i) => (
                        <tr key={i} style={{ borderTop: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '6px 8px' }}>
                            <select
                              className="form-select"
                              value={item.materialId}
                              onChange={(e) => handleSelectMaterialPO(i, e.target.value)}
                              style={{ fontSize: '12px', padding: '6px 8px' }}
                              required
                            >
                              <option value="">-- Chọn vật tư --</option>
                              {availableMaterials.map(m => (
                                <option key={m.id} value={m.id}>[{m.code}] {m.name}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <select
                              className="form-select"
                              value={item.unitId}
                              onChange={(e) => updatePOItem(i, 'unitId', Number(e.target.value))}
                              style={{ fontSize: '12px', padding: '6px 8px' }}
                            >
                              {availableUnits.map(u => (
                                <option key={u.id} value={u.id}>{u.symbol || u.name}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="number"
                              className="form-input"
                              value={item.quantity}
                              onChange={(e) => updatePOItem(i, 'quantity', e.target.value)}
                              placeholder="0"
                              min="0.001"
                              step="any"
                              style={{ fontSize: '12px', padding: '6px 8px' }}
                              required
                            />
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <input
                              type="number"
                              className="form-input"
                              value={item.unitPrice}
                              onChange={(e) => updatePOItem(i, 'unitPrice', e.target.value)}
                              placeholder="0"
                              min="0"
                              style={{ fontSize: '12px', padding: '6px 8px' }}
                              required
                            />
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--orange-primary)', fontSize: '12px' }}>
                            {formatCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                          </td>
                          <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                            {poItems.length > 1 && (
                              <button type="button" onClick={() => removePOItem(i)} style={{ background: 'none', border: 'none', color: 'var(--crimson-danger)', cursor: 'pointer', padding: '4px' }}>
                                <X size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: '2px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
                        <td colSpan={4} style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, fontSize: '13px' }}>
                          Tiền hàng vật tư:
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, fontSize: '13px' }}>
                          {formatCurrency(rawItemsTotal)}
                        </td>
                        <td></td>
                      </tr>
                      {shippingFeeNum > 0 && (
                        <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                          <td colSpan={4} style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, fontSize: '13px', color: '#0284c7' }}>
                            Tiền xe bơm bê tông / vận chuyển:
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, fontSize: '13px', color: '#0284c7' }}>
                            +{formatCurrency(shippingFeeNum)}
                          </td>
                          <td></td>
                        </tr>
                      )}
                      <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <td colSpan={4} style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, fontSize: '13px' }}>
                          Tiền thuế GTGT ({vatRateNum > 0 ? `${vatRateNum}%` : '0% - Không thuế'}):
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, fontSize: '13px', color: '#64748b' }}>
                          {formatCurrency(poVatAmount)}
                        </td>
                        <td></td>
                      </tr>
                      <tr style={{ backgroundColor: '#fff7ed', borderTop: '1.5px solid var(--brand-500)' }}>
                        <td colSpan={4} style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 800, fontSize: '14px', color: 'var(--brand-600)' }}>
                          TỔNG TIỀN THANH TOÁN ĐƠN ĐẶT HÀNG (PO):
                        </td>
                        <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 900, fontSize: '16px', color: 'var(--brand-600)' }}>
                          {formatCurrency(poGrandTotal)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPOModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Phát Hành Đơn PO'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modals for Director Review */}
      <PRDetailModal
        isOpen={showPRDetailModal}
        onClose={() => {
          setShowPRDetailModal(false);
          setSelectedPR(null);
        }}
        request={selectedPR}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
        onSubmitForApproval={handleSubmitRequest}
      />

      <PODetailModal
        isOpen={showPODetailModal}
        onClose={() => {
          setShowPODetailModal(false);
          setSelectedPO(null);
        }}
        order={selectedPO}
        onApprove={handleApproveOrder}
      />
    </div>
  );
};
