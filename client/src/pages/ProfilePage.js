import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, usePwaStore } from '../store';
import { materialApi, levelApi } from '../api/endpoints';
import { GRADE_META } from '../constants/subjects';
{
    MaterialLimits, UserLevelData;
}
from;
'../types';
import SubscriptionModal from '../components/SubscriptionModal';
import { useToast } from '../components/Toast';
import { subApi } from '../api/endpoints';
export default function ProfilePage() {
    var _a = useAppStore(), user = _a.user, logout = _a.logout;
    var navigate = useNavigate();
    var handleLogout = function () {
        if (confirm("Akkountdan chiqasizmi?")) {
            logout();
            navigate('/auth/welcome', { replace: true });
        }
    };
    var _b = useState(false), subOpen = _b[0], setSubOpen = _b[1];
    var toast = useToast();
    var _c = usePwaStore(), canInstall = _c.canInstall, installPwa = _c.installPwa, isInstalled = _c.isInstalled;
    var _d = useState(null), matLimits = _d[0], setMatLimits = _d[1];
    var _e = useState(null), level = _e[0], setLevel = _e[1];
    var _f = useState([]), pendingOrders = _f[0], setPendingOrders = _f[1];
    var isSub = user ? .effectivePlan && user.effectivePlan !== 'free'
        :
    ;
    var planLabel = {
        free: { name: 'Bepul', emoji: '🆓', color: 'var(--txt-3)' },
        basic: { name: 'Basic', emoji: '⭐', color: 'var(--y)' },
        pro: { name: 'Pro', emoji: '✨', color: 'var(--acc-l)' },
        vip: { name: 'VIP', emoji: '💎', color: 'var(--g)' }
    };
    var plan = planLabel[user ? .effectivePlan || 'free' : ];
    var initials = (user ? .firstName || 'F' : ).slice(0, 2).toUpperCase();
    var daysLeft = user ? .planExpiresAt
        ? Math.max(0, Math.ceil((new Date(user.planExpiresAt).getTime() - Date.now()) / 86400000))
        : 0
        :
    ;
    useEffect(function () {
        if (!user)
            return;
        materialApi.limits().then(function (_a) {
            var data = _a.data;
            return setMatLimits(data);
        })["catch"](function () { });
        levelApi.current().then(function (_a) {
            var data = _a.data;
            return setLevel(data);
        })["catch"](function () { });
        subApi.myOrders().then(function (_a) {
            var data = _a.data;
            var p = data.orders ? .filter(function (o) { return o.status === 'pending'; }) || []
                :
            ;
            setPendingOrders(p);
        })["catch"](function () { });
    }, [user]);
    var grade = level ? .currentGrade || 'delta'
        :
    ;
    var gradeMeta = GRADE_META[grade];
    var versionInGrade = level ? (grade === 'delta' ? level.currentVersion
        : grade === 'beta' ? level.currentVersion - 3
            : level.currentVersion - 7) : 1;
    return (<>
      <div className="header">
        <div className="header-logo">FIKRA<span>.</span></div>
      </div>

      <div style={{ height: 6 }}/>

      {!user ? (<div style={{ padding: '20px 20px', textAlign: 'center' }}>
          <div style={{
        background: 'linear-gradient(135deg, rgba(123,104,238,0.1), rgba(0,212,170,0.05))',
        border: '1px solid rgba(123,104,238,0.2)',
        borderRadius: 24,
        padding: '40px 20px'
    }}>
            <div style={{ fontSize: 50, marginBottom: 16 }}>👤</div>
            <h3 style={{ fontSize: 20, color: 'var(--txt)', marginBottom: 8, fontWeight: 800 }}>Siz mehmonsiz</h3>
            <p style={{ fontSize: 13, color: 'var(--txt-2)', marginBottom: 24, lineHeight: 1.5 }}>
              O'z darajangiz, statistikangiz va AI limitlaringizni ko'rish, shuningdek barcha qulayliklardan cheksiz foydalanish uchun profilingizga kiring.
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              <button onClick={function () { return navigate('/auth/register'); }} style={{
        background: 'linear-gradient(135deg, var(--acc), var(--acc-l))',
        color: '#fff', border: 'none',
        padding: '14px', borderRadius: 14,
        fontSize: 14, fontWeight: 800, cursor: 'pointer'
    }}>
                Hisob yaratish
              </button>
              <button onClick={function () { return navigate('/auth/login'); }} style={{
        background: 'var(--s2)',
        color: 'var(--txt)', border: 'none',
        padding: '14px', borderRadius: 14,
        fontSize: 14, fontWeight: 800, cursor: 'pointer'
    }}>
                Tizimga kirish
              </button>
            </div>
          </div>
        </div>) : (<>
          
      <div style={{ padding: '0 20px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: 'linear-gradient(135deg, var(--acc), var(--r))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 22, flexShrink: 0
    }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {user ? .firstName || user ? .displayName || 'Foydalanuvchi' :  : }
            </div>
            {(user ? .email || user ? .phone :  : ) && (<div style={{
        fontSize: 12, color: 'var(--txt-3)', marginTop: 2,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
    }}>
                {user.email || user.phone}
              </div>)}
            {level && (<div style={{
        marginTop: 6,
        display: 'inline-block',
        padding: '3px 9px',
        background: gradeMeta.bgColor,
        border: "1px solid " + gradeMeta.color + "40",
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 700,
        color: gradeMeta.color
    }}>
                {gradeMeta.icon} {gradeMeta.name} {versionInGrade}
              </div>)}
          </div>
        </div>
      </div>

      
      <div style={{ padding: '12px 20px 0' }}>
        <button onClick={isInstalled ? undefined : installPwa} disabled={isInstalled || (!canInstall && !isInstalled)} style={{
        width: '100%',
        background: isInstalled
            ? 'rgba(0,212,170,0.1)'
            : 'linear-gradient(135deg, rgba(0,212,170,0.12), rgba(123,104,238,0.08))',
        border: isInstalled
            ? '1px solid rgba(0,212,170,0.15)'
            : '1px solid rgba(0,212,170,0.3)',
        borderRadius: 14, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        color: 'var(--txt)', cursor: isInstalled || !canInstall ? 'default' : 'pointer', textAlign: 'left',
        opacity: (!isInstalled && !canInstall) ? 0.6 : 1
    }}>
          <div style={{ fontSize: 28 }}>{isInstalled ? '✅' : '📲'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--g)' }}>
              {isInstalled ? 'Ilova o\'rnatilgan' : 'Ilovani o\'rnatish'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
              {isInstalled
        ? 'Siz PWA ilovadan foydalanyapsiz'
        : 'Telefonga yuklab oling — tezroq ishlaydi'}
            </div>
          </div>
          {!isInstalled && canInstall && <div style={{ color: 'var(--g)', fontSize: 18, fontWeight: 800 }}>↓</div>}
        </button>
      </div>

      
      {pendingOrders.length > 0 && (<div style={{ padding: '12px 20px 0' }}>
          {pendingOrders.map(function (o) { return (<div key={o.orderId} style={{
        background: 'rgba(255,204,68,0.1)',
        border: '1px solid rgba(255,204,68,0.3)',
        borderRadius: 14, padding: 14,
        marginBottom: 8,
        display: 'flex', alignItems: 'flex-start', gap: 12
    }}>
              <div style={{ fontSize: 24 }}>⏳</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--y)' }}>Tasdiq kutilmoqda</div>
                <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 4, lineHeight: 1.4 }}>
                  <b>{o.planName}</b> tarifi uchun so'rov adminga yuborilgan.<br />
                  Buyurtma ID: <code style={{ color: 'var(--g)' }}>{o.orderId}</code>
                </div>
              </div>
            </div>); })}
        </div>)}

      
      {level && (<>
          <div className="section-title">📊 Daraja statistikasi</div>
          <div style={{ padding: '0 20px' }}>
            <div style={{
        background: "linear-gradient(135deg, " + gradeMeta.bgColor + ", transparent)",
        border: "1px solid " + gradeMeta.color + "40",
        borderRadius: 14,
        padding: 16
    }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: gradeMeta.bgColor,
        border: "1px solid " + gradeMeta.color + "40",
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 900, fontSize: 28, color: gradeMeta.color,
        flexShrink: 0
    }}>{gradeMeta.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: 18, color: gradeMeta.color }}>
                    {gradeMeta.name} {versionInGrade}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
                    Versiya {level.currentVersion}/10 · Joriy oy
                  </div>
                </div>
              </div>

              
              {!level.nextVersionInfo ? .isMax && level.nextVersionInfo && (<>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--txt-3)', marginBottom: 4 }}>
                    <span>Keyingi darajaga</span>
                    <span style={{ fontWeight: 700 }}>
                      {level.nextVersionInfo.currentAccuracy || 0}% / {level.nextVersionInfo.requiredAccuracy || 0}%
                    </span>
                  </div>
                  <div style={{ height: 4, background: 'var(--s2)', borderRadius: 100, marginBottom: 12 }}>
                    <div style={{
        height: '100%',
        width: Math.min(100, ((level.nextVersionInfo.currentAccuracy || 0) / (level.nextVersionInfo.requiredAccuracy || 1)) * 100) + "%",
        background: gradeMeta.color,
        borderRadius: 100
    }}/>
                  </div>
                </>) : }

              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <StatBox label="Standart" value={level.standardTests.total} sub={level.standardTests.total > 0 ? Math.round(level.standardTests.correct / level.standardTests.total * 100) + "%" : '—'} color="#10b981"/>
                <StatBox label="AI testlar" value={level.personalTests.total} sub={level.personalTests.total > 0 ? Math.round(level.personalTests.correct / level.personalTests.total * 100) + "%" : '—'} color="#a78bfa"/>
                <StatBox label="Mini-test" value={level.miniTests.total} sub={level.miniTests.total > 0 ? Math.round(level.miniTests.correct / level.miniTests.total * 100) + "%" : '—'} color="#f59e0b"/>
              </div>

              
              <div style={{
        marginTop: 12,
        padding: 10,
        background: 'rgba(123,104,238,0.06)',
        borderRadius: 8,
        fontSize: 10,
        color: 'var(--txt-3)',
        lineHeight: 1.5
    }}>
                💡 Daraja har oy boshida nolga tushadi. Joriy oy: {level.currentMonth}
              </div>
            </div>
          </div>
        </>)}

      
      <div className="section-title">Testlar tarixi</div>
      <div style={{ padding: '0 20px 12px' }}>
        <button onClick={function () { return navigate('/tarix'); }} style={{
        width: '100%',
        background: 'var(--s1)',
        border: '1px solid var(--f)',
        borderRadius: 'var(--br)',
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        color: 'var(--txt)', cursor: 'pointer', textAlign: 'left'
    }}>
          <div style={{ fontSize: 24 }}>📚</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Barcha testlar tarixi</div>
            <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>Avval ishlangan testlarni ko'rish va tahlil qilish</div>
          </div>
          <div style={{ color: 'var(--txt-3)', fontSize: 16 }}>→</div>
        </button>
      </div>

      
      <div className="section-title">Obuna</div>
      <div style={{ padding: '0 20px' }}>
        <button onClick={function () { return setSubOpen(true); }} style={{
        width: '100%',
        background: 'var(--s1)',
        border: "1.5px solid " + (isSub ? 'rgba(0,212,170,0.3)' : 'rgba(123,104,238,0.25)'),
        borderRadius: 'var(--br)',
        padding: 16,
        cursor: 'pointer',
        color: 'var(--txt)',
        textAlign: 'left'
    }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 28 }}>{plan.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: plan.color }}>
                {plan.name} {isSub ? 'faol' : 'rejim'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 3 }}>
                {isSub ? daysLeft + " kun qoldi" : 'Imkoniyatlarni cheksiz oching'}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--acc-l)', fontWeight: 700 }}>
              {isSub ? 'Uzaytirish ↗' : 'Obuna ↗'}
            </div>
          </div>
        </button>
      </div>

      
      <div style={{ padding: '12px 20px 0' }}>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10, color: 'var(--txt-2)' }}>
            Bugungi AI limit
          </div>
          {[
        { key: 'hints', name: '💡 Tushuntirish', limit: user ? .aiLimits ? .hints :  : , used: user ? .aiUsage ? .hints :  :  },
        { key: 'chats', name: '💬 Chat', limit: user ? .aiLimits ? .chats :  : , used: user ? .aiUsage ? .chats :  :  },
        { key: 'docs', name: '📄 Hujjat', limit: user ? .aiLimits ? .docs :  : , used: user ? .aiUsage ? .docs :  :  },
        { key: 'images', name: '🎨 Rasm', limit: user ? .aiLimits ? .images :  : , used: user ? .aiUsage ? .images :  :  },
    ].map(function (item) {
        var used = item.used ?  ? 0
            :
            :
        ;
        var limit = item.limit;
        var isUnlimited = limit === null;
        var isLocked = limit === 0;
        var pct = isUnlimited ? 0 : isLocked ? 0 : Math.min(100, (used / limit) * 100);
        return (<div key={item.key} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span>{item.name}</span>
                  <span style={{ color: isLocked ? 'var(--r)' : 'var(--txt-2)', fontWeight: 700 }}>
                    {isLocked ? 'Yopiq' : isUnlimited ? '∞ Cheksiz' : used + "/" + limit}
                  </span>
                </div>
                {!isLocked && !isUnlimited && (<div style={{ height: 4, background: 'var(--s2)', borderRadius: 100 }}>
                    <div style={{
            height: '100%',
            background: pct >= 100 ? 'var(--r)' : 'var(--acc)',
            width: pct + "%",
            borderRadius: 100,
            transition: 'width 0.3s'
        }}/>
                  </div>)}
              </div>);
    })}
        </div>
      </div>

      
      {matLimits && (<div style={{ padding: '12px 20px 0' }}>
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10, color: 'var(--txt-2)' }}>
              📚 Material limitlari (bugun)
            </div>
            {[
        { key: 'ocrUploads', name: '📷 OCR rasm', obj: matLimits.ocrUploads },
        { key: 'fileUploads', name: '📁 Fayl', obj: matLimits.fileUploads },
        { key: 'testsGen', name: '🤖 AI Test', obj: matLimits.testsGen },
    ].map(function (item) {
        var limit = item.obj.limit;
        var used = item.obj.used;
        var isUnlimited = limit === null;
        var isLocked = limit === 0;
        var pct = isUnlimited ? 0 : isLocked ? 0 : Math.min(100, (used / limit) * 100);
        return (<div key={item.key} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span>{item.name}</span>
                    <span style={{ color: isLocked ? 'var(--r)' : 'var(--txt-2)', fontWeight: 700 }}>
                      {isLocked ? 'Yopiq' : isUnlimited ? '∞ Cheksiz' : used + "/" + limit}
                    </span>
                  </div>
                  {!isLocked && !isUnlimited && (<div style={{ height: 4, background: 'var(--s2)', borderRadius: 100 }}>
                      <div style={{
            height: '100%',
            background: pct >= 100 ? 'var(--r)' : 'var(--g)',
            width: pct + "%",
            borderRadius: 100,
            transition: 'width 0.3s'
        }}/>
                    </div>)}
                </div>);
    })}
            {matLimits.plan === 'free' && (<div style={{
        marginTop: 6,
        padding: 10,
        background: 'rgba(255,204,68,0.08)',
        border: '1px solid rgba(255,204,68,0.2)',
        borderRadius: 10,
        fontSize: 11,
        color: 'var(--txt-2)'
    }}>
                💡 Pro tarifda har fanga 20 ta material, kuniga 15 OCR va 12 fayl yuklash
              </div>)}
          </div>
        </div>)}

      
      <div className="section-title">Akkount</div>
      <div style={{ padding: '0 20px 24px' }}>
        <div className="card">
          {user ? .email && (<div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 0',
        borderBottom: user ? .phone ? '1px solid var(--f)' : 'none' : 
    }}>
              <span style={{ fontSize: 18 }}>📧</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 700, letterSpacing: 0.3 }}>EMAIL</div>
                <div style={{ fontSize: 13, color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email}
                </div>
              </div>
            </div>) : }
          {user ? .phone && (<div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 0'
    }}>
              <span style={{ fontSize: 18 }}>📱</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 700, letterSpacing: 0.3 }}>TELEFON</div>
                <div style={{ fontSize: 13, color: 'var(--txt)' }}>{user.phone}</div>
              </div>
            </div>) : }
        </div>

        
        <button onClick={handleLogout} style={{
        width: '100%',
        background: 'rgba(255,95,126,0.1)',
        border: '1px solid rgba(255,95,126,0.3)',
        color: 'var(--r)',
        borderRadius: 12,
        padding: '12px 16px',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        marginTop: 18
    }}>🚪 Chiqish</button>

        <div style={{ height: 30 }}/>
      </div>
      </>)}

      <SubscriptionModal open={subOpen} onClose={function () { return setSubOpen(false); }}/>
    </>);
}
function StatBox(_a) {
    var label = _a.label, value = _a.value, sub = _a.sub, color = _a.color;
    return (<div style={{
        background: 'var(--s2)',
        borderRadius: 10,
        padding: '10px 8px',
        textAlign: 'center'
    }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: color }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--txt-3)', marginTop: 2 }}>{label}</div>
      <div style={{ fontSize: 9, color: 'var(--txt-3)', marginTop: 1 }}>{sub}</div>
    </div>);
}
