import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, } from '../store';
import { usePwaStore } from '../store';
import { levelApi, examApi, personalTestApi } from '../api/endpoints';
import { GRADE_META, versionInGrade } from '../constants/subjects';
import SubscriptionModal from '../components/SubscriptionModal';
import LevelCrystal from '../components/LevelCrystal';
export default function HomePage() {
    const navigate = useNavigate();
    const { user } = useAppStore();
    const { canInstall, installPwa, isInstalled } = usePwaStore();
    const [level, setLevel] = useState(null);
    const [lastActivity, setLastActivity] = useState(null);
    const [subOpen, setSubOpen] = useState(false);
    const isGuest = !user;
    const isSub = user?.effectivePlan && user.effectivePlan !== 'free';
    useEffect(() => {
        if (isGuest)
            return;
        // Daraja
        levelApi.current().then(({ data }) => setLevel(data)).catch(() => { });
        // Oxirgi amaliyat: testlar tarixidan eng so'nggisi
        Promise.all([
            examApi.history(undefined, 1).catch(() => ({ data: { sessions: [] } })),
            personalTestApi.history(undefined, undefined, 1).catch(() => ({ data: { tests: [] } })),
        ]).then(([fikra, ai]) => {
            const fikraLast = (fikra.data.sessions || fikra.data.history || [])[0];
            const aiLast = (ai.data.tests || [])[0];
            let pick = null;
            const fikraTime = fikraLast ? new Date(fikraLast.endTime || fikraLast.createdAt).getTime() : 0;
            const aiTime = aiLast ? new Date(aiLast.endTime || aiLast.createdAt).getTime() : 0;
            if (fikraTime > aiTime && fikraLast) {
                const pct = fikraLast.maxTotalScore > 0
                    ? Math.round((fikraLast.totalScore / fikraLast.maxTotalScore) * 100) : 0;
                pick = {
                    kind: 'fikra_test',
                    emoji: fikraLast.mode === 'dtm' ? '🎯' : '📚',
                    label: fikraLast.mode === 'dtm' ? 'Maxsus blok testi' : 'Erkin tanlov testi',
                    subtitle: `${pct}% natija`,
                    time: timeAgo(new Date(fikraLast.endTime || fikraLast.createdAt)),
                    href: `/test-result/${fikraLast._id}`,
                };
            }
            else if (aiLast) {
                pick = {
                    kind: 'ai_test',
                    emoji: '🤖',
                    label: `${aiLast.subjectName} · AI test`,
                    subtitle: `${aiLast.scorePercent}% natija`,
                    time: timeAgo(new Date(aiLast.endTime || aiLast.createdAt)),
                    href: `/personal-tests/${aiLast._id}/result`,
                };
            }
            setLastActivity(pick);
        });
    }, [isGuest]);
    // ─── MEHMON UCHUN ──────────────────────────────────────────────────────
    if (isGuest) {
        return (_jsxs("div", { className: "page", style: { minHeight: '100vh' }, children: [_jsxs("div", { style: {
                        padding: '32px 20px 24px',
                        textAlign: 'center',
                        background: 'radial-gradient(circle at 50% 0%, rgba(123,104,238,0.18), transparent 60%)',
                    }, children: [_jsx("div", { style: {
                                display: 'inline-block',
                                padding: '4px 12px',
                                background: 'rgba(123,104,238,0.15)',
                                border: '1px solid rgba(123,104,238,0.3)',
                                borderRadius: 100,
                                fontSize: 11,
                                fontWeight: 700,
                                color: 'var(--acc-l)',
                                marginBottom: 14,
                                letterSpacing: 0.5,
                            }, children: "DTM TAYYORLIK PLATFORMASI" }), _jsxs("h1", { style: {
                                fontFamily: "'Syne', sans-serif",
                                fontSize: 36,
                                fontWeight: 800,
                                margin: 0,
                                background: 'linear-gradient(135deg, #fff, var(--acc-l))',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                lineHeight: 1.1,
                            }, children: ["FIKRA", _jsx("span", { style: { color: 'var(--acc)' }, children: "." })] }), _jsxs("p", { style: {
                                fontSize: 14,
                                color: 'var(--txt-2)',
                                marginTop: 12,
                                lineHeight: 1.5,
                                maxWidth: 320,
                                margin: '12px auto 0',
                            }, children: ["AI yordamida shaxsiy testlar yarating va DTM imtihoniga", _jsx("strong", { style: { color: 'var(--txt)' }, children: " ishonchli tayyorgarlik " }), "ko'ring"] })] }), _jsxs("div", { style: { padding: '8px 20px 0' }, children: [_jsx("div", { style: { fontWeight: 800, fontSize: 11, color: 'var(--txt-3)', letterSpacing: 1, marginBottom: 10 }, children: "\u2728 ILOVA IMKONIYATLARI" }), _jsxs("div", { style: { display: 'grid', gap: 10 }, children: [_jsx(FeatureItem, { icon: "\uD83C\uDFDB", title: "Shaxsiy ombor", desc: "Konspekt, PDF, rasm \u2014 barchasidan AI test yaratish" }), _jsx(FeatureItem, { icon: "\uD83C\uDF93", title: "DTM standart testlari", desc: "Maxsus blok va erkin tanlov bilan amaliyot" }), _jsx(FeatureItem, { icon: "\uD83C\uDFAF", title: "AI bilan rivojlanish", desc: "Xatolaringizni tushuntirib, mustahkamlashga yordam" }), _jsx(FeatureItem, { icon: "\uD83E\uDD16", title: "Umumiy AI yordamchi", desc: "Chat, hujjat, rasm \u2014 istalgan mavzuda" }), _jsx(FeatureItem, { icon: "\uD83D\uDCCA", title: "Daraja tizimi", desc: "Delta \u2192 Beta \u2192 Alfa progress trekisi" })] })] }), _jsxs("div", { style: { padding: '24px 20px 24px' }, children: [canInstall ? (_jsx("button", { onClick: installPwa, style: {
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
                                gap: 8,
                            }, children: "\uD83D\uDCF2 Ilovani qurilmaga yuklab olish" })) : (_jsx("button", { onClick: () => navigate('/auth/register'), style: {
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
                                gap: 8,
                            }, children: "\uD83D\uDE80 Boshlash" })), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-3)', textAlign: 'center', marginTop: 10 }, children: "Bepul \u00B7 Cheksiz imkoniyatlar uchun obuna oling" })] })] }));
    }
    // ─── RO'YXATDAN O'TGAN FOYDALANUVCHI ────────────────────────────────────
    const grade = level?.currentGrade || 'delta';
    const gradeMeta = GRADE_META[grade];
    const versionInGr = level ? versionInGrade(level.currentVersion) : 1;
    const accuracy = level?.accuracyPercent || 0;
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsxs("div", { className: "header-logo", children: ["FIKRA", _jsx("span", { children: "." })] }), _jsx("button", { className: "plan-pill", onClick: () => setSubOpen(true), children: isSub
                            ? _jsx("span", { style: { color: 'var(--y)' }, children: user.effectivePlan === 'basic' ? '⭐ Basic' :
                                    user.effectivePlan === 'pro' ? '✨ Pro' :
                                        user.effectivePlan === 'vip' ? '💎 VIP' : '' })
                            : _jsxs(_Fragment, { children: [_jsx("span", { style: { color: 'var(--txt-2)' }, children: "Bepul" }), " ", _jsx("span", { style: { color: 'var(--acc-l)' }, children: "\u2197" })] }) })] }), _jsx("div", { style: { padding: '6px 20px 0' }, children: _jsxs("div", { className: "tilt-card glass", style: {
                        background: `linear-gradient(135deg, ${gradeMeta.bgColor}, rgba(20,20,42,0.8))`,
                        border: `1px solid ${gradeMeta.color}40`,
                        borderRadius: 'var(--br)',
                        padding: 18,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14,
                    }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 14 }, children: [_jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsxs("div", { style: { fontWeight: 800, fontSize: 16 }, children: ["\uD83D\uDC4B Salom, ", user.firstName || 'Abituriyent', "!"] }), _jsx("div", { style: { fontSize: 12, color: 'var(--txt-2)', marginTop: 4 }, children: "Joriy darajangiz" }), _jsxs("div", { style: {
                                                marginTop: 6,
                                                display: 'inline-block',
                                                fontSize: 13,
                                                fontWeight: 800,
                                                color: gradeMeta.color,
                                                letterSpacing: 0.3,
                                            }, children: [gradeMeta.icon, " ", gradeMeta.name, " ", versionInGr] })] }), _jsx(LevelCrystal, { level: level ? level.currentVersion : 1, streak: level ? level.streak : 0 })] }), _jsxs("div", { style: {
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: 12,
                                padding: '10px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: 12,
                                color: 'var(--txt-2)'
                            }, children: [_jsxs("span", { children: ["Aniqlik (Accuracy): ", _jsxs("strong", { style: { color: 'var(--txt)' }, children: [accuracy, "%"] })] }), _jsxs("span", { children: ["Kristall Quvvati: ", _jsx("strong", { style: { color: gradeMeta.color }, children: "Max" })] })] })] }) }), user?.isNew && (_jsx("div", { style: { padding: '12px 20px 0' }, children: _jsxs("div", { style: {
                        background: 'linear-gradient(135deg, rgba(123,104,238,0.15), rgba(167,139,250,0.05))',
                        border: '1px solid rgba(123,104,238,0.3)',
                        borderRadius: 14,
                        padding: 14,
                    }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }, children: [_jsx("span", { style: { fontSize: 20 }, children: "\uD83C\uDF89" }), _jsxs("div", { style: { fontWeight: 800, fontSize: 14, color: 'var(--acc-l)' }, children: ["Xush kelibsiz, ", user.displayName || user.firstName || 'abituriyent', "!"] })] }), _jsxs("div", { style: { fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.55 }, children: ["1\uFE0F\u20E3 ", _jsx("strong", { children: "Ombor" }), "ga material yuklab boshlang", _jsx("br", {}), "2\uFE0F\u20E3 AI sizning materialingizdan ", _jsx("strong", { children: "sifatli test" }), " yaratadi", _jsx("br", {}), "3\uFE0F\u20E3 Test ishlab, ", _jsx("strong", { children: "xatolaringizni o'rganib" }), " rivojlaning"] })] }) })), !isSub && (_jsx("div", { style: { padding: '12px 20px 0' }, children: _jsxs("div", { style: {
                        background: 'linear-gradient(90deg, rgba(255,160,0,0.1), rgba(255,100,0,0.1))',
                        border: '1px solid rgba(255,160,0,0.3)',
                        borderRadius: 14,
                        padding: 14,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: 13, fontWeight: 700, color: 'var(--txt)' }, children: "Pro obunaga o'ting \uD83D\uDE80" }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)' }, children: "Limitlarsiz va suv belgisisiz imkoniyatlar" })] }), _jsx("button", { onClick: () => setSubOpen(true), style: {
                                background: 'var(--y)', color: '#000', border: 'none',
                                padding: '8px 14px', borderRadius: 100, fontSize: 11, fontWeight: 800, cursor: 'pointer'
                            }, children: "Sotib olish" })] }) })), _jsx("div", { className: "section-title", children: "Asosiy bo'limlar" }), _jsxs("div", { className: "grid-responsive", style: { padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }, children: [_jsx(MenuCard, { icon: "\uD83C\uDFDB", title: "Ombor", subtitle: "Materiallar", color: "rgba(167,139,250,0.15)", onClick: () => navigate('/ombor') }), _jsx(MenuCard, { icon: "\uD83D\uDCDD", title: "Testlar", subtitle: "DTM va AI", color: "rgba(0,212,170,0.15)", onClick: () => navigate('/testlar') }), _jsx(MenuCard, { icon: "\uD83D\uDCDA", title: "Tarix", subtitle: "Ishlagan testlar", color: "rgba(59,130,246,0.15)", onClick: () => navigate('/tarix') }), _jsx(MenuCard, { icon: "\uD83E\uDD16", title: "AI", subtitle: "Chat \u00B7 Hujjat \u00B7 Rasm", color: "rgba(251,191,36,0.15)", onClick: () => navigate('/ai') })] }), !isInstalled && canInstall && (_jsx("div", { style: { padding: '16px 20px 0' }, children: _jsxs("button", { onClick: installPwa, style: {
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
                        textAlign: 'left',
                    }, children: [_jsx("div", { style: { fontSize: 28 }, children: "\uD83D\uDCF2" }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 800, fontSize: 13, color: 'var(--g)' }, children: "Ilovani qurilmaga yuklab olish" }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }, children: "Tezroq ishlaydi, offline ham mavjud" })] }), _jsx("div", { style: { color: 'var(--g)', fontSize: 18, fontWeight: 800 }, children: "\u2193" })] }) })), (isInstalled || !canInstall) && lastActivity && (_jsxs(_Fragment, { children: [_jsx("div", { className: "section-title", children: "\uD83D\uDD53 Oxirgi amaliyat" }), _jsx("div", { style: { padding: '0 20px' }, children: _jsxs("button", { onClick: () => navigate(lastActivity.href), style: {
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
                                textAlign: 'left',
                            }, children: [_jsx("div", { style: { fontSize: 28 }, children: lastActivity.emoji }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 13 }, children: lastActivity.label }), _jsxs("div", { style: { fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }, children: [lastActivity.subtitle, " \u00B7 ", lastActivity.time] })] }), _jsx("div", { style: { fontSize: 18, color: 'var(--acc-l)' }, children: "\u2192" })] }) })] })), _jsx("div", { style: { height: 24 } }), _jsx(SubscriptionModal, { open: subOpen, onClose: () => setSubOpen(false) })] }));
}
// ─── Components ───────────────────────────────────────────────────────────
function FeatureItem({ icon, title, desc }) {
    return (_jsxs("div", { style: {
            background: 'var(--s1)',
            border: '1px solid var(--f)',
            borderRadius: 12,
            padding: 14,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
        }, children: [_jsx("div", { style: { fontSize: 24, lineHeight: 1, marginTop: 2 }, children: icon }), _jsxs("div", { children: [_jsx("div", { style: { fontWeight: 700, fontSize: 13, marginBottom: 2 }, children: title }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.4 }, children: desc })] })] }));
}
function MenuCard({ icon, title, subtitle, color, onClick }) {
    return (_jsxs("button", { onClick: onClick, style: {
            background: color,
            border: '1px solid var(--f)',
            borderRadius: 14,
            padding: '16px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            cursor: 'pointer',
            color: 'var(--txt)',
            textAlign: 'left',
            minHeight: 92,
        }, children: [_jsx("div", { style: { fontSize: 26, lineHeight: 1 }, children: icon }), _jsx("div", { style: { fontWeight: 800, fontSize: 14 }, children: title }), _jsx("div", { style: { fontSize: 10, color: 'var(--txt-2)' }, children: subtitle })] }));
}
function CircularProgress({ percent, color, size = 64 }) {
    const stroke = 6;
    const r = (size - stroke) / 2;
    const cf = 2 * Math.PI * r;
    const offset = cf - (percent / 100) * cf;
    return (_jsxs("div", { style: { position: 'relative', flexShrink: 0 }, children: [_jsxs("svg", { width: size, height: size, style: { transform: 'rotate(-90deg)' }, children: [_jsx("circle", { cx: size / 2, cy: size / 2, r: r, stroke: "var(--s2)", strokeWidth: stroke, fill: "none" }), _jsx("circle", { cx: size / 2, cy: size / 2, r: r, stroke: color, strokeWidth: stroke, fill: "none", strokeDasharray: cf, strokeDashoffset: offset, strokeLinecap: "round", style: { transition: 'stroke-dashoffset 0.6s' } })] }), _jsx("div", { style: {
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column',
                    fontSize: size > 60 ? 14 : 11,
                    fontWeight: 800,
                    color,
                    lineHeight: 1,
                }, children: _jsxs("span", { children: [percent, "%"] }) })] }));
}
function timeAgo(d) {
    const sec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (sec < 60)
        return `${sec} sec oldin`;
    if (sec < 3600)
        return `${Math.floor(sec / 60)} daq oldin`;
    if (sec < 86400)
        return `${Math.floor(sec / 3600)} soat oldin`;
    return `${Math.floor(sec / 86400)} kun oldin`;
}
