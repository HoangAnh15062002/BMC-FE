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
  biddingPrice?: number;
  ownerEstimate?: number;
  biddingStatus?: string;
  biddingDocumentUrl?: string;
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

export interface PurchaseRequestItem {
  id?: number;
  purchaseRequestId?: number;
  projectItemId?: number;
  projectItemName?: string;
  projectTaskId?: number;
  projectTaskName?: string;
  materialId: number;
  materialCode?: string;
  materialName?: string;
  unitId?: number;
  unitName?: string;
  unitSymbol?: string;
  quantity: number;
  estimatedPrice?: number;
  totalPrice?: number;
  note?: string;
}

export interface PurchaseRequest {
  id: number;
  projectId: number;
  projectCode?: string;
  projectName?: string;
  projectItemId?: number;
  projectItemName?: string;
  projectTaskId?: number;
  projectTaskName?: string;
  requestNo: string;
  requestCode?: string;
  requestDate: string;
  requiredDate?: string;
  status: string;
  note?: string;
  requestedByName?: string;
  createdByName?: string;
  approvedByName?: string;
  approvedAt?: string;
  itemsCount?: number;
  totalEstimatedAmount?: number;
  createdAt: string;
  items?: PurchaseRequestItem[];
}

export interface PurchaseOrderItem {
  id?: number;
  purchaseOrderId?: number;
  projectItemId?: number;
  projectItemName?: string;
  projectTaskId?: number;
  projectTaskName?: string;
  materialId: number;
  materialCode?: string;
  materialName?: string;
  unitId?: number;
  unitName?: string;
  unitSymbol?: string;
  quantity: number;
  unitPrice: number;
  totalAmount?: number;
  note?: string;
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
  items?: PurchaseOrderItem[];
}

