import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Calendar,
  DollarSign,
  TrendingUp,
  Image,
  Truck,
  HardHat,
  Cpu,
  Clock,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  ChevronRight,
  Maximize2,
  History,
} from 'lucide-react';
import { projectApi } from '../../api';
import { TaskBreakdown } from '../../types';
import { formatCurrency, formatNumber, formatDate, formatPercent, getStatusBadgeClass, formatUnit, formatQuantityWithUnit } from '../../utils/formatters';
import { PriceHistoryModal } from '../catalogs/PriceHistoryModal';

interface TaskBreakdownDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: number | null;
}

export const TaskBreakdownDrawer: React.FC<TaskBreakdownDrawerProps> = ({
  isOpen,
  onClose,
  taskId,
}) => {
  const [activeTab, setActiveTab] = useState<'norms' | 'progress' | 'photos' | 'actual'>('norms');
  const [data, setData] = useState<TaskBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Price History Modal state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<{
    code: string;
    name: string;
    unit: string;
    type: 'MATERIAL' | 'LABOR' | 'MACHINE';
    currentPrice: number;
  } | null>(null);

  const openPriceHistory = (code: string, name: string, unit: string, type: 'MATERIAL' | 'LABOR' | 'MACHINE', currentPrice: number) => {
    setHistoryTarget({ code, name, unit, type, currentPrice });
    setHistoryModalOpen(true);
  };

  useEffect(() => {
    if (isOpen && taskId) {
      loadBreakdown(taskId);
    } else {
      setData(null);
    }
  }, [isOpen, taskId]);

  const loadBreakdown = async (id: number) => {
    setLoading(true);
    try {
      const res = await projectApi.getTaskBreakdown(id);
      setData(res);
    } catch (err) {
      console.error('Failed to load task breakdown:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(3px)',
        zIndex: 9998,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          height: '100%',
          backgroundColor: '#ffffff',
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  padding: '2px 8px',
                  backgroundColor: '#e0e7ff',
                  color: '#4338ca',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {data?.code || 'Đang tải...'}
              </span>
              <span className={`badge ${getStatusBadgeClass(data?.status || '')}`}>
                {data?.status || 'PLANNED'}
              </span>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Hạng mục: <strong style={{ color: '#1e293b' }}>{data?.projectItemName || '-'}</strong>
              </span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {data?.name || 'Chi Tiết Công Tác WBS'}
            </h2>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Dự án: {data?.projectName || '-'}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#e2e8f0',
              cursor: 'pointer',
              color: '#475569',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            padding: '0 24px',
          }}
        >
          {[
            { id: 'norms', label: '1. Định Mức & Kế Hoạch', icon: Layers },
            { id: 'progress', label: '2. Tiến Độ & Nhật Ký', icon: TrendingUp },
            { id: 'photos', label: `3. Ảnh Hiện Trường (${data?.photos?.length || 0})`, icon: Image },
            { id: 'actual', label: '4. Tiêu Hao Thực Tế', icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 18px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#2563eb' : '#64748b',
                  borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Đang tải dữ liệu chi tiết công tác...
            </div>
          ) : !data ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
              Không thể tải dữ liệu chi tiết công tác.
            </div>
          ) : (
            <>
              {/* TAB 1: NORMS & PLANNED BUDGET */}
              {activeTab === 'norms' && (
                <div>
                  {/* Summary Direct Cost Cards */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '14px',
                      marginBottom: '24px',
                    }}
                  >
                    <div
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontSize: '12px', fontWeight: 600 }}>
                        <Truck size={15} />
                        <span>Vật Tư (VL)</span>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#14532d', marginTop: '6px' }}>
                        {formatCurrency(data.plannedMaterialCost)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#15803d', marginTop: '2px' }}>
                        {data.materials.length} loại vật liệu
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e40af', fontSize: '12px', fontWeight: 600 }}>
                        <HardHat size={15} />
                        <span>Nhân Công (NC)</span>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e3a8a', marginTop: '6px' }}>
                        {formatCurrency(data.plannedLaborCost)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#2563eb', marginTop: '2px' }}>
                        {data.labors.length} cấp bậc thợ
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        backgroundColor: '#fefce8',
                        border: '1px solid #fef08a',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#854d0e', fontSize: '12px', fontWeight: 600 }}>
                        <Cpu size={15} />
                        <span>Máy Thi Công (M)</span>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#713f12', marginTop: '6px' }}>
                        {formatCurrency(data.plannedMachineCost)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#a16207', marginTop: '2px' }}>
                        {data.machines.length} loại ca máy
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        backgroundColor: '#f8fafc',
                        border: '2px solid #cbd5e1',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontSize: '12px', fontWeight: 700 }}>
                        <DollarSign size={15} />
                        <span>Tổng Chi Phí Trực Tiếp</span>
                      </div>
                      <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                        {formatCurrency(data.totalPlannedCost)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        Khối lượng: {formatQuantityWithUnit(data.plannedQuantity, data.unitName).fullText}
                      </div>
                    </div>
                  </div>

                  {/* 1. Vật Tư Table */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Truck size={16} color="#16a34a" />
                      <span>Danh mục Hao phí Vật liệu (Vật tư cần cung ứng)</span>
                    </h3>
                    {data.materials.length === 0 ? (
                      <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#94a3b8', fontSize: '13px' }}>
                        Chưa có dữ liệu hao phí vật tư hoặc công tác này không tiêu hao vật liệu.
                      </div>
                    ) : (
                      <div className="table-container">
                        <table className="table" style={{ width: '100%', fontSize: '13px' }}>
                          <thead>
                            <tr>
                              <th>Mã VT</th>
                              <th>Tên Vật Tư / Vật Liệu</th>
                              <th>ĐVT</th>
                              <th style={{ textAlign: 'right' }}>Định mức / ĐV</th>
                              <th style={{ textAlign: 'right' }}>Tổng KL cần</th>
                              <th style={{ textAlign: 'right' }}>Đơn giá dự toán</th>
                              <th style={{ textAlign: 'right' }}>Thành tiền</th>
                              <th style={{ textAlign: 'center', width: '100px' }}>Lịch Sử Giá</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.materials.map((m, idx) => (
                              <tr key={idx}>
                                <td><code style={{ fontSize: '12px' }}>{m.code}</code></td>
                                <td style={{ fontWeight: 600 }}>{m.name}</td>
                                <td>{formatUnit(m.unit)}</td>
                                <td style={{ textAlign: 'right' }}>{formatNumber(m.normRate, 4)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600, color: '#2563eb' }}>
                                  {formatNumber(m.totalQuantity, 2)} {formatUnit(m.unit)}
                                </td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(m.unitPrice)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: '#15803d' }}>
                                  {formatCurrency(m.totalAmount)}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => openPriceHistory(m.code, m.name, m.unit, 'MATERIAL', m.unitPrice)}
                                    title="Xem lịch sử biến động đơn giá qua các tháng"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', padding: '3px 8px' }}
                                  >
                                    <History size={12} color="var(--orange-primary)" /> Lịch Sử
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* 2. Nhân Công Table */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <HardHat size={16} color="#2563eb" />
                      <span>Hao phí Nhân công xây dựng</span>
                    </h3>
                    {data.labors.length === 0 ? (
                      <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#94a3b8', fontSize: '13px' }}>
                        Chưa có dữ liệu hao phí nhân công.
                      </div>
                    ) : (
                      <div className="table-container">
                        <table className="table" style={{ width: '100%', fontSize: '13px' }}>
                          <thead>
                            <tr>
                              <th>Mã NC</th>
                              <th>Cấp bậc nhân công</th>
                              <th>ĐVT</th>
                              <th style={{ textAlign: 'right' }}>Định mức / ĐV</th>
                              <th style={{ textAlign: 'right' }}>Tổng số công</th>
                              <th style={{ textAlign: 'right' }}>Lương ngày công</th>
                              <th style={{ textAlign: 'right' }}>Thành tiền</th>
                              <th style={{ textAlign: 'center', width: '100px' }}>Lịch Sử Giá</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.labors.map((l, idx) => (
                              <tr key={idx}>
                                <td><code style={{ fontSize: '12px' }}>{l.code}</code></td>
                                <td style={{ fontWeight: 600 }}>{l.name}</td>
                                <td>{formatUnit(l.unit || 'công')}</td>
                                <td style={{ textAlign: 'right' }}>{formatNumber(l.normRate, 4)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600, color: '#2563eb' }}>
                                  {formatNumber(l.totalQuantity, 2)} công
                                </td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(l.unitPrice)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: '#15803d' }}>
                                  {formatCurrency(l.totalAmount)}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => openPriceHistory(l.code, l.name, l.unit, 'LABOR', l.unitPrice)}
                                    title="Xem lịch sử biến động lương ngày công"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', padding: '3px 8px' }}
                                  >
                                    <History size={12} color="var(--orange-primary)" /> Lịch Sử
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* 3. Máy Thi Công Table */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Cpu size={16} color="#eab308" />
                      <span>Hao phí Ca máy & Thiết bị thi công</span>
                    </h3>
                    {data.machines.length === 0 ? (
                      <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#94a3b8', fontSize: '13px' }}>
                        Công tác này không sử dụng ca máy hoặc chưa cấu hình máy.
                      </div>
                    ) : (
                      <div className="table-container">
                        <table className="table" style={{ width: '100%', fontSize: '13px' }}>
                          <thead>
                            <tr>
                              <th>Mã Máy</th>
                              <th>Tên Loại máy & Thiết bị</th>
                              <th>ĐVT</th>
                              <th style={{ textAlign: 'right' }}>Định mức / ĐV</th>
                              <th style={{ textAlign: 'right' }}>Tổng số ca</th>
                              <th style={{ textAlign: 'right' }}>Đơn giá ca máy</th>
                              <th style={{ textAlign: 'right' }}>Thành tiền</th>
                              <th style={{ textAlign: 'center', width: '100px' }}>Lịch Sử Giá</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.machines.map((mc, idx) => (
                              <tr key={idx}>
                                <td><code style={{ fontSize: '12px' }}>{mc.code}</code></td>
                                <td style={{ fontWeight: 600 }}>{mc.name}</td>
                                <td>{formatUnit(mc.unit || 'ca')}</td>
                                <td style={{ textAlign: 'right' }}>{formatNumber(mc.normRate, 4)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600, color: '#2563eb' }}>
                                  {formatNumber(mc.totalQuantity, 2)} ca
                                </td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(mc.unitPrice)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: '#15803d' }}>
                                  {formatCurrency(mc.totalAmount)}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => openPriceHistory(mc.code, mc.name, mc.unit, 'MACHINE', mc.unitPrice)}
                                    title="Xem lịch sử biến động giá ca máy"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', padding: '3px 8px' }}
                                  >
                                    <History size={12} color="var(--orange-primary)" /> Lịch Sử
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: PROGRESS & LOGS */}
              {activeTab === 'progress' && (
                <div>
                  {/* Progress Stats Card */}
                  <div
                    style={{
                      padding: '20px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      marginBottom: '24px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>Khối lượng hoàn thành:</span>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                          {formatNumber(data.completedQuantity)} / {formatQuantityWithUnit(data.plannedQuantity, data.unitName).fullText}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>Tiến độ thực tế:</span>
                        <div style={{ fontSize: '24px', fontWeight: 900, color: '#2563eb' }}>
                          {formatPercent(data.progressPercent)}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '12px', backgroundColor: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, data.progressPercent || 0)}%`,
                          height: '100%',
                          backgroundColor: data.progressPercent >= 100 ? '#10b981' : '#3b82f6',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '12px', color: '#64748b' }}>
                      <div>Kế hoạch: {formatDate(data.plannedStart)} → {formatDate(data.plannedEnd)}</div>
                      <div>Thực tế: {formatDate(data.actualStart)} → {formatDate(data.actualEnd) || 'Đang thi công'}</div>
                    </div>
                  </div>

                  {/* Logs Timeline */}
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
                    Lịch sử cập nhật khối lượng & Nhật ký hiện trường
                  </h3>
                  {data.progressLogs.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#94a3b8' }}>
                      Chưa có nhật ký ghi nhận tiến độ cho công tác này.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {data.progressLogs.map((log) => (
                        <div
                          key={log.logId}
                          style={{
                            padding: '16px',
                            backgroundColor: '#ffffff',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Calendar size={16} color="#2563eb" />
                              <strong style={{ fontSize: '14px', color: '#0f172a' }}>{formatDate(log.progressDate)}</strong>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>({log.createdByName || 'Kỹ sư BMC'})</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '13px', color: '#059669', fontWeight: 600 }}>
                                +{formatNumber(log.completedQuantity)} {formatUnit(data.unitName)}
                              </span>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  backgroundColor: '#dbeafe',
                                  color: '#1d4ed8',
                                }}
                              >
                                Lũy kế: {formatPercent(log.progressPercent)}
                              </span>
                            </div>
                          </div>

                          {log.note && (
                            <div style={{ fontSize: '13px', color: '#334155', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '6px' }}>
                              {log.note}
                            </div>
                          )}

                          {log.photoUrls && log.photoUrls.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                              {log.photoUrls.map((url, pIdx) => (
                                <img
                                  key={pIdx}
                                  src={url}
                                  alt="Hiện trường"
                                  onClick={() => setSelectedPhoto(url)}
                                  style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '6px',
                                    objectFit: 'cover',
                                    cursor: 'pointer',
                                    border: '1px solid #cbd5e1',
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PHOTOS GALLERY */}
              {activeTab === 'photos' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      📸 Thư Viện Hình Ảnh Hiện Trường Thi Công
                    </h3>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      Tổng số: {data.photos.length} hình ảnh
                    </span>
                  </div>

                  {data.photos.length === 0 ? (
                    <div style={{ padding: '48px 24px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
                      <Image size={40} color="#94a3b8" style={{ marginBottom: '10px' }} />
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                        Chưa có hình ảnh thi công nào được tải lên
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        Khi kỹ sư cập nhật tiến độ thi công tại Hiện trường, hãy đính kèm ảnh chụp thực tế.
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '16px',
                      }}
                    >
                      {data.photos.map((photo, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => setSelectedPhoto(photo.url)}
                          style={{
                            borderRadius: '10px',
                            overflow: 'hidden',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(0,0,0,0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{ height: '140px', width: '100%', position: 'relative' }}>
                            <img
                              src={photo.url}
                              alt="Ảnh thi công"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                color: '#ffffff',
                                borderRadius: '4px',
                                padding: '4px',
                              }}
                            >
                              <Maximize2 size={12} />
                            </div>
                          </div>
                          <div style={{ padding: '10px' }}>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              Ngày: {formatDate(photo.date)}
                            </div>
                            <div
                              style={{
                                fontSize: '12px',
                                color: '#1e293b',
                                fontWeight: 500,
                                marginTop: '4px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {photo.note || 'Ảnh nghiệm thu công tác'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: ACTUAL COSTS INCURRED */}
              {activeTab === 'actual' && (
                <div>
                  {/* Variance Card */}
                  <div
                    style={{
                      padding: '20px',
                      borderRadius: '12px',
                      backgroundColor: data.costVariance > 0 ? '#fef2f2' : '#f0fdf4',
                      border: `1px solid ${data.costVariance > 0 ? '#fecaca' : '#bbf7d0'}`,
                      marginBottom: '24px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        So sánh Chi phí Dự toán Kế hoạch vs Chi phí Thực tế Tiêu hao:
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '6px' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>Ngân sách Kế hoạch:</span>
                          <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                            {formatCurrency(data.totalPlannedCost)}
                          </div>
                        </div>
                        <ChevronRight size={20} color="#94a3b8" />
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>Đã tiêu hao Thực tế:</span>
                          <div style={{ fontSize: '17px', fontWeight: 700, color: '#2563eb' }}>
                            {formatCurrency(data.totalActualCost)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Chênh lệch (Variance):</span>
                      <div
                        style={{
                          fontSize: '20px',
                          fontWeight: 800,
                          color: data.costVariance > 0 ? '#dc2626' : '#16a34a',
                        }}
                      >
                        {data.costVariance > 0 ? '+' : ''}{formatCurrency(data.costVariance)}
                      </div>
                      <div style={{ fontSize: '11px', color: data.costVariance > 0 ? '#b91c1c' : '#15803d' }}>
                        {data.costVariance > 0 ? 'Vượt định mức kế hoạch' : 'Trong tầm kiểm soát'}
                      </div>
                    </div>
                  </div>

                  {/* 1. Actual Materials from Warehouse */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <PackageCheck size={16} color="#16a34a" />
                      <span>Vật tư đã xuất kho cho công tác này ({data.actualMaterials.length} phiếu)</span>
                    </h3>
                    {data.actualMaterials.length === 0 ? (
                      <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#94a3b8', fontSize: '13px' }}>
                        Chưa có phiếu xuất kho nào được gán trực tiếp vào công tác này.
                      </div>
                    ) : (
                      <div className="table-container">
                        <table className="table" style={{ width: '100%', fontSize: '13px' }}>
                          <thead>
                            <tr>
                              <th>Ngày xuất</th>
                              <th>Số phiếu xuất</th>
                              <th>Tên vật tư</th>
                              <th>ĐVT</th>
                              <th style={{ textAlign: 'right' }}>Khối lượng</th>
                              <th style={{ textAlign: 'right' }}>Đơn giá kho</th>
                              <th style={{ textAlign: 'right' }}>Thành tiền</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.actualMaterials.map((mat, idx) => (
                              <tr key={idx}>
                                <td>{formatDate(mat.transactionDate)}</td>
                                <td><code style={{ fontSize: '12px' }}>{mat.transactionNo}</code></td>
                                <td style={{ fontWeight: 600 }}>{mat.materialName}</td>
                                <td>{formatUnit(mat.unit)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatNumber(mat.quantity)} {formatUnit(mat.unit)}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(mat.unitPrice)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: '#15803d' }}>
                                  {formatCurrency(mat.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* 2. Actual Machine Shifts */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Cpu size={16} color="#eab308" />
                      <span>Nhật trình ca máy hoạt động tại công tác ({data.actualMachines.length} ca)</span>
                    </h3>
                    {data.actualMachines.length === 0 ? (
                      <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#94a3b8', fontSize: '13px' }}>
                        Chưa ghi nhận ca máy chạy cho công tác này.
                      </div>
                    ) : (
                      <div className="table-container">
                        <table className="table" style={{ width: '100%', fontSize: '13px' }}>
                          <thead>
                            <tr>
                              <th>Ngày</th>
                              <th>Tên máy & Thiết bị</th>
                              <th>Người vận hành</th>
                              <th style={{ textAlign: 'right' }}>Số ca</th>
                              <th style={{ textAlign: 'right' }}>Số giờ</th>
                              <th>Ghi chú</th>
                              <th style={{ textAlign: 'right' }}>Tổng chi phí</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.actualMachines.map((mac, idx) => (
                              <tr key={idx}>
                                <td>{formatDate(mac.logDate)}</td>
                                <td style={{ fontWeight: 600 }}>{mac.machineName}</td>
                                <td>{mac.operatorName || '-'}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatNumber(mac.shiftCount)} ca</td>
                                <td style={{ textAlign: 'right' }}>{formatNumber(mac.hoursWorked)} h</td>
                                <td style={{ fontSize: '12px', color: '#64748b' }}>{mac.notes || '-'}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: '#854d0e' }}>
                                  {formatCurrency(mac.totalCost)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* 3. Actual Labor Summary */}
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <HardHat size={16} color="#2563eb" />
                      <span>Chi phí Nhân công đã chi trả thực tế</span>
                    </h3>
                    <div
                      style={{
                        padding: '16px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>Tổng chi phí nhân công tổ đội đã xác nhận:</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e40af', marginTop: '4px' }}>
                          {formatCurrency(data.actualLaborCost)}
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Dự toán kế hoạch: <strong>{formatCurrency(data.plannedLaborCost)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '8px 20px' }}
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Lightbox for Selected Photo */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <img
            src={selectedPhoto}
            alt="Hiện trường phóng to"
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              borderRadius: '8px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
          />
        </div>
      )}

      {/* Price History Modal */}
      {historyTarget && (
        <PriceHistoryModal
          isOpen={historyModalOpen}
          onClose={() => {
            setHistoryModalOpen(false);
            setHistoryTarget(null);
          }}
          itemCode={historyTarget.code}
          itemName={historyTarget.name}
          unit={historyTarget.unit}
          itemType={historyTarget.type}
          projectName={data?.projectName || 'Công trình BMC'}
          taskName={data?.name || 'Công tác thi công'}
          currentPrice={historyTarget.currentPrice}
        />
      )}
    </div>
  );
};
