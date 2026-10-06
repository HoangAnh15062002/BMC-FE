import { Contract } from '../types';

export type ContractCategory = 'OWNER' | 'SUBCONTRACTOR' | 'SUPPLIER' | 'CONSULTING';

export interface ContractMeta {
  contractType: ContractCategory;
  partnerName: string;
  partnerRole: string;
  isRevenue: boolean;
  contractTitle: string;
  badgeText: string;
  badgeClass: string;
  partyA: {
    title: string;
    name: string;
    rep?: string;
    taxCode?: string;
    address?: string;
  };
  partyB: {
    title: string;
    name: string;
    rep?: string;
    taxCode?: string;
    address?: string;
  };
  wordUrl?: string;
  wordFileName?: string;
  note?: string;
}

export function parseContractMeta(contract: Partial<Contract>): ContractMeta {
  let contractType: ContractCategory = 'OWNER';
  let partnerName = '';
  let wordUrl = contract.wordFileUrl || '';
  let wordFileName = '';
  let note = '';

  // 1. Try reading from contract.description (JSON)
  if (contract.description) {
    try {
      const parsed = JSON.parse(contract.description);
      if (parsed.contractType) contractType = parsed.contractType;
      if (parsed.partnerName) partnerName = parsed.partnerName;
      if (parsed.wordUrl) wordUrl = parsed.wordUrl;
      if (parsed.fileName || parsed.wordFileName) wordFileName = parsed.fileName || parsed.wordFileName;
      if (parsed.note) note = parsed.note;
    } catch {
      note = contract.description;
    }
  }

  // Also check direct fields if present
  if (contract.contractType) contractType = contract.contractType;
  if (contract.partnerName && !partnerName) partnerName = contract.partnerName;

  // 2. Heuristics fallback if not explicitly stored
  const no = (contract.contractNo || '').toUpperCase();
  const name = (contract.contractName || '').toUpperCase();

  if (!partnerName || contractType === 'OWNER') {
    if (no.startsWith('HĐTP') || name.includes('THẦU PHỤ') || name.includes('GIAO KHOÁN') || name.includes('ÉP CỌC') || name.includes('CỐT THÉP')) {
      contractType = 'SUBCONTRACTOR';
      if (!partnerName) {
        if (name.includes('ÉP CỌC') || name.includes('PHÚ MỸ')) partnerName = 'Công ty TNHH Xây Dựng & Nền Móng Phú Mỹ';
        else if (name.includes('CỐT THÉP') || name.includes('GIA CÔNG')) partnerName = 'Đội Thi Công Cốt Thép & Kết Cấu BMC';
        else partnerName = 'Đơn vị Thầu phụ Thi công Chuyên ngành';
      }
    } else if (no.startsWith('HĐCU') || name.includes('CUNG ỨNG') || name.includes('VẬT TƯ') || name.includes('BÊ TÔNG') || name.includes('XI MĂNG') || name.includes('THÉP') || name.includes('THIẾT BỊ')) {
      contractType = 'SUPPLIER';
      if (!partnerName) {
        if (name.includes('BÊ TÔNG') || name.includes('AN LỘC')) partnerName = 'Công ty CP Bê Tông Tươi An Lộc';
        else if (name.includes('XI MĂNG') || name.includes('HÀ TIÊN')) partnerName = 'Công ty Xi Măng Vicem Hà Tiên';
        else partnerName = 'Nhà Cung Ứng Vật Tư Xây Dựng';
      }
    } else if (name.includes('TƯ VẤN') || name.includes('KHẢO SÁT') || name.includes('THÍ NGHIỆM') || name.includes('KIỂM ĐỊNH')) {
      contractType = 'CONSULTING';
      if (!partnerName) partnerName = 'Trung Tâm Kiểm Định & Khảo Sát Xây Dựng';
    } else {
      contractType = 'OWNER';
      if (!partnerName) {
        if (contract.projectName?.includes('Móng M02B') || contract.projectName?.includes('BT-A22') || contract.projectName?.includes('Nam Long')) {
          partnerName = 'Tập đoàn Bất động sản Nam Long';
        } else {
          partnerName = 'Chủ Đầu Tư / Ban Quản Lý Dự Án';
        }
      }
    }
  }

  // Determine parties based on contract type
  const bmcCompany = {
    name: 'CÔNG TY CỔ PHẦN XÂY DỰNG KỸ THUẬT BMC',
    rep: 'Ban Giám Đốc Công Ty (Ông Nguyễn Văn Quang)',
    taxCode: '3700148567',
    address: 'Khu đô thị sinh thái Chánh Mỹ, P. Chánh Mỹ, TP. Thủ Dầu Một, Bình Dương',
  };

  if (contractType === 'OWNER') {
    return {
      contractType: 'OWNER',
      partnerName,
      partnerRole: 'Chủ Đầu Tư (Khách hàng)',
      isRevenue: true,
      contractTitle: 'HỢP ĐỒNG THI CÔNG XÂY DỰNG CÔNG TRÌNH',
      badgeText: 'HĐ Chủ Đầu Tư',
      badgeClass: 'badge-owner',
      partyA: {
        title: 'BÊN GIAO THẦU (CHỦ ĐẦU TƯ - BÊN A)',
        name: partnerName,
        rep: 'Đại diện Chủ Đầu Tư',
        taxCode: '0301894671',
        address: 'Theo hồ sơ mời thầu & Dự án đầu tư',
      },
      partyB: {
        title: 'BÊN NHẬN THẦU (TỔNG THẦU THI CÔNG - BÊN B)',
        ...bmcCompany,
      },
      wordUrl,
      wordFileName,
      note,
    };
  }

  if (contractType === 'SUBCONTRACTOR') {
    return {
      contractType: 'SUBCONTRACTOR',
      partnerName,
      partnerRole: 'Nhà Thầu Phụ (Đơn vị thi công)',
      isRevenue: false,
      contractTitle: 'HỢP ĐỒNG GIAO THẦU PHỤ THI CÔNG XÂY DỰNG',
      badgeText: 'HĐ Thầu Phụ',
      badgeClass: 'badge-subcontractor',
      partyA: {
        title: 'BÊN GIAO THẦU PHỤ (TỔNG THẦU BMC - BÊN A)',
        ...bmcCompany,
      },
      partyB: {
        title: 'BÊN NHẬN THẦU PHỤ (ĐƠN VỊ THI CÔNG - BÊN B)',
        name: partnerName,
        rep: 'Đại diện Ban Điều Hành Thầu Phụ',
        taxCode: '0315894220',
        address: 'Địa chỉ đăng ký kinh doanh đơn vị thầu phụ',
      },
      wordUrl,
      wordFileName,
      note,
    };
  }

  if (contractType === 'SUPPLIER') {
    return {
      contractType: 'SUPPLIER',
      partnerName,
      partnerRole: 'Nhà Cung Ứng (Vật tư - Thiết bị)',
      isRevenue: false,
      contractTitle: 'HỢP ĐỒNG NGUYÊN TẮC CUNG ỨNG VẬT TƯ & THIẾT BỊ',
      badgeText: 'HĐ Cung Ứng Vật Tư',
      badgeClass: 'badge-supplier',
      partyA: {
        title: 'BÊN MUA HÀNG (CÔNG TY BMC - BÊN A)',
        ...bmcCompany,
      },
      partyB: {
        title: 'BÊN BÁN HÀNG / CUNG ỨNG (NHÀ CUNG CẤP - BÊN B)',
        name: partnerName,
        rep: 'Đại diện Nhà Cung Cấp',
        taxCode: '3702489611',
        address: 'Địa chỉ xưởng sản xuất / văn phòng giao dịch',
      },
      wordUrl,
      wordFileName,
      note,
    };
  }

  // CONSULTING / OTHER
  return {
    contractType: 'CONSULTING',
    partnerName,
    partnerRole: 'Đơn Vị Tư Vấn / Dịch Vụ',
    isRevenue: false,
    contractTitle: 'HỢP ĐỒNG DỊCH VỤ TƯ VẤN & KIỂM ĐỊNH XÂY DỰNG',
    badgeText: 'HĐ Tư Vấn & Dịch Vụ',
    badgeClass: 'badge-consulting',
    partyA: {
      title: 'BÊN GIAO VIỆC (CÔNG TY BMC - BÊN A)',
      ...bmcCompany,
    },
    partyB: {
      title: 'BÊN THỰC HIỆN DỊCH VỤ (BÊN B)',
      name: partnerName,
      rep: 'Đại diện Đơn Vị Dịch Vụ',
      taxCode: '0314789520',
      address: 'Trụ sở đơn vị kiểm định / tư vấn',
    },
    wordUrl,
    wordFileName,
    note,
  };
}
