import React from 'react';
import { Investor, Project, Contract } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { X, Building2, Phone, Mail, MapPin, Hash, User, Briefcase, FileText } from 'lucide-react';

interface InvestorDetailModalProps {
  investor: Investor;
  projects: Project[];
  contracts: Contract[];
  onClose: () => void;
  onOpenContract?: (contract: Contract) => void;
}

export const InvestorDetailModal: React.FC<InvestorDetailModalProps> = ({
  investor,
  projects,
  contracts,
  onClose,
  onOpenContract,
}) => {
  // Find linked projects and contracts
  const linkedProjects = projects.filter(
    (p) => p.investorId === investor.id || p.investorName?.toLowerCase().includes(investor.name.toLowerCase())
  );
  const linkedProjectIds = new Set(linkedProjects.map((p) => p.id));
  const linkedContracts = contracts.filter((c) => linkedProjectIds.has(c.projectId));
  const totalContractValue = linkedContracts.reduce(
    (sum, c) => sum + (c.totalAdjustedValue || c.contractValue || 0),
    0
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: '800px',
          maxWidth: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          borderRadius: '16px',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(249, 115, 22, 0.08) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'rgba(234, 88, 12, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--orange-primary)',
              }}
            >
              <Building2 size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: 'var(--orange-primary)',
                    backgroundColor: 'rgba(234, 88, 12, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {investor.code}
                </span>
                <span className={`badge ${investor.isActive ? 'badge-active' : 'badge-danger'}`}>
                  {investor.isActive ? 'Đang hợp tác' : 'Tạm dừng'}
                </span>
              </div>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {investor.name}
              </h2>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-card-subtle, #f8fafc)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>
                <Hash size={14} /> Mã số thuế
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{investor.taxCode || 'Chưa cập nhật'}</div>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-card-subtle, #f8fafc)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>
                <User size={14} /> Người đại diện pháp luật
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{investor.representative || 'Chưa cập nhật'}</div>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-card-subtle, #f8fafc)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>
                <Phone size={14} /> Số điện thoại liên hệ
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{investor.phone || 'Chưa cập nhật'}</div>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-card-subtle, #f8fafc)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>
                <Mail size={14} /> Hòm thư điện tử
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{investor.email || 'Chưa cập nhật'}</div>
            </div>
          </div>

          {/* Address */}
          {investor.address && (
            <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: 'var(--bg-card-subtle, #f8fafc)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MapPin size={18} style={{ color: 'var(--orange-primary)', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Địa chỉ trụ sở chính</span>
                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{investor.address}</span>
              </div>
            </div>
          )}

          {/* Financial summary with BMC */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(234, 88, 12, 0.05)',
              border: '1px dashed rgba(234, 88, 12, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>
                Tổng quy mô hợp đồng thi công ký với BMC
              </span>
              <strong style={{ fontSize: '1.4rem', color: 'var(--orange-primary)' }}>
                {formatCurrency(totalContractValue)}
              </strong>
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Dự án tham gia</span>
                <strong style={{ fontSize: '1.1rem' }}>{linkedProjects.length} công trình</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Hợp đồng đã ký</span>
                <strong style={{ fontSize: '1.1rem' }}>{linkedContracts.length} hợp đồng</strong>
              </div>
            </div>
          </div>

          {/* Linked Projects */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Briefcase size={16} style={{ color: 'var(--blue-tech)' }} />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
                Công Trình / Dự Án Trực Thuộc Chủ Đầu Tư ({linkedProjects.length})
              </h4>
            </div>
            {linkedProjects.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card-subtle, #f8fafc)', borderRadius: '8px' }}>
                Chưa có dự án nào được gán cho Chủ Đầu Tư này.
              </div>
            ) : (
              <div className="table-container" style={{ margin: 0 }}>
                <table className="bmc-table">
                  <thead>
                    <tr>
                      <th>Mã Dự Án</th>
                      <th>Tên Công Trình</th>
                      <th>Địa Điểm</th>
                      <th>Tiến Độ</th>
                      <th>Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedProjects.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700, color: 'var(--blue-tech)' }}>{p.code}</td>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td style={{ fontSize: '0.85rem' }}>{p.location || '-'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(p.progressPercent || 0, 100)}%`, height: '100%', backgroundColor: 'var(--emerald-success)' }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{Number(p.progressPercent || 0).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${p.status === 'IN_PROGRESS' ? 'badge-active' : 'badge-neutral'}`}>
                            {p.status === 'IN_PROGRESS' ? 'Đang thi công' : p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Linked Contracts */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <FileText size={16} style={{ color: 'var(--orange-primary)' }} />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
                Hợp Đồng & Phụ Lục Ký Kết ({linkedContracts.length})
              </h4>
            </div>
            {linkedContracts.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card-subtle, #f8fafc)', borderRadius: '8px' }}>
                Chưa có hợp đồng nào được lập.
              </div>
            ) : (
              <div className="table-container" style={{ margin: 0 }}>
                <table className="bmc-table">
                  <thead>
                    <tr>
                      <th>Số HĐ</th>
                      <th>Tên Hợp Đồng</th>
                      <th>Ngày Ký</th>
                      <th>Giá Trị Ban Đầu</th>
                      <th>Sau Điều Chỉnh</th>
                      <th>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedContracts.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 700, color: 'var(--blue-tech)' }}>{c.contractNo}</td>
                        <td style={{ fontWeight: 600 }}>{c.contractName}</td>
                        <td>{formatDate(c.signedDate)}</td>
                        <td>{formatCurrency(c.contractValue)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--orange-primary)' }}>
                          {formatCurrency(c.totalAdjustedValue || c.contractValue)}
                        </td>
                        <td>
                          {onOpenContract && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                onClose();
                                onOpenContract(c);
                              }}
                            >
                              Xem Hợp Đồng
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'var(--bg-card-subtle, #f8fafc)' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
