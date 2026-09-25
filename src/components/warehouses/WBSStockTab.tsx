import React, { useState, useEffect } from 'react';
import { projectApi } from '../../api';
import { Project, ProjectItem, ProjectTask } from '../../types';
import { formatCurrency, formatNumber, formatUnit } from '../../utils/formatters';
import {
  Layers,
  Building2,
  Filter,
  Search,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Truck,
  TrendingDown,
  Warehouse,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface WBSStockRecord {
  id: number;
  projectId: number;
  projectName: string;
  projectCode: string;
  projectItemId: number;
  projectItemName: string;
  projectTaskId: number;
  projectTaskName: string;
  materialId: number;
  materialCode: string;
  materialName: string;
  unit: string;
  normQuantity: number; // Định mức thiết kế
  allocatedQuantity: number; // Lũy kế đã xuất kho cấp phát
  consumedQuantity: number; // Khối lượng đã thi công nghiệm thu
  currentSiteQuantity: number; // Tồn tại công trường (allocated - consumed)
  unitPrice: number;
  totalSiteValue: number;
  status: 'SAFE' | 'LOW_STOCK' | 'OVER_NORM';
  lastIssuedDate: string;
}

const DEFAULT_WBS_STOCKS: WBSStockRecord[] = [
  {
    id: 1,
    projectId: 1,
    projectCode: 'DA-BMC-01',
    projectName: 'Tòa nhà Hỗn hợp BMC Landmark Tower',
    projectItemId: 101,
    projectItemName: 'Hạng mục: Kết cấu phần ngầm & móng',
    projectTaskId: 1001,
    projectTaskName: 'Công tác: Gia công cốt thép đài móng ĐM1-ĐM8',
    materialId: 1,
    materialCode: 'VL-THEP-D20',
    materialName: 'Thép thanh vằn CB400 D20 Hòa Phát',
    unit: 'Kg',
    normQuantity: 28500,
    allocatedQuantity: 25000,
    consumedQuantity: 18200,
    currentSiteQuantity: 6800,
    unitPrice: 17500,
    totalSiteValue: 6800 * 17500,
    status: 'SAFE',
    lastIssuedDate: '2026-03-18',
  },
  {
    id: 2,
    projectId: 1,
    projectCode: 'DA-BMC-01',
    projectName: 'Tòa nhà Hỗn hợp BMC Landmark Tower',
    projectItemId: 101,
    projectItemName: 'Hạng mục: Kết cấu phần ngầm & móng',
    projectTaskId: 1002,
    projectTaskName: 'Công tác: Đổ bê tông đài móng mác M350 R28',
    materialId: 2,
    materialCode: 'VL-BT-M350',
    materialName: 'Bê tông thương phẩm mác 350 độ sụt 12±2',
    unit: 'm3',
    normQuantity: 650,
    allocatedQuantity: 640,
    consumedQuantity: 635,
    currentSiteQuantity: 5,
    unitPrice: 1350000,
    totalSiteValue: 5 * 1350000,
    status: 'SAFE',
    lastIssuedDate: '2026-03-20',
  },
  {
    id: 3,
    projectId: 1,
    projectCode: 'DA-BMC-01',
    projectName: 'Tòa nhà Hỗn hợp BMC Landmark Tower',
    projectItemId: 102,
    projectItemName: 'Hạng mục: Kết cấu phần thân (Tầng 1 - 5)',
    projectTaskId: 1003,
    projectTaskName: 'Công tác: Lắp dựng cốp pha dầm sàn Tầng 2',
    materialId: 3,
    materialCode: 'VL-VAN-PHU',
    materialName: 'Ván phủ phim 18mm tiêu chuẩn BMC',
    unit: 'm2',
    normQuantity: 1200,
    allocatedQuantity: 1350,
    consumedQuantity: 1100,
    currentSiteQuantity: 250,
    unitPrice: 280000,
    totalSiteValue: 250 * 280000,
    status: 'OVER_NORM',
    lastIssuedDate: '2026-03-15',
  },
  {
    id: 4,
    projectId: 1,
    projectCode: 'DA-BMC-01',
    projectName: 'Tòa nhà Hỗn hợp BMC Landmark Tower',
    projectItemId: 102,
    projectItemName: 'Hạng mục: Kết cấu phần thân (Tầng 1 - 5)',
    projectTaskId: 1004,
    projectTaskName: 'Công tác: Lắp dựng cốt thép cột vách Tầng 2',
    materialId: 4,
    materialCode: 'VL-THEP-D16',
    materialName: 'Thép thanh vằn CB400 D16 Hòa Phát',
    unit: 'Kg',
    normQuantity: 14200,
    allocatedQuantity: 8000,
    consumedQuantity: 7800,
    currentSiteQuantity: 200,
    unitPrice: 17200,
    totalSiteValue: 200 * 17200,
    status: 'LOW_STOCK',
    lastIssuedDate: '2026-03-21',
  },
  {
    id: 5,
    projectId: 2,
    projectCode: 'DA-BMC-02',
    projectName: 'Khu Nhà Xưởng Sản Xuất BMC KCN Nam Sơn',
    projectItemId: 201,
    projectItemName: 'Hạng mục: Kết cấu khung thép tiền chế',
    projectTaskId: 2001,
    projectTaskName: 'Công tác: Lắp dựng cột kèo thép Tiền chế K1-K12',
    materialId: 5,
    materialCode: 'VL-KTHEP-H400',
    materialName: 'Thép hình H400x200x8x13 gia công tổ hợp',
    unit: 'Tấn',
    normQuantity: 145,
    allocatedQuantity: 120,
    consumedQuantity: 85,
    currentSiteQuantity: 35,
    unitPrice: 26500000,
    totalSiteValue: 35 * 26500000,
    status: 'SAFE',
    lastIssuedDate: '2026-03-12',
  },
  {
    id: 6,
    projectId: 2,
    projectCode: 'DA-BMC-02',
    projectName: 'Khu Nhà Xưởng Sản Xuất BMC KCN Nam Sơn',
    projectItemId: 202,
    projectItemName: 'Hạng mục: Xây tường bao che & vách ngăn',
    projectTaskId: 2002,
    projectTaskName: 'Công tác: Xây tường gạch block bê tông dày 200mm',
    materialId: 6,
    materialCode: 'VL-GACH-BLOCK',
    materialName: 'Gạch block bê tông 390x190x190mm',
    unit: 'Viên',
    normQuantity: 22000,
    allocatedQuantity: 15000,
    consumedQuantity: 14500,
    currentSiteQuantity: 500,
    unitPrice: 12500,
    totalSiteValue: 500 * 12500,
    status: 'LOW_STOCK',
    lastIssuedDate: '2026-03-22',
  },
  {
    id: 7,
    projectId: 3,
    projectCode: 'DA-BMC-03',
    projectName: 'Hạ Tầng Giao Thông Khu Đô Thị Nam Cầu Cẩm Lý',
    projectItemId: 301,
    projectItemName: 'Hạng mục: Nền mặt đường tuyến chính D1',
    projectTaskId: 3001,
    projectTaskName: 'Công tác: Rải và lu lèn cấp phối đá dăm Loại 1',
    materialId: 7,
    materialCode: 'VL-CPDD-L1',
    materialName: 'Cấp phối đá dăm loại 1 Dmax 25mm',
    unit: 'm3',
    normQuantity: 4200,
    allocatedQuantity: 3500,
    consumedQuantity: 2800,
    currentSiteQuantity: 700,
    unitPrice: 320000,
    totalSiteValue: 700 * 320000,
    status: 'SAFE',
    lastIssuedDate: '2026-03-19',
  }
];

export const WBSStockTab: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SAFE' | 'LOW_STOCK' | 'OVER_NORM'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const pList = await projectApi.getAll();
      setProjects(pList);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProjectChange = async (projId: string) => {
    setSelectedProjectId(projId);
    setSelectedItemId('');
    setSelectedTaskId('');
    setItems([]);
    setTasks([]);
    if (projId) {
      try {
        const itms = await projectApi.getItems(Number(projId));
        setItems(itms);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleItemChange = async (itemId: string) => {
    setSelectedItemId(itemId);
    setSelectedTaskId('');
    setTasks([]);
    if (selectedProjectId && itemId) {
      try {
        const tsks = await projectApi.getTasks(Number(selectedProjectId), Number(itemId));
        setTasks(tsks);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Filter stocks based on selectors
  const filteredStocks = DEFAULT_WBS_STOCKS.filter((s) => {
    if (selectedProjectId && String(s.projectId) !== selectedProjectId) return false;
    if (selectedItemId && String(s.projectItemId) !== selectedItemId) return false;
    if (selectedTaskId && String(s.projectTaskId) !== selectedTaskId) return false;
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCode = s.materialCode.toLowerCase().includes(q);
      const matchName = s.materialName.toLowerCase().includes(q);
      const matchTask = s.projectTaskName.toLowerCase().includes(q);
      if (!matchCode && !matchName && !matchTask) return false;
    }
    return true;
  });

  // Calculate Metrics
  const totalSiteValue = filteredStocks.reduce((sum, s) => sum + s.totalSiteValue, 0);
  const totalAllocatedItems = filteredStocks.length;
  const lowStockCount = filteredStocks.filter(s => s.status === 'LOW_STOCK').length;
  const overNormCount = filteredStocks.filter(s => s.status === 'OVER_NORM').length;

  return (
    <div>
      {/* Description Header */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} color="var(--orange-primary)" />
              Quản Trị Tồn Kho & Cấp Phát Riêng Biệt Theo Dự Án - Hạng Mục - Công Tác (WBS)
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              Kiểm soát chính xác vật tư đã xuất kho cấp phát đến chân công trường, đã thi công nghiệm thu, và lượng tồn thực tế phục vụ từng công tác thi công
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-primary" style={{ fontSize: '12px', padding: '6px 12px' }}>
              Đang theo dõi {filteredStocks.length} mục vật tư công trình
            </span>
          </div>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--orange-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>
            <Warehouse size={16} color="var(--orange-primary)" />
            <span>TỔNG GIÁ TRỊ VẬT TƯ TỒN TẠI CÔNG TRƯỜNG</span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--orange-primary)', marginTop: '8px' }}>
            {formatCurrency(totalSiteValue)}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            Giá trị thực tế tại chân công trình (chưa lắp đặt)
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>
            <Truck size={16} color="#3b82f6" />
            <span>SỐ CHỦNG LOẠI VẬT TƯ ĐANG CẤP PHÁT</span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e40af', marginTop: '8px' }}>
            {totalAllocatedItems} mặt hàng
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            Phân bổ cho các công tác theo dự toán
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>
            <AlertTriangle size={16} color="#ef4444" />
            <span>CẢNH BÁO THIẾU VẬT TƯ (TỒN THẤP)</span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#b91c1c', marginTop: '8px' }}>
            {lowStockCount} công tác
          </div>
          <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>
            Cần lập phiếu đề xuất mua sắm bổ sung ngay
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>
            <AlertCircle size={16} color="#f59e0b" />
            <span>CẢNH BÁO XUẤT VƯỢT ĐỊNH MỨC</span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#b45309', marginTop: '8px' }}>
            {overNormCount} trường hợp
          </div>
          <div style={{ fontSize: '11px', color: '#d97706', marginTop: '4px' }}>
            Cấp phát vượt khối lượng thiết kế phê duyệt
          </div>
        </div>
      </div>

      {/* Cascading Filter Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: '14px', alignItems: 'flex-end' }}>
          {/* Level 1: Project */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Building2 size={13} color="var(--orange-primary)" />
              1. Dự Án / Công Trình:
            </label>
            <select
              className="form-select"
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              style={{ fontSize: '13px' }}
            >
              <option value="">-- Tất cả công trình / dự án --</option>
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
              onChange={(e) => handleItemChange(e.target.value)}
              disabled={!selectedProjectId}
              style={{ fontSize: '13px' }}
            >
              <option value="">-- Tất cả hạng mục --</option>
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
              disabled={!selectedItemId}
              style={{ fontSize: '13px' }}
            >
              <option value="">-- Tất cả công tác --</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code ? `[${t.code}] ` : ''}{t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
              4. Tình Trạng Quản Trị:
            </label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{ fontSize: '13px' }}
            >
              <option value="ALL">-- Tất cả tình trạng --</option>
              <option value="SAFE">✓ Tồn kho an toàn</option>
              <option value="LOW_STOCK">⚠ Cảnh báo: Thiếu / Sắp hết vật tư</option>
              <option value="OVER_NORM">⛔ Cảnh báo: Cấp vượt định mức</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
              Tìm Kiếm Vật Tư:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Mã hoặc tên vật tư..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: '13px', paddingLeft: '30px' }}
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Stock Table Grouped by WBS */}
      <div className="card">
        <div className="card-header" style={{ marginBottom: '14px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
              Bảng Theo Dõi Cấp Phát & Tồn Kho Chi Tiết Theo Công Tác
            </h4>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Dữ liệu liên thông giữa Kho, Dự toán định mức và Nhật ký thi công nghiệm thu hiện trường
            </span>
          </div>
        </div>

        <div className="table-container">
          <table className="bmc-table">
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <th>Dự Án / Công Trình</th>
                <th>Hạng Mục & Công Tác Thi Công (WBS)</th>
                <th>Mã & Tên Vật Tư / Quy Cách</th>
                <th>ĐVT</th>
                <th style={{ textAlign: 'right' }}>Định Mức Kế Hoạch</th>
                <th style={{ textAlign: 'right' }}>Lũy Kế Đã Cấp Phát</th>
                <th style={{ textAlign: 'right' }}>Đã Thi Công Nghiệm Thu</th>
                <th style={{ textAlign: 'right', backgroundColor: 'rgba(234, 88, 12, 0.08)' }}>
                  TỒN TẠI CÔNG TRƯỜNG
                </th>
                <th style={{ textAlign: 'right' }}>Đơn Giá BQ (VNĐ)</th>
                <th style={{ textAlign: 'right' }}>Giá Trị Tồn Tại Chân CT</th>
                <th style={{ textAlign: 'center' }}>Tình Trạng</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontSize: '12px', fontWeight: 600 }}>
                    <div style={{ color: '#0f172a' }}>{s.projectName}</div>
                    <code style={{ fontSize: '11px', color: '#64748b' }}>{s.projectCode}</code>
                  </td>

                  <td style={{ fontSize: '12px' }}>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{s.projectTaskName}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{s.projectItemName}</div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--blue-tech)', fontSize: '12px' }}>
                      {s.materialCode}
                    </div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>
                      {s.materialName}
                    </div>
                  </td>

                  <td>
                    <span className="badge badge-secondary" style={{ fontSize: '11px' }}>
                      {formatUnit(s.unit)}
                    </span>
                  </td>

                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#475569' }}>
                    {formatNumber(s.normQuantity, 2)}
                  </td>

                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#2563eb' }}>
                    {formatNumber(s.allocatedQuantity, 2)}
                  </td>

                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                    {formatNumber(s.consumedQuantity, 2)}
                  </td>

                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 800,
                      fontSize: '14px',
                      backgroundColor: 'rgba(234, 88, 12, 0.06)',
                      color: s.currentSiteQuantity <= 500 ? 'var(--crimson-danger)' : 'var(--orange-primary)',
                    }}
                  >
                    {formatNumber(s.currentSiteQuantity, 2)}
                  </td>

                  <td style={{ textAlign: 'right', fontSize: '12px', color: '#475569' }}>
                    {formatCurrency(s.unitPrice)}
                  </td>

                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--orange-primary)' }}>
                    {formatCurrency(s.totalSiteValue)}
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    {s.status === 'SAFE' && (
                      <span className="badge badge-active" style={{ fontSize: '11px' }}>
                        <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 3 }} /> An toàn
                      </span>
                    )}
                    {s.status === 'LOW_STOCK' && (
                      <span className="badge badge-danger" style={{ fontSize: '11px' }}>
                        <AlertTriangle size={12} style={{ display: 'inline', marginRight: 3 }} /> Thiếu vật tư
                      </span>
                    )}
                    {s.status === 'OVER_NORM' && (
                      <span className="badge badge-warning" style={{ fontSize: '11px' }}>
                        <AlertCircle size={12} style={{ display: 'inline', marginRight: 3 }} /> Vượt định mức
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredStocks.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Không tìm thấy dữ liệu tồn kho công tác phù hợp với tiêu chí lọc đã chọn.
                  </td>
                </tr>
              )}
            </tbody>

            {filteredStocks.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: '#f8fafc', fontWeight: 800 }}>
                  <td colSpan={7} style={{ textAlign: 'right', fontSize: '13px', color: '#0f172a' }}>
                    TỔNG CỘNG GIÁ TRỊ VẬT TƯ TỒN TẠI CÔNG TRƯỜNG:
                  </td>
                  <td colSpan={2}></td>
                  <td style={{ textAlign: 'right', fontSize: '16px', color: 'var(--orange-primary)' }}>
                    {formatCurrency(totalSiteValue)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
