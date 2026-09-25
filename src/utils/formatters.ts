export const formatCurrency = (val: number | null | undefined): string => {
  if (val === null || val === undefined) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(val);
};

export const formatNumber = (val: number | null | undefined, decimals = 2): string => {
  if (val === null || val === undefined) return '0';
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: decimals,
  }).format(val);
};

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const formatPercent = (val: number | null | undefined): string => {
  if (val === null || val === undefined) return '0%';
  return `${(val).toFixed(1)}%`;
};

// ============================================================
// Construction Unit Formatter (Tiêu chuẩn xây dựng Việt Nam)
// ============================================================
const UNIT_MAP: Record<string, string> = {
  // Nhân công
  'WORKDAY': 'công',
  'CONG': 'công',
  'NGAYCONG': 'công',
  'NGAY_CONG': 'công',
  'MAN_DAY': 'công',
  'MANDAY': 'công',
  'LABOR': 'công',
  'LABOUR': 'công',

  // Ca máy
  'SHIFT': 'ca',
  'CA': 'ca',
  'CAMAY': 'ca',
  'CA_MAY': 'ca',
  'MACHINE_SHIFT': 'ca',

  // Chiều dài
  'M': 'm',
  'MD': 'm',
  'MET': 'm',
  'METER': 'm',
  'METERS': 'm',
  '100M': '100m',
  '1000M': '1.000m',
  'KM': 'km',
  'MM': 'mm',
  'CM': 'cm',

  // Diện tích
  'M2': 'm²',
  'M^2': 'm²',
  'SQM': 'm²',
  'SQUARE_METER': 'm²',
  '100M2': '100m²',
  '1000M2': '1.000m²',
  'HA': 'ha',

  // Thể tích
  'M3': 'm³',
  'M^3': 'm³',
  'CBM': 'm³',
  'CUBIC_METER': 'm³',
  '100M3': '100m³',
  '1000M3': '1.000m³',
  'L': 'lít',
  'LIT': 'lít',
  'LITER': 'lít',

  // Khối lượng
  'KG': 'kg',
  'KILOGRAM': 'kg',
  'T': 'tấn',
  'TAN': 'tấn',
  'TON': 'tấn',
  'TONNE': 'tấn',
  'YEN': 'yến',
  'TA': 'tạ',

  // Số lượng đếm
  'VIEN': 'viên',
  '1000VIEN': '1.000 viên',
  'CAI': 'cái',
  'CHIEC': 'chiếc',
  'BO': 'bộ',
  'SET': 'bộ',
  'CAP': 'cặp',
  'CUON': 'cuộn',
  'THUNG': 'thùng',
  'HOP': 'hộp',
  'BAO': 'bao',
  'GOI': 'gói',
  'TAM': 'tấm',
  'THANH': 'thanh',
  'ONG': 'ống',
  'CAY': 'cây',
  'RAM': 'gam',
  'RAME': 'gam',
  'BIEU': 'biểu',
  'QUYEN': 'quyển',
  'MET_DAI': 'm',
  'CHAU': 'chậu',
  'HO': 'hố',
  'KHOANG': 'khoang',
  'DIEM': 'điểm',
  'MOI': 'mối',
  'KHAU': 'khẩu',
  'DOAN': 'đoạn',

  // Thời gian
  'GIO': 'giờ',
  'HOUR': 'giờ',
  'NGAY': 'ngày',
  'DAY': 'ngày',
  'THANG': 'tháng',
  'MONTH': 'tháng',
  'NAM': 'năm',
  'YEAR': 'năm',

  // Khác & Công trình đặc thù
  'LAN': 'lần',
  'CHUYEN': 'chuyến',
  'HO_SO': 'hồ sơ',
  'HE': 'hệ',
  'TIM': 'tim',
  'TIM_COC': 'tim',
  'COC': 'cọc',
  'DOT': 'đốt',
  'TRAM': 'trạm',
  'MOI_NOI': 'mối',
  '100MD': '100m',

  // Hỗ trợ tiếng Việt có dấu
  'CÔNG': 'công',
  'NGÀY_CÔNG': 'công',
  'CA_MÁY': 'ca',
  'TẤN': 'tấn',
  'VIÊN': 'viên',
  'CHIẾC': 'chiếc',
  'BỘ': 'bộ',
  'CUỘN': 'cuộn',
  'THÙNG': 'thùng',
  'HỘP': 'hộp',
  'TẤM': 'tấm',
  'ỐNG': 'ống',
  'CÂY': 'cây',
  'CHẬU': 'chậu',
  'HỐ': 'hố',
  'ĐIỂM': 'điểm',
  'MỐI': 'mối',
  'KHẨU': 'khẩu',
  'ĐOẠN': 'đoạn',
  'LẦN': 'lần',
  'CHUYẾN': 'chuyến',
  'HỆ': 'hệ',
  'GIỜ': 'giờ',
  'THÁNG': 'tháng',
  'NĂM': 'năm',
};

