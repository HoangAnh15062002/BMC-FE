import React, { useEffect, useState } from 'react';
import { catalogsApi } from '../api';
import { formatCurrency } from '../utils/formatters';
import { BookOpen, DollarSign, Users, Wrench, MapPin } from 'lucide-react';

export const CatalogsPage: React.FC = () => {
  const [tab, setTab] = useState<'norms' | 'materials' | 'labors' | 'machines' | 'regions'>('norms');

  const [norms, setNorms] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [labors, setLabors] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [nList, mList, lList, macList, rList] = await Promise.all([
          catalogsApi.getNormTasks().catch(() => []),
          catalogsApi.getMaterialPrices().catch(() => []),
          catalogsApi.getLaborPrices().catch(() => []),
          catalogsApi.getMachinePrices().catch(() => []),
          catalogsApi.getRegions().catch(() => []),
        ]);
        setNorms(nList);
        setMaterials(mList);
        setLabors(lList);
        setMachines(macList);
        setRegions(rList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  return (
    <div>
      <div className="tabs-bar">
        <button
          className={`tab-btn ${tab === 'norms' ? 'active' : ''}`}
          onClick={() => setTab('norms')}
        >
          <BookOpen size={16} /> Định Mức Bộ Xây Dựng ({norms.length})
        </button>
        <button
          className={`tab-btn ${tab === 'materials' ? 'active' : ''}`}
          onClick={() => setTab('materials')}
        >
          <DollarSign size={16} /> Giá Vật Liệu Liên Sở ({materials.length})
        </button>
        <button
          className={`tab-btn ${tab === 'labors' ? 'active' : ''}`}
          onClick={() => setTab('labors')}
        >
          <Users size={16} /> Giá Nhân Công ({labors.length})
        </button>
        <button
          className={`tab-btn ${tab === 'machines' ? 'active' : ''}`}
          onClick={() => setTab('machines')}
        >
          <Wrench size={16} /> Giá Ca Máy Thi Công ({machines.length})
        </button>
        <button
          className={`tab-btn ${tab === 'regions' ? 'active' : ''}`}
          onClick={() => setTab('regions')}
        >
          <MapPin size={16} /> Vùng & Địa Bàn ({regions.length})
        </button>
      </div>

      {tab === 'norms' && (
        <div className="table-container">
          <table className="bmc-table">
            <thead>
              <tr>
                <th>Mã Hiệu Công Tác</th>
                <th>Tên Công Tác Xây Dựng</th>
                <th>Đơn Vị Tính</th>
                <th>Bộ Định Mức Ban Hành</th>
              </tr>
            </thead>
            <tbody>
              {norms.map((n) => (
                <tr key={n.id}>
                  <td style={{ fontWeight: 700, color: 'var(--orange-primary)' }}>{n.code}</td>
                  <td style={{ fontWeight: 600 }}>{n.name}</td>
                  <td>{n.unitName || n.unit?.symbol || '-'}</td>
                  <td>{n.normCatalogName || 'Thông tư 12/2021/TT-BXD'}</td>
                </tr>
              ))}
              {norms.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    Chưa có dữ liệu công tác định mức.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'materials' && (
        <div className="table-container">
          <table className="bmc-table">
            <thead>
              <tr>
                <th>Mã Vật Liệu</th>
                <th>Tên Vật Tư / Quy Cách</th>
                <th>Đơn Vị</th>
                <th>Kỳ Công Bố</th>
                <th>Đơn Giá Công Bố</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 700, color: 'var(--blue-tech)' }}>{m.materialCode || m.code}</td>
                  <td style={{ fontWeight: 600 }}>{m.materialName || m.name}</td>
                  <td>{m.unitName || m.unitSymbol || '-'}</td>
                  <td>{m.pricePeriodName || 'Tháng 03/2026'}</td>
                  <td style={{ fontWeight: 700, color: 'var(--orange-primary)' }}>
                    {formatCurrency(m.price || m.unitPrice)}
                  </td>
                </tr>
              ))}
              {materials.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    Chưa có bảng giá vật liệu công bố.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'labors' && (
        <div className="table-container">
          <table className="bmc-table">
            <thead>
              <tr>
                <th>Mã Nhân Công</th>
                <th>Nhóm / Cấp Bậc Thợ</th>
                <th>Kỳ Công Bố</th>
                <th>Đơn Giá Ngày Công (8h)</th>
              </tr>
            </thead>
            <tbody>
              {labors.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 700, color: 'var(--blue-tech)' }}>{l.laborCode || l.code}</td>
                  <td style={{ fontWeight: 600 }}>{l.laborName || l.name || 'Thợ bậc 3.5/7 Nhóm 1'}</td>
                  <td>{l.pricePeriodName || 'Quy chuẩn 2026'}</td>
                  <td style={{ fontWeight: 700, color: 'var(--emerald-success)' }}>
                    {formatCurrency(l.price || l.dailyRate)}
                  </td>
                </tr>
              ))}
              {labors.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    Chưa có đơn giá nhân công công bố.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'machines' && (
        <div className="table-container">
          <table className="bmc-table">
            <thead>
              <tr>
                <th>Mã Ca Máy</th>
                <th>Loại Máy / Thiết Bị Thi Công</th>
                <th>Công Suất / Thông Số</th>
                <th>Đơn Giá Ca Máy</th>
              </tr>
            </thead>
            <tbody>
              {machines.map((mac) => (
                <tr key={mac.id}>
                  <td style={{ fontWeight: 700, color: 'var(--blue-tech)' }}>{mac.machineCode || mac.code}</td>
                  <td style={{ fontWeight: 600 }}>{mac.machineName || mac.name}</td>
                  <td>{mac.specification || 'Theo Thông tư BXD'}</td>
                  <td style={{ fontWeight: 700, color: 'var(--orange-primary)' }}>
                    {formatCurrency(mac.price || mac.shiftPrice)}
                  </td>
                </tr>
              ))}
              {machines.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    Chưa có đơn giá ca máy công bố.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'regions' && (
        <div className="table-container">
          <table className="bmc-table">
            <thead>
              <tr>
                <th>Mã Vùng</th>
                <th>Tên Vùng / Tỉnh Thành</th>
                <th>Khu Vực Lương (Nghị Định)</th>
                <th>Mô Tả Địa Bàn</th>
              </tr>
            </thead>
            <tbody>
              {regions.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700 }}>{r.code}</td>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td><span className="badge badge-info">{r.salaryRegion || 'Vùng I'}</span></td>
                  <td>{r.description || 'Áp dụng mức lương tối thiểu vùng I'}</td>
                </tr>
              ))}
              {regions.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    Chưa có danh mục vùng lương.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
