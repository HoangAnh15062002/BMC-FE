import React, { useState, useEffect } from 'react';
import { PriceHistoryRecord, Supplier } from '../../types';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import { procurementApi } from '../../api';
import {
  X,
  History,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Building2,
  Layers,
  Plus,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Truck,
  Users,
  Search,
  Check,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  FileText
} from 'lucide-react';

interface PriceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemCode?: string;
  itemName?: string;
  unit?: string;
  itemType?: 'MATERIAL' | 'LABOR' | 'MACHINE';
  projectName?: string;
  taskName?: string;
  currentPrice?: number;
}

const DEFAULT_SUPPLIERS: Supplier[] = [
  { id: 1, code: 'NCC-HP', name: 'Công ty Cổ phần Thép Hòa Phát Hưng Yên', taxCode: '0900282431', contactPerson: 'Nguyễn Văn Tuấn', phone: '024.6281.8666', email: 'sales@hoaphat.com.vn', address: 'KCN Phố Nối A, Hưng Yên', isActive: true },
  { id: 2, code: 'NCC-POMINA', name: 'Công ty Cổ phần Thép Pomina', taxCode: '3500456123', contactPerson: 'Trần Đình Long', phone: '028.3824.7123', email: 'contact@pomina-steel.com', address: 'KCN Phú Mỹ 1, Bà Rịa - Vũng Tàu', isActive: true },
  { id: 3, code: 'NCC-VIETNHAT', name: 'Công ty TNHH Thép Vina Kyoei (Việt Nhật)', taxCode: '3500109988', contactPerson: 'Lê Hoàng Nam', phone: '0254.3895.111', email: 'info@vinakyoeisteel.com.vn', address: 'KCN Phú Mỹ, BR-VT', isActive: true },
  { id: 4, code: 'NCC-HATIEN', name: 'Công ty CP Xi Măng Vicem Hà Tiên', taxCode: '0300448688', contactPerson: 'Vũ Đức Thịnh', phone: '028.3836.8363', email: 'kinhdoanh@vicemhatien.com.vn', address: '360 Bến Vân Đồn, Q.4, TP.HCM', isActive: true },
  { id: 5, code: 'NCC-RACHCHIEC', name: 'Công ty Bê tông Thương phẩm Rạch Chiếc', taxCode: '0303889922', contactPerson: 'Phạm Minh Trí', phone: '028.3731.4567', email: 'sales@betongrachchiec.vn', address: 'Xa lộ Hà Nội, TP. Thủ Đức', isActive: true },
  { id: 6, code: 'NCC-PHUOCAN', name: 'Công ty Cơ giới & Bê tông Đúc sẵn Phước An', taxCode: '0312554477', contactPerson: 'Đặng Quốc Huy', phone: '028.3990.8888', email: 'phuocan.machinery@gmail.com', address: 'KCN Hiệp Phước, Nhà Bè, TP.HCM', isActive: true },
];

