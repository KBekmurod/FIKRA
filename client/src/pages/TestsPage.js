import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
export default function TestsPage() {
    var navigate = useNavigate();
    var _a = useAppStore(), user = _a.user, setAuthModalOpen = _a.setAuthModalOpen;
    return (<>
      <div className="header">
        <div className="header-logo">📝 Testlar</div>
      </div>

      <div style={{ padding: '8px 20px 0' }}>
        <p style={{ fontSize: 13, color: 'var(--txt-2)', margin: '4px 0 16px' }}>
          Test turini tanlang
        </p>

        
        <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12
    }}>
          
          <button onClick={function () {
        if (!user)
            return setAuthModalOpen(true);
        navigate('/testlar/ai');
    }} style={{
        background: 'linear-gradient(135deg, rgba(123,104,238,0.18), rgba(167,139,250,0.10))',
        border: '1.5px solid rgba(123,104,238,0.35)',
        borderRadius: 18,
        padding: '24px 14px',
        minHeight: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--txt)',
        textAlign: 'center',
        gap: 10
    }}>
            <div style={{ fontSize: 44 }}>🤖</div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--acc-l)' }}>
              AI testlarim
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.4 }}>
              Ombordagi materiallaringizdan AI yaratgan testlar
            </div>
          </button>

          
          <button onClick={function () {
        if (!user)
            return setAuthModalOpen(true);
        navigate('/testlar/fikra');
    }} style={{
        background: 'linear-gradient(135deg, rgba(0,212,170,0.18), rgba(74,222,128,0.10))',
        border: '1.5px solid rgba(0,212,170,0.35)',
        borderRadius: 18,
        padding: '24px 14px',
        minHeight: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--txt)',
        textAlign: 'center',
        gap: 10
    }}>
            <div style={{ fontSize: 44 }}>🎓</div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--g)' }}>
              FIKRA testlari
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.4 }}>
              DTM standart imtihonlari
            </div>
          </button>
        </div>

        
        <div style={{
        marginTop: 18,
        padding: 14,
        background: 'rgba(123,104,238,0.06)',
        border: '1px solid rgba(123,104,238,0.15)',
        borderRadius: 12,
        fontSize: 11,
        color: 'var(--txt-2)',
        lineHeight: 1.6
    }}>
          <div style={{ fontWeight: 700, color: 'var(--txt)', marginBottom: 6 }}>
            💡 Qaysi birini tanlash kerak?
          </div>
          <div>
            <strong>AI testlarim</strong> — siz yuklagan kitob, dars, konspektlardan yaratiladi.
            Shaxsiy mavzularingiz uchun.
          </div>
          <div style={{ marginTop: 6 }}>
            <strong>FIKRA testlari</strong> — DTM standartiga ko'ra (maxsus blok va erkin tanlov).
            Imtihonga tayyorgarlik uchun.
          </div>
        </div>
      </div>
    </>);
}
