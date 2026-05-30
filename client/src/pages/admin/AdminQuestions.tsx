import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { FiTrash2, FiSearch, FiDatabase } from 'react-icons/fi';

export const AdminQuestions: React.FC = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/questions/stats`, {
        headers: { 'x-admin-secret': localStorage.getItem('adminSecret') || '' }
      });
      const data = await res.json();
      setStats(data.stats || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div style={{ padding: '20px' }} className="fade-in-up">
      <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Testlar Bazasi</h2>

      <div className="card glass tilt-card" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ background: 'rgba(0,212,170,0.15)', padding: '16px', borderRadius: '50%', color: 'var(--g)' }}>
          <FiDatabase size={32} />
        </div>
        <div>
          <div style={{ fontSize: '13px', color: 'var(--txt-2)' }}>Tizimdagi jami noyob savollar</div>
          <div style={{ fontSize: '32px', fontWeight: 800 }}>{total}</div>
        </div>
      </div>

      <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '12px', color: 'var(--txt-2)' }}>Fanlar bo'yicha taqsimot</h3>
      <div className="grid-responsive">
        {stats.map(s => (
          <div key={s._id} className="card glass" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--acc-l)' }}>{s._id}</div>
              <div style={{ fontSize: '12px', color: 'var(--txt-3)', marginTop: 4 }}>
                {s.withExplanation} ta savolda tushuntirish bor
              </div>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800 }}>
              {s.count} <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--txt-2)' }}>ta</span>
            </div>
          </div>
        ))}
      </div>
      
      {stats.length === 0 && <div className="empty">Savollar yo'q</div>}
      
      <div style={{ marginTop: '30px', padding: '16px', background: 'rgba(255,95,126,0.1)', border: '1px solid var(--r)', borderRadius: '12px' }}>
        <h3 style={{ color: 'var(--r)', fontSize: '14px', marginBottom: '8px', fontWeight: 800 }}>Xavfli Hudud (Danger Zone)</h3>
        <p style={{ fontSize: '12px', color: 'var(--txt-2)', marginBottom: '12px' }}>
          Savollarni ommaviy o'chirish yoki tozalash operatsiyalari faqat server konsoli orqali bajarilishi tavsiya etiladi.
        </p>
      </div>
    </div>
  );
};
