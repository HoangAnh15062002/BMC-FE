import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { estimateApi, projectApi, catalogsApi } from '../api';
import { EstimateVersion, Project } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { confirmDialog } from '../contexts/ConfirmContext';
import {
  Calculator,
  Download,
  Play,
  Plus,
  RefreshCw,
  Award,
  Eye,
  Send,
  CheckCircle,
  Star,
  X,
  FileSpreadsheet,
  Sliders,
  Percent,
  Settings,
} from 'lucide-react';
import { EstimateDetailModal } from '../components/estimates/EstimateDetailModal';
import { exportEstimateToExcel } from '../utils/estimateExcelExport';

const DEFAULT_COST_COMPONENTS = [
  { costComponentCatalogId: 1, baseCode: 'DIRECT_COST', ratePercent: 6.5, calculationOrder: 10 },
  { costComponentCatalogId: 2, baseCode: 'DIRECT_COST', ratePercent: 1.2, calculationOrder: 20 },
  { costComponentCatalogId: 4, baseCode: 'DIRECT_COST', ratePercent: 2.5, calculationOrder: 30 },
  { costComponentCatalogId: 3, baseCode: 'DIRECT_AND_OVERHEAD', ratePercent: 5.5, calculationOrder: 40 },
];

export const EstimatesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const savedProjectId = localStorage.getItem('bmc_active_project_id')
    ? Number(localStorage.getItem('bmc_active_project_id'))
    : undefined;
  const initialProjectId = searchParams.get('projectId')
    ? Number(searchParams.get('projectId'))
    : (savedProjectId || 9);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(initialProjectId);
  const [estimates, setEstimates] = useState<EstimateVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculatingId, setCalculatingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Regions & price periods for new estimate form
  const [regions, setRegions] = useState<any[]>([]);
  const [pricePeriods, setPricePeriods] = useState<any[]>([]);

  // Modal: Create new estimate version
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    versionName: '',
    description: '',
    regionCode: '',
    pricePeriodId: '',
    vatRate: '8',
    materialAdjustmentFactor: '1.0',
    laborAdjustmentFactor: '1.0',
    machineAdjustmentFactor: '1.0',
  });
  const [submitting, setSubmitting] = useState(false);

  // Modal: Calculate & Adjust Tax/Factors
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [calcTargetEst, setCalcTargetEst] = useState<EstimateVersion | null>(null);
  const [calcParams, setCalcParams] = useState({
    vatRate: '8',
    materialAdjustmentFactor: '1.0',
    laborAdjustmentFactor: '1.0',
    machineAdjustmentFactor: '1.0',
  });

  // Modal: View detail
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailEst, setDetailEst] = useState<any | null>(null);

  const loadProjects = async () => {
    try {
      const projs = await projectApi.getAll();
      setProjects(projs);
      if (!selectedProjectId && projs.length > 0) {
        setSelectedProjectId(projs[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadEstimates = async (projId: number) => {
    setLoading(true);
    try {
      const data = await estimateApi.getByProject(projId);
      setEstimates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogs = async () => {
    try {
      const [rList, ppList] = await Promise.all([
        catalogsApi.getRegions().catch(() => []),
        catalogsApi.getPricePeriods().catch(() => []),
      ]);
      setRegions(rList);
      setPricePeriods(ppList);
      if (ppList && ppList.length > 0) {
        setCreateForm((prev) => ({ ...prev, pricePeriodId: prev.pricePeriodId || String(ppList[0].id) }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProjects();
    loadCatalogs();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem('bmc_active_project_id', String(selectedProjectId));
      loadEstimates(selectedProjectId);
    }
  }, [selectedProjectId]);

  const openCalcModal = (est: EstimateVersion) => {
    setCalcTargetEst(est);
    setCalcParams({
      vatRate: String(est.vatRateSnapshot ?? 8),
      materialAdjustmentFactor: String(est.materialAdjustmentFactor ?? 1.0),
      laborAdjustmentFactor: String(est.laborAdjustmentFactor ?? 1.0),
      machineAdjustmentFactor: String(est.machineAdjustmentFactor ?? 1.0),
    });
    setShowCalcModal(true);
  };

  const handleExecuteCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !calcTargetEst) return;
    setCalculatingId(calcTargetEst.id);
    try {
      await estimateApi.calculate(selectedProjectId, calcTargetEst.id, {
        materialAdjustmentFactor: Number(calcParams.materialAdjustmentFactor) || 1.0,
        laborAdjustmentFactor: Number(calcParams.laborAdjustmentFactor) || 1.0,
        machineAdjustmentFactor: Number(calcParams.machineAdjustmentFactor) || 1.0,
        vatRate: calcParams.vatRate !== '' ? Number(calcParams.vatRate) : undefined,
        rowVersion: calcTargetEst.rowVersion || undefined,
        costComponents: DEFAULT_COST_COMPONENTS,
      });
      setShowCalcModal(false);
      alert('Đã cập nhật thuế VAT và chạy Engine tính toán chi phí tự động thành công!');
      await loadEstimates(selectedProjectId);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : null) ||
        err.message ||
        'Lỗi khi tính toán dự toán';
      alert(msg);
    } finally {
      setCalculatingId(null);
    }
  };

  const handleExportExcel = async (id: number, versionName?: string) => {
    if (!selectedProjectId) return;
    setDownloadingId(id);
    const proj = projects.find(p => p.id === selectedProjectId);
    const safeProject = (proj?.code || `Project_${selectedProjectId}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeName = (versionName || `v${id}`).replace(/\s+/g, '_');
    const filename = `DuToan_${safeProject}_${safeName}.xlsx`;

    try {
      // 1. Prioritize official backend master export (7 sheets ClosedXML standard)
      await estimateApi.downloadExcel(selectedProjectId, id, filename);
    } catch (err: any) {
      console.warn('Backend excel export failed, falling back to client-side generator:', err);
      try {
        const detail: any = await estimateApi.getById(selectedProjectId, id);
        
        // Aggregate resources for Sheet 3
        const resourceMap = new Map<string, any>();
        const rawItems = detail.items || [];
        const normalizedItems = rawItems.map((it: any, idx: number) => {
          const code = it.itemCodeSnapshot || it.code || it.itemCode || `HM-${idx + 1}`;
          const name = it.itemNameSnapshot || it.name || it.itemName || `Hạng mục ${idx + 1}`;
          const material = it.totalMaterial ?? it.materialCost ?? 0;
          const labor = it.totalLabor ?? it.laborCost ?? 0;
          const machine = it.totalMachine ?? it.machineCost ?? 0;
          const direct = it.totalDirectCost ?? it.totalAmount ?? (material + labor + machine);
          const tasks = (it.tasks || []).map((t: any, tIdx: number) => {
            const tQty = t.quantitySnapshot ?? t.quantity ?? 1;
            // Aggregate resources if present
            (t.resources || []).forEach((r: any) => {
              const rType = r.resourceType || 'MATERIAL';
              const rCode = r.resourceCodeSnapshot || r.code || 'VT-00';
              const rName = r.resourceNameSnapshot || r.name || 'Tài nguyên';
              const rUnit = r.unitCodeSnapshot || r.unit || '';
              const rQty = r.requiredQuantity ?? ((r.normQuantitySnapshot || 0) * tQty);
              const rPrice = r.unitPriceSnapshot ?? r.unitPrice ?? 0;
              const rAmt = r.amount ?? (rQty * rPrice);
              const key = `${rType}_${rCode}`;
              if (resourceMap.has(key)) {
                const ex = resourceMap.get(key);
                ex.totalQuantity += rQty;
                ex.totalAmount += rAmt;
              } else {
                resourceMap.set(key, {
                  type: rType,
                  code: rCode,
                  name: rName,
                  unit: rUnit,
                  totalQuantity: rQty,
                  unitPrice: rPrice,
                  totalAmount: rAmt,
                });
              }
            });

            return {
              code: t.taskCodeSnapshot || t.code || `CT-${tIdx + 1}`,
              name: t.taskNameSnapshot || t.name || `Công tác ${tIdx + 1}`,
              quantity: tQty,
              unit: t.unitCode || t.unitCodeSnapshot || t.unitSymbolSnapshot || t.unitName || '',
              unitPrice: t.unitPrice ?? 0,
              materialTotal: t.materialTotal ?? (t.materialUnitPrice ? t.materialUnitPrice * tQty : 0),
              laborTotal: t.laborTotal ?? (t.laborUnitPrice ? t.laborUnitPrice * tQty : 0),
              machineTotal: t.machineTotal ?? (t.machineUnitPrice ? t.machineUnitPrice * tQty : 0),
              directCost: t.directCost ?? t.amount ?? 0,
            };
          });
          return {
            code,
            name,
            totalMaterial: material,
            totalLabor: labor,
            totalMachine: machine,
            totalDirectCost: direct,
            tasks,
          };
        });

        const totalDirect = detail.totalDirectCost ?? 0;
        const totalBeforeTax = detail.totalBeforeTax ?? (totalDirect * 1.16);
        const totalIndirect = detail.totalIndirectCost ?? Math.max(0, totalBeforeTax - totalDirect);
        const vatRate = detail.vatRateSnapshot ?? 10;
        const vatAmount = detail.vatAmount ?? (totalBeforeTax * (vatRate / 100));
        const totalEst = detail.totalEstimate ?? detail.totalAfterTax ?? (totalBeforeTax + vatAmount);

        exportEstimateToExcel({
          projectName: proj?.name,
          projectCode: proj?.code,
          versionName: detail.versionName || detail.name || versionName,
          versionNo: detail.versionNo || 1,
          pricePeriod: detail.pricePeriodCodeSnapshot || detail.pricePeriodCode || 'PP-2024-Q1',
          normStandard: 'Thông tư 12/2021/TT-BXD',
          totalDirectCost: totalDirect,
          totalMaterial: detail.totalMaterial ?? 0,
          totalLabor: detail.totalLabor ?? 0,
          totalMachine: detail.totalMachine ?? 0,
          totalIndirectCost: totalIndirect,
          totalBeforeTax,
          vatRate,
          vatAmount,
          totalEstimate: totalEst,
          items: normalizedItems,
          aggregatedResources: Array.from(resourceMap.values()),
        });
      } catch (clientErr: any) {
        alert('Lỗi khi xuất file Excel dự toán: ' + (clientErr.message || clientErr));
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSubmit = async (est: EstimateVersion) => {
    if (!selectedProjectId) return;
    const name = est.versionName || est.name || `Phiên bản v${est.versionNo}`;
    if (!await confirmDialog({
      title: 'Trình Duyệt Dự Toán',
      message: `Xác nhận trình duyệt phiên bản "${name}"?`,
      confirmText: 'Trình Duyệt',
      type: 'info',
    })) return;
    try {
      await estimateApi.submit(selectedProjectId, est.id, {
        rowVersion: est.rowVersion || undefined,
      });
      alert('Đã trình duyệt dự toán thành công!');
      loadEstimates(selectedProjectId);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : null) ||
        err.message ||
        'Lỗi khi trình duyệt';
      alert(msg);
    }
  };

  const handleApprove = async (est: EstimateVersion) => {
    if (!selectedProjectId) return;
    const name = est.versionName || est.name || `Phiên bản v${est.versionNo}`;
    if (!await confirmDialog({
      title: 'Phê Duyệt Dự Toán',
      message: `Xác nhận PHÊ DUYỆT phiên bản "${name}"? Thao tác này sẽ chính thức hóa dự toán dự án!`,
      confirmText: 'Phê Duyệt Dự Toán',
      type: 'warning',
    })) return;
    try {
      await estimateApi.approve(selectedProjectId, est.id, {
        rowVersion: est.rowVersion || undefined,
      });
      alert('Đã phê duyệt dự toán thành công!');
      loadEstimates(selectedProjectId);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : null) ||
        err.message ||
        'Lỗi khi phê duyệt';
      alert(msg);
    }
  };

  const handleSetBaseline = async (est: EstimateVersion) => {
    if (!selectedProjectId) return;
    const name = est.versionName || est.name || `Phiên bản v${est.versionNo}`;
    if (!await confirmDialog({
      title: 'Thiết Lập Dự Toán Mốc (Baseline)',
      message: `Đặt phiên bản "${name}" làm DỰ TOÁN MỐC (Baseline)? Baseline cũ sẽ bị thay thế.`,
      confirmText: 'Xác Nhận Thiết Lập',
      type: 'warning',
    })) return;
    try {
      await estimateApi.setBaseline(selectedProjectId, est.id, {
        rowVersion: est.rowVersion || undefined,
      });
      alert('Đã đặt baseline thành công!');
      loadEstimates(selectedProjectId);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : null) ||
        err.message ||
        'Lỗi khi đặt baseline';
      alert(msg);
    }
  };

  const handleViewDetail = async (est: EstimateVersion) => {
    if (!selectedProjectId) return;
    try {
      const detail = await estimateApi.getById(selectedProjectId, est.id);
      setDetailEst(detail);
      setShowDetailModal(true);
    } catch (err: any) {
      alert('Lỗi khi tải chi tiết dự toán');
    }
  };

  const handleCreateEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    setSubmitting(true);
    try {
      const ppId = createForm.pricePeriodId || (pricePeriods.length > 0 ? String(pricePeriods[0].id) : '1');
      await estimateApi.create(selectedProjectId, {
        name: createForm.versionName.trim(),
        versionName: createForm.versionName.trim(),
        description: createForm.description.trim() || undefined,
        note: createForm.description.trim() || undefined,
        regionCode: createForm.regionCode || undefined,
        pricePeriodId: Number(ppId),
        vatRate: createForm.vatRate !== '' ? Number(createForm.vatRate) : undefined,
        materialAdjustmentFactor: Number(createForm.materialAdjustmentFactor) || 1.0,
        laborAdjustmentFactor: Number(createForm.laborAdjustmentFactor) || 1.0,
        machineAdjustmentFactor: Number(createForm.machineAdjustmentFactor) || 1.0,
        costComponents: DEFAULT_COST_COMPONENTS,
      });
      setShowCreateModal(false);
      setCreateForm({
        versionName: '',
        description: '',
        regionCode: '',
        pricePeriodId: '',
        vatRate: '8',
        materialAdjustmentFactor: '1.0',
        laborAdjustmentFactor: '1.0',
        machineAdjustmentFactor: '1.0',
      });
      alert('Tạo phiên bản dự toán mới thành công! Hãy bấm "Tính Toán" để chạy engine bóc tách khối lượng.');
      loadEstimates(selectedProjectId);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : null) ||
        err.message ||
        'Lỗi khi tạo phiên bản dự toán';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getWorkflowBtns = (est: EstimateVersion) => {
    const btns = [];
    const isDraft = est.status === 'DRAFT';
    const isSubmitted = est.status === 'SUBMITTED';
    const isApproved = est.status === 'APPROVED';

    // Calculate & Edit Tax - Only for DRAFT
    if (isDraft) {
      btns.push(
        <button
          key="calc"
          className="btn btn-primary btn-sm"
          onClick={() => openCalcModal(est)}
          disabled={calculatingId === est.id}
          title="Tùy chỉnh thuế suất VAT, hệ số trượt giá và chạy engine tính toán"
        >
          <Sliders size={13} />
          {calculatingId === est.id ? 'Đang tính...' : 'Tính Toán & Sửa Thuế'}
        </button>
      );
    }

    // Submit if Draft and calculated
    if (isDraft && ['CALCULATED', 'COMPLETE'].includes(est.calculationStatus || '')) {
      btns.push(
        <button
          key="submit"
          className="btn btn-secondary btn-sm"
          onClick={() => handleSubmit(est)}
          title="Trình duyệt lên cấp trên"
        >
          <Send size={13} /> Trình Duyệt
        </button>
      );
    }

    // Approve if submitted
    if (isSubmitted) {
      btns.push(
        <button
          key="approve"
          className="btn btn-success btn-sm"
          onClick={() => handleApprove(est)}
          title="Phê duyệt chính thức"
        >
          <CheckCircle size={13} /> Phê Duyệt
        </button>
      );
    }

    // Set Baseline if approved and not yet baseline
    if (isApproved && !est.isBaseline) {
      btns.push(
        <button
          key="baseline"
          className="btn btn-sm"
          style={{ background: 'var(--blue-tech)', color: '#fff' }}
          onClick={() => handleSetBaseline(est)}
          title="Đặt làm dự toán mốc (Baseline)"
        >
          <Star size={13} /> Đặt Baseline
        </button>
      );
    }

    // Export
    btns.push(
      <button
        key="export"
        className="btn btn-success btn-sm"
        onClick={() => handleExportExcel(est.id, est.versionName)}
        disabled={downloadingId === est.id}
        title="Xuất file Excel chuẩn Bộ Xây Dựng"
      >
        <Download size={13} />
        {downloadingId === est.id ? 'Đang tải...' : 'Xuất Excel'}
      </button>
    );

    // View Detail
    btns.push(
      <button
        key="view"
        className="btn btn-secondary btn-sm"
        onClick={() => handleViewDetail(est)}
        title="Xem chi tiết bóc tách"
      >
        <Eye size={13} /> Chi Tiết
      </button>
    );

    return btns;
  };

  const getStatusLabel = (est: EstimateVersion) => {
    if (est.status === 'APPROVED') return { label: 'Đã Phê Duyệt', cls: 'badge-approved' };
    if (est.status === 'SUBMITTED') return { label: 'Chờ Duyệt', cls: 'badge-warning' };
    if (est.calculationStatus === 'CALCULATED') return { label: 'Đã Tính Toán', cls: 'badge-info' };
    return { label: 'Dự Thảo', cls: 'badge-pending' };
  };

  return (
    <div>
      {/* Project Selector Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 24px' }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Chọn Dự Án Cần Xem Dự Toán:
            </span>
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

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => selectedProjectId && loadEstimates(selectedProjectId)}
            >
              <RefreshCw size={14} /> Làm mới
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowCreateModal(true)}
              disabled={!selectedProjectId}
            >
              <Plus size={14} /> Tạo Phiên Bản Dự Toán Mới
            </button>
          </div>
        </div>
      </div>

      {/* Estimates Versions Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Danh Sách Các Phiên Bản Dự Toán</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Engine bóc tách khối lượng và áp giá theo định mức Bộ Xây Dựng (Thông tư 12/2021/TT-BXD)
            </p>
          </div>
        </div>

        <div className="table-container">
          <table className="bmc-table">
            <thead>
              <tr>
                <th>Phiên Bản</th>
                <th>Tên Phiên Bản Dự Toán</th>
                <th>Trực Tiếp (T)</th>
                <th>Gián Tiếp (GT)</th>
                <th>Thuế VAT</th>
                <th>Tổng Dự Toán Sau Thuế</th>
                <th>Trạng Thái</th>
                <th style={{ textAlign: 'center', minWidth: '340px' }}>Thao Tác Nghiệp Vụ</th>
              </tr>
            </thead>
            <tbody>
              {estimates.map((est) => {
                const { label, cls } = getStatusLabel(est);
                return (
                  <tr key={est.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge badge-info">v{est.versionNo}</span>
                        {est.isBaseline && (
                          <span className="badge badge-active" title="Dự toán mốc (Baseline)">
                            <Award size={10} style={{ display: 'inline', marginRight: 2 }} /> Baseline
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {est.versionName || est.name || `Dự toán v${est.versionNo}`}
                      {est.description && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
                          {est.description}
                        </div>
                      )}
                    </td>
                    <td>{formatCurrency(est.totalDirectCost || 0)}</td>
                    <td>
                      {formatCurrency(
                        est.totalIndirectCost ??
                          Math.max(0, (est.totalBeforeTax || 0) - (est.totalDirectCost || 0))
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{formatCurrency(est.vatAmount || 0)}</div>
                      {est.vatRateSnapshot !== undefined && est.vatRateSnapshot !== null ? (
                        <div style={{ fontSize: '11px', color: 'var(--blue-tech)', fontWeight: 600, marginTop: '2px' }}>
                          VAT {est.vatRateSnapshot}%
                        </div>
                      ) : (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Chưa tính</div>
                      )}
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--orange-primary)', fontSize: '0.95rem' }}>
                      {formatCurrency(est.totalAfterTax || est.totalEstimate || 0)}
                    </td>
                    <td>
                      <span className={`badge ${cls}`}>{label}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {getWorkflowBtns(est)}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {estimates.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    Chưa có phiên bản dự toán nào. Bấm <strong>"Tạo Phiên Bản Dự Toán Mới"</strong> để bắt đầu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create New Estimate Version */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '540px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Tạo Phiên Bản Dự Toán Mới</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Sau khi tạo, bấm "Tính Toán" để engine bóc tách khối lượng từ WBS và áp giá định mức
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCreateModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateEstimate}>
              <div className="form-group">
                <label className="form-label">Tên Phiên Bản Dự Toán *</label>
                <input
                  type="text"
                  className="form-input"
                  value={createForm.versionName}
                  onChange={(e) => setCreateForm({ ...createForm, versionName: e.target.value })}
                  placeholder="VD: Dự Toán Gói Thầu Phần Thô - Lần 1"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mô Tả / Ghi Chú</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Mô tả phạm vi, phiên bản thiết kế hoặc ghi chú nghiệp vụ..."
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Vùng Giá Áp Dụng</label>
                  <select
                    className="form-select"
                    value={createForm.regionCode}
                    onChange={(e) => {
                      setCreateForm({ ...createForm, regionCode: e.target.value, pricePeriodId: '' });
                      if (e.target.value) catalogsApi.getPricePeriods(e.target.value).then(setPricePeriods).catch(() => {});
                    }}
                  >
                    <option value="">-- Chọn vùng giá --</option>
                    {regions.map((r: any) => (
                      <option key={r.code || r.id} value={r.code || r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Kỳ Bảng Giá Vật Liệu</label>
                  <select
                    className="form-select"
                    value={createForm.pricePeriodId}
                    onChange={(e) => setCreateForm({ ...createForm, pricePeriodId: e.target.value })}
                    disabled={!createForm.regionCode && pricePeriods.length === 0}
                  >
                    <option value="">-- Chọn kỳ giá --</option>
                    {pricePeriods.map((pp: any) => (
                      <option key={pp.id} value={pp.id}>
                        {pp.periodName || pp.name} {pp.year ? `(${pp.year})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* VAT & Factor Settings */}
              <div style={{
                background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '14px 16px',
                margin: '16px 0', border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>
                  Cấu Hình Thuế VAT & Hệ Số Điều Chỉnh
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '10px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                      <Percent size={13} color="var(--orange-primary)" /> Thuế Suất VAT Đầu Ra (%) *
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        className="form-input"
                        value={createForm.vatRate}
                        onChange={(e) => setCreateForm({ ...createForm, vatRate: e.target.value })}
                        placeholder="VD: 8 hoặc 10"
                        required
                        style={{ fontWeight: 700 }}
                      />
                      {['8', '10', '0'].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          className={`btn btn-sm ${createForm.vatRate === rate ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '2px 8px', fontSize: '11px' }}
                          onClick={() => setCreateForm({ ...createForm, vatRate: rate })}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Hệ Số Vật Liệu (KMVL)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-input"
                      value={createForm.materialAdjustmentFactor}
                      onChange={(e) => setCreateForm({ ...createForm, materialAdjustmentFactor: e.target.value })}
                      placeholder="1.0"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Hệ Số Nhân Công (KNC)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-input"
                      value={createForm.laborAdjustmentFactor}
                      onChange={(e) => setCreateForm({ ...createForm, laborAdjustmentFactor: e.target.value })}
                      placeholder="1.0"
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Hệ Số Máy Thi Công (KMTC)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-input"
                      value={createForm.machineAdjustmentFactor}
                      onChange={(e) => setCreateForm({ ...createForm, machineAdjustmentFactor: e.target.value })}
                      placeholder="1.0"
                    />
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px',
                padding: '12px 16px', marginBottom: '20px', fontSize: '12px',
                color: 'var(--text-muted)', lineHeight: 1.6
              }}>
                <strong style={{ color: 'var(--text-main)' }}>💡 Quy trình:</strong>{' '}
                Tạo phiên bản → Tính Toán (engine bóc tách WBS) → Trình Duyệt → Phê Duyệt → Đặt Baseline → Xuất Excel
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <FileSpreadsheet size={15} />
                  {submitting ? 'Đang tạo...' : 'Tạo Phiên Bản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Calculate & Adjust Tax/Factors */}
      {showCalcModal && calcTargetEst && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={18} color="var(--orange-primary)" />
                  Cấu Hình & Chạy Tính Toán Dự Toán
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Phiên bản v{calcTargetEst.versionNo}: {calcTargetEst.versionName || calcTargetEst.name}
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCalcModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleExecuteCalculate}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                  <Percent size={14} color="var(--orange-primary)" /> Thuế Suất VAT Đầu Ra (%) *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="form-input"
                    value={calcParams.vatRate}
                    onChange={(e) => setCalcParams({ ...calcParams, vatRate: e.target.value })}
                    placeholder="VD: 8 hoặc 10"
                    required
                    style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--orange-primary)' }}
                  />
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['8', '10', '5', '0'].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        className={`btn btn-sm ${calcParams.vatRate === rate ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '4px 10px', fontSize: '12px', fontWeight: 600 }}
                        onClick={() => setCalcParams({ ...calcParams, vatRate: rate })}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  💡 Cho phép thay đổi mức thuế GTGT linh hoạt (8% theo chính sách giảm thuế, hoặc 10% tiêu chuẩn).
                </div>
              </div>

              <div style={{
                background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '14px',
                marginBottom: '18px', border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>
                  Hệ Số Điều Chỉnh / Trượt Giá Chi Phí:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Vật Liệu (KMVL)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-input"
                      value={calcParams.materialAdjustmentFactor}
                      onChange={(e) => setCalcParams({ ...calcParams, materialAdjustmentFactor: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Nhân Công (KNC)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-input"
                      value={calcParams.laborAdjustmentFactor}
                      onChange={(e) => setCalcParams({ ...calcParams, laborAdjustmentFactor: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Máy TC (KMTC)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-input"
                      value={calcParams.machineAdjustmentFactor}
                      onChange={(e) => setCalcParams({ ...calcParams, machineAdjustmentFactor: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCalcModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={calculatingId === calcTargetEst.id}>
                  <Play size={14} />
                  {calculatingId === calcTargetEst.id ? 'Đang chạy engine...' : 'Chạy Engine Tính Toán'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Estimate Detail */}
      <EstimateDetailModal
        isOpen={showDetailModal && !!detailEst}
        onClose={() => setShowDetailModal(false)}
        estimate={detailEst}
        projectName={projects.find(p => p.id === selectedProjectId)?.name}
        projectCode={projects.find(p => p.id === selectedProjectId)?.code}
        projectId={selectedProjectId}
      />
    </div>
  );
};