export const formatUnit = (unit: string | null | undefined, fallback = ''): string => {
  if (!unit) return fallback;
  const clean = unit.trim();
  if (!clean || clean === '-') return fallback;
  const upper = clean.toUpperCase().replace(/\s+/g, '_');
  if (UNIT_MAP[upper]) return UNIT_MAP[upper];
  
  const noUnderscore = upper.replace(/_/g, '');
  if (UNIT_MAP[noUnderscore]) return UNIT_MAP[noUnderscore];

  return clean;
};

/**
 * Format quantity with unit, handling composite units with multiplier (e.g., 100m, 100m³, 100m², 1000m)
 * Example:
 * - (120, '100m') => { display: '120 × 100m', converted: '12.000 m', fullText: '120 × 100m (≈ 12.000 m)' }
 * - (45, '100m³') => { display: '45 × 100m³', converted: '4.500 m³', fullText: '45 × 100m³ (≈ 4.500 m³)' }
 * - (85.5, 'm³') => { display: '85,5 m³', converted: null, fullText: '85,5 m³' }
 */
export const formatQuantityWithUnit = (
  quantity: number | null | undefined,
  unit: string | null | undefined,
  decimals = 2
) => {
  const qty = quantity || 0;
  const formattedQty = formatNumber(qty, decimals);
  const cleanUnit = formatUnit(unit);

  if (!cleanUnit) {
    return {
      qty: formattedQty,
      unit: '',
      display: formattedQty,
      converted: null,
      fullText: formattedQty,
    };
  }

  // Check if unit starts with a number (e.g. 100m, 100m³, 1000m, 1.000m)
  const normalizedUnitStr = cleanUnit.replace(/\./g, '');
  const match = normalizedUnitStr.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (match) {
    const multiplier = parseFloat(match[1]);
    const baseUnit = match[2];
    if (multiplier > 1 && baseUnit) {
      const totalActual = qty * multiplier;
      const formattedConverted = `${formatNumber(totalActual, decimals)} ${baseUnit}`.trim();
      return {
        qty: formattedQty,
        unit: cleanUnit,
        display: `${formattedQty} × ${cleanUnit}`,
        converted: formattedConverted,
        fullText: `${formattedQty} × ${cleanUnit} (≈ ${formattedConverted})`,
      };
    }
  }

  return {
    qty: formattedQty,
    unit: cleanUnit,
    display: `${formattedQty} ${cleanUnit}`,
    converted: null,
    fullText: `${formattedQty} ${cleanUnit}`,
  };
};

// ============================================================
// Status Label Maps - Vietnamese
// ============================================================
const PROJECT_STATUS_LABELS: Record<string, string> = {
  PREPARING: 'Chuẩn bị',
  IN_PROGRESS: 'Đang thi công',
  PAUSED: 'Tạm dừng',
  COMPLETED: 'Hoàn thành',
  CLOSED: 'Đã đóng',
  CANCELLED: 'Đã hủy',
  ACTIVE: 'Đang hoạt động',
  PLANNING: 'Lên kế hoạch',
};

const PROJECT_ITEM_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Chưa bắt đầu',
  IN_PROGRESS: 'Đang thi công',
  PAUSED: 'Tạm dừng',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const PURCHASE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Đã trình',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  ORDERED: 'Đã đặt hàng',
  SENT: 'Đã gửi',
  PARTIAL: 'Nhận một phần',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const VARIATION_STATUS_LABELS: Record<string, string> = {
  INTERNAL: 'Nội bộ',
  SUBMITTED: 'Đã trình',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
};

export const getProjectStatusLabel = (status: string): string =>
  PROJECT_STATUS_LABELS[status] || status;

export const getItemStatusLabel = (status: string): string =>
  PROJECT_ITEM_STATUS_LABELS[status] || status;

export const getPurchaseStatusLabel = (status: string): string =>
  PURCHASE_STATUS_LABELS[status] || status;

export const getVariationStatusLabel = (status: string): string =>
  VARIATION_STATUS_LABELS[status] || status;

export const getStatusBadgeClass = (status: string): string => {
  const positive = ['IN_PROGRESS', 'ACTIVE', 'COMPLETED', 'APPROVED', 'ORDERED'];
  const warning = ['PREPARING', 'PLANNING', 'SUBMITTED', 'PARTIAL', 'SENT', 'PAUSED', 'NOT_STARTED'];
  const danger = ['CANCELLED', 'REJECTED', 'CLOSED'];
  if (positive.includes(status)) return 'badge-active';
  if (danger.includes(status)) return 'badge-danger';
  return 'badge-pending';
};
