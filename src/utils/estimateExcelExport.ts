import * as XLSX from 'xlsx-js-style';
import { formatDate } from './formatters';

export interface EstimateExportParams {
  projectName?: string;
  projectCode?: string;
  versionName?: string;
  versionNo?: number;
  pricePeriod?: string;
  normStandard?: string;
  totalDirectCost: number;
  totalMaterial: number;
  totalLabor: number;
  totalMachine: number;
  totalIndirectCost: number;
  totalBeforeTax: number;
  vatRate: number;
  vatAmount: number;
  totalEstimate: number;
  items: any[];
  aggregatedResources?: any[];
}

// Border presets
const borderThin = {
  top: { style: 'thin', color: { rgb: 'CBD5E1' } },
  bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
  left: { style: 'thin', color: { rgb: 'CBD5E1' } },
  right: { style: 'thin', color: { rgb: 'CBD5E1' } },
};

const borderTotal = {
  top: { style: 'thin', color: { rgb: '0F172A' } },
  bottom: { style: 'double', color: { rgb: '0F172A' } },
  left: { style: 'thin', color: { rgb: 'CBD5E1' } },
  right: { style: 'thin', color: { rgb: 'CBD5E1' } },
};

// Helper to create a styled cell object
function c(
  val: string | number | null | undefined,
  style: any = {},
  numFmt?: string
) {
  const isNum = typeof val === 'number';
  const cell: any = {
    v: val ?? '',
    t: isNum ? 'n' : 's',
    s: {
      font: { name: 'Segoe UI', sz: 10, ...style.font },
      alignment: { vertical: 'center', ...style.alignment },
      ...style,
    },
  };
  if (isNum && numFmt) {
    cell.s.numFmt = numFmt;
  }
  return cell;
}

