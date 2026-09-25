USE BMCConstructionDb;
GO

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- 1. CẬP NHẬT NHÀ CUNG CẤP (SUPPLIERS)
UPDATE bmc.suppliers
SET 
    name = N'Công ty TNHH Bê tông tươi An Lộc',
    address = N'KCN Sóng Thần 2, TP. Dĩ An, Tỉnh Bình Dương',
    contact_person = N'Lê Tấn Lực',
    bank_name = N'BIDV - CN Đồng Nai',
    note = N'Cung cấp bê tông thương phẩm M200, M250, M300 độ sụt theo yêu cầu.'
WHERE code = 'NCC-BETONG-ANLOC';

UPDATE bmc.suppliers
SET 
    name = N'Công ty CP Vật liệu Xây dựng Cát Đá Tân Cảng',
    address = N'Mỏ đá Tân Cảng, Xã Phước Tân, TP. Biên Hòa, Tỉnh Đồng Nai',
    contact_person = N'Phạm Hùng Cường',
    bank_name = N'Agribank - CN Biên Hòa',
    note = N'Cung cấp cát vàng đổ bê tông, cát xây tô, đá 1x2, đá 4x6.'
WHERE code = 'NCC-CATDA-TANCANG';

UPDATE bmc.suppliers
SET 
    name = N'Công ty Xi măng Vicem Hoàng Thạch',
    address = N'Thị trấn Minh Tân, Huyện Kinh Môn, Tỉnh Hải Dương',
    contact_person = N'Trần Văn Xi',
    bank_name = N'VietinBank - CN Hải Dương',
    note = N'Nhà máy sản xuất xi măng PCB40, PC40 rời và bao.'
WHERE code = 'NCC-HOANGTHACH';

UPDATE bmc.suppliers
SET 
    name = N'Công ty Cổ phần Tập đoàn Hòa Phát',
    address = N'KCN Phố Nối A, Xã Giai Phạm, Huyện Yên Mỹ, Tỉnh Hưng Yên',
    contact_person = N'Nguyễn Văn Thép',
    bank_name = N'Vietcombank - CN Sở Giao Dịch',
    note = N'Cung cấp thép xây dựng D10-D32, thép cuộn, thép hình tiêu chuẩn TCVN.'
WHERE code = 'NCC-HOAPHAT';

UPDATE bmc.suppliers
SET 
    name = N'Công ty TNHH Vật liệu Bình Dương',
    address = N'Số 88 Quốc lộ 13, TP. Thủ Dầu Một, Tỉnh Bình Dương',
    contact_person = N'Phạm Hoàng',
    note = N'Cung cấp vật liệu cát đá xây dựng tại Bình Dương.'
WHERE code = 'SUP-CATDA-BD';

UPDATE bmc.suppliers
SET 
    name = N'Công ty CP Cọc Bê tông Phú Mỹ',
    address = N'KCN Phú Mỹ 1, Thị xã Phú Mỹ, Tỉnh Bà Rịa - Vũng Tàu',
    contact_person = N'Lê Quang Hải',
    note = N'Sản xuất và ép cọc bê tông dự ứng lực D300, D400, D500.'
WHERE code = 'SUP-COC-BT';

UPDATE bmc.suppliers
SET 
    name = N'Công ty CP Thép Việt Nam',
    address = N'Số 56 Thủ Khoa Huân, Quận 1, TP. Hồ Chí Minh',
    contact_person = N'Trần Văn Nam',
    note = N'Thép xây dựng Hòa Phát, Pomina, Miền Nam.'
WHERE code = 'SUP-THEP-VN';

UPDATE bmc.suppliers
SET 
    name = N'Công ty CP Xi măng Việt Nam',
    address = N'Số 228 Lê Duẩn, Quận Đống Đa, TP. Hà Nội',
    contact_person = N'Nguyễn Trung',
    note = N'Cung cấp xi măng bao và xi măng xá giao tận công trình.'
WHERE code = 'SUP-VIETCEM';

