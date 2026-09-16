import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  Calculator,
  ShoppingCart,
  Warehouse,
  HardHat,
  GitPullRequestDraft,
  BarChart3,
  Building2,
  BookOpen,
  LogOut,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Bảng điều hành', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Quản lý Dự án', path: '/projects', icon: FolderKanban },
    { label: 'Dự toán Công trình', path: '/estimates', icon: Calculator },
    { label: 'Mua sắm & Vật tư', path: '/procurement', icon: ShoppingCart },
    { label: 'Kho & Quản lý Tồn', path: '/warehouses', icon: Warehouse },
    { label: 'Hiện trường & Chi phí', path: '/site-execution', icon: HardHat },
    { label: 'Hồ sơ Phát sinh', path: '/variations', icon: GitPullRequestDraft },
    { label: 'Kiểm soát Chi phí', path: '/cost-control', icon: BarChart3 },
    { label: 'Hợp đồng & Đối tác', path: '/admin', icon: Building2 },
    { label: 'Định mức & Đơn giá', path: '/catalogs', icon: BookOpen },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-logo-badge">BMC</div>
        <div>
          <div className="brand-title">BMC Construction</div>
          <div className="brand-sub">Enterprise ERP</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Hệ thống Nghiệp vụ</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-snippet">
          <div className="user-avatar">
            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.fullName || user?.username}</div>
            <div className="user-role-badge">{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="btn-icon"
            title="Đăng xuất"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