export interface PriceHistoryRecord {
  id: number;
  itemType: 'MATERIAL' | 'LABOR' | 'MACHINE';
  itemId: number;
  itemCode: string;
  itemName: string;
  unit: string;
  period: string; // e.g. "01/2026", "02/2026", "03/2026"
  price: number;
  previousPrice?: number;
  percentChange?: number;
  source: string; // e.g. "Công bố Liên sở", "Báo giá NCC", "Định mức BMC"
  supplierName?: string;
  projectId?: number;
  projectName?: string;
  projectItemId?: number;
  projectItemName?: string;
  projectTaskId?: number;
  projectTaskName?: string;
  effectiveDate: string;
  updatedBy?: string;
  note?: string;
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

// Material Catalog Types
export interface Material {
  id: number;
  code: string;
  name: string;
  unitId?: number;
  unitCode?: string;
  unitName?: string;
  unitSymbol?: string;
  standardPrice?: number;
  description?: string;
}

// Site & Cost Control Types
export interface TaskProgressEntry {
  id?: number;
  logId?: number;
  projectTaskId: number;
  taskName?: string;
  reportingDate?: string;
  progressDate?: string;
  completedQuantity?: number;
  cumulativeQuantity?: number;
  cumulativeCompletedQuantity?: number;
  completionPercentage?: number;
  progressPercent?: number;
  note?: string;
  createdByName?: string;
  photoUrls?: string[];
  createdAt?: string;
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

export interface ProjectVariationItem {
  id?: number;
  projectVariationId?: number;
  projectItemId?: number;
  projectItemName?: string;
  projectTaskId?: number;
  projectTaskName?: string;
  description: string;
  quantity?: number;
  unitId?: number;
  unitCode?: string;
  unitPrice?: number;
  amount: number;
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
  approvedDate?: string;
  reason?: string;
  requestedDate?: string;
  createdAt: string;
  createdByName?: string;
  items?: ProjectVariationItem[];
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

export interface ContractAppendix {
  id: number;
  contractId: number;
  appendixNo: string;
  signedDate: string;
  valueChange?: number;
  content?: string;
  fileUrl?: string;
  status: string;
  createdAt?: string;
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
  vatRate?: number;
  totalAdjustedValue: number;
  status: string;
  appendicesCount: number;
  appendices?: ContractAppendix[];
  startDate?: string;
  endDate?: string;
  fileUrl?: string;
  wordFileUrl?: string;
  description?: string;
  contractType?: 'OWNER' | 'SUBCONTRACTOR' | 'SUPPLIER' | 'CONSULTING';
  partnerName?: string;
  partnerType?: string;
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
  latestVersion?: { fileUrl?: string; fileName?: string; fileSize?: number; mimeType?: string };
  fileUrl?: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// Upgraded Construction Domain Interfaces
// -------------------------------------------------------------

export interface ProjectFinancialSummary {
  projectId: number;
  projectCode: string;
  projectName: string;
  investorName?: string;
  status: string;
  ownerEstimate?: number;
  biddingPrice?: number;
  biddingStatus?: string;
  biddingDocumentUrl?: string;
  baselineDirectCost: number;
  baselineIndirectCost: number;
  baselineTotalEstimate: number;
  baselineTotalWithVat: number;
  actualMaterialCost: number;
  actualLaborCost: number;
  actualMachineCost: number;
  actualOtherCost: number;
  totalActualCost: number;
  plannedProfit?: number;
  plannedProfitMarginPercent?: number;
  currentProfit?: number;
  currentProfitMarginPercent?: number;
  costVariance: number;
  costVariancePercent: number;
}

export interface TaskResourceItem {
  resourceId: number;
  code: string;
  name: string;
  unit: string;
  normRate: number;
  totalQuantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface TaskActualMaterial {
  transactionId: number;
  transactionNo: string;
  transactionDate: string;
  materialName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface TaskActualMachine {
  shiftLogId: number;
  logDate: string;
  machineName: string;
  operatorName?: string;
  shiftCount: number;
  hoursWorked: number;
  totalCost: number;
  notes?: string;
}

export interface TaskProgressItem {
  logId: number;
  progressDate: string;
  completedQuantity: number;
  cumulativeCompletedQuantity: number;
  progressPercent: number;
  note?: string;
  createdByName?: string;
  photoUrls: string[];
}

export interface TaskPhoto {
  url: string;
  date: string;
  note?: string;
}

export interface TaskBreakdown {
  taskId: number;
  projectId: number;
  projectName: string;
  projectItemId: number;
  projectItemName: string;
  code: string;
  name: string;
  unitName: string;
  plannedQuantity: number;
  completedQuantity: number;
  progressPercent: number;
  status: string;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  plannedMaterialCost: number;
  plannedLaborCost: number;
  plannedMachineCost: number;
  totalPlannedCost: number;
  actualMaterialCost: number;
  actualLaborCost: number;
  actualMachineCost: number;
  totalActualCost: number;
  costVariance: number;
  materials: TaskResourceItem[];
  labors: TaskResourceItem[];
  machines: TaskResourceItem[];
  actualMaterials: TaskActualMaterial[];
  actualMachines: TaskActualMachine[];
  progressLogs: TaskProgressItem[];
  photos: TaskPhoto[];
}

export interface MachineShiftLog {
  id: number;
  projectId: number;
  projectName?: string;
  projectItemId?: number;
  projectItemName?: string;
  projectTaskId?: number;
  projectTaskName?: string;
  logDate: string;
  machineName: string;
  operatorName?: string;
  shiftCount: number;
  hoursWorked: number;
  unitPrice: number;
  fuelCost: number;
  totalCost: number;
  notes?: string;
  createdAt?: string;
}

export interface StockCardEntry {
  transactionId: number;
  transactionNo: string;
  transactionDate: string;
  transactionType: string;
  referenceDoc?: string;
  projectName?: string;
  taskName?: string;
  inQuantity: number;
  outQuantity: number;
  balanceAfter: number;
  unitPrice: number;
  totalAmount: number;
  note?: string;
}

export interface StockCard {
  warehouseId: number;
  warehouseName: string;
  materialId: number;
  materialCode: string;
  materialName: string;
  unitName: string;
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  closingBalance: number;
  entries: StockCardEntry[];
}

export interface SupplierQuote {
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  contactPerson?: string;
  phone?: string;
  materialId: number;
  materialCode: string;
  materialName: string;
  unitName: string;
  unitPrice?: number;
  quotedDate?: string;
  leadTimeDays?: number;
  isPreferred: boolean;
  note?: string;
}

export interface UploadedFile {
  url: string;
  fullUrl: string;
  fileName: string;
  storedFileName: string;
  fileSize: number;
  mimeType: string;
}

