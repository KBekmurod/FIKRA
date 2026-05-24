import { useNavigate } from 'react-router-dom';
export default function WelcomePage() {
    var navigate = useNavigate();
    return (<div style={{ minHeight: '100vh', padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ textAlign: 'center', marginTop: 28 }}>
        <h1 style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 56,
        fontWeight: 800,
        margin: 0,
        background: 'linear-gradient(135deg, #fff, var(--acc-l))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        lineHeight: 1
    }}>FIKRA<span style={{ color: 'var(--acc)' }}>.</span></h1>

        <div style={{
        display: 'inline-block',
        padding: '5px 14px',
        background: 'rgba(123,104,238,0.15)',
        border: '1px solid rgba(123,104,238,0.3)',
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--acc-l)',
        marginTop: 14,
        letterSpacing: 0.5
    }}>DTM TAYYORLIK PLATFORMASI</div>

        <p style={{
        fontSize: 14,
        color: 'var(--txt-2)',
        marginTop: 16,
        lineHeight: 1.55,
        maxWidth: 320,
        margin: '16px auto 0'
    }}>
          AI yordamida shaxsiy testlar yarating va DTM'ga
          <strong style={{ color: 'var(--txt)' }}> ishonchli tayyorgarlik </strong>
          ko'ring
        </p>
      </div>

      
      <div style={{ marginTop: 28, display: 'grid', gap: 8 }}>
        <FeatureItem icon="🏛" text="Konspekt, PDF, rasm — har biridan AI test"/>
        <FeatureItem icon="🎓" text="DTM standart bloklarini ishlash"/>
        <FeatureItem icon="🎯" text="Xatolaringizni AI tushuntiradi"/>
        <FeatureItem icon="📊" text="Delta → Beta → Alfa darajalar"/>
      </div>

      <div style={{ flex: 1 }}/>

      
      <div style={{ marginTop: 28, display: 'grid', gap: 10 }}>
        <button onClick={function () { return navigate('/auth/register'); }} style={{
        background: 'linear-gradient(135deg, var(--acc), var(--acc-l))',
        color: 'white',
        border: 'none',
        borderRadius: 14,
        padding: '15px 18px',
        fontSize: 14,
        fontWeight: 800,
        cursor: 'pointer'
    }}>Ro'yxatdan o'tish</button>

        <button onClick={function () { return navigate('/auth/login'); }} style={{
        background: 'var(--s1)',
        color: 'var(--txt)',
        border: '1px solid var(--f)',
        borderRadius: 14,
        padding: '15px 18px',
        fontSize: 14,
        fontWeight: 800,
        cursor: 'pointer'
    }}>Mavjud akkountga kirish</button>
      </div>

      <div style={{
        marginTop: 14, marginBottom: 8,
        fontSize: 10, color: 'var(--txt-3)', textAlign: 'center',
        lineHeight: 1.5
    }}>
        Ro'yxatdan o'tib siz <strong>Foydalanish shartlari</strong>{' '}
        va <strong>Maxfiylik</strong> bilan rozisiz
      </div>
    </div>);
}
function FeatureItem(_a) {
    var icon = _a.icon, text = _a.text;
    return (<div style={{
        background: 'var(--s1)',
        border: '1px solid var(--f)',
        borderRadius: 12,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.4 }}>{text}</span>
    </div>);
}
