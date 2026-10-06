import React, { useState, useMemo } from 'react';
import {
  X,
  Calculator,
  Layers,
  ChevronDown,
  ChevronRight,
  Download,
  Building2,
  Calendar,
  DollarSign,
  Package,
  HardHat,
  Truck,
  FileText,
  Search,
  CheckCircle,
  Eye,
  Info,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate, formatQuantityWithUnit, formatUnit } from '../../utils/formatters';
import { estimateApi } from '../../api';
import { exportEstimateToExcel } from '../../utils/estimateExcelExport';

interface EstimateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  estimate: any;
  projectName?: string;
  projectCode?: string;
  projectId?: number;
}

export const EstimateDetailModal: React.FC<EstimateDetailModalProps> = ({
  isOpen,
  onClose,
  estimate,
  projectName = 'Dự án BMC Landmark',
  projectCode = 'DA-BMC-01',
  projectId,
}) => {
  const [activeTab, setActiveTab] = useState<'wbs' | 'resources' | 'summary'>('wbs');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({ 0: true, 1: true });
  const [selectedTaskResources, setSelectedTaskResources] = useState<any | null>(null);
  const [resourceFilterType, setResourceFilterType] = useState<'ALL' | 'MATERIAL' | 'LABOR' | 'MACHINE'>('ALL');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Key Financial Figures from API or fallback
  const totalDirectCost = estimate?.totalDirectCost ?? 0;
  const totalMaterial = estimate?.totalMaterial ?? 0;
  const totalLabor = estimate?.totalLabor ?? 0;
  const totalMachine = estimate?.totalMachine ?? 0;
  
  // Indirect cost (Chi phí gián tiếp GT)
  const totalBeforeTax = estimate?.totalBeforeTax ?? (totalDirectCost * 1.16);
  const totalIndirectCost = estimate?.totalIndirectCost ?? Math.max(0, totalBeforeTax - totalDirectCost);
  
  // VAT and Total after tax
  const vatRate = estimate?.vatRateSnapshot ?? 10;
  const vatAmount = estimate?.vatAmount ?? (totalBeforeTax * (vatRate / 100));
  const totalEstimate = estimate?.totalEstimate ?? estimate?.totalAfterTax ?? (totalBeforeTax + vatAmount);

  // Items and tasks normalization
  const items = useMemo(() => {
    if (!estimate?.items || !Array.isArray(estimate.items)) return [];
    return estimate.items.map((it: any, idx: number) => {
      const code = it.itemCodeSnapshot || it.code || it.itemCode || `HM-${idx + 1}`;
      const name = it.itemNameSnapshot || it.name || it.itemName || `Hạng mục ${idx + 1}`;
      const material = it.totalMaterial ?? it.materialCost ?? 0;
      const labor = it.totalLabor ?? it.laborCost ?? 0;
      const machine = it.totalMachine ?? it.machineCost ?? 0;
      const direct = it.totalDirectCost ?? it.totalAmount ?? (material + labor + machine);
      
      const rawTasks = it.tasks || [];
      const tasks = rawTasks.map((t: any, tIdx: number) => {
        const tCode = t.taskCodeSnapshot || t.code || `CT-${tIdx + 1}`;
        const tName = t.taskNameSnapshot || t.name || `Công tác ${tIdx + 1}`;
        const tQty = t.quantitySnapshot ?? t.quantity ?? 1;
        const tUnit = t.unitCode || t.unitCodeSnapshot || t.unitSymbolSnapshot || t.unitName || '';
        const tMat = t.materialTotal ?? (t.materialUnitPrice ? t.materialUnitPrice * tQty : 0);
        const tLab = t.laborTotal ?? (t.laborUnitPrice ? t.laborUnitPrice * tQty : 0);
        const tMac = t.machineTotal ?? (t.machineUnitPrice ? t.machineUnitPrice * tQty : 0);
        const tDirect = t.directCost ?? t.amount ?? (tMat + tLab + tMac);
        const tUnitPrice = t.unitPrice ?? (tQty > 0 ? tDirect / tQty : 0);
        
        return {
          id: t.id || tIdx,
          code: tCode,
          name: tName,
          quantity: tQty,
          unit: tUnit,
          unitPrice: tUnitPrice,
          materialUnitPrice: t.materialUnitPrice || 0,
          laborUnitPrice: t.laborUnitPrice || 0,
          machineUnitPrice: t.machineUnitPrice || 0,
          materialTotal: tMat,
          laborTotal: tLab,
          machineTotal: tMac,
          directCost: tDirect,
          resources: t.resources || [],
        };
      });

      return {
        id: it.id || idx,
        code,
        name,
        totalMaterial: material,
        totalLabor: labor,
        totalMachine: machine,
        totalDirectCost: direct,
        tasks,
      };
    });
  }, [estimate]);

  // All combined resources across the entire estimate
  const aggregatedResources = useMemo(() => {
    const map = new Map<string, {
      type: string;
      code: string;
      name: string;
      unit: string;
      totalQuantity: number;
      unitPrice: number;
      totalAmount: number;
    }>();

    items.forEach((it: any) => {
      it.tasks.forEach((t: any) => {
        (t.resources || []).forEach((r: any) => {
          const type = r.resourceType || 'MATERIAL';
          const code = r.resourceCodeSnapshot || r.code || 'VL-00';
          const name = r.resourceNameSnapshot || r.name || 'Vật tư / Tài nguyên';
          const unit = r.unitCodeSnapshot || r.unit || '';
          const qty = r.requiredQuantity ?? ((r.normQuantitySnapshot || 0) * (t.quantity || 1));
          const price = r.unitPriceSnapshot ?? r.unitPrice ?? 0;
          const amt = r.amount ?? (qty * price);

          const key = `${type}_${code}`;
          if (map.has(key)) {
            const existing = map.get(key)!;
            existing.totalQuantity += qty;
            existing.totalAmount += amt;
          } else {
            map.set(key, {
              type,
              code,
              name,
              unit,
              totalQuantity: qty,
              unitPrice: price,
              totalAmount: amt,
            });
          }
        });
      });
    });

    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [items]);

  if (!isOpen || !estimate) return null;

  const toggleItem = (id: number) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all: Record<number, boolean> = {};
    items.forEach((it: any) => { all[it.id] = true; });
    setExpandedItems(all);
  };

  const collapseAll = () => {
    setExpandedItems({});
  };

  const handleExportExcel = async () => {
    setExporting(true);
    const pId = projectId || estimate?.projectId;
    const eId = estimate?.id;
    const safeProject = (projectCode || `Project_${pId}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeName = (estimate.name || estimate.versionName || `v${estimate.versionNo || 1}`).replace(/\s+/g, '_');
    const filename = `DuToan_${safeProject}_${safeName}.xlsx`;

    if (pId && eId) {
      try {
        // 1. Try official backend master export (7 sheets ClosedXML)
        await estimateApi.downloadExcel(pId, eId, filename);
        setTimeout(() => setExporting(false), 1000);
        return;
      } catch (backendErr) {
        console.warn('Backend excel export failed, falling back to client-side generator:', backendErr);
      }
    }

    // 2. Fallback to client-side generator
    try {
      exportEstimateToExcel({
        projectName,
        projectCode,
        versionName: estimate.name || estimate.versionName,
        versionNo: estimate.versionNo || 1,
        pricePeriod: estimate.pricePeriodCodeSnapshot || estimate.pricePeriodCode || 'PP-2024-Q1',
        normStandard: 'Thông tư 12/2021/TT-BXD',
        totalDirectCost,
        totalMaterial,
        totalLabor,
        totalMachine,
        totalIndirectCost,
        totalBeforeTax,
        vatRate,
        vatAmount,
        totalEstimate,
        items,
        aggregatedResources,
      });
      setTimeout(() => setExporting(false), 1200);
    } catch (err: any) {
      setExporting(false);
      console.error('Error exporting estimate to excel:', err);
      alert('Lỗi khi xuất file Excel dự toán: ' + (err.message || err));
    }
  };

  // Filter items by search query
  const filteredItems = items.map((it: any) => {
    if (!searchQuery.trim()) return it;
    const q = searchQuery.toLowerCase();
    const matchItem = it.code.toLowerCase().includes(q) || it.name.toLowerCase().includes(q);
    const matchedTasks = it.tasks.filter((t: any) => t.code.toLowerCase().includes(q) || t.name.toLowerCase().includes(q));
    if (matchItem || matchedTasks.length > 0) {
      return {
        ...it,
        tasks: matchItem ? it.tasks : matchedTasks,
      };
    }
    return null;
  }).filter(Boolean);

  const filteredResources = aggregatedResources.filter(r => {
    if (resourceFilterType !== 'ALL' && r.type !== resourceFilterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="card"
        style={{
          width: isFullscreen ? '100vw' : '96vw',
          maxWidth: isFullscreen ? '100vw' : '1680px',
          height: isFullscreen ? '100vh' : '95vh',
          maxHeight: isFullscreen ? '100vh' : '95vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: isFullscreen ? 0 : '16px',
          border: isFullscreen ? 'none' : '1px solid #e2e8f0',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
          transition: 'all 0.15s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                color: 'var(--brand-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(249, 115, 22, 0.2)',
              }}
            >
              <Calculator size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Chi Tiết Dự Toán Công Trình — v{estimate.versionNo}: {estimate.name || estimate.versionName}
                </h2>
                <span className="badge badge-primary" style={{ fontSize: '12px', padding: '3px 10px' }}>
                  {estimate.status === 'APPROVED' ? 'Đã phê duyệt' : estimate.status === 'SUBMITTED' ? 'Đã trình duyệt' : 'Dự thảo (Draft)'}
                </span>
              </div>
              <div style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: 'var(--brand-600)' }}>[{projectCode}]</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{projectName}</span>
                <span>·</span>
                <span>Kỳ giá: <strong>{estimate.pricePeriodCodeSnapshot || estimate.pricePeriodCode || 'PP-2024-Q1'}</strong></span>
                <span>·</span>
                <span>Định mức: <strong>Thông tư 12/2021/TT-BXD</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Thu nhỏ giao diện' : 'Toàn màn hình'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: 600,
                backgroundColor: isFullscreen ? 'rgba(249, 115, 22, 0.1)' : undefined,
                color: isFullscreen ? 'var(--brand-600)' : undefined,
              }}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleExportExcel}
              disabled={exporting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <Download size={14} />
              <span>{exporting ? 'Đang tạo Excel...' : 'Xuất Excel BOQ'}</span>
            </button>
            <button
              className="btn-icon"
              onClick={onClose}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Executive Cost Summary Cards */}
        <div
          style={{
            padding: '16px 24px 0 24px',
            backgroundColor: '#ffffff',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '14px',
            }}
          >
            {/* 1. Chi phí trực tiếp */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                1. CHI PHÍ TRỰC TIẾP (T)
              </div>
              <div style={{ fontSize: '19px', fontWeight: 900, color: '#0284c7', marginTop: '4px' }}>
                {formatCurrency(totalDirectCost)}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'flex', gap: '8px' }}>
                <span>VL: <strong>{formatCurrency(totalMaterial)}</strong></span>
                <span>NC: <strong>{formatCurrency(totalLabor)}</strong></span>
                <span>M: <strong>{formatCurrency(totalMachine)}</strong></span>
              </div>
            </div>

            {/* 2. Chi phí gián tiếp */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                2. CHI PHÍ GIÁN TIẾP (GT)
              </div>
              <div style={{ fontSize: '19px', fontWeight: 900, color: '#f59e0b', marginTop: '4px' }}>
                {formatCurrency(totalIndirectCost)}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                Chi phí chung & lán trại tạm theo TT 12/2021
              </div>
            </div>

            {/* 3. Thuế VAT */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                3. THUẾ GTGT ({vatRate}%)
              </div>
              <div style={{ fontSize: '19px', fontWeight: 900, color: '#64748b', marginTop: '4px' }}>
                {formatCurrency(vatAmount)}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                Trước thuế: {formatCurrency(totalBeforeTax)}
              </div>
            </div>

            {/* 4. Tổng dự toán sau thuế */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: '#fff7ed',
                border: '1.5px solid var(--brand-500)',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--brand-600)', fontWeight: 800, textTransform: 'uppercase' }}>
                4. TỔNG DỰ TOÁN SAU THUẾ (GXD)
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--brand-600)', marginTop: '4px' }}>
                {formatCurrency(totalEstimate)}
              </div>
              <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700, marginTop: '4px' }}>
                ✓ Giá trị dự toán phê duyệt
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('wbs')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                backgroundColor: activeTab === 'wbs' ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                color: activeTab === 'wbs' ? 'var(--brand-600)' : '#64748b',
              }}
            >
              <Layers size={16} />
              <span>Bóc Tách Hạng Mục & Công Tác (WBS BOQ)</span>
            </button>

            <button
              onClick={() => setActiveTab('resources')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                backgroundColor: activeTab === 'resources' ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                color: activeTab === 'resources' ? 'var(--brand-600)' : '#64748b',
              }}
            >
              <Package size={16} />
              <span>Hao Phí Toàn Bộ Vật Tư · Nhân Công · Máy ({aggregatedResources.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('summary')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                backgroundColor: activeTab === 'summary' ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                color: activeTab === 'summary' ? 'var(--brand-600)' : '#64748b',
              }}
            >
              <FileText size={16} />
              <span>Bảng Tổng Hợp Chi Phí Xây Dựng (TT 12/2021)</span>
            </button>
          </div>

          {activeTab === 'wbs' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={expandAll}
                style={{ fontSize: '12px', padding: '4px 10px' }}
              >
                Mở rộng tất cả
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={collapseAll}
                style={{ fontSize: '12px', padding: '4px 10px' }}
              >
                Thu gọn
              </button>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Lọc hạng mục / công tác..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    height: '32px',
                    paddingLeft: '30px',
                    paddingRight: '10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tab Contents */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, backgroundColor: '#ffffff' }}>
          {/* TAB 1: WBS BOQ */}
          {activeTab === 'wbs' && (
            <div>
              {filteredItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                  Không tìm thấy hạng mục hoặc công tác nào phù hợp với bộ lọc.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {filteredItems.map((item: any, idx: number) => {
                    const isExpanded = !!expandedItems[item.id];
                    return (
                      <div
                        key={item.id}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Item Header Row */}
                        <div
                          onClick={() => toggleItem(item.id)}
                          style={{
                            padding: '12px 16px',
                            backgroundColor: '#f8fafc',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {isExpanded ? <ChevronDown size={18} color="#64748b" /> : <ChevronRight size={18} color="#64748b" />}
                            <span style={{ fontWeight: 800, color: 'var(--brand-600)', fontSize: '13px' }}>
                              [{item.code}]
                            </span>
                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                              {item.name}
                            </span>
                            <span className="badge badge-secondary" style={{ fontSize: '11px', marginLeft: '6px' }}>
                              {item.tasks.length} công tác thi công
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '13px' }}>
                            <div style={{ color: '#64748b' }}>
                              VL: <strong style={{ color: '#0f172a' }}>{formatCurrency(item.totalMaterial)}</strong>
                            </div>
                            <div style={{ color: '#64748b' }}>
                              NC: <strong style={{ color: '#0f172a' }}>{formatCurrency(item.totalLabor)}</strong>
                            </div>
                            <div style={{ color: '#64748b' }}>
                              Máy: <strong style={{ color: '#0f172a' }}>{formatCurrency(item.totalMachine)}</strong>
                            </div>
                            <div style={{ fontWeight: 900, color: '#0284c7', fontSize: '14px' }}>
                              Tổng TT: {formatCurrency(item.totalDirectCost)}
                            </div>
                          </div>
                        </div>

                        {/* Tasks Table for this Item */}
                        {isExpanded && (
                          <div className="table-container" style={{ margin: 0 }}>
                            <table className="bmc-table" style={{ margin: 0, fontSize: '12.5px' }}>
                              <thead>
                                <tr style={{ backgroundColor: '#ffffff', borderBottom: '2px solid #e2e8f0' }}>
                                  <th style={{ width: '40px', textAlign: 'center' }}>STT</th>
                                  <th style={{ width: '100px' }}>Mã Hiệu</th>
                                  <th>Tên Công Tác Xây Dựng</th>
                                  <th style={{ width: '140px' }}>Khối Lượng Thiết Kế</th>
                                  <th style={{ textAlign: 'right' }}>Đơn Giá TT</th>
                                  <th style={{ textAlign: 'right' }}>Thành Tiền VL</th>
                                  <th style={{ textAlign: 'right' }}>Thành Tiền NC</th>
                                  <th style={{ textAlign: 'right' }}>Thành Tiền Máy</th>
                                  <th style={{ textAlign: 'right' }}>Tổng Chi Phí TT</th>
                                  <th style={{ textAlign: 'center', width: '90px' }}>Chi Tiết</th>
                                </tr>
                              </thead>
                              <tbody>
                                {item.tasks.map((task: any, tIdx: number) => {
                                  const qInfo = formatQuantityWithUnit(task.quantity, task.unit);
                                  return (
                                    <tr key={task.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                      <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{tIdx + 1}</td>
                                      <td style={{ fontWeight: 700, color: '#2563eb' }}>{task.code}</td>
                                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{task.name}</td>
                                      <td>
                                        <div style={{ fontWeight: 700 }}>{qInfo.display}</div>
                                        {qInfo.converted && (
                                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                                            ≈ {qInfo.converted}
                                          </div>
                                        )}
                                      </td>
                                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                                        {formatCurrency(task.unitPrice)}
                                      </td>
                                      <td style={{ textAlign: 'right', color: '#475569' }}>
                                        {formatCurrency(task.materialTotal)}
                                      </td>
                                      <td style={{ textAlign: 'right', color: '#475569' }}>
                                        {formatCurrency(task.laborTotal)}
                                      </td>
                                      <td style={{ textAlign: 'right', color: '#475569' }}>
                                        {formatCurrency(task.machineTotal)}
                                      </td>
                                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#0284c7' }}>
                                        {formatCurrency(task.directCost)}
                                      </td>
                                      <td style={{ textAlign: 'center' }}>
                                        <button
                                          className="btn btn-secondary btn-sm"
                                          onClick={() => setSelectedTaskResources(task)}
                                          title="Xem hao phí định mức công tác"
                                          style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                        >
                                          <Eye size={12} />
                                          <span>Hao phí</span>
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Resources Breakdown */}
          {activeTab === 'resources' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['ALL', 'MATERIAL', 'LABOR', 'MACHINE'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setResourceFilterType(type)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: '1px solid #cbd5e1',
                        cursor: 'pointer',
                        backgroundColor: resourceFilterType === type ? 'var(--brand-500)' : '#ffffff',
                        color: resourceFilterType === type ? '#ffffff' : '#475569',
                      }}
                    >
                      {type === 'ALL' ? 'Tất Cả Hao Phí' : type === 'MATERIAL' ? 'Vật Tư / Vật Liệu' : type === 'LABOR' ? 'Nhân Công' : 'Máy Thi Công'}
                    </button>
                  ))}
                </div>

                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  Hiển thị <strong>{filteredResources.length}</strong> chủng loại tài nguyên trong toàn bộ dự án
                </div>
              </div>

              <div className="table-container" style={{ border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <table className="bmc-table" style={{ margin: 0, fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ width: '40px', textAlign: 'center' }}>STT</th>
                      <th style={{ width: '100px' }}>Loại</th>
                      <th style={{ width: '120px' }}>Mã Vật Tư / NC</th>
                      <th>Tên Quy Cách / Chủng Loại</th>
                      <th style={{ width: '80px', textAlign: 'center' }}>ĐVT</th>
                      <th style={{ textAlign: 'right', width: '150px' }}>Tổng Hao Phí</th>
                      <th style={{ textAlign: 'right', width: '150px' }}>Đơn Giá Áp Dụng</th>
                      <th style={{ textAlign: 'right', width: '170px' }}>Thành Tiền Dự Toán</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResources.map((r, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                        <td>
                          <span
                            className={`badge ${r.type === 'MATERIAL' ? 'badge-primary' : r.type === 'LABOR' ? 'badge-active' : 'badge-danger'}`}
                            style={{ fontSize: '11px' }}
                          >
                            {r.type === 'MATERIAL' ? 'Vật liệu' : r.type === 'LABOR' ? 'Nhân công' : 'Máy'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--brand-600)' }}>{r.code}</td>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>{r.name}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{formatUnit(r.unit)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatNumber(r.totalQuantity, 2)}</td>
                        <td style={{ textAlign: 'right', color: '#475569' }}>{formatCurrency(r.unitPrice)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>{formatCurrency(r.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Statutory Summary (TT 12/2021/TT-BXD) */}
          {activeTab === 'summary' && (
            <div style={{ maxWidth: '960px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  BẢNG TỔNG HỢP KINH PHÍ DỰ TOÁN XÂY DỰNG CÔNG TRÌNH
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  (Căn cứ Thông tư số 12/2021/TT-BXD ngày 31/08/2021 của Bộ Xây Dựng)
                </div>
              </div>

              <div className="table-container" style={{ border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <table className="bmc-table" style={{ margin: 0 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ width: '50px', textAlign: 'center' }}>STT</th>
                      <th>Khoản Mục Chi Phí</th>
                      <th style={{ width: '140px', textAlign: 'center' }}>Cách Tính</th>
                      <th style={{ width: '180px', textAlign: 'right' }}>Giá Trị Dự Toán</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 1. Chi phí trực tiếp */}
                    <tr style={{ backgroundColor: '#f8fafc', fontWeight: 800 }}>
                      <td style={{ textAlign: 'center' }}>I</td>
                      <td style={{ color: '#0f172a' }}>CHI PHÍ TRỰC TIẾP (T)</td>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>VL + NC + M</td>
                      <td style={{ textAlign: 'right', color: '#0284c7' }}>{formatCurrency(totalDirectCost)}</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>1</td>
                      <td style={{ paddingLeft: '28px' }}>- Chi phí Vật liệu (VL)</td>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>Bóc tách BOQ</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(totalMaterial)}</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>2</td>
                      <td style={{ paddingLeft: '28px' }}>- Chi phí Nhân công (NC)</td>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>Bóc tách BOQ</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(totalLabor)}</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>3</td>
                      <td style={{ paddingLeft: '28px' }}>- Chi phí Máy & Thiết bị thi công (M)</td>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>Bóc tách BOQ</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(totalMachine)}</td>
                    </tr>

                    {/* 2. Chi phí gián tiếp */}
                    <tr style={{ backgroundColor: '#f8fafc', fontWeight: 800 }}>
                      <td style={{ textAlign: 'center' }}>II</td>
                      <td style={{ color: '#0f172a' }}>CHI PHÍ GIÁN TIẾP (GT)</td>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>TT 12/2021</td>
                      <td style={{ textAlign: 'right', color: '#f59e0b' }}>{formatCurrency(totalIndirectCost)}</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>1</td>
                      <td style={{ paddingLeft: '28px' }}>- Chi phí chung</td>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>T × 6.5%</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(totalDirectCost * 0.065)}</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>2</td>
                      <td style={{ paddingLeft: '28px' }}>- Chi phí nhà tạm để ở và điều hành thi công</td>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>T × 1.2%</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(totalDirectCost * 0.012)}</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>3</td>
                      <td style={{ paddingLeft: '28px' }}>- Chi phí một số công việc không xác định được từ thiết kế</td>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>T × 2.5%</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(totalDirectCost * 0.025)}</td>
                    </tr>

                    {/* 3. Thu nhập chịu thuế tính trước */}
                    <tr style={{ backgroundColor: '#f8fafc', fontWeight: 800 }}>
                      <td style={{ textAlign: 'center' }}>III</td>
                      <td style={{ color: '#0f172a' }}>THU NHẬP CHỊU THUẾ TÍNH TRƯỚC (TL)</td>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>(T + GT) × 5.5%</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency((totalDirectCost + totalIndirectCost) * 0.055)}</td>
                    </tr>

                    {/* 4. Chi phí xây dựng trước thuế */}
                    <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 900 }}>
                      <td style={{ textAlign: 'center' }}>IV</td>
                      <td style={{ color: '#0f172a' }}>CHI PHÍ XÂY DỰNG TRƯỚC THUẾ (G)</td>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>T + GT + TL</td>
                      <td style={{ textAlign: 'right', color: '#0f172a', fontSize: '15px' }}>{formatCurrency(totalBeforeTax)}</td>
                    </tr>

                    {/* 5. Thuế GTGT */}
                    <tr>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>V</td>
                      <td style={{ fontWeight: 700 }}>THUẾ GIÁ TRỊ GIA TĂNG (VAT)</td>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>G × {vatRate}%</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(vatAmount)}</td>
                    </tr>

                    {/* 6. Tổng sau thuế */}
                    <tr style={{ backgroundColor: '#fff7ed', fontWeight: 900, borderTop: '2px solid var(--brand-500)' }}>
                      <td style={{ textAlign: 'center', color: 'var(--brand-600)' }}>VI</td>
                      <td style={{ color: 'var(--brand-600)', fontSize: '15px' }}>TỔNG DỰ TOÁN XÂY DỰNG SAU THUẾ (GXD)</td>
                      <td style={{ textAlign: 'center', color: 'var(--brand-600)' }}>G + VAT</td>
                      <td style={{ textAlign: 'right', color: 'var(--brand-600)', fontSize: '17px' }}>{formatCurrency(totalEstimate)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Tổng số: <strong style={{ color: '#0f172a' }}>{items.length} Hạng mục</strong> ·{' '}
            <strong style={{ color: '#0f172a' }}>
              {items.reduce((acc: number, it: any) => acc + (it.tasks?.length || 0), 0)} Công tác thi công
            </strong>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Nested Modal: Task Resources Breakdown (Vật liệu, Nhân công, Máy) */}
      {selectedTaskResources && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '840px',
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--brand-600)' }}>[{selectedTaskResources.code}]</span>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                    {selectedTaskResources.name}
                  </h3>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                  Khối lượng: <strong>{formatQuantityWithUnit(selectedTaskResources.quantity, selectedTaskResources.unit).display}</strong> ·{' '}
                  Đơn giá TT: <strong>{formatCurrency(selectedTaskResources.unitPrice)}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaskResources(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="table-container" style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <table className="bmc-table" style={{ margin: 0, fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ width: '40px', textAlign: 'center' }}>STT</th>
                      <th style={{ width: '90px' }}>Loại</th>
                      <th style={{ width: '110px' }}>Mã Vật Tư/NC</th>
                      <th>Tên Hao Phí Thành Phần</th>
                      <th style={{ width: '70px', textAlign: 'center' }}>ĐVT</th>
                      <th style={{ textAlign: 'right', width: '90px' }}>Định Mức</th>
                      <th style={{ textAlign: 'right', width: '110px' }}>Khối Lượng</th>
                      <th style={{ textAlign: 'right', width: '110px' }}>Đơn Giá</th>
                      <th style={{ textAlign: 'right', width: '130px' }}>Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedTaskResources.resources || []).map((r: any, rIdx: number) => {
                      const type = r.resourceType || 'MATERIAL';
                      const code = r.resourceCodeSnapshot || r.code || '—';
                      const name = r.resourceNameSnapshot || r.name || '—';
                      const unit = r.unitCodeSnapshot || r.unit || '';
                      const normQty = r.normQuantitySnapshot || 0;
                      const reqQty = r.requiredQuantity ?? (normQty * (selectedTaskResources.quantity || 1));
                      const price = r.unitPriceSnapshot ?? r.unitPrice ?? 0;
                      const amt = r.amount ?? (reqQty * price);

                      return (
                        <tr key={rIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ textAlign: 'center', color: '#64748b' }}>{rIdx + 1}</td>
                          <td>
                            <span
                              className={`badge ${type === 'MATERIAL' ? 'badge-primary' : type === 'LABOR' ? 'badge-active' : 'badge-danger'}`}
                              style={{ fontSize: '10.5px' }}
                            >
                              {type === 'MATERIAL' ? 'Vật tư' : type === 'LABOR' ? 'Nhân công' : 'Máy'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--brand-600)' }}>{code}</td>
                          <td style={{ fontWeight: 600, color: '#0f172a' }}>{name}</td>
                          <td style={{ textAlign: 'center' }}>{formatUnit(unit)}</td>
                          <td style={{ textAlign: 'right', color: '#64748b' }}>{formatNumber(normQty, 3)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatNumber(reqQty, 2)}</td>
                          <td style={{ textAlign: 'right', color: '#475569' }}>{formatCurrency(price)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>{formatCurrency(amt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div
              style={{
                padding: '12px 20px',
                backgroundColor: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Tổng cộng: <strong style={{ color: '#0284c7' }}>{formatCurrency(selectedTaskResources.directCost)}</strong> chi phí trực tiếp
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedTaskResources(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
