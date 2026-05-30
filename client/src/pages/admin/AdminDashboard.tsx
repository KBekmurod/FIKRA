import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { FiTrendingUp, FiActivity, FiUsers, FiDollarSign } from 'react-icons/fi';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getStats(),
      adminApi.getRevenue()
    ]).then(([st, rev]) => {
      setStats(st);
      setRevenue(rev);
      setLoading(false);
    }).catch(err => {
      alert(err.message);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="empty"><div className="spin" /></div>;

  return (
    <div style={{ padding: '20px' }} className="fade-in-up">
      <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>Moliyaviy Holat</h2>
      
      {/* Moliyaviy Kartalar */}
      <div className="grid-responsive" style={{ marginBottom: '24px' }}>
        <div className="card glass tilt-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--g)' }}>
            <FiTrendingUp /> <span style={{ fontSize: '12px', fontWeight: 700 }}>Tushumlar (P2P)</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800 }}>{revenue?.revenue?.p2p?.toLocaleString()} UZS</div>
          <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>Tasdiqlangan obunalardan</div>
        </div>

        <div className="card glass tilt-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--r)' }}>
            <FiActivity /> <span style={{ fontSize: '12px', fontWeight: 700 }}>AI API Xarajatlar (Taxminiy)</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800 }}>{revenue?.costs?.apiUZS?.toLocaleString()} UZS</div>
          <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>{revenue?.aiRequests?.toLocaleString()} so'rov / ${revenue?.costs?.apiUSD}</div>
        </div>

        <div className="card glass tilt-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderColor: revenue?.profit?.uzs > 0 ? 'var(--g)' : 'var(--f)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: revenue?.profit?.uzs > 0 ? 'var(--g)' : 'var(--y)' }}>
            <FiDollarSign /> <span style={{ fontSize: '12px', fontWeight: 700 }}>Sof Foyda</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800 }}>{revenue?.profit?.uzs?.toLocaleString()} UZS</div>
        </div>
      </div>

      <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px' }}>Tizim Statistikasi</h2>
      <div className="grid-responsive">
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--txt-2)' }}>Jami Foydalanuvchilar</div>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>{stats?.users?.total}</div>
          </div>
          <div style={{ background: 'rgba(123,104,238,0.1)', padding: '12px', borderRadius: '50%', color: 'var(--acc)' }}>
            <FiUsers size={24} />
          </div>
        </div>

        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--txt-2)' }}>Bugun Qoshilganlar</div>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>+{stats?.users?.today}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--txt-2)' }}>Faol Obunalar</div>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>{stats?.subscriptions?.total}</div>
            <div style={{ fontSize: '11px', color: 'var(--txt-3)', marginTop: 4 }}>
              Basic: {stats?.subscriptions?.basic} | Pro: {stats?.subscriptions?.pro} | VIP: {stats?.subscriptions?.vip}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
