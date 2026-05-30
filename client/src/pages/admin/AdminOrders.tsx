import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'pending' | 'confirmed' | 'rejected'>('pending');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getOrders(1, 50, tab);
      setOrders(data.orders);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [tab]);

  const handleConfirm = async (orderId: string) => {
    if (!confirm('Haqiqatdan ham pul tushganini tasdiqlaysizmi? (Foydalanuvchiga obuna beriladi)')) return;
    try {
      await adminApi.confirmOrder(orderId);
      alert('Tasdiqlandi!');
      fetchOrders();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (orderId: string) => {
    const reason = prompt('Bekor qilish sababini kiriting: (Masalan: Pul tushmadi)');
    if (reason === null) return;
    try {
      await adminApi.rejectOrder(orderId, reason);
      alert('Bekor qilindi!');
      fetchOrders();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '20px' }} className="fade-in-up">
      <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>To'lovlar</h2>

      <div className="seg-tabs">
        <button className={`seg-tab ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>
          Kutayotgan
        </button>
        <button className={`seg-tab ${tab === 'confirmed' ? 'active' : ''}`} onClick={() => setTab('confirmed')}>
          Tasdiqlangan
        </button>
        <button className={`seg-tab ${tab === 'rejected' ? 'active' : ''}`} onClick={() => setTab('rejected')}>
          Rad etilgan
        </button>
      </div>

      {loading ? <div className="empty"><div className="spin" /></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {orders.map(o => (
            <div key={o._id} className="card glass" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800 }}>{o.priceUZS?.toLocaleString() || 0} UZS</div>
                  <div style={{ fontSize: '12px', color: 'var(--acc-l)', fontWeight: 700 }}>
                    Kvitansiya: {o.receiptNumber || o.orderId}
                  </div>
                </div>
                {o.status === 'pending' && <span className="badge badge-yellow"><FiClock/> Kutmoqda</span>}
                {o.status === 'confirmed' && <span className="badge badge-green"><FiCheckCircle/> Tasdiqlangan</span>}
                {o.status === 'rejected' && <span className="badge badge-red"><FiXCircle/> Rad etilgan</span>}
              </div>

              <div style={{ fontSize: '12px', color: 'var(--txt-2)' }}>
                <strong>ID:</strong> {o.userId} <br/>
                <strong>Tarif:</strong> {o.planId?.toUpperCase()} <br/>
                <strong>Sana:</strong> {new Date(o.createdAt).toLocaleString()}
              </div>

              {o.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button onClick={() => handleConfirm(o.orderId)} className="btn btn-success btn-sm" style={{ flex: 1 }}>
                    <FiCheckCircle /> Tasdiqlash
                  </button>
                  <button onClick={() => handleReject(o.orderId)} className="btn btn-danger btn-sm" style={{ flex: 1 }}>
                    <FiXCircle /> Bekor qilish
                  </button>
                </div>
              )}
            </div>
          ))}
          {orders.length === 0 && <div className="empty">Bu yerda hozircha hech nima yo'q</div>}
        </div>
      )}
    </div>
  );
};
