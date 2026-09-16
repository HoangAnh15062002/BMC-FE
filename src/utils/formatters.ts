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
