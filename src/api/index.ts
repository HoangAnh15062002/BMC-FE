import apiClient from './client';
import {
  User,
  Project,
  ProjectItem,
  ProjectTask,
  EstimateVersion,
  Supplier,
  PurchaseRequest,
  PurchaseOrder,
  Warehouse,
  WarehouseStockItem,
  WarehouseTransaction,
  TaskProgressEntry,
  ActualSiteCost,
  ProjectVariation,
  ProjectAlert,
  VarianceReport,
  Investor,
  Contract,
  ProjectMember,
  ProjectDocument,
  ProjectFinancialSummary,
  TaskBreakdown,
  MachineShiftLog,
  StockCard,
  SupplierQuote,
  UploadedFile,
} from '../types';

// Helper to guarantee returned value is an Array
const ensureArray = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.value)) return data.value;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.results)) return data.results;
  }
  return [];
};

// Authentication API
export const authApi = {
  login: async (credentials: { username: string; password?: string; passwordHash?: string }) => {
    const res = await apiClient.post<any>('/auth/login', credentials);
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },
};

// Project & WBS API
export const projectApi = {
  getAll: async (search?: string, status?: string) => {
    const res = await apiClient.get<any>('/projects', { params: { search, status } });
    return ensureArray<Project>(res.data);
  },
  getById: async (id: number) => {
    const res = await apiClient.get<Project>(`/projects/${id}`);
    return res.data;
  },
  create: async (data: Partial<Project>) => {
    const res = await apiClient.post<Project>('/projects', data);
    return res.data;
  },
  update: async (id: number, data: Partial<Project>) => {
    const res = await apiClient.put<Project>(`/projects/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await apiClient.delete(`/projects/${id}`);
    return res.data;
  },
  getItems: async (projectId: number) => {
    const res = await apiClient.get<any>(`/projects/${projectId}/items`);
    return ensureArray<ProjectItem>(res.data);
  },
  createItem: async (projectId: number, data: Partial<ProjectItem>) => {
    const res = await apiClient.post<ProjectItem>(`/projects/${projectId}/items`, data);
    return res.data;
  },
  getTasks: async (projectId: number, projectItemId: number) => {
    const res = await apiClient.get<any>(`/projects/${projectId}/items/${projectItemId}/tasks`);
    return ensureArray<ProjectTask>(res.data);
  },
  createTask: async (projectId: number, projectItemId: number, data: any) => {
    const res = await apiClient.post<ProjectTask>(`/projects/${projectId}/items/${projectItemId}/tasks`, data);
    return res.data;
  },
  getFinancialSummary: async (projectId: number) => {
    const res = await apiClient.get<ProjectFinancialSummary>(`/projects/${projectId}/financial-summary`);
    return res.data;
  },
  getTaskBreakdown: async (taskId: number) => {
    const res = await apiClient.get<TaskBreakdown>(`/project-tasks/${taskId}/breakdown`);
    return res.data;
  },
};

// Estimates API
export const estimateApi = {
  getByProject: async (projectId: number) => {
    const res = await apiClient.get<any>(`/projects/${projectId}/estimate-versions`);
    return ensureArray<EstimateVersion>(res.data);
  },
  getById: async (projectId: number, id: number) => {
    const res = await apiClient.get<EstimateVersion>(`/projects/${projectId}/estimate-versions/${id}`);
    return res.data;
  },
  create: async (projectId: number, data: any) => {
    const res = await apiClient.post<EstimateVersion>(`/projects/${projectId}/estimate-versions`, data);
    return res.data;
  },
  calculate: async (projectId: number, id: number, dto: any = {}) => {
    const res = await apiClient.post(`/projects/${projectId}/estimate-versions/${id}/recalculate`, dto);
    return res.data;
  },
  submit: async (projectId: number, id: number, dto: any = {}) => {
    const res = await apiClient.post(`/projects/${projectId}/estimate-versions/${id}/submit`, dto);
    return res.data;
  },
  approve: async (projectId: number, id: number, dto: any = {}) => {
    const res = await apiClient.post(`/projects/${projectId}/estimate-versions/${id}/approve`, dto);
    return res.data;
  },
  setBaseline: async (projectId: number, id: number, dto: any = {}) => {
    const res = await apiClient.post(`/projects/${projectId}/estimate-versions/${id}/baseline`, dto);
    return res.data;
  },
  downloadExcel: async (projectId: number, id: number, filename = 'DuToan_BMC.xlsx') => {
    const res = await apiClient.get(`/projects/${projectId}/estimate-versions/${id}/export-excel`, {
      responseType: 'blob',
    });
    const blob = res.data instanceof Blob 
      ? res.data 
      : new Blob([res.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
    }, 1000);
  },
};

// Procurement API
export const procurementApi = {
  getSuppliers: async () => {
    const res = await apiClient.get<any>('/suppliers');
    return ensureArray<Supplier>(res.data);
  },
  createSupplier: async (data: Partial<Supplier>) => {
    const res = await apiClient.post<Supplier>('/suppliers', data);
    return res.data;
  },
  getPurchaseRequests: async (projectId?: number, status?: string) => {
    const res = await apiClient.get<any>('/purchase-requests', { params: { projectId, status } });
    return ensureArray<PurchaseRequest>(res.data);
  },
  getPurchaseRequestById: async (id: number) => {
    const res = await apiClient.get<PurchaseRequest>(`/purchase-requests/${id}`);
    return res.data;
  },
  createPurchaseRequest: async (data: any) => {
    const res = await apiClient.post<PurchaseRequest>('/purchase-requests', data);
    return res.data;
  },
  submitPurchaseRequest: async (id: number) => {
    const res = await apiClient.post(`/purchase-requests/${id}/submit`);
    return res.data;
  },
  approvePurchaseRequest: async (id: number) => {
    const res = await apiClient.post(`/purchase-requests/${id}/approve`);
    return res.data;
  },
  rejectPurchaseRequest: async (id: number, reason?: string) => {
    const res = await apiClient.post(`/purchase-requests/${id}/reject`, { reason });
    return res.data;
  },
  getPurchaseOrders: async (projectId?: number, status?: string) => {
    const res = await apiClient.get<any>('/purchase-orders', { params: { projectId, status } });
    return ensureArray<PurchaseOrder>(res.data);
  },
  getPurchaseOrderById: async (id: number) => {
    const res = await apiClient.get<PurchaseOrder>(`/purchase-orders/${id}`);
    return res.data;
  },
  createPurchaseOrder: async (data: any) => {
    const res = await apiClient.post<PurchaseOrder>('/purchase-orders', data);
    return res.data;
  },
  approvePurchaseOrder: async (id: number) => {
    const res = await apiClient.post(`/purchase-orders/${id}/approve`);
    return res.data;
  },
  getQuotes: async (materialId?: number, supplierId?: number) => {
    const res = await apiClient.get<any>('/suppliers/quotes', {
      params: { materialId, supplierId },
    });
    return ensureArray<SupplierQuote>(res.data);
  },
  upsertQuote: async (supplierId: number, data: any) => {
    const res = await apiClient.post<SupplierQuote>(`/suppliers/${supplierId}/quotes`, data);
    return res.data;
  },
};

// Warehouse API
export const warehouseApi = {
  getAll: async (projectId?: number, search?: string) => {
    const res = await apiClient.get<any>('/warehouses', { params: { projectId, search } });
    return ensureArray<Warehouse>(res.data);
  },
  getById: async (id: number) => {
    const res = await apiClient.get<Warehouse>(`/warehouses/${id}`);
    return res.data;
  },
  create: async (data: Partial<Warehouse>) => {
    const res = await apiClient.post<Warehouse>('/warehouses', data);
    return res.data;
  },
  getStocks: async (warehouseId: number, search?: string) => {
    const res = await apiClient.get<any>(`/warehouses/${warehouseId}/stocks`, { params: { search } });
    return ensureArray<WarehouseStockItem>(res.data);
  },
  getTransactions: async (warehouseId?: number, projectId?: number) => {
    const res = await apiClient.get<any>('/warehouse-transactions', { params: { warehouseId, projectId } });
    return ensureArray<WarehouseTransaction>(res.data);
  },
  createReceiptFromPo: async (data: any) => {
    const res = await apiClient.post('/warehouse-transactions/from-po', data);
    return res.data;
  },
  createTransaction: async (data: any) => {
    const res = await apiClient.post('/warehouse-transactions', data);
    return res.data;
  },
  getStockCard: async (warehouseId: number, materialId: number, fromDate?: string, toDate?: string) => {
    const res = await apiClient.get<StockCard>('/warehouse-transactions/stock-card', {
      params: { warehouseId, materialId, fromDate, toDate },
    });
    return res.data;
  },
};

// Machine Shift API
export const machineShiftApi = {
  getAll: async (projectId?: number, projectTaskId?: number, fromDate?: string, toDate?: string) => {
    const res = await apiClient.get<any>('/machine-shift-logs', {
      params: { projectId, projectTaskId, fromDate, toDate },
    });
    return ensureArray<MachineShiftLog>(res.data);
  },
  getById: async (id: number) => {
    const res = await apiClient.get<MachineShiftLog>(`/machine-shift-logs/${id}`);
    return res.data;
  },
  create: async (data: Partial<MachineShiftLog>) => {
    const res = await apiClient.post<MachineShiftLog>('/machine-shift-logs', data);
    return res.data;
  },
  update: async (id: number, data: Partial<MachineShiftLog>) => {
    const res = await apiClient.put<MachineShiftLog>(`/machine-shift-logs/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await apiClient.delete(`/machine-shift-logs/${id}`);
    return res.data;
  },
};

// Uploads API (Photos & PDF documents)
export const uploadApi = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<UploadedFile>('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  uploadMultiple: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    const res = await apiClient.post<UploadedFile[]>('/uploads/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

// Site Execution & Cost API
export const siteApi = {
  getProgress: async (projectTaskId?: number) => {
    const url = projectTaskId ? `/task-progress/task/${projectTaskId}` : '/task-progress';
    const res = await apiClient.get<any>(url).catch(() => ({ data: [] }));
    return ensureArray<TaskProgressEntry>(res.data);
  },
  createProgress: async (data: any) => {
    const res = await apiClient.post<TaskProgressEntry>('/task-progress', data);
    return res.data;
  },
  getCosts: async (projectId?: number) => {
    if (!projectId) return null;
    const res = await apiClient.get<any>(`/actual-site-costs/project-summary/${projectId}`).catch(() => ({ data: null }));
    return res.data;
  },
  getLaborEntries: async (projectId?: number) => {
    const res = await apiClient.get<any>('/actual-site-costs/labor', { params: { projectId } }).catch(() => ({ data: [] }));
    return ensureArray<any>(res.data);
  },
  createLaborEntry: async (data: any) => {
    const res = await apiClient.post('/actual-site-costs/labor', data);
    return res.data;
  },
  deleteLaborEntry: async (id: number) => {
    const res = await apiClient.delete(`/actual-site-costs/labor/${id}`);
    return res.data;
  },
  getMachineEntries: async (projectId?: number) => {
    const res = await apiClient.get<any>('/actual-site-costs/machine', { params: { projectId } }).catch(() => ({ data: [] }));
    return ensureArray<any>(res.data);
  },
  createMachineEntry: async (data: any) => {
    const res = await apiClient.post('/actual-site-costs/machine', data);
    return res.data;
  },
  deleteMachineEntry: async (id: number) => {
    const res = await apiClient.delete(`/actual-site-costs/machine/${id}`);
    return res.data;
  },
  getVariations: async (projectId?: number, status?: string) => {
    const res = await apiClient.get<any>('/variations', { params: { projectId, status } });
    return ensureArray<ProjectVariation>(res.data);
  },
  getVariationById: async (id: number) => {
    const res = await apiClient.get<ProjectVariation>(`/variations/${id}`);
    return res.data;
  },
  createVariation: async (data: any) => {
    const res = await apiClient.post<ProjectVariation>('/variations', data);
    return res.data;
  },
  approveVariation: async (id: number, approvedValue: number) => {
    const res = await apiClient.post(`/variations/${id}/approve`, { approvedValue });
    return res.data;
  },
  rejectVariation: async (id: number, reason?: string) => {
    const res = await apiClient.post(`/variations/${id}/reject`, { reason });
    return res.data;
  },
};

// Cost Control & Alerts API
export const costControlApi = {
  getVariance: async (projectId: number) => {
    const res = await apiClient.get<any>(`/variances/project/${projectId}/overview`);
    return res.data;
  },
  getVarianceRecords: async (projectId: number) => {
    const res = await apiClient.get<any>(`/variances/project/${projectId}/records`);
    return ensureArray<any>(res.data);
  },
  getAlerts: async (projectId?: number, isResolved?: boolean) => {
    const status = isResolved === undefined ? undefined : isResolved ? 'RESOLVED' : 'OPEN';
    const res = await apiClient.get<any>('/alerts', { params: { projectId, status } });
    return ensureArray<ProjectAlert>(res.data);
  },
  scanAlerts: async (projectId: number) => {
    const res = await apiClient.post(`/alerts/scan/${projectId}`);
    return res.data;
  },
  resolveAlert: async (id: number, note: string) => {
    const res = await apiClient.post(`/alerts/${id}/close`, { note });
    return res.data;
  },
  acknowledgeAlert: async (id: number) => {
    const res = await apiClient.post(`/alerts/${id}/acknowledge`);
    return res.data;
  },
};

// Administration API (Investors, Contracts, Members, Documents)
export const adminApi = {
  getInvestors: async () => {
    const res = await apiClient.get<any>('/investors');
    return ensureArray<Investor>(res.data);
  },
  createInvestor: async (data: Partial<Investor>) => {
    const res = await apiClient.post<Investor>('/investors', data);
    return res.data;
  },
  getContracts: async (projectId?: number) => {
    const res = await apiClient.get<any>('/contracts', { params: { projectId } });
    return ensureArray<Contract>(res.data);
  },
  getContractById: async (id: number) => {
    const res = await apiClient.get<Contract>(`/contracts/${id}`);
    return res.data;
  },
  createContract: async (data: any) => {
    const res = await apiClient.post<Contract>('/contracts', data);
    return res.data;
  },
  updateContract: async (id: number, data: any) => {
    const res = await apiClient.put<Contract>(`/contracts/${id}`, data);
    return res.data;
  },
  addAppendix: async (contractId: number, data: any) => {
    const res = await apiClient.post(`/contracts/${contractId}/appendices`, data);
    return res.data;
  },
  getMembers: async (projectId: number) => {
    const res = await apiClient.get<any>(`/projects/${projectId}/members`);
    return ensureArray<ProjectMember>(res.data);
  },
  addMember: async (projectId: number, data: any) => {
    const res = await apiClient.post<ProjectMember>(`/projects/${projectId}/members`, data);
    return res.data;
  },
  getDocuments: async (projectId?: number) => {
    const res = await apiClient.get<any>('/project-documents', { params: { projectId } });
    return ensureArray<ProjectDocument>(res.data);
  },
  createDocument: async (data: any) => {
    const res = await apiClient.post<ProjectDocument>('/project-documents', data);
    return res.data;
  },
  getUsers: async () => {
    const res = await apiClient.get<any>('/users');
    return ensureArray<any>(res.data);
  },
};

// Catalogs & Price Resolution API
export const catalogsApi = {
  getNormCatalogs: async () => {
    const res = await apiClient.get<any>('/cost-component-catalogs').catch(() => ({ data: [] }));
    return ensureArray<any>(res.data);
  },
  getMaterials: async () => {
    const res = await apiClient.get<any>('/materials').catch(() => ({ data: [] }));
    return ensureArray<any>(res.data);
  },
  getLabors: async () => {
    const res = await apiClient.get<any>('/labors').catch(() => ({ data: [] }));
    return ensureArray<any>(res.data);
  },
  getMachines: async () => {
    const res = await apiClient.get<any>('/machines').catch(() => ({ data: [] }));
    return ensureArray<any>(res.data);
  },
  getUnits: async () => {
    const res = await apiClient.get<any>('/units').catch(() => ({ data: [] }));
    return ensureArray<any>(res.data);
  },
  getNormTasks: async (search?: string) => {
    const res = await apiClient.get<any>('/task-catalog', { params: { search } }).catch(() => ({ data: [] }));
    return ensureArray<any>(res.data);
  },
  createNormTask: async (data: any) => {
    const res = await apiClient.post('/task-catalog', data);
    return res.data;
  },
  getRegions: async () => {
    const res = await apiClient.get<any>('/regions').catch(() => ({ data: [] }));
    return ensureArray<any>(res.data);
  },
  getPricePeriods: async (regionCode?: string) => {
    const res = await apiClient.get<any>('/price-periods', { params: { regionCode } }).catch(() => ({ data: [] }));
    return ensureArray<any>(res.data);
  },
  getMaterialPrices: async (pricePeriodId?: number, search?: string) => {
    const url = pricePeriodId ? `/price-periods/${pricePeriodId}/material-prices` : '/price-periods';
    const res = await apiClient.get<any>(url, { params: { search } }).catch(() => ({ data: [] }));
    return ensureArray<any>(res.data);
  },
  getLaborPrices: async (pricePeriodId?: number) => {
    const url = pricePeriodId ? `/price-periods/${pricePeriodId}/labor-prices` : '/price-periods';
    const res = await apiClient.get<any>(url).catch(() => ({ data: [] }));
    return ensureArray<any>(res.data);
  },
  getMachinePrices: async (pricePeriodId?: number) => {
    const url = pricePeriodId ? `/price-periods/${pricePeriodId}/machine-prices` : '/price-periods';
    const res = await apiClient.get<any>(url).catch(() => ({ data: [] }));
    return ensureArray<any>(res.data);
  },
};