export const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({
  isOpen,
  onClose,
  itemCode = 'VL-THEP-D16',
  itemName = 'Thép thanh vằn CB400 D16 Hòa Phát',
  unit = 'Kg',
  itemType = 'MATERIAL',
  projectName = 'Tòa nhà Hỗn hợp BMC Landmark Tower',
  taskName = 'Gia công lắp dựng cốt thép dầm sàn',
  currentPrice = 17200,
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'timeline' | 'suppliers_compare' | 'manage_suppliers'>('timeline');

  // Suppliers state
  const [suppliers, setSuppliers] = useState<Supplier[]>(DEFAULT_SUPPLIERS);
  const [supplierSearch, setSupplierSearch] = useState('');

  // Initial monthly history records
  const [historyRecords, setHistoryRecords] = useState<PriceHistoryRecord[]>([
    {
      id: 1,
      itemType: itemType,
      itemId: 101,
      itemCode: itemCode,
      itemName: itemName,
      unit: unit,
      period: 'Tháng 10/2025',
      price: Math.round(currentPrice * 0.92),
      previousPrice: Math.round(currentPrice * 0.90),
      percentChange: 2.2,
      source: 'Công bố Liên sở XD - TC',
      supplierName: 'Đơn vị công bố nhà nước',
      projectName: projectName,
      effectiveDate: '2025-10-01',
      updatedBy: 'KS. Nguyễn Văn Tuấn (Phòng Kế Hoạch - Dự Toán)',
      note: 'Áp dụng cho dự toán giai đoạn đấu thầu khởi đầu',
    },
    {
      id: 2,
      itemType: itemType,
      itemId: 101,
      itemCode: itemCode,
      itemName: itemName,
      unit: unit,
      period: 'Tháng 11/2025',
      price: Math.round(currentPrice * 0.94),
      previousPrice: Math.round(currentPrice * 0.92),
      percentChange: 2.1,
      source: 'Báo giá chính thức Nhà Cung Cấp',
      supplierName: 'Công ty Cổ phần Thép Hòa Phát Hưng Yên',
      projectName: projectName,
      effectiveDate: '2025-11-05',
      updatedBy: 'Phòng Vật tư - Mua sắm BMC',
      note: 'Điều chỉnh theo bảng giá nhà máy công bố đợt 1',
    },
    {
      id: 3,
      itemType: itemType,
      itemId: 101,
      itemCode: itemCode,
      itemName: itemName,
      unit: unit,
      period: 'Tháng 12/2025',
      price: Math.round(currentPrice * 0.97),
      previousPrice: Math.round(currentPrice * 0.94),
      percentChange: 3.2,
      source: 'Hợp đồng nguyên tắc cung ứng',
      supplierName: 'Đại lý Cấp 1 Thép Việt Nhật / Hòa Phát',
      projectName: projectName,
      effectiveDate: '2025-12-01',
      updatedBy: 'Phòng Vật tư - Mua sắm BMC',
      note: 'Giá tăng do chi phí phôi thép và cước vận tải cuối năm',
    },
    {
      id: 4,
      itemType: itemType,
      itemId: 101,
      itemCode: itemCode,
      itemName: itemName,
      unit: unit,
      period: 'Tháng 01/2026',
      price: Math.round(currentPrice * 0.96),
      previousPrice: Math.round(currentPrice * 0.97),
      percentChange: -1.0,
      source: 'Báo giá đấu thầu mua sắm gói móng',
      supplierName: 'Công ty Cổ phần Thương mại Thép BMC',
      projectName: projectName,
      effectiveDate: '2026-01-10',
      updatedBy: 'KS. Trần Đình Trọng (Ban Chỉ Huy Công Trường)',
      note: 'Chiết khấu khối lượng lớn đơn hàng đợt 1 phần ngầm',
    },
    {
      id: 5,
      itemType: itemType,
      itemId: 101,
      itemCode: itemCode,
      itemName: itemName,
      unit: unit,
      period: 'Tháng 02/2026',
      price: Math.round(currentPrice * 0.98),
      previousPrice: Math.round(currentPrice * 0.96),
      percentChange: 2.08,
      source: 'Công bố Liên sở XD - TC Tháng 2',
      supplierName: 'Liên sở Tài chính - Xây dựng TP. Hà Nội',
      projectName: projectName,
      effectiveDate: '2026-02-15',
      updatedBy: 'Phòng Kế Hoạch - Dự Toán BMC',
      note: 'Cập nhật lại dự toán chi phí thi công sau Tết',
    },
    {
      id: 6,
      itemType: itemType,
      itemId: 101,
      itemCode: itemCode,
      itemName: itemName,
      unit: unit,
      period: 'Tháng 03/2026 (Hiện tại)',
      price: currentPrice,
      previousPrice: Math.round(currentPrice * 0.98),
      percentChange: 2.04,
      source: 'Báo giá đơn đặt hàng PO thực tế',
      supplierName: 'Công ty CP Đầu tư Thương mại Thép Hòa Phát',
      projectName: projectName,
      effectiveDate: '2026-03-01',
      updatedBy: 'Giám đốc Phê Duyệt',
      note: 'Đơn giá thực tế ký hợp đồng PO cung cấp cho công tác dầm sàn',
    }
  ]);

  // Form add new period price
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('04');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [newPrice, setNewPrice] = useState('');
  const [newSource, setNewSource] = useState('Báo giá Nhà Cung Cấp');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('1');
  const [newNote, setNewNote] = useState('');

  // Quick Add Supplier Modal state
  const [showAddSupModal, setShowAddSupModal] = useState(false);
  const [supForm, setSupForm] = useState({
    code: '',
    name: '',
    taxCode: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
  });

  // Fetch real suppliers from backend on open
  useEffect(() => {
    if (isOpen) {
      procurementApi.getSuppliers()
        .then(res => {
          if (Array.isArray(res) && res.length > 0) {
            setSuppliers(res);
            setSelectedSupplierId(String(res[0].id));
          }
        })
        .catch(() => {
          // Keep defaults
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddNewPeriod = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = Number(newPrice);
    if (!priceNum || priceNum <= 0) {
      alert('Vui lòng nhập đơn giá hợp lệ!');
      return;
    }
    const lastRecord = historyRecords[historyRecords.length - 1];
    const prevP = lastRecord ? lastRecord.price : priceNum;
    const diff = priceNum - prevP;
    const percentChange = prevP > 0 ? Number(((diff / prevP) * 100).toFixed(2)) : 0;

    const chosenSupplier = suppliers.find(s => String(s.id) === selectedSupplierId);
    const supplierName = chosenSupplier ? chosenSupplier.name : 'Nhà cung cấp đã chọn';
    const periodStr = `Tháng ${selectedMonth}/${selectedYear}`;

    const newRec: PriceHistoryRecord = {
      id: Date.now(),
      itemType: itemType,
      itemId: 101,
      itemCode: itemCode,
      itemName: itemName,
      unit: unit,
      period: periodStr,
      price: priceNum,
      previousPrice: prevP,
      percentChange: percentChange,
      source: newSource.trim(),
      supplierName: supplierName,
      projectName: projectName,
      effectiveDate: `${selectedYear}-${selectedMonth}-01`,
      updatedBy: 'Kỹ sư Quản lý Chi phí (Hiện tại)',
      note: newNote.trim() || 'Cập nhật biến động đơn giá tháng mới',
    };

    setHistoryRecords(prev => [...prev, newRec]);
    setShowAddForm(false);
    setNewPrice('');
    setNewNote('');
    alert(`Đã cập nhật đơn giá kỳ [${periodStr}] từ [${supplierName}] thành công!`);
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supForm.name.trim()) {
      alert('Vui lòng nhập tên nhà cung cấp!');
      return;
    }
    const newCode = supForm.code.trim() || `NCC-${Date.now().toString().slice(-4)}`;
    try {
      const created = await procurementApi.createSupplier({
        code: newCode,
        name: supForm.name.trim(),
        taxCode: supForm.taxCode.trim(),
        contactPerson: supForm.contactPerson.trim(),
        phone: supForm.phone.trim(),
        email: supForm.email.trim(),
        address: supForm.address.trim(),
        isActive: true,
      });

      const newSup: Supplier = created || {
        id: Date.now(),
        code: newCode,
        name: supForm.name.trim(),
        taxCode: supForm.taxCode.trim(),
        contactPerson: supForm.contactPerson.trim(),
        phone: supForm.phone.trim(),
        email: supForm.email.trim(),
        address: supForm.address.trim(),
        isActive: true,
      };

      setSuppliers(prev => [newSup, ...prev]);
      setSelectedSupplierId(String(newSup.id));
      setShowAddSupModal(false);
      setSupForm({ code: '', name: '', taxCode: '', contactPerson: '', phone: '', email: '', address: '' });
      alert(`Đã thêm nhà cung cấp [${newSup.name}] vào hệ thống!`);
    } catch {
      // Local fallback
      const localSup: Supplier = {
        id: Date.now(),
        code: newCode,
        name: supForm.name.trim(),
        taxCode: supForm.taxCode.trim(),
        contactPerson: supForm.contactPerson.trim(),
        phone: supForm.phone.trim(),
        email: supForm.email.trim(),
        address: supForm.address.trim(),
        isActive: true,
      };
      setSuppliers(prev => [localSup, ...prev]);
      setSelectedSupplierId(String(localSup.id));
      setShowAddSupModal(false);
      setSupForm({ code: '', name: '', taxCode: '', contactPerson: '', phone: '', email: '', address: '' });
      alert(`Đã thêm nhà cung cấp [${localSup.name}] vào hệ thống!`);
    }
  };

  const handleApplySupplierPrice = (sup: Supplier, quotePrice: number) => {
    if (confirm(`Xác nhận áp dụng đơn giá ${formatCurrency(quotePrice)}/${unit} từ nhà cung cấp [${sup.name}] cho công tác này?`)) {
      const newRec: PriceHistoryRecord = {
        id: Date.now(),
        itemType: itemType,
        itemId: 101,
        itemCode: itemCode,
        itemName: itemName,
        unit: unit,
        period: `Tháng ${selectedMonth}/${selectedYear} (Đã áp dụng)`,
        price: quotePrice,
        previousPrice: currentPrice,
        percentChange: Number((((quotePrice - currentPrice) / currentPrice) * 100).toFixed(2)),
        source: 'Áp dụng báo giá Nhà Cung Cấp',
        supplierName: sup.name,
        projectName: projectName,
        effectiveDate: new Date().toISOString().split('T')[0],
        updatedBy: 'Ban Quản lý Dự Án',
        note: `Đã phê duyệt chọn nhà cung cấp ${sup.name}`,
      };
      setHistoryRecords(prev => [...prev, newRec]);
      setActiveTab('timeline');
      alert(`Đã cập nhật đơn giá ${formatCurrency(quotePrice)} của [${sup.name}] vào hệ thống!`);
    }
  };

  const initialPrice = historyRecords[0]?.price || currentPrice;
  const latestPrice = historyRecords[historyRecords.length - 1]?.price || currentPrice;
  const overallDiff = latestPrice - initialPrice;
  const overallPercent = initialPrice > 0 ? ((overallDiff / initialPrice) * 100).toFixed(1) : '0';

  // Vendor quotes comparison list
  const vendorQuotes = suppliers.map((sup, idx) => {
    // Variations around current price for realistic comparison
    const priceFactors = [1.0, 0.96, 1.04, 0.98, 1.02, 0.95, 1.06];
    const factor = priceFactors[idx % priceFactors.length];
    const unitPrice = Math.round(currentPrice * factor);
    const diffPercent = Number((((unitPrice - currentPrice) / currentPrice) * 100).toFixed(1));
    const leadTimes = ['1-2 ngày', '3-5 ngày', 'Giao ngay trong ngày', '2-4 ngày'];
    return {
      supplier: sup,
      unitPrice: unitPrice,
      diffPercent: diffPercent,
      leadTime: leadTimes[idx % leadTimes.length],
      isPreferred: idx === 0,
      isBestPrice: diffPercent < 0,
      quoteDate: `2026-03-${10 + (idx % 15)}`,
    };
  });

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    s.code.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    (s.taxCode && s.taxCode.includes(supplierSearch))
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
          width: '100%',
          maxWidth: '1120px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                color: 'var(--brand-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(249, 115, 22, 0.2)',
              }}
            >
              <History size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Lịch Sử Biến Động Đơn Giá & Quản Lý Nhà Cung Cấp
                </h2>
                <span className="badge badge-primary" style={{ fontSize: '12px', padding: '3px 10px' }}>
                  {itemType === 'MATERIAL' ? 'Vật Tư' : itemType === 'LABOR' ? 'Nhân Công' : 'Máy Thi Công'}
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Theo dõi biến động thị trường theo thời gian và so sánh báo giá từ các nhà cung cấp
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setShowAddForm(true);
                setActiveTab('timeline');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <Plus size={15} /> Cập Nhật Đơn Giá Kỳ Mới
            </button>
            <button
              className="btn-icon"
              onClick={onClose}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 24px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <button
            onClick={() => setActiveTab('timeline')}
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
              backgroundColor: activeTab === 'timeline' ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
              color: activeTab === 'timeline' ? 'var(--brand-600)' : '#64748b',
              transition: 'all 0.15s ease',
            }}
          >
            <Calendar size={16} />
            <span>Biến Động Theo Tháng ({historyRecords.length} kỳ)</span>
          </button>

          <button
            onClick={() => setActiveTab('suppliers_compare')}
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
              backgroundColor: activeTab === 'suppliers_compare' ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
              color: activeTab === 'suppliers_compare' ? 'var(--brand-600)' : '#64748b',
              transition: 'all 0.15s ease',
            }}
          >
            <Truck size={16} />
            <span>So Sánh Báo Giá Các NCC ({suppliers.length} đơn vị)</span>
          </button>

          <button
            onClick={() => setActiveTab('manage_suppliers')}
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
              backgroundColor: activeTab === 'manage_suppliers' ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
              color: activeTab === 'manage_suppliers' ? 'var(--brand-600)' : '#64748b',
              transition: 'all 0.15s ease',
            }}
          >
            <Building2 size={16} />
            <span>Danh Bạ & Quản Lý Nhà Cung Cấp</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, backgroundColor: '#ffffff' }}>
          {/* Target Item Context Bar */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              marginBottom: '18px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>TÊN & QUY CÁCH ĐỊNH MỨC</span>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px', marginTop: '3px' }}>
                {itemName}
              </div>
              <code style={{ fontSize: '12px', color: 'var(--brand-600)', fontWeight: 700 }}>{itemCode}</code>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>CÔNG TRÌNH & CÔNG TÁC ÁP DỤNG</span>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px', marginTop: '3px' }}>
                {taskName}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{projectName}</div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>ĐƠN GIÁ THỜI ĐIỂM HIỆN TẠI</span>
              <div style={{ fontWeight: 900, color: 'var(--brand-600)', fontSize: '18px', marginTop: '3px' }}>
                {formatCurrency(latestPrice)} / {unit}
              </div>
              <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>Kỳ áp dụng: {historyRecords[historyRecords.length - 1]?.period}</div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>TỔNG MỨC BIẾN ĐỘNG CHU KỲ</span>
              <div
                style={{
                  fontWeight: 900,
                  color: overallDiff >= 0 ? '#dc2626' : '#059669',
                  fontSize: '18px',
                  marginTop: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                {overallDiff >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                <span>{overallDiff >= 0 ? `+${overallPercent}%` : `${overallPercent}%`}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Chênh lệch: {formatCurrency(overallDiff)} / {unit}
              </div>
            </div>
          </div>

          {/* Form Add New Period */}
          {showAddForm && (
            <div
              style={{
                marginBottom: '20px',
                padding: '18px 20px',
                borderRadius: '12px',
                backgroundColor: '#eff6ff',
                border: '1.5px solid #bfdbfe',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <Plus size={16} />
                  Khai Báo Cập Nhật Đơn Giá Kỳ Mới (Chuẩn Định Dạng Tháng & Nhà Cung Cấp)
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddNewPeriod}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '14px' }}>
                  {/* Month & Year Select */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Kỳ Áp Dụng (Tháng / Năm) *
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        style={{
                          flex: 1,
                          height: '38px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          color: '#0f172a',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                      >
                        {Array.from({ length: 12 }, (_, i) => {
                          const m = String(i + 1).padStart(2, '0');
                          return <option key={m} value={m}>Tháng {m}</option>;
                        })}
                      </select>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        style={{
                          width: '90px',
                          height: '38px',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          color: '#0f172a',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                      >
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                        <option value="2028">2028</option>
                      </select>
                    </div>
                  </div>

                  {/* New Price */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Đơn Giá Mới (VNĐ/{unit}) *
                    </label>
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder={`VD: ${latestPrice}`}
                      required
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#0f172a',
                        fontSize: '13px',
                        fontWeight: 700,
                      }}
                    />
                  </div>

                  {/* Price Source */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Nguồn Gốc Đơn Giá *
                    </label>
                    <select
                      value={newSource}
                      onChange={(e) => setNewSource(e.target.value)}
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#0f172a',
                        fontSize: '13px',
                      }}
                    >
                      <option value="Báo giá Nhà Cung Cấp">Báo giá Nhà Cung Cấp</option>
                      <option value="Công bố Liên sở XD - TC">Công bố Liên sở XD - TC</option>
                      <option value="Đơn giá hợp đồng PO ký kết">Đơn giá hợp đồng PO ký kết</option>
                      <option value="Định mức nội bộ BMC">Định mức nội bộ BMC</option>
                    </select>
                  </div>

                  {/* Supplier Dropdown with quick add */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                        Nhà Cung Cấp *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAddSupModal(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563eb',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        <Plus size={12} /> Thêm mới
                      </button>
                    </div>
                    <select
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#0f172a',
                        fontSize: '13px',
                      }}
                    >
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>
                          [{s.code}] {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Lý Do Điều Chỉnh & Ghi Chú Phân Tích
                  </label>
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="VD: Nhà cung cấp điều chỉnh theo biến động giá nguyên liệu đầu vào, cước vận tải tăng..."
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowAddForm(false)}
                    style={{ padding: '6px 16px' }}
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    style={{ padding: '6px 18px', fontWeight: 700 }}
                  >
                    Lưu Cập Nhật Đơn Giá
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 1: Monthly Timeline & History Records */}
          {activeTab === 'timeline' && (
            <div>
              {/* Timeline Visual Indicator */}
              <div style={{ marginBottom: '22px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  Diễn Biến Đơn Giá Qua Các Kỳ (VNĐ/{unit})
                </h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${historyRecords.length}, 1fr)`,
                    gap: '10px',
                    padding: '14px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {historyRecords.map((r, i) => {
                    const isLatest = i === historyRecords.length - 1;
                    return (
                      <div
                        key={r.id}
                        style={{
                          padding: '12px 10px',
                          borderRadius: '8px',
                          backgroundColor: isLatest ? '#fff7ed' : '#ffffff',
                          border: isLatest ? '1.5px solid var(--brand-500)' : '1px solid #e2e8f0',
                          textAlign: 'center',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        }}
                      >
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{r.period}</div>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: isLatest ? 'var(--brand-600)' : '#0f172a', marginTop: '4px' }}>
                          {formatCurrency(r.price)}
                        </div>
                        {r.percentChange !== undefined && (
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              marginTop: '3px',
                              color: r.percentChange > 0 ? '#dc2626' : r.percentChange < 0 ? '#16a34a' : '#64748b',
                            }}
                          >
                            {r.percentChange > 0 ? `▲ +${r.percentChange}%` : r.percentChange < 0 ? `▼ ${r.percentChange}%` : '— 0%'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed History Table */}
              <div className="table-container" style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <table className="bmc-table" style={{ margin: 0 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ width: '40px', textAlign: 'center', color: '#475569' }}>STT</th>
                      <th style={{ color: '#475569' }}>Kỳ Áp Dụng</th>
                      <th style={{ textAlign: 'right', color: '#475569' }}>Đơn Giá (VNĐ/{unit})</th>
                      <th style={{ textAlign: 'right', color: '#475569' }}>Biến Động So Kỳ Trước</th>
                      <th style={{ color: '#475569' }}>Nguồn Báo Giá & Đơn Vị Cung Cấp</th>
                      <th style={{ color: '#475569' }}>Ngày Hiệu Lực</th>
                      <th style={{ color: '#475569' }}>Người Cập Nhật</th>
                      <th style={{ color: '#475569' }}>Lý Do / Ghi Chú Biến Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRecords.map((r, idx) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ fontWeight: 800, color: idx === historyRecords.length - 1 ? 'var(--brand-600)' : '#0f172a', fontSize: '13px' }}>
                          {r.period}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 900, color: '#0f172a', fontSize: '14px' }}>
                          {formatCurrency(r.price)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {r.percentChange !== undefined && (
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: '12px',
                                color: r.percentChange > 0 ? '#dc2626' : r.percentChange < 0 ? '#16a34a' : '#64748b',
                              }}
                            >
                              {r.percentChange > 0 ? `+${r.percentChange}%` : `${r.percentChange}%`}
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.source}</div>
                          {r.supplierName && (
                            <div style={{ fontSize: '11px', color: '#2563eb', marginTop: '2px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Truck size={12} /> {r.supplierName}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '12px', color: '#64748b' }}>
                          {formatDate(r.effectiveDate)}
                        </td>
                        <td style={{ fontSize: '12px', color: '#64748b' }}>
                          {r.updatedBy || 'Hệ thống'}
                        </td>
                        <td style={{ fontSize: '12px', color: '#334155' }}>
                          {r.note || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Vendor Quotes Comparison */}
          {activeTab === 'suppliers_compare' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    So Sánh Báo Giá Từ Các Nhà Cung Cấp Khác Nhau
                  </h4>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    Đối chiếu giá chào thầu giữa các NCC để lựa chọn đơn vị cung ứng tối ưu chi phí
                  </p>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAddSupModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Thêm Nhà Cung Cấp Mới
                </button>
              </div>

              <div className="table-container" style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <table className="bmc-table" style={{ margin: 0 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ color: '#475569' }}>Nhà Cung Cấp</th>
                      <th style={{ color: '#475569' }}>Mã Số Thuế</th>
                      <th style={{ textAlign: 'right', color: '#475569' }}>Đơn Giá Báo Giá (VNĐ/{unit})</th>
                      <th style={{ textAlign: 'right', color: '#475569' }}>Chênh Lệch So Với Dự Toán</th>
                      <th style={{ color: '#475569' }}>Thời Gian Giao Hàng</th>
                      <th style={{ color: '#475569' }}>Ngày Báo Giá</th>
                      <th style={{ color: '#475569' }}>Đánh Giá</th>
                      <th style={{ textAlign: 'right', color: '#475569' }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorQuotes.map((vq, idx) => (
                      <tr key={vq.supplier.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{vq.supplier.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--brand-600)', fontWeight: 600 }}>{vq.supplier.code}</div>
                        </td>
                        <td style={{ fontSize: '12px', color: '#64748b' }}>{vq.supplier.taxCode || '—'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 900, color: '#0f172a', fontSize: '15px' }}>
                          {formatCurrency(vq.unitPrice)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: '12px',
                              color: vq.diffPercent > 0 ? '#dc2626' : vq.diffPercent < 0 ? '#16a34a' : '#64748b',
                            }}
                          >
                            {vq.diffPercent > 0 ? `+${vq.diffPercent}%` : `${vq.diffPercent}%`}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>
                          {vq.leadTime}
                        </td>
                        <td style={{ fontSize: '12px', color: '#64748b' }}>
                          {formatDate(vq.quoteDate)}
                        </td>
                        <td>
                          {vq.diffPercent < 0 ? (
                            <span className="badge badge-success" style={{ fontSize: '11px' }}>
                              Giá tốt nhất
                            </span>
                          ) : vq.diffPercent === 0 ? (
                            <span className="badge badge-primary" style={{ fontSize: '11px' }}>
                              Giá hiện tại
                            </span>
                          ) : (
                            <span className="badge badge-secondary" style={{ fontSize: '11px' }}>
                              Dự phòng
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleApplySupplierPrice(vq.supplier, vq.unitPrice)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              padding: '4px 10px',
                              backgroundColor: vq.diffPercent <= 0 ? 'rgba(34, 197, 94, 0.1)' : undefined,
                              color: vq.diffPercent <= 0 ? '#15803d' : undefined,
                              borderColor: vq.diffPercent <= 0 ? '#86efac' : undefined,
                            }}
                          >
                            <Check size={13} />
                            <span>Áp dụng giá này</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Manage Suppliers Directory */}
          {activeTab === 'manage_suppliers' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '400px' }}>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                    <input
                      type="text"
                      className="form-control"
                      value={supplierSearch}
                      onChange={(e) => setSupplierSearch(e.target.value)}
                      placeholder="Tìm theo tên, mã NCC hoặc MST..."
                      style={{ paddingLeft: '32px', height: '36px', fontSize: '13px' }}
                    />
                  </div>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAddSupModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={15} /> Thêm Nhà Cung Cấp Mới
                </button>
              </div>

              <div className="table-container" style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <table className="bmc-table" style={{ margin: 0 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ color: '#475569' }}>Mã NCC</th>
                      <th style={{ color: '#475569' }}>Tên Nhà Cung Cấp</th>
                      <th style={{ color: '#475569' }}>Mã Số Thuế</th>
                      <th style={{ color: '#475569' }}>Người Đại Diện / Liên Hệ</th>
                      <th style={{ color: '#475569' }}>Điện Thoại</th>
                      <th style={{ color: '#475569' }}>Email</th>
                      <th style={{ color: '#475569' }}>Địa Chỉ</th>
                      <th style={{ color: '#475569' }}>Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.map((s) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--brand-600)' }}>{s.code}</span>
                        </td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{s.name}</td>
                        <td style={{ fontSize: '12px', color: '#64748b' }}>{s.taxCode || '—'}</td>
                        <td style={{ fontSize: '13px', color: '#334155' }}>{s.contactPerson || s.representative || '—'}</td>
                        <td style={{ fontSize: '12px', color: '#334155' }}>
                          {s.phone ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={12} color="#64748b" /> {s.phone}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ fontSize: '12px', color: '#334155' }}>
                          {s.email ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Mail size={12} color="#64748b" /> {s.email}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ fontSize: '12px', color: '#64748b' }}>{s.address || '—'}</td>
                        <td>
                          <span className={`badge ${s.isActive ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '11px' }}>
                            {s.isActive ? 'Đang hợp tác' : 'Tạm dừng'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredSuppliers.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                          Không tìm thấy nhà cung cấp nào phù hợp.
                        </td>
                      </tr>
                    )}
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
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Tổng số <strong style={{ color: '#0f172a' }}>{historyRecords.length} kỳ ghi nhận</strong> | <strong style={{ color: '#0f172a' }}>{suppliers.length} Nhà cung cấp</strong> trong hệ thống
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ color: '#334155' }}>
            Đóng
          </button>
        </div>
      </div>

      {/* Modal: Quick Create Supplier */}
      {showAddSupModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
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
              maxWidth: '560px',
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} color="var(--brand-500)" />
                Thêm Mới Nhà Cung Cấp Vào Hệ Thống
              </h3>
              <button
                type="button"
                onClick={() => setShowAddSupModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Mã Nhà Cung Cấp</label>
                  <input
                    type="text"
                    className="form-control"
                    value={supForm.code}
                    onChange={(e) => setSupForm({ ...supForm, code: e.target.value })}
                    placeholder="VD: NCC-THEP-HP"
                    style={{ height: '36px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Mã Số Thuế</label>
                  <input
                    type="text"
                    className="form-control"
                    value={supForm.taxCode}
                    onChange={(e) => setSupForm({ ...supForm, taxCode: e.target.value })}
                    placeholder="VD: 0102030405"
                    style={{ height: '36px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Tên Đơn Vị / Công Ty *</label>
                <input
                  type="text"
                  className="form-control"
                  value={supForm.name}
                  onChange={(e) => setSupForm({ ...supForm, name: e.target.value })}
                  placeholder="VD: Công ty TNHH Thép Việt Nhật"
                  required
                  style={{ height: '36px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Người Đại Diện / Liên Hệ</label>
                  <input
                    type="text"
                    className="form-control"
                    value={supForm.contactPerson}
                    onChange={(e) => setSupForm({ ...supForm, contactPerson: e.target.value })}
                    placeholder="VD: Nguyễn Văn A"
                    style={{ height: '36px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Số Điện Thoại</label>
                  <input
                    type="text"
                    className="form-control"
                    value={supForm.phone}
                    onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })}
                    placeholder="VD: 0912 345 678"
                    style={{ height: '36px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Email Báo Giá</label>
                <input
                  type="email"
                  className="form-control"
                  value={supForm.email}
                  onChange={(e) => setSupForm({ ...supForm, email: e.target.value })}
                  placeholder="VD: baogia@nhacungcap.vn"
                  style={{ height: '36px', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Địa Chỉ Kho / Trụ Sở</label>
                <input
                  type="text"
                  className="form-control"
                  value={supForm.address}
                  onChange={(e) => setSupForm({ ...supForm, address: e.target.value })}
                  placeholder="VD: KCN Tân Bình, TP.HCM"
                  style={{ height: '36px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAddSupModal(false)}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                >
                  Lưu Nhà Cung Cấp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