-- 2. CẬP NHẬT VẬT TƯ (MATERIALS)
UPDATE bmc.materials SET name = N'Cọc bê tông dự ứng lực D300', description = N'Cọc bê tông ly tâm dự ứng lực D300 mác 600-800' WHERE code = 'COC-D300';
UPDATE bmc.materials SET name = N'Đá 1x2', description = N'Đá dăm 1x2 đổ bê tông thương phẩm' WHERE code = 'A24.0008';
UPDATE bmc.materials SET name = N'Đá 4x6', description = N'Đá 4x6 lót móng công trình' WHERE code = 'A24.0010';
UPDATE bmc.materials SET name = N'Đinh thép', description = N'Đinh thép đóng cốp pha ván khuôn' WHERE code = 'A24.0054';
UPDATE bmc.materials SET name = N'Cát mịn ML=1.5-2.0', description = N'Cát mịn xây tô hoàn thiện' WHERE code = 'A24.0176';
UPDATE bmc.materials SET name = N'Cát vàng đổ bê tông', description = N'Cát hạt lớn đổ bê tông kết cấu' WHERE code = 'A24.0180';
UPDATE bmc.materials SET name = N'Cây chống thép ống', description = N'Cây chống thép ren điều chỉnh' WHERE code = 'A24.0185';
UPDATE bmc.materials SET name = N'Cột chống thép ống', description = N'Cột chống hệ giàn giáo' WHERE code = 'A24.0262';
UPDATE bmc.materials SET name = N'Dây thép buộc', description = N'Dây thép mềm buộc cốt thép 1 ly' WHERE code = 'A24.0293';
UPDATE bmc.materials SET name = N'Gạch không nung 4x8x18', description = N'Gạch xi măng cốt liệu xây tường' WHERE code = 'A24.0396A';
UPDATE bmc.materials SET name = N'Gỗ đà nẹp', description = N'Gỗ đà nẹp xà gồ cốp pha' WHERE code = 'A24.0404';
UPDATE bmc.materials SET name = N'Gỗ chống', description = N'Gỗ tròn chống phụ' WHERE code = 'A24.0406';
UPDATE bmc.materials SET name = N'Gỗ ván khuôn phủ phim', description = N'Ván ép phủ phim 18mm chịu nước' WHERE code = 'A24.0418';
UPDATE bmc.materials SET name = N'Nước sạch thi công', description = N'Nước sạch phục vụ trộn bê tông và dưỡng hộ' WHERE code = 'A24.0524';
UPDATE bmc.materials SET name = N'Khí gas', description = N'Khí gas hàn cắt' WHERE code = 'A24.0931';
UPDATE bmc.materials SET name = N'Cát đắp nền', description = N'Cát san lấp mặt bằng tôn nền' WHERE code = 'A24.1091';
UPDATE bmc.materials SET name = N'Đá cát', description = N'Đá cát hỗn hợp' WHERE code = 'A25.0005';
UPDATE bmc.materials SET name = N'Thép tròn trơn D12', description = N'Thép tròn trơn CB240T D12' WHERE code = 'THEP-D12';
UPDATE bmc.materials SET name = N'Thép vằn D16', description = N'Thép vằn CB400V D16 cường độ cao' WHERE code = 'THEP-D16';
UPDATE bmc.materials SET name = N'Xi măng Portland PC40', description = N'Xi măng Portland hỗn hợp PC40 bao 50kg' WHERE code = 'XI-MANG';

-- 3. CẬP NHẬT ĐƠN VỊ TÍNH (UNITS)
UPDATE bmc.units SET name = N'Kilôgam', symbol = N'kg' WHERE code = 'KG';
UPDATE bmc.units SET name = N'Tấn', symbol = N'tấn' WHERE code IN ('TON', 'TAN');
UPDATE bmc.units SET name = N'Mét', symbol = N'm' WHERE code = 'M';
UPDATE bmc.units SET name = N'Mét vuông', symbol = N'm²' WHERE code = 'M2';
UPDATE bmc.units SET name = N'Mét khối', symbol = N'm³' WHERE code = 'M3';
UPDATE bmc.units SET name = N'Công', symbol = N'công' WHERE code IN ('WORKDAY', 'CONG');
UPDATE bmc.units SET name = N'Ca máy', symbol = N'ca' WHERE code IN ('SHIFT', 'CA');
UPDATE bmc.units SET name = N'100 mét', symbol = N'100m' WHERE code = '100M';
UPDATE bmc.units SET name = N'100 mét khối', symbol = N'100m³' WHERE code = '100M3';
UPDATE bmc.units SET name = N'Cái', symbol = N'cái' WHERE code = 'CAI';
UPDATE bmc.units SET name = N'Cấu kiện', symbol = N'cấu kiện' WHERE code = 'CK';
UPDATE bmc.units SET name = N'Lít', symbol = N'lít' WHERE code = 'LIT';
UPDATE bmc.units SET name = N'Mối nối', symbol = N'mối nối' WHERE code = 'MOI_NOI';
UPDATE bmc.units SET name = N'Viên', symbol = N'viên' WHERE code = 'VIEN';

