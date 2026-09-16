import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout: React.FC = () => {
  const location = useLocation();

  const getPageTitle = (pathname: string): string => {
    if (pathname.startsWith('/dashboard')) return 'Bảng Điều Hành Tổng Thể';
    if (pathname.startsWith('/projects')) return 'Quản Lý Dự Án & Công Trình';
    if (pathname.startsWith('/estimates')) return 'Dự Toán Kỹ Thuật & Phân Tích Đơn Giá';
    if (pathname.startsWith('/procurement')) return 'Mua Sắm & Đơn Đặt Hàng Vật Tư';
    if (pathname.startsWith('/warehouses')) return 'Quản Lý Kho Bãi & Tồn Kho Tức Thời';
    if (pathname.startsWith('/site-execution')) return 'Tiến Độ Nghiệm Thu & Chi Phí Hiện Trường';
    if (pathname.startsWith('/variations')) return 'Quản Lý Hồ Sơ Phát Sinh Công Trình';
    if (pathname.startsWith('/cost-control')) return 'Kiểm Soát Chi Phí & Cảnh Báo Rủi Ro';
    if (pathname.startsWith('/admin')) return 'Chủ Đầu Tư, Hợp Đồng & Ban Chỉ Huy';
    if (pathname.startsWith('/catalogs')) return 'Định Mức Xây Dựng & Giá Thông Báo Liên Sở';
    return 'BMC Construction ERP';
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Header title={getPageTitle(location.pathname)} />
        <main className="content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

