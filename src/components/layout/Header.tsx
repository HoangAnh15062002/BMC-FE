import React, { useEffect, useState } from 'react';
import { costControlApi } from '../../api';
import { Bell, Search, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const [alertCount, setAlertCount] = useState<number>(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    costControlApi.getAlerts(undefined, false)
      .then((alerts) => setAlertCount(alerts.length))
      .catch(() => setAlertCount(0));
  }, []);

  // Build breadcrumb from path
  const pathParts = location.pathname.split('/').filter(Boolean);

  return (
    <header className="top-header">
      <div className="header-left">
        {/* Page title with optional breadcrumb arrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {pathParts.length > 1 && (
            <ChevronRight size={14} style={{ color: 'var(--text-dim)' }} />
          )}
          <h1 className="page-title-badge">{title}</h1>
        </div>
      </div>

      <div className="header-right">
        {/* Search */}
        <div className="search-input-wrapper">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm công trình, vật tư..."
          />
        </div>

        {/* Bell */}
        <button
          className="btn-icon"
          style={{ position: 'relative' }}
          onClick={() => navigate('/cost-control')}
          title="Xem cảnh báo chi phí & kho"
        >
          <Bell size={18} />
          {alertCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              background: 'var(--red-500)',
              color: 'white',
              borderRadius: '50%',
              fontSize: '0.58rem',
              fontWeight: 800,
              width: '14px',
              height: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 6px rgba(239,68,68,0.5)',
            }}>
              {alertCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