-- 4. CẬP NHẬT NHÂN CÔNG (LABORS)
UPDATE bmc.labors SET name = N'Nhân công bậc 3.0/7 - Nhóm 1' WHERE code = 'N1.30';
UPDATE bmc.labors SET name = N'Nhân công bậc 3.0/7 - Nhóm 2' WHERE code = 'N2.30';
UPDATE bmc.labors SET name = N'Nhân công bậc 4.0/7 - Nhóm 2' WHERE code = 'N2.40';
UPDATE bmc.labors SET name = N'Lái máy bậc 4.0/7 - Nhóm 4' WHERE code = 'N4.40';
UPDATE bmc.labors SET name = N'Lái máy bậc 5.0/7 - Nhóm 4' WHERE code = 'N4.50';
UPDATE bmc.labors SET name = N'Lái máy bậc 6.0/7 - Nhóm 4' WHERE code = 'N4.60';

-- 5. CẬP NHẬT MÁY THI CÔNG (MACHINES)
UPDATE bmc.machines SET name = N'Máy ép cọc Robot thủy lực' WHERE code = 'M-EP';
UPDATE bmc.machines SET name = N'Cần cẩu bánh xích 50T' WHERE code = 'M-CAU50';
UPDATE bmc.machines SET name = N'Cần cẩu bánh hơi - sức nâng 6T' WHERE code = 'M102.0201';
UPDATE bmc.machines SET name = N'Cần cẩu bánh xích - sức nâng 16T' WHERE code = 'M102.0302';
UPDATE bmc.machines SET name = N'Cần cẩu bánh xích - sức nâng 50T' WHERE code = 'M102.0307';
UPDATE bmc.machines SET name = N'Máy ép cọc Robot thủy lực tự hành 600T' WHERE code = 'M103.0801';
UPDATE bmc.machines SET name = N'Máy ép cọc thủy lực 200T' WHERE code = 'M103.0802';
UPDATE bmc.machines SET name = N'Máy đào gầu ngoạm - dung tích 1.25m³' WHERE code = 'M121.0201';
UPDATE bmc.machines SET name = N'Máy đầm rung 9 tấn' WHERE code = 'M122.0101';
UPDATE bmc.machines SET name = N'Ô tô tự đổ 7 tấn' WHERE code = 'M131.0101';
UPDATE bmc.machines SET name = N'Ô tô tự đổ 12 tấn' WHERE code = 'M131.0102';
UPDATE bmc.machines SET name = N'Máy trộn bê tông 250 lít' WHERE code = 'M241.0101';
UPDATE bmc.machines SET name = N'Máy đầm dùi 1.5kW' WHERE code = 'M242.0101';
UPDATE bmc.machines SET name = N'Máy hàn điện 23kVA' WHERE code = 'M332.0101';
UPDATE bmc.machines SET name = N'Máy thi công khác' WHERE code = 'M999';

-- 6. CẬP NHẬT DỰ ÁN (PROJECTS)
UPDATE bmc.projects SET name = N'Công trình thử nghiệm BMC' WHERE code = 'CT001';
UPDATE bmc.projects SET name = N'Công trình BMC số 2' WHERE code = 'CT002';
UPDATE bmc.projects SET name = N'Xây dựng Nhà máy sản xuất VLXD BMC - KCN Bình Dương', location = N'Lô CN-05, KCN Bàu Bàng, Huyện Bàu Bàng, Tỉnh Bình Dương' WHERE code = 'PRJ-KCN-BD-2024';
UPDATE bmc.projects SET name = N'Đầu tư XD khu nhà ở biệt thự BT-A22, BT-C1 - HM Móng M02B', location = N'Khu đô thị sinh thái Chánh Mỹ, Phường Chánh Mỹ, TP. Thủ Dầu Một, Tỉnh Bình Dương' WHERE code = 'PRJ-M02B-2024';
UPDATE bmc.projects SET name = N'Cải tạo, nâng cấp Quốc lộ 15 - Km10+000 đến Km25+500', location = N'Tuyến QL15, Tỉnh Nghệ An' WHERE code = 'PRJ-QL15-2023';

