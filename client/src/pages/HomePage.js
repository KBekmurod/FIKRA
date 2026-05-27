var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { usePwaStore } from '../store';
import { levelApi, examApi, personalTestApi } from '../api/endpoints';
import { GRADE_META, versionInGrade } from '../constants/subjects';
{
    UserLevelData;
}
from;
'../types';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import SubscriptionModal from '../components/SubscriptionModal';
import LevelCrystal from '../components/LevelCrystal';
export default function HomePage() {
    var navigate = useNavigate();
    var user = useAppStore().user;
    var _a = usePwaStore(), canInstall = _a.canInstall, installPwa = _a.installPwa, isInstalled = _a.isInstalled;
    var _b = useState(null), level = _b[0], setLevel = _b[1];
    var _c = useState(null), lastActivity = _c[0], setLastActivity = _c[1];
    var _d = useState(false), subOpen = _d[0], setSubOpen = _d[1];
    var isGuest = !user;
    var isSub = user ? .effectivePlan && user.effectivePlan !== 'free'
        :
    ;
    useEffect(function () {
        if (isGuest)
            return;
        // Mehmon bo'lmasa ishlaydi
        levelApi.current().then(function (_a) {
            var data = _a.data;
            return setLevel(data);
        })["catch"](function () { });
        // Oxirgi amaliyat: testlar tarixidan eng so'nggisi
        Promise.all([
            examApi.history(undefined, 1)["catch"](function () { return ({ data: { sessions: [] } }); }),
            personalTestApi.history(undefined, undefined, 1)["catch"](function () { return ({ data: { tests: [] } }); }),
        ]).then(function (_a) {
            var fikra = _a[0], ai = _a[1];
            var fikraLast = (fikra.data.sessions || fikra.data.history || [])[0];
            var aiLast = (ai.data.tests || [])[0];
            var pick = null;
            var fikraTime = fikraLast ? new Date(fikraLast.endTime || fikraLast.createdAt).getTime() : 0;
            var aiTime = aiLast ? new Date(aiLast.endTime || aiLast.createdAt).getTime() : 0;
            if (fikraTime > aiTime && fikraLast) {
                var pct = fikraLast.maxTotalScore > 0
                    ? Math.round((fikraLast.totalScore / fikraLast.maxTotalScore) * 100) : 0;
                pick = {
                    kind: 'fikra_test',
                    emoji: fikraLast.mode === 'dtm' ? '🎯' : '📚',
                    label: fikraLast.mode === 'dtm' ? 'Maxsus blok testi' : 'Erkin tanlov testi',
                    subtitle: pct + "% natija",
                    time: timeAgo(new Date(fikraLast.endTime || fikraLast.createdAt)),
                    href: "/test-result/" + fikraLast._id
                };
            }
            else if (aiLast) {
                pick = {
                    kind: 'ai_test',
                    emoji: '🤖',
                    label: aiLast.subjectName + " \u00B7 AI test",
                    subtitle: aiLast.scorePercent + "% natija",
                    time: timeAgo(new Date(aiLast.endTime || aiLast.createdAt)),
                    href: "/personal-tests/" + aiLast._id + "/result"
                };
            }
            setLastActivity(pick);
        });
    }, [isGuest]);
    // ─── MEHMON UCHUN ──────────────────────────────────────────────────────
    if (isGuest) {
        return (<div className="page" style={{ minHeight: '100vh' }}>
        
        <div style={{
            padding: '32px 20px 24px',
            textAlign: 'center',
            background: 'radial-gradient(circle at 50% 0%, rgba(123,104,238,0.18), transparent 60%)'
        }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            background: 'rgba(123,104,238,0.15)',
            border: '1px solid rgba(123,104,238,0.3)',
            borderRadius: 100,
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--acc-l)',
            marginBottom: 14,
            letterSpacing: 0.5
        }}>DTM TAYYORLIK PLATFORMASI</div>

          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 36,
            fontWeight: 800,
            margin: 0,
            background: 'linear-gradient(135deg, #fff, var(--acc-l))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.1
        }}>
            FIKRA<span style={{ color: 'var(--acc)' }}>.</span>
          </h1>

          <p style={{
            fontSize: 14,
            color: 'var(--txt-2)',
            marginTop: 12,
            lineHeight: 1.5,
            maxWidth: 320,
            margin: '12px auto 0'
        }}>
            AI yordamida shaxsiy testlar yarating va DTM imtihoniga
            <strong style={{ color: 'var(--txt)' }}> ishonchli tayyorgarlik </strong>
            ko'ring
          </p>
        </div>

        
        <div style={{ padding: '8px 20px 0' }}>
          <div style={{ fontWeight: 800, fontSize: 11, color: 'var(--txt-3)', letterSpacing: 1, marginBottom: 10 }}>
            ✨ ILOVA IMKONIYATLARI
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            <FeatureItem icon="🏛" title="Shaxsiy ombor" desc="Konspekt, PDF, rasm — barchasidan AI test yaratish"/>
            <FeatureItem icon="🎓" title="DTM standart testlari" desc="Maxsus blok va erkin tanlov bilan amaliyot"/>
            <FeatureItem icon="🎯" title="AI bilan rivojlanish" desc="Xatolaringizni tushuntirib, mustahkamlashga yordam"/>
            <FeatureItem icon="🤖" title="Umumiy AI yordamchi" desc="Chat, hujjat, rasm — istalgan mavzuda"/>
            <FeatureItem icon="📊" title="Daraja tizimi" desc="Delta → Beta → Alfa progress trekisi"/>
          </div>
        </div>

        
        <div style={{ padding: '24px 20px 24px' }}>
          {canInstall ? (<button onClick={installPwa} style={{
            width: '100%',
            background: 'linear-gradient(135deg, var(--acc), var(--acc-l))',
            color: 'white',
            border: 'none',
            borderRadius: 14,
            padding: '16px 18px',
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
        }}>
              📲 Ilovani qurilmaga yuklab olish
            </button>) : (<button onClick={function () { return navigate('/auth/register'); }} style={{
            display: 'flex',
            width: '100%',
            background: 'linear-gradient(135deg, var(--acc), var(--acc-l))',
            color: 'white',
            border: 'none',
            borderRadius: 14,
            padding: '16px 18px',
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
        }}>
              🚀 Boshlash
            </button>)}
          <div style={{ fontSize: 11, color: 'var(--txt-3)', textAlign: 'center', marginTop: 10 }}>
            Bepul · Cheksiz imkoniyatlar uchun obuna oling
          </div>
        </div>
      </div>);
    }
    // ─── RO'YXATDAN O'TGAN FOYDALANUVCHI ────────────────────────────────────
    var grade = level ? .currentGrade || 'delta'
        :
    ;
    var gradeMeta = GRADE_META[grade];
    var versionInGr = level ? versionInGrade(level.currentVersion) : 1;
    var accuracy = level ? .accuracyPercent || 0
        :
    ;
    return (<>
      <div className="header">
        <div className="header-logo">FIKRA<span>.</span></div>
        <button className="plan-pill" onClick={function () { return setSubOpen(true); }}>
          {isSub
        ? <span style={{ color: 'var(--y)' }}>
                {user.effectivePlan === 'basic' ? '⭐ Basic' :
            user.effectivePlan === 'pro' ? '✨ Pro' :
                user.effectivePlan === 'vip' ? '💎 VIP' : ''}
              </span>
        : <><span style={{ color: 'var(--txt-2)' }}>Bepul</span> <span style={{ color: 'var(--acc-l)' }}>↗</span></>}
        </button>
      </div>

      
      <div style={{ padding: '6px 20px 0' }}>
        <div className="tilt-card glass" style={{
        background: "linear-gradient(135deg, " + gradeMeta.bgColor + ", rgba(20,20,42,0.8))",
        border: "1px solid " + gradeMeta.color + "40",
        borderRadius: 'var(--br)',
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 14
    }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>
                👋 Salom, {user.firstName || 'Abituriyent'}!
              </div>
              <div style={{ fontSize: 12, color: 'var(--txt-2)', marginTop: 4 }}>
                Joriy darajangiz
              </div>
              <div style={{
        marginTop: 6,
        display: 'inline-block',
        fontSize: 13,
        fontWeight: 800,
        color: gradeMeta.color,
        letterSpacing: 0.3
    }}>
                <>{gradeMeta.icon} {gradeMeta.name} {versionInGr}</>
              </div>
            </div>
            
            <LevelCrystal level={level ? level.currentVersion : 1} streak={level ? level.streak : 0}/>
          </div>
          
          <div style={{
        background: 'rgba(0,0,0,0.2)',
        borderRadius: 12,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 12,
        color: 'var(--txt-2)'
    }}>
            <span>Aniqlik (Accuracy): <strong style={{ color: 'var(--txt)' }}>{accuracy}%</strong></span>
            <span>Kristall Quvvati: <strong style={{ color: gradeMeta.color }}>{Math.min(100, 20 + (level ? .streak || 0 : ) * 10)}%</strong></span>
          </div>
        </div>
      </div>

      
      {user ? .isNew && (<div style={{ padding: '12px 20px 0' }}>
          <div style={{
        background: 'linear-gradient(135deg, rgba(123,104,238,0.15), rgba(167,139,250,0.05))',
        border: '1px solid rgba(123,104,238,0.3)',
        borderRadius: 14,
        padding: 14
    }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 20 }}>🎉</span>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--acc-l)' }}>
                Xush kelibsiz, {user.displayName || user.firstName || 'abituriyent'}!
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.55 }}>
              1️⃣ <strong>Ombor</strong>ga material yuklab boshlang<br />
              2️⃣ AI sizning materialingizdan <strong>sifatli test</strong> yaratadi<br />
              3️⃣ Test ishlab, <strong>xatolaringizni o'rganib</strong> rivojlaning
            </div>
          </div>
        </div>) : }

      
      {!isSub && (<div style={{ padding: '12px 20px 0' }}>
          <div style={{
        background: 'linear-gradient(90deg, rgba(255,160,0,0.1), rgba(255,100,0,0.1))',
        border: '1px solid rgba(255,160,0,0.3)',
        borderRadius: 14,
        padding: 14,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>Pro obunaga o'ting 🚀</div>
              <div style={{ fontSize: 11, color: 'var(--txt-2)' }}>Limitlarsiz va suv belgisisiz imkoniyatlar</div>
            </div>
            <button onClick={function () { return setSubOpen(true); }} style={{
        background: 'var(--y)', color: '#000', border: 'none',
        padding: '8px 14px', borderRadius: 100, fontSize: 11, fontWeight: 800, cursor: 'pointer'
    }}>Sotib olish</button>
          </div>
        </div>)}



      <div className="section-title">Asosiy bo'limlar</div>
      <div className="grid-responsive" style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <MenuCard icon="🏛" title="Ombor" subtitle="Materiallar" color="rgba(167,139,250,0.15)" onClick={function () { return navigate('/ombor'); }}/>
        <MenuCard icon="📝" title="Testlar" subtitle="DTM va AI" color="rgba(0,212,170,0.15)" onClick={function () { return navigate('/testlar'); }}/>
        <MenuCard icon="📚" title="Tarix" subtitle="Ishlagan testlar" color="rgba(59,130,246,0.15)" onClick={function () { return navigate('/tarix'); }}/>
        <MenuCard icon="🤖" title="AI" subtitle="Chat · Hujjat · Rasm" color="rgba(251,191,36,0.15)" onClick={function () { return navigate('/ai'); }}/>
      </div>

      
      {!isInstalled && canInstall && (<div style={{ padding: '16px 20px 0' }}>
          <button onClick={installPwa} style={{
        width: '100%',
        background: 'linear-gradient(135deg, rgba(0,212,170,0.12), rgba(123,104,238,0.05))',
        border: '1px solid rgba(0,212,170,0.3)',
        borderRadius: 14,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        color: 'var(--txt)',
        cursor: 'pointer',
        textAlign: 'left'
    }}>
            <div style={{ fontSize: 28 }}>📲</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--g)' }}>
                Ilovani qurilmaga yuklab olish
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
                Tezroq ishlaydi, offline ham mavjud
              </div>
            </div>
            <div style={{ color: 'var(--g)', fontSize: 18, fontWeight: 800 }}>↓</div>
          </button>
        </div>)}

      
      {(isInstalled || !canInstall) && lastActivity && (<>
          <div className="section-title">🕓 Oxirgi amaliyat</div>
          <div style={{ padding: '0 20px' }}>
            <button onClick={function () { return navigate(lastActivity.href); }} style={{
        width: '100%',
        background: 'var(--s1)',
        border: '1px solid var(--f)',
        borderRadius: 14,
        padding: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        color: 'var(--txt)',
        cursor: 'pointer',
        textAlign: 'left'
    }}>
              <div style={{ fontSize: 28 }}>{lastActivity.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{lastActivity.label}</div>
                <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }}>
                  {lastActivity.subtitle} · {lastActivity.time}
                </div>
              </div>
              <div style={{ fontSize: 18, color: 'var(--acc-l)' }}>→</div>
            </button>
          </div>
        </>)}

      <div style={{ height: 24 }}/>
      <SubscriptionModal open={subOpen} onClose={function () { return setSubOpen(false); }}/>
    </>);
}
// ─── Components ───────────────────────────────────────────────────────────
function FeatureItem(_a) {
    var icon = _a.icon, title = _a.title, desc = _a.desc;
    return (<div style={{
        background: 'var(--s1)',
        border: '1px solid var(--f)',
        borderRadius: 12,
        padding: 14,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start'
    }}>
      <div style={{ fontSize: 24, lineHeight: 1, marginTop: 2 }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.4 }}>{desc}</div>
      </div>
    </div>);
}
function MenuCard(_a) {
    var icon = _a.icon, title = _a.title, subtitle = _a.subtitle, color = _a.color, onClick = _a.onClick, className = _a.className, onMouseEnter = _a.onMouseEnter, style = _a.style;
    var x = useMotionValue(0.5);
    var y = useMotionValue(0.5);
    var rotateX = useTransform(y, [0, 1], [15, -15]);
    var rotateY = useTransform(x, [0, 1], [-15, 15]);
    // Glare effect calculation
    var glareOpacity = useTransform(y, [0, 1], [0, 0.5]);
    var glareY = useTransform(y, [0, 1], ['-50%', '150%']);
    function handleMouse(event) {
        var rect = event.currentTarget.getBoundingClientRect();
        x.set((event.clientX - rect.left) / rect.width);
        y.set((event.clientY - rect.top) / rect.height);
    }
    function handleMouseLeave() {
        x.set(0.5);
        y.set(0.5);
    }
    return (<motion.button onClick={onClick} onMouseEnter={onMouseEnter} onMouseMove={handleMouse} onMouseLeave={handleMouseLeave} className={className} style={__assign({ background: color, border: '1px solid var(--f)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, cursor: 'pointer', textAlign: 'left', position: 'relative', overflow: 'hidden', rotateX: rotateX,
        rotateY: rotateY, transformPerspective: 800 }, style)} whileHover={{ scale: 1.05, zIndex: 10 }} whileTap={{ scale: 0.95 }}>
      
      <motion.div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%)',
        opacity: glareOpacity,
        y: glareY,
        pointerEvents: 'none',
        borderRadius: 14
    }}/>

      <motion.div style={{ fontSize: 26, lineHeight: 1, translateZ: 40 }}>{icon}</motion.div>
      <motion.div style={{ fontWeight: 800, fontSize: 14, translateZ: 20 }}>{title}</motion.div>
      <motion.div style={{ fontSize: 10, color: 'var(--txt-2)', translateZ: 10 }}>{subtitle}</motion.div>
    </motion.button>);
}
function CircularProgress(_a) {
    var percent = _a.percent, color = _a.color, _b = _a.size, size = _b === void 0 ? 64 : _b;
    var stroke = 6;
    var r = (size - stroke) / 2;
    var cf = 2 * Math.PI * r;
    var offset = cf - (percent / 100) * cf;
    return (<div style={{ position: 'relative', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--s2)" strokeWidth={stroke} fill="none"/>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={cf} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s' }}/>
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
        fontSize: size > 60 ? 14 : 11,
        fontWeight: 800,
        color: color,
        lineHeight: 1
    }}>
        <span>{percent}%</span>
      </div>
    </div>);
}
function timeAgo(d) {
    var sec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (sec < 60)
        return sec + " sec oldin";
    if (sec < 3600)
        return Math.floor(sec / 60) + " daq oldin";
    if (sec < 86400)
        return Math.floor(sec / 3600) + " soat oldin";
    return Math.floor(sec / 86400) + " kun oldin";
}
