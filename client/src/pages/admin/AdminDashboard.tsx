import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { FiTrendingUp, FiActivity, FiUsers, FiDollarSign, FiSettings, FiPieChart, FiCpu, FiServer, FiSave } from 'react-icons/fi';
import { useToast } from '../../components/Toast';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const toast = useToast();

  const loadData = async () => {
    try {
      const [st, rev, cfg] = await Promise.all([
        adminApi.getStats(),
        adminApi.getRevenue(),
        adminApi.getConfig()
      ]);
      setStats(st);
      setRevenue(rev);
      setConfig(cfg);
    } catch (err: any) {
      toast.error(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfigChange = (field: string, val: string) => {
    setConfig({ ...config, [field]: Number(val) });
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      await adminApi.updateConfig(config);
      toast.success('Moliyaviy sozlamalar saqlandi!');
      setShowSettings(false);
      setLoading(true);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Xatolik');
    } finally {
      setSavingConfig(false);
    }
  };

  if (loading) return <div className="empty"><div className="spin" /></div>;

  const margin = revenue?.profit?.marginPercent || 0;
  const isProfitable = revenue?.profit?.uzs > 0;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }} className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 900 }}>Buxgalteriya va Analitika</h2>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          style={{ background: 'var(--s2)', border: '1px solid var(--f)', padding: '10px 16px', borderRadius: '10px', color: 'var(--txt)', fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}
        >
          <FiSettings /> Moliyaviy Sozlamalar
        </button>
      </div>

      {showSettings && config && (
        <div className="card glass" style={{ marginBottom: 24, border: '1px solid var(--g)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: 'var(--g)' }}>API va Doimiy Xarajatlarni Sozlash</h3>
          <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--txt-3)', display: 'block', marginBottom: 4 }}>USD to UZS Kursi</label>
              <input type="number" value={config.usdToUzsRate} onChange={e => handleConfigChange('usdToUzsRate', e.target.value)} className="input" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--txt-3)', display: 'block', marginBottom: 4 }}>Chat / Tushuntirish ($)</label>
              <input type="number" step="0.00001" value={config.costPerChat} onChange={e => handleConfigChange('costPerChat', e.target.value)} className="input" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--txt-3)', display: 'block', marginBottom: 4 }}>Test Generatsiya ($)</label>
              <input type="number" step="0.00001" value={config.costPerTest} onChange={e => handleConfigChange('costPerTest', e.target.value)} className="input" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--txt-3)', display: 'block', marginBottom: 4 }}>Hujjat o'qish ($)</label>
              <input type="number" step="0.00001" value={config.costPerDoc} onChange={e => handleConfigChange('costPerDoc', e.target.value)} className="input" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--txt-3)', display: 'block', marginBottom: 4 }}>Server xarajatlari ($/oy)</label>
              <input type="number" step="0.1" value={config.fixedMonthlyCosts} onChange={e => handleConfigChange('fixedMonthlyCosts', e.target.value)} className="input" />
            </div>
          </div>
          <button 
            onClick={saveConfig} disabled={savingConfig}
            style={{ background: 'var(--g)', color: '#000', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 800, marginTop: 16, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center' }}
          >
            {savingConfig ? 'Saqlanmoqda...' : <><FiSave /> Saqlash va Qayta hisoblash</>}
          </button>
        </div>
      )}

      {/* YIRIK MOLIYAVIY KO'RSATKICHLAR */}
      <div className="grid-responsive" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        
        {/* Tushumlar */}
        <div className="card glass" style={{ background: 'linear-gradient(145deg, rgba(0,212,170,0.1), rgba(0,212,170,0.02))', border: '1px solid rgba(0,212,170,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--g)', marginBottom: 8, display: 'flex', gap: 6, alignItems: 'center' }}><FiTrendingUp /> Jami Tushum (P2P)</div>
              <div style={{ fontSize: '32px', fontWeight: 900, letterSpacing: -1 }}>{revenue?.revenue?.p2p != null ? Number(revenue.revenue.p2p).toLocaleString() : 0} <span style={{fontSize: 16, color: 'var(--txt-3)'}}>UZS</span></div>
              <div style={{ fontSize: '12px', color: 'var(--txt-2)', marginTop: 4 }}>≈ ${revenue?.revenue?.p2pUSD != null ? Number(revenue.revenue.p2pUSD).toFixed(2) : '0.00'} USD</div>
            </div>
          </div>
        </div>

        {/* Xarajatlar */}
        <div className="card glass" style={{ background: 'linear-gradient(145deg, rgba(255,80,80,0.1), rgba(255,80,80,0.02))', border: '1px solid rgba(255,80,80,0.2)' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--r)', marginBottom: 8, display: 'flex', gap: 6, alignItems: 'center' }}><FiActivity /> Jami Xarajatlar</div>
          <div style={{ fontSize: '32px', fontWeight: 900, letterSpacing: -1 }}>{revenue?.costs?.totalUZS != null ? Number(revenue.costs.totalUZS).toLocaleString() : 0} <span style={{fontSize: 16, color: 'var(--txt-3)'}}>UZS</span></div>
          <div style={{ fontSize: '12px', color: 'var(--txt-2)', marginTop: 4 }}>API: ${revenue?.costs?.apiUSD != null ? Number(revenue.costs.apiUSD).toFixed(2) : '0.00'} + Server: ${revenue?.costs?.fixedUSD != null ? Number(revenue.costs.fixedUSD).toFixed(2) : '0.00'}</div>
        </div>

        {/* Sof Foyda */}
        <div className="card glass" style={{ background: isProfitable ? 'linear-gradient(145deg, rgba(123,104,238,0.15), rgba(123,104,238,0.02))' : 'linear-gradient(145deg, rgba(255,80,80,0.15), rgba(255,80,80,0.02))', border: `1px solid ${isProfitable ? 'var(--acc)' : 'var(--r)'}` }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: isProfitable ? 'var(--acc)' : 'var(--r)', marginBottom: 8, display: 'flex', gap: 6, alignItems: 'center' }}><FiDollarSign /> Sof Foyda</div>
          <div style={{ fontSize: '32px', fontWeight: 900, letterSpacing: -1 }}>{revenue?.profit?.uzs != null ? Number(revenue.profit.uzs).toLocaleString() : 0} <span style={{fontSize: 16, color: 'var(--txt-3)'}}>UZS</span></div>
          
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: 100, fontSize: 12, fontWeight: 800, color: isProfitable ? 'var(--g)' : 'var(--r)' }}>
              Marja: {margin}%
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: 100, fontSize: 12, fontWeight: 800, color: 'var(--y)' }}>
              ARPU: {revenue?.metrics?.arpuUZS != null ? Number(revenue.metrics.arpuUZS).toLocaleString() : 0} UZS
            </div>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24, marginBottom: 24 }}>
        {/* Xarajatlar Yoyilmasi */}
        <div className="card glass">
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}><FiPieChart /> Xarajatlar Yoyilmasi (USD)</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--f)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--txt-2)' }}>Test Generatsiya (eng og'ir)</span>
              <strong style={{ color: 'var(--r)' }}>${revenue?.costs?.breakdown?.testsUSD != null ? Number(revenue.costs.breakdown.testsUSD).toFixed(2) : '0.00'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--f)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--txt-2)' }}>AI Chatlar va Tushuntirish</span>
              <strong>${revenue?.costs?.breakdown?.chatsUSD != null ? Number(Number(revenue.costs.breakdown.chatsUSD) + Number(revenue.costs.breakdown.hintsUSD || 0)).toFixed(2) : '0.00'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--f)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--txt-2)' }}>Hujjatlar va Rasmlar (OCR)</span>
              <strong>${revenue?.costs?.breakdown?.docsUSD != null ? Number(Number(revenue.costs.breakdown.docsUSD) + Number(revenue.costs.breakdown.imagesUSD || 0)).toFixed(2) : '0.00'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--txt-2)' }}>Doimiy Server & Domen</span>
              <strong>${revenue?.costs?.fixedUSD != null ? Number(revenue.costs.fixedUSD).toFixed(2) : '0.00'}</strong>
            </div>
          </div>
        </div>

        {/* Tizim Aktivligi */}
        <div className="card glass">
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}><FiCpu /> Tizim Aktivligi</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--s2)', padding: 12, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{revenue?.metrics?.totalReqs != null ? Number(revenue.metrics.totalReqs).toLocaleString() : 0}</div>
              <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 4 }}>Jami AI So'rovlar</div>
            </div>
            <div style={{ background: 'var(--s2)', padding: 12, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{revenue?.orders?.total || 0}</div>
              <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 4 }}>Tasdiqlangan Obunalar</div>
            </div>
            <div style={{ background: 'var(--s2)', padding: 12, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{stats?.users?.total}</div>
              <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 4 }}>Umumiy Ro'yxatdan o'tganlar</div>
            </div>
            <div style={{ background: 'var(--s2)', padding: 12, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--acc)' }}>{revenue?.metrics?.activeSubs}</div>
              <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 4 }}>Faol To'lagan Mijozlar</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