-- 7. CẬP NHẬT HẠNG MỤC CÔNG TRÌNH (PROJECT ITEMS)
UPDATE bmc.project_items SET name = N'Phần móng công trình' WHERE code = 'HM-MONG' AND (name LIKE '%mng%' OR name LIKE '%mong%');
UPDATE bmc.project_items SET name = N'Móng M1 - Khu A' WHERE code = 'MONG-M1';
UPDATE bmc.project_items SET name = N'Hoàn thiện mặt ngoài - Lô BT-C1' WHERE code = 'HM-HOANTAT';
UPDATE bmc.project_items SET name = N'Khung cột nhà xưởng' WHERE code = 'HM-KHUNGCOT';
UPDATE bmc.project_items SET name = N'Cải tạo mặt đường' WHERE code = 'HM-MATDUONG';
UPDATE bmc.project_items SET name = N'Phần móng - XD khu nhà ở BT-C1' WHERE id = 11;
UPDATE bmc.project_items SET name = N'Phần thân nhà - XD khu nhà ở BT-C1' WHERE id = 12;

-- 8. CẬP NHẬT DANH MỤC CÔNG TÁC & CÔNG TÁC WBS (TASK CATALOG & PROJECT TASKS)
UPDATE bmc.task_catalog SET name = N'Ép cọc bê tông dự ứng lực D300' WHERE code = 'AC.26311';
UPDATE bmc.task_catalog SET name = N'Đào móng công trình bằng máy đào <=1.25m³, đất cấp II' WHERE code = 'AB.11111';
UPDATE bmc.task_catalog SET name = N'Đắp cát công trình bằng máy kết hợp thủ công' WHERE code = 'AB.21111';
UPDATE bmc.task_catalog SET name = N'Bê tông lót móng đá 4x6 mác 100' WHERE code = 'AF.11210';
UPDATE bmc.task_catalog SET name = N'Bê tông móng đá 1x2 mác 250 thương phẩm' WHERE code = 'AF.12310';
UPDATE bmc.task_catalog SET name = N'Sản xuất lắp dựng cốt thép móng D <= 18mm' WHERE code = 'AF.61111';
UPDATE bmc.task_catalog SET name = N'Sản xuất lắp dựng ván khuôn móng phủ phim' WHERE code = 'AF.81111';

UPDATE bmc.project_tasks SET name_snapshot = N'Ép cọc bê tông dự ứng lực D300' WHERE code_snapshot = 'AC.26311';
UPDATE bmc.project_tasks SET name_snapshot = N'Đào đất hố móng bằng máy đào 1.25m³ kết hợp sửa thủ công' WHERE code_snapshot = 'AB.11111';
UPDATE bmc.project_tasks SET name_snapshot = N'Bê tông lót móng đá 4x6 mác 100 chiều dày 10cm' WHERE code_snapshot = 'AF.11210';
UPDATE bmc.project_tasks SET name_snapshot = N'Gia công lắp dựng cốt thép móng D <= 18mm' WHERE code_snapshot = 'AF.61111';
UPDATE bmc.project_tasks SET name_snapshot = N'Lắp dựng ván khuôn móng và dầm giằng móng' WHERE code_snapshot = 'AF.81111';
UPDATE bmc.project_tasks SET name_snapshot = N'Đổ bê tông đài móng và dầm móng mác 250 thương phẩm' WHERE code_snapshot = 'AF.12310';

-- 9. CẬP NHẬT CHỦ ĐẦU TƯ (INVESTORS)
UPDATE bmc.investors SET name = N'Bộ Giao thông Vận tải' WHERE code = 'INV-BGTVT';
UPDATE bmc.investors SET name = N'Tập đoàn Nam Long Group' WHERE code = 'INV-NAMLONGGP';
UPDATE bmc.investors SET name = N'Sở Xây dựng Tỉnh Bình Dương' WHERE code = 'INV-SOXD-BD';
UPDATE bmc.investors SET name = N'Công ty CP Phát triển Đô thị Chánh Mỹ (Becamex / BMC)' WHERE code = 'CDT-CHANHMY';

-- 10. CẬP NHẬT KHO BÃI (WAREHOUSES)
UPDATE bmc.warehouses SET name = N'Kho Tổng Trung Tâm BMC - Bình Dương', address = N'Số 12 Đại lộ Bình Dương, TP. Thủ Dầu Một, Tỉnh Bình Dương' WHERE code = 'KHO-TONG-BD';
UPDATE bmc.warehouses SET name = N'Kho Bãi Công Trường M02B', address = N'KĐT Chánh Mỹ, Phường Chánh Mỹ, TP. Thủ Dầu Một' WHERE code = 'KHO-CT-M02B';
UPDATE bmc.warehouses SET name = N'Kho Bãi Công Trường QL15', address = N'Km15 Tuyến QL15, Tỉnh Nghệ An' WHERE code = 'KHO-CT-QL15';

PRINT N'SUCCESS_ALL_VIETNAMESE_ENCODINGS_FIXED';
GO
