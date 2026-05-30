import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { FiSearch, FiShield, FiSlash } from 'react-icons/fi';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchUsers = async (p = 1, query = q) => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers(p, 20, query);
      setUsers(data.users);
      setTotal(data.total);
      setPage(data.page);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, q);
  }, [q]);

  const handleBan = async (id: string) => {
    if (!confirm('Rostdan ham holatini o\'zgartirmoqchimisiz?')) return;
    try {
      const res = await adminApi.banUser(id);
      setUsers(users.map(u => u._id === id ? { ...u, isActive: res.isActive } : u));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleActivatePlan = async (id: string) => {
    const planId = prompt('Qaysi tarifni faollashtiramiz? (basic_1mo, pro_1mo, vip_1mo, free)');
    if (!planId) return;
    try {
      await adminApi.activatePlan(id, planId);
      alert('Muvaffaqiyatli faollashtirildi!');
      fetchUsers(page);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '20px' }} className="fade-in-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Foydalanuvchilar ({total})</h2>
      </div>

      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <FiSearch style={{ position: 'absolute', top: 14, left: 14, color: 'var(--txt-3)' }} />
        <input 
          type="text" 
          className="input" 
          placeholder="Ism, nomer yoki email orqali qidirish..." 
          style={{ paddingLeft: '40px' }}
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      {loading ? <div className="empty"><div className="spin" /></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {users.map(u => (
            <div key={u._id} className="card glass" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{u.firstName || u.displayName || 'Ismsiz'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--txt-2)' }}>{u.phone || u.email}</div>
                </div>
                <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                  {u.isActive ? 'Faol' : 'Bloklangan'}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <div style={{ fontSize: '11px' }}>
                  Tarif: <strong style={{ color: 'var(--acc-l)' }}>{u.plan.toUpperCase()}</strong>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => handleActivatePlan(u._id)} className="btn btn-sm btn-ghost" style={{ padding: '4px 8px' }}>
                    <FiShield /> Tarif
                  </button>
                  <button onClick={() => handleBan(u._id)} className="btn btn-sm btn-ghost" style={{ padding: '4px 8px', color: u.isActive ? 'var(--r)' : 'var(--g)' }}>
                    <FiSlash /> {u.isActive ? 'Ban' : 'Ochish'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {users.length === 0 && <div className="empty">Foydalanuvchilar topilmadi</div>}
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
        <button className="btn btn-sm btn-ghost" disabled={page === 1} onClick={() => fetchUsers(page - 1)}>Orqaga</button>
        <button className="btn btn-sm btn-ghost" disabled={users.length < 20} onClick={() => fetchUsers(page + 1)}>Keyingi</button>
      </div>
    </div>
  );
};