export function exportEstimateToExcel(params: EstimateExportParams) {
  const {
    projectName = 'Dự án BMC Landmark',
    projectCode = 'DA-BMC-01',
    versionName = 'Dự toán chính thức',
    versionNo = 1,
    pricePeriod = 'PP-2024-Q1',
    normStandard = 'Thông tư 12/2021/TT-BXD',
    totalDirectCost = 0,
    totalMaterial = 0,
    totalLabor = 0,
    totalMachine = 0,
    totalIndirectCost = 0,
    totalBeforeTax = 0,
    vatRate = 10,
    vatAmount = 0,
    totalEstimate = 0,
    items = [],
    aggregatedResources = [],
  } = params;

  const wb = XLSX.utils.book_new();

  // ==========================================
  // SHEET 1: BÓC TÁCH KHỐI LƯỢNG CHI TIẾT (BOQ)
  // ==========================================
  const boqData: any[][] = [];

  // Top Company Info
  boqData.push([
    c('CÔNG TY CỔ PHẦN ĐẦU TƯ XÂY DỰNG BMC', { font: { bold: true, sz: 11, color: { rgb: '0F2C59' } } }),
    c(''), c(''), c(''), c(''), c(''), c(''), c(''), c(''), c('')
  ]);
  boqData.push([
    c('HỆ THỐNG QUẢN LÝ DỰ ÁN & KIỂM SOÁT CHI PHÍ (BMC ERP)', { font: { italic: true, sz: 9.5, color: { rgb: '64748B' } } }),
    c(''), c(''), c(''), c(''), c(''), c(''), c(''), c(''), c('')
  ]);
  boqData.push([c(''), c(''), c(''), c(''), c(''), c(''), c(''), c(''), c(''), c('')]);

  // Document Title (Merged across columns)
  boqData.push([
    c('BẢNG DỰ TOÁN BÓC TÁCH KHỐI LƯỢNG & ĐƠN GIÁ CHI TIẾT (BOQ)', {
      font: { bold: true, sz: 15, color: { rgb: '0F2C59' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    }),
    c(''), c(''), c(''), c(''), c(''), c(''), c(''), c(''), c('')
  ]);
  boqData.push([
    c(`Công trình: [${projectCode}] ${projectName}`, {
      font: { bold: true, sz: 11, color: { rgb: '1E293B' } },
      alignment: { horizontal: 'center' }
    }),
    c(''), c(''), c(''), c(''), c(''), c(''), c(''), c(''), c('')
  ]);
  boqData.push([
    c(`Hồ sơ dự toán: Phiên bản v${versionNo} — ${versionName}`, {
      font: { sz: 10.5, color: { rgb: '334155' } },
      alignment: { horizontal: 'center' }
    }),
    c(''), c(''), c(''), c(''), c(''), c(''), c(''), c(''), c('')
  ]);
  boqData.push([
    c(`Kỳ công bố giá: ${pricePeriod}   |   Định mức áp dụng: ${normStandard}   |   Ngày xuất: ${formatDate(new Date().toISOString())}`, {
      font: { italic: true, sz: 9.5, color: { rgb: '64748B' } },
      alignment: { horizontal: 'center' }
    }),
    c(''), c(''), c(''), c(''), c(''), c(''), c(''), c(''), c('')
  ]);
  boqData.push([c(''), c(''), c(''), c(''), c(''), c(''), c(''), c(''), c(''), c('')]);

  // Table Headers
  const headerStyle = {
    font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1E3A8A' } }, // Dark Navy
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: '172554' } },
      bottom: { style: 'medium', color: { rgb: '172554' } },
      left: { style: 'thin', color: { rgb: '2563EB' } },
      right: { style: 'thin', color: { rgb: '2563EB' } },
    }
  };

  boqData.push([
    c('STT', headerStyle),
    c('Mã Định Mức', headerStyle),
    c('Tên Hạng Mục / Công Tác Xây Dựng', headerStyle),
    c('ĐVT', headerStyle),
    c('Khối Lượng\nThiết Kế', headerStyle),
    c('Đơn Giá Trực Tiếp\n(VNĐ)', headerStyle),
    c('Thành Tiền\nVật Liệu (VNĐ)', headerStyle),
    c('Thành Tiền\nNhân Công (VNĐ)', headerStyle),
    c('Thành Tiền\nMáy (VNĐ)', headerStyle),
    c('TỔNG CHI PHÍ\nTRỰC TIẾP (VNĐ)', headerStyle)
  ]);

  let taskGlobalIdx = 1;

  items.forEach((item, itemIdx) => {
    // WBS Item Row Header (Light Blue Highlight)
    const wbsStyle = {
      font: { bold: true, sz: 10.5, color: { rgb: '1E3A8A' } },
      fill: { fgColor: { rgb: 'DBEAFE' } },
      border: borderThin,
    };

    boqData.push([
      c(`HM.${itemIdx + 1}`, { ...wbsStyle, alignment: { horizontal: 'center' } }),
      c(item.code || `HM-${itemIdx + 1}`, { ...wbsStyle, alignment: { horizontal: 'center' } }),
      c(`HẠNG MỤC: ${(item.name || '').toUpperCase()}`, wbsStyle),
      c('', wbsStyle),
      c('', wbsStyle),
      c('', wbsStyle),
      c(Number(item.totalMaterial || 0), { ...wbsStyle, alignment: { horizontal: 'right' } }, '#,##0'),
      c(Number(item.totalLabor || 0), { ...wbsStyle, alignment: { horizontal: 'right' } }, '#,##0'),
      c(Number(item.totalMachine || 0), { ...wbsStyle, alignment: { horizontal: 'right' } }, '#,##0'),
      c(Number(item.totalDirectCost || 0), { ...wbsStyle, alignment: { horizontal: 'right' }, font: { bold: true, sz: 10.5, color: { rgb: '0369A1' } } }, '#,##0')
    ]);

    // Tasks under this item
    (item.tasks || []).forEach((t: any, tIdx: number) => {
      const isEven = tIdx % 2 === 1;
      const rowFill = isEven ? { fgColor: { rgb: 'F8FAFC' } } : undefined;
      const baseRowStyle = {
        font: { sz: 9.5, color: { rgb: '1E293B' } },
        fill: rowFill,
        border: borderThin,
      };

      boqData.push([
        c(taskGlobalIdx++, { ...baseRowStyle, alignment: { horizontal: 'center' } }),
        c(t.code || '', { ...baseRowStyle, font: { bold: true, sz: 9.5, color: { rgb: '0284C7' } }, alignment: { horizontal: 'center' } }),
        c(t.name || '', { ...baseRowStyle, alignment: { horizontal: 'left' } }),
        c(t.unit || '', { ...baseRowStyle, alignment: { horizontal: 'center' } }),
        c(Number(t.quantity || 0), { ...baseRowStyle, alignment: { horizontal: 'right' } }, '#,##0.00'),
        c(Number(t.unitPrice || 0), { ...baseRowStyle, alignment: { horizontal: 'right' } }, '#,##0'),
        c(Number(t.materialTotal || 0), { ...baseRowStyle, alignment: { horizontal: 'right' } }, '#,##0'),
        c(Number(t.laborTotal || 0), { ...baseRowStyle, alignment: { horizontal: 'right' } }, '#,##0'),
        c(Number(t.machineTotal || 0), { ...baseRowStyle, alignment: { horizontal: 'right' } }, '#,##0'),
        c(Number(t.directCost || 0), { ...baseRowStyle, font: { bold: true, sz: 9.5, color: { rgb: '0F172A' } }, alignment: { horizontal: 'right' } }, '#,##0')
      ]);
    });
  });

  // Total Summary Row
  const totalRowStyle = {
    font: { bold: true, sz: 11, color: { rgb: '0F172A' } },
    fill: { fgColor: { rgb: 'FEF3C7' } }, // Light Amber
    border: borderTotal,
  };

  boqData.push([
    c('', totalRowStyle),
    c('TỔNG CỘNG', { ...totalRowStyle, alignment: { horizontal: 'center' } }),
    c('TỔNG CHI PHÍ TRỰC TIẾP CÔNG TRÌNH (T = VL + NC + M)', totalRowStyle),
    c('', totalRowStyle),
    c('', totalRowStyle),
    c('', totalRowStyle),
    c(Number(totalMaterial), { ...totalRowStyle, alignment: { horizontal: 'right' } }, '#,##0'),
    c(Number(totalLabor), { ...totalRowStyle, alignment: { horizontal: 'right' } }, '#,##0'),
    c(Number(totalMachine), { ...totalRowStyle, alignment: { horizontal: 'right' } }, '#,##0'),
    c(Number(totalDirectCost), { ...totalRowStyle, alignment: { horizontal: 'right' }, font: { bold: true, sz: 12, color: { rgb: 'B45309' } } }, '#,##0')
  ]);

  const wsBOQ = XLSX.utils.aoa_to_sheet(boqData);

  // Column Widths
  wsBOQ['!cols'] = [
    { wch: 7 },   // STT
    { wch: 14 },  // Mã Định Mức
    { wch: 48 },  // Tên Công Tác
    { wch: 9 },   // ĐVT
    { wch: 15 },  // Khối Lượng
    { wch: 17 },  // Đơn Giá TT
    { wch: 18 },  // TT Vật Liệu
    { wch: 18 },  // TT Nhân Công
    { wch: 18 },  // TT Máy
    { wch: 22 }   // Tổng Trực Tiếp
  ];

  // Row Heights
  wsBOQ['!rows'] = [
    { hpt: 20 }, // Row 1
    { hpt: 18 }, // Row 2
    { hpt: 10 }, // Row 3
    { hpt: 28 }, // Row 4 (Title)
    { hpt: 22 }, // Row 5 (Project)
    { hpt: 20 }, // Row 6 (Version)
    { hpt: 18 }, // Row 7 (Meta)
    { hpt: 12 }, // Row 8
    { hpt: 36 }  // Row 9 (Table Header)
  ];

  // Merge title rows across table width
  wsBOQ['!merges'] = [
    { s: { r: 3, c: 0 }, e: { r: 3, c: 9 } }, // Title
    { s: { r: 4, c: 0 }, e: { r: 4, c: 9 } }, // Project
    { s: { r: 5, c: 0 }, e: { r: 5, c: 9 } }, // Version
    { s: { r: 6, c: 0 }, e: { r: 6, c: 9 } }, // Meta
  ];

  XLSX.utils.book_append_sheet(wb, wsBOQ, '1. Bóc Tách BOQ');

  // ==========================================
  // SHEET 2: TỔNG HỢP CHI PHÍ XÂY DỰNG (TT 12/2021)
  // ==========================================
  const summaryData: any[][] = [];

  summaryData.push([
    c('CÔNG TY CỔ PHẦN ĐẦU TƯ XÂY DỰNG BMC', { font: { bold: true, sz: 11, color: { rgb: '0F2C59' } } }),
    c(''), c(''), c(''), c(''), c(''), c('')
  ]);
  summaryData.push([
    c('HỆ THỐNG QUẢN LÝ DỰ ÁN & KIỂM SOÁT CHI PHÍ', { font: { italic: true, sz: 9.5, color: { rgb: '64748B' } } }),
    c(''), c(''), c(''), c(''), c(''), c('')
  ]);
  summaryData.push([c(''), c(''), c(''), c(''), c(''), c(''), c('')]);

  summaryData.push([
    c('BẢNG TỔNG HỢP DỰ TOÁN CHI PHÍ XÂY DỰNG', {
      font: { bold: true, sz: 15, color: { rgb: '0F2C59' } },
      alignment: { horizontal: 'center' }
    }),
    c(''), c(''), c(''), c(''), c(''), c('')
  ]);
  summaryData.push([
    c('(Kèm theo Thông tư số 12/2021/TT-BXD của Bộ Xây Dựng)', {
      font: { italic: true, sz: 10, color: { rgb: '475569' } },
      alignment: { horizontal: 'center' }
    }),
    c(''), c(''), c(''), c(''), c(''), c('')
  ]);
  summaryData.push([
    c(`Công trình: [${projectCode}] ${projectName}  —  Phiên bản: v${versionNo}`, {
      font: { bold: true, sz: 11, color: { rgb: '1E293B' } },
      alignment: { horizontal: 'center' }
    }),
    c(''), c(''), c(''), c(''), c(''), c('')
  ]);
  summaryData.push([c(''), c(''), c(''), c(''), c(''), c(''), c('')]);

  // Summary Table Header
  const sumHeaderStyle = {
    font: { bold: true, sz: 10.5, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '0F766E' } }, // Teal Green
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderThin,
  };

  summaryData.push([
    c('STT', sumHeaderStyle),
    c('Khoản Mục Chi Phí', sumHeaderStyle),
    c('Ký Hiệu', sumHeaderStyle),
    c('Cách Tính', sumHeaderStyle),
    c('Giá Trị Trước Thuế (VNĐ)', sumHeaderStyle),
    c('Thuế VAT (VNĐ)', sumHeaderStyle),
    c('TỔNG CỘNG SAU THUẾ (VNĐ)', sumHeaderStyle)
  ]);

  const rowDirectStyle = {
    font: { bold: true, sz: 10.5, color: { rgb: '0F172A' } },
    fill: { fgColor: { rgb: 'F0FDFA' } },
    border: borderThin,
  };
  summaryData.push([
    c('1', { ...rowDirectStyle, alignment: { horizontal: 'center' } }),
    c('CHI PHÍ TRỰC TIẾP', rowDirectStyle),
    c('T', { ...rowDirectStyle, alignment: { horizontal: 'center' } }),
    c('T = VL + NC + M', rowDirectStyle),
    c(Number(totalDirectCost), { ...rowDirectStyle, alignment: { horizontal: 'right' } }, '#,##0'),
    c(Math.round(totalDirectCost * (vatRate / 100)), { ...rowDirectStyle, alignment: { horizontal: 'right' } }, '#,##0'),
    c(Math.round(totalDirectCost * (1 + vatRate / 100)), { ...rowDirectStyle, alignment: { horizontal: 'right' }, font: { bold: true, sz: 10.5, color: { rgb: '0F766E' } } }, '#,##0')
  ]);

  const subStyle = {
    font: { sz: 9.5, color: { rgb: '334155' } },
    border: borderThin,
  };
  summaryData.push([
    c('1.1', { ...subStyle, alignment: { horizontal: 'center' } }),
    c('  - Chi phí vật liệu', subStyle),
    c('VL', { ...subStyle, alignment: { horizontal: 'center' } }),
    c('Bóc tách từ bảng dự toán BOQ', subStyle),
    c(Number(totalMaterial), { ...subStyle, alignment: { horizontal: 'right' } }, '#,##0'),
    c('-', { ...subStyle, alignment: { horizontal: 'center' } }),
    c('-', { ...subStyle, alignment: { horizontal: 'center' } })
  ]);
  summaryData.push([
    c('1.2', { ...subStyle, alignment: { horizontal: 'center' } }),
    c('  - Chi phí nhân công', subStyle),
    c('NC', { ...subStyle, alignment: { horizontal: 'center' } }),
    c('Bóc tách từ bảng dự toán BOQ', subStyle),
    c(Number(totalLabor), { ...subStyle, alignment: { horizontal: 'right' } }, '#,##0'),
    c('-', { ...subStyle, alignment: { horizontal: 'center' } }),
    c('-', { ...subStyle, alignment: { horizontal: 'center' } })
  ]);
  summaryData.push([
    c('1.3', { ...subStyle, alignment: { horizontal: 'center' } }),
    c('  - Chi phí máy thi công', subStyle),
    c('M', { ...subStyle, alignment: { horizontal: 'center' } }),
    c('Bóc tách từ bảng dự toán BOQ', subStyle),
    c(Number(totalMachine), { ...subStyle, alignment: { horizontal: 'right' } }, '#,##0'),
    c('-', { ...subStyle, alignment: { horizontal: 'center' } }),
    c('-', { ...subStyle, alignment: { horizontal: 'center' } })
  ]);

  const rowIndirectStyle = {
    font: { bold: true, sz: 10, color: { rgb: '0F172A' } },
    border: borderThin,
  };
  summaryData.push([
    c('2', { ...rowIndirectStyle, alignment: { horizontal: 'center' } }),
    c('CHI PHÍ GIÁN TIẾP', rowIndirectStyle),
    c('GT', { ...rowIndirectStyle, alignment: { horizontal: 'center' } }),
    c('Chi phí chung + Lán trại tạm theo TT 12/2021', rowIndirectStyle),
    c(Number(totalIndirectCost), { ...rowIndirectStyle, alignment: { horizontal: 'right' } }, '#,##0'),
    c(Math.round(totalIndirectCost * (vatRate / 100)), { ...rowIndirectStyle, alignment: { horizontal: 'right' } }, '#,##0'),
    c(Math.round(totalIndirectCost * (1 + vatRate / 100)), { ...rowIndirectStyle, alignment: { horizontal: 'right' } }, '#,##0')
  ]);

  const rowBeforeTaxStyle = {
    font: { bold: true, sz: 10.5, color: { rgb: '1E3A8A' } },
    fill: { fgColor: { rgb: 'EFF6FF' } },
    border: borderThin,
  };
  summaryData.push([
    c('3', { ...rowBeforeTaxStyle, alignment: { horizontal: 'center' } }),
    c('TỔNG CHI PHÍ XÂY DỰNG TRƯỚC THUẾ', rowBeforeTaxStyle),
    c('G', { ...rowBeforeTaxStyle, alignment: { horizontal: 'center' } }),
    c('G = T + GT', rowBeforeTaxStyle),
    c(Number(totalBeforeTax), { ...rowBeforeTaxStyle, alignment: { horizontal: 'right' } }, '#,##0'),
    c('-', { ...rowBeforeTaxStyle, alignment: { horizontal: 'center' } }),
    c(Number(totalBeforeTax), { ...rowBeforeTaxStyle, alignment: { horizontal: 'right' } }, '#,##0')
  ]);

  const rowVatStyle = {
    font: { bold: true, sz: 10, color: { rgb: 'B45309' } },
    border: borderThin,
  };
  summaryData.push([
    c('4', { ...rowVatStyle, alignment: { horizontal: 'center' } }),
    c(`THUẾ GIÁ TRỊ GIA TĂNG (VAT ${vatRate}%)`, rowVatStyle),
    c('VAT', { ...rowVatStyle, alignment: { horizontal: 'center' } }),
    c(`VAT = G x ${vatRate}%`, rowVatStyle),
    c(Number(vatAmount), { ...rowVatStyle, alignment: { horizontal: 'right' } }, '#,##0'),
    c(Number(vatAmount), { ...rowVatStyle, alignment: { horizontal: 'right' } }, '#,##0'),
    c(Number(vatAmount), { ...rowVatStyle, alignment: { horizontal: 'right' } }, '#,##0')
  ]);

  const rowGrandTotalStyle = {
    font: { bold: true, sz: 12, color: { rgb: '9A3412' } },
    fill: { fgColor: { rgb: 'FFEDD5' } }, // Warm Gold
    border: borderTotal,
  };
  summaryData.push([
    c('5', { ...rowGrandTotalStyle, alignment: { horizontal: 'center' } }),
    c('TỔNG DỰ TOÁN XÂY DỰNG CÔNG TRÌNH SAU THUẾ', rowGrandTotalStyle),
    c('GXD', { ...rowGrandTotalStyle, alignment: { horizontal: 'center' } }),
    c('GXD = G + VAT', rowGrandTotalStyle),
    c(Number(totalEstimate), { ...rowGrandTotalStyle, alignment: { horizontal: 'right' } }, '#,##0'),
    c(Number(vatAmount), { ...rowGrandTotalStyle, alignment: { horizontal: 'right' } }, '#,##0'),
    c(Number(totalEstimate), { ...rowGrandTotalStyle, alignment: { horizontal: 'right' }, font: { bold: true, sz: 13, color: { rgb: 'EA580C' } } }, '#,##0')
  ]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 8 },  // STT
    { wch: 45 }, // Khoản Mục
    { wch: 12 }, // Ký Hiệu
    { wch: 36 }, // Cách Tính
    { wch: 25 }, // Trước Thuế
    { wch: 20 }, // VAT
    { wch: 28 }  // Sau Thuế
  ];
  wsSummary['!rows'] = [
    { hpt: 20 },
    { hpt: 18 },
    { hpt: 10 },
    { hpt: 26 },
    { hpt: 18 },
    { hpt: 22 },
    { hpt: 12 },
    { hpt: 32 }
  ];
  wsSummary['!merges'] = [
    { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 6 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 6 } },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, '2. Tổng Hợp Chi Phí');

  // ==========================================
  // SHEET 3: TỔNG HỢP VẬT TƯ - NHÂN CÔNG - CA MÁY
  // ==========================================
  const resourceData: any[][] = [];

  resourceData.push([
    c('CÔNG TY CỔ PHẦN ĐẦU TƯ XÂY DỰNG BMC', { font: { bold: true, sz: 11, color: { rgb: '0F2C59' } } }),
    c(''), c(''), c(''), c(''), c(''), c(''), c('')
  ]);
  resourceData.push([
    c('BẢNG TỔNG HỢP HAO PHÍ TÀI NGUYÊN (VẬT TƯ, NHÂN CÔNG, MÁY THI CÔNG)', {
      font: { bold: true, sz: 14, color: { rgb: '0F2C59' } },
      alignment: { horizontal: 'center' }
    }),
    c(''), c(''), c(''), c(''), c(''), c(''), c('')
  ]);
  resourceData.push([
    c(`Công trình: [${projectCode}] ${projectName} — v${versionNo}`, {
      font: { bold: true, sz: 10.5, color: { rgb: '334155' } },
      alignment: { horizontal: 'center' }
    }),
    c(''), c(''), c(''), c(''), c(''), c(''), c('')
  ]);
  resourceData.push([c(''), c(''), c(''), c(''), c(''), c(''), c(''), c('')]);

  const resHeaderStyle = {
    font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '0284C7' } }, // Sky Blue
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderThin,
  };

  resourceData.push([
    c('STT', resHeaderStyle),
    c('Phân Loại', resHeaderStyle),
    c('Mã Định Mức', resHeaderStyle),
    c('Tên Quy Cách / Chủng Loại Tài Nguyên', resHeaderStyle),
    c('ĐVT', resHeaderStyle),
    c('Tổng Hao Phí', resHeaderStyle),
    c('Đơn Giá Dự Toán (VNĐ)', resHeaderStyle),
    c('Thành Tiền Dự Toán (VNĐ)', resHeaderStyle)
  ]);

  let totalResAmount = 0;

  aggregatedResources.forEach((r, idx) => {
    const isEven = idx % 2 === 1;
    const typeLabel = r.type === 'MATERIAL' ? 'Vật liệu' : r.type === 'LABOR' ? 'Nhân công' : 'Máy thi công';
    const typeColor = r.type === 'MATERIAL' ? '0284C7' : r.type === 'LABOR' ? 'D97706' : '059669';
    const amt = Number(r.totalAmount || 0);
    totalResAmount += amt;

    const rowStyle = {
      font: { sz: 9.5, color: { rgb: '1E293B' } },
      fill: isEven ? { fgColor: { rgb: 'F8FAFC' } } : undefined,
      border: borderThin,
    };

    resourceData.push([
      c(idx + 1, { ...rowStyle, alignment: { horizontal: 'center' } }),
      c(typeLabel, { ...rowStyle, font: { bold: true, sz: 9.5, color: { rgb: typeColor } }, alignment: { horizontal: 'center' } }),
      c(r.code || '', { ...rowStyle, alignment: { horizontal: 'center' } }),
      c(r.name || '', { ...rowStyle, alignment: { horizontal: 'left' } }),
      c(r.unit || '', { ...rowStyle, alignment: { horizontal: 'center' } }),
      c(Number(r.totalQuantity || 0), { ...rowStyle, alignment: { horizontal: 'right' } }, '#,##0.00'),
      c(Number(r.unitPrice || 0), { ...rowStyle, alignment: { horizontal: 'right' } }, '#,##0'),
      c(amt, { ...rowStyle, font: { bold: true, sz: 9.5, color: { rgb: '0F172A' } }, alignment: { horizontal: 'right' } }, '#,##0')
    ]);
  });

  // Total Resource Row
  resourceData.push([
    c('', totalRowStyle),
    c('', totalRowStyle),
    c('TỔNG CỘNG', { ...totalRowStyle, alignment: { horizontal: 'center' } }),
    c('TỔNG HAO PHÍ TÀI NGUYÊN BÓC TÁCH', totalRowStyle),
    c('', totalRowStyle),
    c('', totalRowStyle),
    c('', totalRowStyle),
    c(totalResAmount, { ...totalRowStyle, alignment: { horizontal: 'right' }, font: { bold: true, sz: 11, color: { rgb: 'B45309' } } }, '#,##0')
  ]);

  const wsRes = XLSX.utils.aoa_to_sheet(resourceData);
  wsRes['!cols'] = [
    { wch: 7 },   // STT
    { wch: 14 },  // Phân loại
    { wch: 16 },  // Mã hiệu
    { wch: 48 },  // Tên
    { wch: 9 },   // ĐVT
    { wch: 16 },  // Tổng KL
    { wch: 20 },  // Đơn giá
    { wch: 24 }   // Thành tiền
  ];
  wsRes['!rows'] = [
    { hpt: 20 },
    { hpt: 26 },
    { hpt: 20 },
    { hpt: 12 },
    { hpt: 32 }
  ];
  wsRes['!merges'] = [
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
  ];
  XLSX.utils.book_append_sheet(wb, wsRes, '3. Tổng Hợp Tài Nguyên');

  // Export & Download
  const safeProject = (projectCode || 'DA_BMC').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeVersion = `v${versionNo}`;
  const filename = `DuToan_${safeProject}_${safeVersion}.xlsx`;

  // Write workbook to binary buffer with styles
  const excelBuffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array',
  });

  // Create Blob with exact Excel MIME type
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
  });

  // Create downloadable link with explicit download attribute
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = blobUrl;
  link.download = filename;
  link.setAttribute('download', filename);

  document.body.appendChild(link);
  link.click();

  // Crucial: delay revoking the blob URL to let Chrome/Edge finish downloading with the proper filename!
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
    window.URL.revokeObjectURL(blobUrl);
  }, 4000);
}
