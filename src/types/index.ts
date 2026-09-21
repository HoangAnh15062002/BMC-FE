// Authentication & User Types
export interface User {
  id: number;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  roleId?: number;
  roleCode?: string;
  roleName?: string;
  role?: string;
  isActive?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  token?: string;
  tokenType?: string;
  expiresIn?: number;
  user: User;
}

// Project & WBS Types
export interface Project {
  id: number;
  code: string;
  name: string;
  description?: string;
  location?: string;
  regionCode?: string;
  regionName?: string;
  status: string;
  progressPercent?: number;
  startDate?: string;
  plannedEndDate?: string;
  endDate?: string;
  actualEndDate?: string;
  investorId?: number;
  investorName?: string;
  itemsCount?: number;
  createdAt?: string;
}

export interface ProjectItem {
  id: number;
  projectId: number;
  parentItemId?: number;
  code: string;
  name: string;
  description?: string;
  status: string;
  progressPercent?: number;
  sortOrder?: number;
  orderIndex?: number;
  tasksCount?: number;
}

export interface ProjectTask {
  id: number;
  projectItemId: number;
  taskCatalogId?: number;
  normVersionId?: number;
  code: string;
  name: string;
  unitId?: number;
  unitName?: string;
  unitCode?: string;
  normBaseQuantity?: number;
  quantity?: number;
  plannedQuantity?: number;
  status: string;
  progressPercent?: number;
  sortOrder?: number;
}

// Estimate Types
export interface EstimateVersion {
  id: number;
  projectId: number;
  projectCode?: string;
  projectName?: string;
  versionNo: number;
  versionName?: string;
  name?: string;
  description?: string;
  regionId?: number;
  pricePeriodId?: number;
  status?: string;
  calculationStatus?: string;
  totalDirectCost: number;
  totalIndirectCost?: number;
  totalTaxProfit?: number;
  totalBeforeTax?: number;
  vatAmount: number;
  vatRateSnapshot?: number;
  materialAdjustmentFactor?: number;
  laborAdjustmentFactor?: number;
  machineAdjustmentFactor?: number;
  totalEstimate?: number;
  totalAfterTax?: number;
  isBaseline?: boolean;
  isLocked?: boolean;
  rowVersion?: string;
  createdAt?: string;
  updatedAt: string;
}

// Procurement Types
export interface Supplier {
  id: number;
  code: string;
  name: string;
  taxCode?: string;
  contactPerson?: string;
  representative?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
}

export interface PurchaseRequest {
  id: number;
  projectId: number;
  projectCode?: string;
  projectName?: string;
  requestNo: string;
  requestCode?: string;
  requestDate: string;
  requiredDate?: string;
  status: string;
  note?: string;
  requestedByName?: string;
  createdByName?: string;
  approvedByName?: string;
  itemsCount?: number;
  createdAt: string;
}

export interface PurchaseOrder {
  id: number;
  projectId: number;
  projectCode?: string;
  projectName?: string;
  supplierId: number;
  supplierCode?: string;
  supplierName?: string;
  poNo: string;
  orderCode?: string;
  poDate: string;
  orderDate?: string;
  deliveryDate?: string;
  amountBeforeTax: number;
  vatRate?: number;
  vatAmount: number;
  totalAmount: number;
  status: string;
  itemsCount?: number;
  createdByName?: string;
  note?: string;
  // Hóa đơn & Thanh toán
  invoiceNo?: string;
  invoiceDate?: string;
  invoiceStatus?: string;
  paymentMethod?: string;
  deliveryDate?: string;
}

// Warehouse & Stock Types
export interface Warehouse {
  id: number;
  projectId?: number;
  projectCode?: string;
  projectName?: string;
  code: string;
  name: string;
  location?: string;
  address?: string;
  keeperUserId?: number;
  keeperName?: string;
  isActive: boolean;
  totalItemsCount?: number;
  totalStockValue?: number;
  totalInventoryValue?: number;
}

export interface WarehouseStockItem {
  warehouseId?: number;
  warehouseCode?: string;
  warehouseName?: string;
  materialId?: number;
  materialCode: string;
  materialName: string;
  unitId?: number;
  unitCode?: string;
  unitName?: string;
  quantityOnHand: number;
  currentQuantity?: number;
  averageUnitCost: number;
  totalValue: number;
  updatedAt?: string;
}

export interface WarehouseTransaction {
  id: number;
  warehouseId: number;
  warehouseName?: string;
  transactionType: string;
  transactionCode: string;
  transactionDate: string;
  totalValue: number;
  note?: string;
}

// Site & Cost Control Types
export interface TaskProgressEntry {
  id: number;
  projectTaskId: number;
  taskName?: string;
  reportingDate: string;
  cumulativeQuantity: number;
  completionPercentage: number;
  note?: string;
}

export interface ActualSiteCost {
  id: number;
  projectId: number;
  projectCode?: string;
  projectName?: string;
  costType: string;
  costDate: string;
  amount: number;
  recipientOrVendor?: string;
  description: string;
}

export interface ProjectVariation {
  id: number;
  projectId: number;
  projectCode?: string;
  projectName?: string;
  variationNo?: string;
  title: string;
  variationType: string;
  status: string;
  requestedValue: number;
  approvedValue?: number;
  reason?: string;
  requestedDate?: string;
  createdAt: string;
}

export interface ProjectAlert {
  id: number;
  projectId: number;
  projectName?: string;
  alertType: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | string;
  title: string;
  message: string;
  status?: string;
  isResolved: boolean;
  resolvedNote?: string;
  createdAt: string;
}

export interface VarianceReport {
  projectId: number;
  projectCode: string;
  projectName: string;
  budgetCost: number;
  actualCost: number;
  varianceAmount: number;
  variancePercentage: number;
  status: string;
}

// Administration Types
export interface Investor {
  id: number;
  code: string;
  name: string;
  taxCode?: string;
  representative?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
  projectsCount?: number;
}

export interface Contract {
  id: number;
  projectId: number;
  projectCode?: string;
  projectName?: string;
  contractNo: string;
  contractName: string;
  signedDate: string;
  contractValue: number;
  totalAdjustedValue: number;
  status: string;
  appendicesCount: number;
}

export interface ProjectMember {
  projectId: number;
  projectName?: string;
  userId: number;
  username: string;
  fullName: string;
  roleName?: string;
  joinedAt: string;
  isActive: boolean;
}

export interface ProjectDocument {
  id: number;
  projectId: number;
  projectName?: string;
  documentType: string;
  documentNo: string;
  title: string;
  currentVersionNo: number;
  status: string;
  versionsCount: number;
  updatedAt: string;
}
