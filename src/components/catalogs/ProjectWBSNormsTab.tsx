import React, { useState, useEffect } from 'react';
import { projectApi } from '../../api';
import { Project, ProjectItem, ProjectTask } from '../../types';
import { formatCurrency, formatNumber, formatUnit } from '../../utils/formatters';
import {
  Layers,
  Building2,
  Calendar,
  History,
  TrendingUp,
  Truck,
  HardHat,
  Cpu,
  DollarSign,
  ChevronRight,
  Plus,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { PriceHistoryModal } from './PriceHistoryModal';

interface NormDetailItem {
  id: number;
  type: 'MATERIAL' | 'LABOR' | 'MACHINE';
  code: string;
  name: string;
  unit: string;
  normRate: number; // Định mức cho 1 đơn vị công tác
  unitPrice: number; // Đơn giá theo thời điểm chọn
  previousUnitPrice?: number;
  totalQuantity: number; // normRate * plannedTaskQuantity
  totalAmount: number; // totalQuantity * unitPrice
  supplierOrSource: string;
}

export const ProjectWBSNormsTab: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('1');
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('102');
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('1003');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Tháng 03/2026');

  // Modal Price History
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<{
    code: string;
    name: string;
    unit: string;
    type: 'MATERIAL' | 'LABOR' | 'MACHINE';
    currentPrice: number;
  } | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const pList = await projectApi.getAll();
      setProjects(pList);
      if (pList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(String(pList[0].id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      projectApi.getItems(Number(selectedProjectId)).then(itms => {
        setItems(itms);
        if (itms.length > 0 && !selectedItemId) {
          setSelectedItemId(String(itms[0].id));
        }
      }).catch(console.error);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId && selectedItemId) {
      projectApi.getTasks(Number(selectedProjectId), Number(selectedItemId)).then(tsks => {
        setTasks(tsks);
        if (tsks.length > 0 && !selectedTaskId) {
          setSelectedTaskId(String(tsks[0].id));
        }
      }).catch(console.error);
    }
  }, [selectedProjectId, selectedItemId]);

  // Context simulation for current selected task
  const taskQuantity = 120; // 120 m3 bê tông dầm sàn
  const taskUnit = 'm3';

  // Multiplier depending on selected period to reflect price variations over time
  const getPeriodMultiplier = (period: string) => {
    switch (period) {
      case 'Tháng 10/2025': return 0.92;
      case 'Tháng 11/2025': return 0.94;
      case 'Tháng 12/2025': return 0.97;
      case 'Tháng 01/2026': return 0.96;
      case 'Tháng 02/2026': return 0.98;
      case 'Tháng 03/2026':
      default: return 1.0;
    }
  };

  const mult = getPeriodMultiplier(selectedPeriod);

  // Materials
  const materials: NormDetailItem[] = [
    {
      id: 1,
      type: 'MATERIAL',
      code: 'VL-THEP-D16',
      name: 'Thép thanh vằn CB400 D16 Hòa Phát',
      unit: 'Kg',
      normRate: 110.5,
      unitPrice: Math.round(17200 * mult),
      previousUnitPrice: Math.round(17200 * 0.98),
      totalQuantity: 110.5 * taskQuantity,
      totalAmount: (110.5 * taskQuantity) * Math.round(17200 * mult),
      supplierOrSource: 'Báo giá Thép Hòa Phát (Hợp đồng PO)',
    },
    {
      id: 2,
      type: 'MATERIAL',
      code: 'VL-BT-M300',
      name: 'Bê tông thương phẩm mác 300 R28',
      unit: 'm3',
      normRate: 1.025,
      unitPrice: Math.round(1280000 * mult),
      previousUnitPrice: Math.round(1280000 * 0.98),
      totalQuantity: 1.025 * taskQuantity,
      totalAmount: (1.025 * taskQuantity) * Math.round(1280000 * mult),
      supplierOrSource: 'Trạm trộn bê tông BMC Sông Lô',
    },
    {
      id: 3,
      type: 'MATERIAL',
      code: 'VL-VAN-PHU',
      name: 'Ván cốp pha phủ phim 18mm luân chuyển',
      unit: 'm2',
      normRate: 3.5,
      unitPrice: Math.round(280000 * mult),
      previousUnitPrice: Math.round(280000 * 0.98),
      totalQuantity: 3.5 * taskQuantity,
      totalAmount: (3.5 * taskQuantity) * Math.round(280000 * mult),
      supplierOrSource: 'Tổng kho vật liệu BMC',
    },
  ];

  // Labors
  const labors: NormDetailItem[] = [
    {
      id: 4,
      type: 'LABOR',
      code: 'NC-XD-3.5',
      name: 'Nhân công xây dựng bậc 3.5/7 (Lắp dựng cốt thép & đổ BT)',
      unit: 'công',
      normRate: 1.85,
      unitPrice: Math.round(420000 * mult),
      previousUnitPrice: Math.round(420000 * 0.98),
      totalQuantity: 1.85 * taskQuantity,
      totalAmount: (1.85 * taskQuantity) * Math.round(420000 * mult),
      supplierOrSource: 'Quyết định công bố đơn giá NC TP. Hà Nội',
    },
    {
      id: 5,
      type: 'LABOR',
      code: 'NC-CO-3.0',
      name: 'Nhân công cốp pha bậc 3.0/7',
      unit: 'công',
      normRate: 1.20,
      unitPrice: Math.round(390000 * mult),
      previousUnitPrice: Math.round(390000 * 0.98),
      totalQuantity: 1.20 * taskQuantity,
      totalAmount: (1.20 * taskQuantity) * Math.round(390000 * mult),
      supplierOrSource: 'Đơn giá khoán đội thi công số 3',
    },
  ];

  // Machines
  const machines: NormDetailItem[] = [
    {
      id: 6,
      type: 'MACHINE',
      code: 'MAY-BOM-BT',
      name: 'Máy bơm bê tông tĩnh 90m3/h',
      unit: 'ca',
      normRate: 0.045,
      unitPrice: Math.round(3800000 * mult),
      previousUnitPrice: Math.round(3800000 * 0.98),
      totalQuantity: Number((0.045 * taskQuantity).toFixed(2)),
      totalAmount: Number((0.045 * taskQuantity * Math.round(3800000 * mult)).toFixed(0)),
      supplierOrSource: 'Bảng giá ca máy Đội xe máy BMC',
    },
    {
      id: 7,
      type: 'MACHINE',
      code: 'MAY-DAM-DUI',
      name: 'Máy đầm dùi bê tông 1.5kW',
      unit: 'ca',
      normRate: 0.12,
      unitPrice: Math.round(350000 * mult),
      previousUnitPrice: Math.round(350000 * 0.98),
      totalQuantity: Number((0.12 * taskQuantity).toFixed(2)),
      totalAmount: Number((0.12 * taskQuantity * Math.round(350000 * mult)).toFixed(0)),
      supplierOrSource: 'Thiết bị thi công nội bộ',
    },
  ];

  const totalMaterialCost = materials.reduce((s, it) => s + it.totalAmount, 0);
  const totalLaborCost = labors.reduce((s, it) => s + it.totalAmount, 0);
  const totalMachineCost = machines.reduce((s, it) => s + it.totalAmount, 0);
  const totalDirectCost = totalMaterialCost + totalLaborCost + totalMachineCost;
  const unitRateDirect = Math.round(totalDirectCost / taskQuantity);

  const openHistoryFor = (item: NormDetailItem) => {
    setSelectedHistoryItem({
      code: item.code,
      name: item.name,
      unit: item.unit,
      type: item.type,
      currentPrice: item.unitPrice,
    });
    setHistoryModalOpen(true);
  };

  return (
    <div>
      {/* Description */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} color="var(--orange-primary)" />
              Quản Trị Định Mức & Đơn Giá Chi Tiết Theo Dự Án - Hạng Mục - Công Tác
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              Đơn giá không cố định giữa các tháng và địa bàn thi công — Hệ thống lưu trữ lịch sử biến động để dự toán chi phí dự án chính xác theo thời điểm
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-primary" style={{ fontSize: '12px', padding: '6px 12px' }}>
              Thời điểm áp dụng: {selectedPeriod}
            </span>
          </div>
        </div>
      </div>

      {/* Cascading Filter Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', alignItems: 'flex-end' }}>
          {/* Level 1: Project */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Building2 size={13} color="var(--orange-primary)" />
              1. Dự Án / Công Trình:
            </label>
            <select
              className="form-select"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              style={{ fontSize: '13px' }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Level 2: Project Item */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Layers size={13} color="#3b82f6" />
              2. Hạng Mục Công Trình:
            </label>
            <select
              className="form-select"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              style={{ fontSize: '13px' }}
            >
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.code ? `[${it.code}] ` : ''}{it.name}
                </option>
              ))}
            </select>
          </div>

          {/* Level 3: Project Task */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ChevronRight size={13} color="#10b981" />
              3. Công Tác Thi Công:
            </label>
            <select
              className="form-select"
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              style={{ fontSize: '13px' }}
            >
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code ? `[${t.code}] ` : ''}{t.name}
                </option>
              ))}
              <option value="1003">[CT-03] Gia công lắp dựng cốt thép và đổ bê tông dầm sàn</option>
            </select>
          </div>

          {/* Level 4: Time Period Selector */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} color="#f59e0b" />
              4. Kỳ Áp Đơn Giá Dự Toán:
            </label>
            <select
              className="form-select"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              style={{ fontSize: '13px', fontWeight: 600, color: 'var(--orange-primary)' }}
            >
              <option value="Tháng 03/2026">Tháng 03/2026 (Giá hiện tại)</option>
              <option value="Tháng 02/2026">Tháng 02/2026 (-2.0%)</option>
              <option value="Tháng 01/2026">Tháng 01/2026 (-4.0%)</option>
              <option value="Tháng 12/2025">Tháng 12/2025 (-3.0%)</option>
              <option value="Tháng 11/2025">Tháng 11/2025 (-6.0%)</option>
              <option value="Tháng 10/2025">Tháng 10/2025 (-8.0% Dự toán thầu)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cost Breakdown Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            padding: '16px',
            borderRadius: '10px',
            backgroundColor: '#f0fdf4',
            border: '1.5px solid #bbf7d0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontSize: '12px', fontWeight: 700 }}>
            <Truck size={16} />
            <span>VẬT LIỆU (VL)</span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#14532d', marginTop: '6px' }}>
            {formatCurrency(totalMaterialCost)}
          </div>
          <div style={{ fontSize: '11px', color: '#15803d', marginTop: '2px' }}>
            {materials.length} loại vật liệu định mức
          </div>
        </div>

        <div
          style={{
            padding: '16px',
            borderRadius: '10px',
            backgroundColor: '#eff6ff',
            border: '1.5px solid #bfdbfe',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e40af', fontSize: '12px', fontWeight: 700 }}>
            <HardHat size={16} />
            <span>NHÂN CÔNG (NC)</span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e3a8a', marginTop: '6px' }}>
            {formatCurrency(totalLaborCost)}
          </div>
          <div style={{ fontSize: '11px', color: '#2563eb', marginTop: '2px' }}>
            {labors.length} cấp bậc thợ thi công
          </div>
        </div>

        <div
          style={{
            padding: '16px',
            borderRadius: '10px',
            backgroundColor: '#fefce8',
            border: '1.5px solid #fef08a',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#854d0e', fontSize: '12px', fontWeight: 700 }}>
            <Cpu size={16} />
            <span>MÁY THI CÔNG (M)</span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#713f12', marginTop: '6px' }}>
            {formatCurrency(totalMachineCost)}
          </div>
          <div style={{ fontSize: '11px', color: '#a16207', marginTop: '2px' }}>
            {machines.length} loại ca máy chuyên dụng
          </div>
        </div>

        <div
          style={{
            padding: '16px',
            borderRadius: '10px',
            backgroundColor: '#fff7ed',
            border: '2px solid #fdba74',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9a3412', fontSize: '12px', fontWeight: 700 }}>
            <DollarSign size={16} />
            <span>TỔNG DỰ TOÁN CÔNG TÁC</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--orange-primary)', marginTop: '4px' }}>
            {formatCurrency(totalDirectCost)}
          </div>
          <div style={{ fontSize: '11px', color: '#c2410c', marginTop: '2px' }}>
            Đơn giá trực tiếp: <strong>{formatCurrency(unitRateDirect)}</strong> / {formatUnit(taskUnit)}
          </div>
        </div>
      </div>

      {/* Table 1: Materials */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header" style={{ marginBottom: '12px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={17} />
              1. Bảng Định Mức & Đơn Giá Vật Liệu (Hao phí vật tư thi công)
            </h4>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Khối lượng kế hoạch: {formatNumber(taskQuantity)} {formatUnit(taskUnit)} công tác
            </span>
          </div>
        </div>

        <div className="table-container">
          <table className="bmc-table">
            <thead>
              <tr style={{ backgroundColor: '#f0fdf4' }}>
                <th>Mã Vật Liệu</th>
                <th>Tên Vật Tư & Quy Cách Tiêu Chuẩn</th>
                <th>ĐVT</th>
                <th style={{ textAlign: 'right' }}>Định Mức / ĐV</th>
                <th style={{ textAlign: 'right' }}>Tổng KL Hao Phí</th>
                <th style={{ textAlign: 'right' }}>Đơn Giá Kỳ {selectedPeriod}</th>
                <th style={{ textAlign: 'right' }}>Thành Tiền Dự Toán</th>
                <th>Nguồn Gốc / Báo Giá</th>
                <th style={{ textAlign: 'center', width: '130px' }}>Lịch Sử Giá</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id}>
                  <td><code style={{ fontWeight: 700, color: 'var(--blue-tech)', fontSize: '12px' }}>{m.code}</code></td>
                  <td style={{ fontWeight: 600, color: '#1e293b' }}>{m.name}</td>
                  <td><span className="badge badge-secondary">{formatUnit(m.unit)}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatNumber(m.normRate, 3)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>
                    {formatNumber(m.totalQuantity, 2)} {formatUnit(m.unit)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {formatCurrency(m.unitPrice)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#15803d' }}>
                    {formatCurrency(m.totalAmount)}
                  </td>
                  <td style={{ fontSize: '12px', color: '#64748b' }}>{m.supplierOrSource}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openHistoryFor(m)}
                      title="Xem lịch sử biến động đơn giá qua các tháng"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 8px' }}
                    >
                      <History size={13} color="var(--orange-primary)" /> Lịch Sử
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2: Labors */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header" style={{ marginBottom: '12px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HardHat size={17} />
              2. Bảng Định Mức & Lương Nhân Công Xây Dựng
            </h4>
          </div>
        </div>

        <div className="table-container">
          <table className="bmc-table">
            <thead>
              <tr style={{ backgroundColor: '#eff6ff' }}>
                <th>Mã Nhân Công</th>
                <th>Cấp Bậc Thợ / Chức Danh</th>
                <th>ĐVT</th>
                <th style={{ textAlign: 'right' }}>Định Mức Công / ĐV</th>
                <th style={{ textAlign: 'right' }}>Tổng Số Công</th>
                <th style={{ textAlign: 'right' }}>Lương Ngày Công Kỳ {selectedPeriod}</th>
                <th style={{ textAlign: 'right' }}>Thành Tiền Dự Toán</th>
                <th>Nguồn Gốc / Đơn Giá</th>
                <th style={{ textAlign: 'center', width: '130px' }}>Lịch Sử Giá</th>
              </tr>
            </thead>
            <tbody>
              {labors.map((l) => (
                <tr key={l.id}>
                  <td><code style={{ fontWeight: 700, color: 'var(--blue-tech)', fontSize: '12px' }}>{l.code}</code></td>
                  <td style={{ fontWeight: 600, color: '#1e293b' }}>{l.name}</td>
                  <td><span className="badge badge-secondary">{formatUnit(l.unit)}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatNumber(l.normRate, 3)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>
                    {formatNumber(l.totalQuantity, 2)} công
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {formatCurrency(l.unitPrice)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#1e3a8a' }}>
                    {formatCurrency(l.totalAmount)}
                  </td>
                  <td style={{ fontSize: '12px', color: '#64748b' }}>{l.supplierOrSource}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openHistoryFor(l)}
                      title="Xem lịch sử biến động lương ngày công"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 8px' }}
                    >
                      <History size={13} color="var(--orange-primary)" /> Lịch Sử
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 3: Machines */}
      <div className="card">
        <div className="card-header" style={{ marginBottom: '12px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#854d0e', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={17} />
              3. Bảng Định Mức & Đơn Giá Ca Máy Thi Công
            </h4>
          </div>
        </div>

        <div className="table-container">
          <table className="bmc-table">
            <thead>
              <tr style={{ backgroundColor: '#fefce8' }}>
                <th>Mã Máy</th>
                <th>Tên Loại Máy & Thiết Bị Thi Công</th>
                <th>ĐVT</th>
                <th style={{ textAlign: 'right' }}>Định Mức Ca / ĐV</th>
                <th style={{ textAlign: 'right' }}>Tổng Số Ca Máy</th>
                <th style={{ textAlign: 'right' }}>Đơn Giá Ca Máy Kỳ {selectedPeriod}</th>
                <th style={{ textAlign: 'right' }}>Thành Tiền Dự Toán</th>
                <th>Nguồn Gốc / Đơn vị quản lý</th>
                <th style={{ textAlign: 'center', width: '130px' }}>Lịch Sử Giá</th>
              </tr>
            </thead>
            <tbody>
              {machines.map((m) => (
                <tr key={m.id}>
                  <td><code style={{ fontWeight: 700, color: 'var(--blue-tech)', fontSize: '12px' }}>{m.code}</code></td>
                  <td style={{ fontWeight: 600, color: '#1e293b' }}>{m.name}</td>
                  <td><span className="badge badge-secondary">{formatUnit(m.unit)}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatNumber(m.normRate, 3)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>
                    {formatNumber(m.totalQuantity, 2)} ca
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {formatCurrency(m.unitPrice)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#854d0e' }}>
                    {formatCurrency(m.totalAmount)}
                  </td>
                  <td style={{ fontSize: '12px', color: '#64748b' }}>{m.supplierOrSource}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openHistoryFor(m)}
                      title="Xem lịch sử biến động giá ca máy"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 8px' }}
                    >
                      <History size={13} color="var(--orange-primary)" /> Lịch Sử
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Price History Modal */}
      {selectedHistoryItem && (
        <PriceHistoryModal
          isOpen={historyModalOpen}
          onClose={() => {
            setHistoryModalOpen(false);
            setSelectedHistoryItem(null);
          }}
          itemCode={selectedHistoryItem.code}
          itemName={selectedHistoryItem.name}
          unit={selectedHistoryItem.unit}
          itemType={selectedHistoryItem.type}
          projectName={projects.find(p => String(p.id) === selectedProjectId)?.name || 'Dự án BMC Landmark'}
          taskName={tasks.find(t => String(t.id) === selectedTaskId)?.name || 'Gia công cốt thép và đổ bê tông dầm sàn'}
          currentPrice={selectedHistoryItem.currentPrice}
        />
      )}
    </div>
  );
};
