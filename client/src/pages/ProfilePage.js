import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, usePwaStore } from '../store';
import { materialApi, levelApi } from '../api/endpoints';
import { GRADE_META } from '../constants/subjects';
import SubscriptionModal from '../components/SubscriptionModal';
import { useToast } from '../components/Toast';
export default function ProfilePage() {
    const { user, logout } = useAppStore();
    const navigate = useNavigate();
    const handleLogout = () => {
        if (confirm("Akkountdan chiqasizmi?")) {
            logout();
            navigate('/auth/welcome', { replace: true });
        }
    };
    const [subOpen, setSubOpen] = useState(false);
    const toast = useToast();
    const { canInstall, installPwa, isInstalled } = usePwaStore();
    const [matLimits, setMatLimits] = useState(null);
    const [level, setLevel] = useState(null);
    const isSub = user?.effectivePlan && user.effectivePlan !== 'free';
    const planLabel = {
        free: { name: 'Bepul', emoji: '🆓', color: 'var(--txt-3)' },
        basic: { name: 'Basic', emoji: '⭐', color: 'var(--y)' },
        pro: { name: 'Pro', emoji: '✨', color: 'var(--acc-l)' },
        vip: { name: 'VIP', emoji: '💎', color: 'var(--g)' },
    };
    const plan = planLabel[user?.effectivePlan || 'free'];
    const initials = (user?.firstName || 'F').slice(0, 2).toUpperCase();
    const daysLeft = user?.planExpiresAt
        ? Math.max(0, Math.ceil((new Date(user.planExpiresAt).getTime() - Date.now()) / 86400000))
        : 0;
    useEffect(() => {
        materialApi.limits().then(({ data }) => setMatLimits(data)).catch(() => { });
        levelApi.current().then(({ data }) => setLevel(data)).catch(() => { });
    }, []);
    const grade = level?.currentGrade || 'delta';
    const gradeMeta = GRADE_META[grade];
    const versionInGrade = level ? (grade === 'delta' ? level.currentVersion
        : grade === 'beta' ? level.currentVersion - 3
            : level.currentVersion - 7) : 1;
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "header", children: _jsxs("div", { className: "header-logo", children: ["FIKRA", _jsx("span", { children: "." })] }) }), _jsx("div", { style: { height: 6 } }), _jsx("div", { style: { padding: '0 20px' }, children: _jsxs("div", { className: "card", style: { display: 'flex', alignItems: 'center', gap: 14 }, children: [_jsx("div", { style: {
                                width: 56, height: 56, borderRadius: 16,
                                background: 'linear-gradient(135deg, var(--acc), var(--r))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, fontSize: 22, flexShrink: 0,
                            }, children: initials }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 16 }, children: user?.firstName || user?.displayName || 'Foydalanuvchi' }), (user?.email || user?.phone) && (_jsx("div", { style: {
                                        fontSize: 12, color: 'var(--txt-3)', marginTop: 2,
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }, children: user.email || user.phone })), level && (_jsxs("div", { style: {
                                        marginTop: 6,
                                        display: 'inline-block',
                                        padding: '3px 9px',
                                        background: gradeMeta.bgColor,
                                        border: `1px solid ${gradeMeta.color}40`,
                                        borderRadius: 8,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: gradeMeta.color,
                                    }, children: [gradeMeta.icon, " ", gradeMeta.name, " ", versionInGrade] }))] })] }) }), _jsx("div", { style: { padding: '12px 20px 0' }, children: _jsxs("button", { onClick: isInstalled ? undefined : installPwa, disabled: isInstalled || (!canInstall && !isInstalled), style: {
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
                        opacity: (!isInstalled && !canInstall) ? 0.6 : 1,
                    }, children: [_jsx("div", { style: { fontSize: 28 }, children: isInstalled ? '✅' : '📲' }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 800, fontSize: 14, color: 'var(--g)' }, children: isInstalled ? 'Ilova o\'rnatilgan' : 'Ilovani o\'rnatish' }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }, children: isInstalled
                                        ? 'Siz PWA ilovadan foydalanyapsiz'
                                        : 'Telefonga yuklab oling — tezroq ishlaydi' })] }), !isInstalled && canInstall && _jsx("div", { style: { color: 'var(--g)', fontSize: 18, fontWeight: 800 }, children: "\u2193" })] }) }), level && (_jsxs(_Fragment, { children: [_jsx("div", { className: "section-title", children: "\uD83D\uDCCA Daraja statistikasi" }), _jsx("div", { style: { padding: '0 20px' }, children: _jsxs("div", { style: {
                                background: `linear-gradient(135deg, ${gradeMeta.bgColor}, transparent)`,
                                border: `1px solid ${gradeMeta.color}40`,
                                borderRadius: 14,
                                padding: 16,
                            }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }, children: [_jsx("div", { style: {
                                                width: 56, height: 56, borderRadius: 14,
                                                background: gradeMeta.bgColor,
                                                border: `1px solid ${gradeMeta.color}40`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 900, fontSize: 28, color: gradeMeta.color,
                                                flexShrink: 0,
                                            }, children: gradeMeta.icon }), _jsxs("div", { style: { flex: 1 }, children: [_jsxs("div", { style: { fontWeight: 900, fontSize: 18, color: gradeMeta.color }, children: [gradeMeta.name, " ", versionInGrade] }), _jsxs("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }, children: ["Versiya ", level.currentVersion, "/10 \u00B7 Joriy oy"] })] })] }), !level.nextVersionInfo?.isMax && level.nextVersionInfo && (_jsxs(_Fragment, { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--txt-3)', marginBottom: 4 }, children: [_jsx("span", { children: "Keyingi darajaga" }), _jsxs("span", { style: { fontWeight: 700 }, children: [level.nextVersionInfo.currentAccuracy || 0, "% / ", level.nextVersionInfo.requiredAccuracy || 0, "%"] })] }), _jsx("div", { style: { height: 4, background: 'var(--s2)', borderRadius: 100, marginBottom: 12 }, children: _jsx("div", { style: {
                                                    height: '100%',
                                                    width: `${Math.min(100, ((level.nextVersionInfo.currentAccuracy || 0) / (level.nextVersionInfo.requiredAccuracy || 1)) * 100)}%`,
                                                    background: gradeMeta.color,
                                                    borderRadius: 100,
                                                } }) })] })), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }, children: [_jsx(StatBox, { label: "Standart", value: level.standardTests.total, sub: level.standardTests.total > 0 ? `${Math.round(level.standardTests.correct / level.standardTests.total * 100)}%` : '—', color: "#10b981" }), _jsx(StatBox, { label: "AI testlar", value: level.personalTests.total, sub: level.personalTests.total > 0 ? `${Math.round(level.personalTests.correct / level.personalTests.total * 100)}%` : '—', color: "#a78bfa" }), _jsx(StatBox, { label: "Mini-test", value: level.miniTests.total, sub: level.miniTests.total > 0 ? `${Math.round(level.miniTests.correct / level.miniTests.total * 100)}%` : '—', color: "#f59e0b" })] }), _jsxs("div", { style: {
                                        marginTop: 12,
                                        padding: 10,
                                        background: 'rgba(123,104,238,0.06)',
                                        borderRadius: 8,
                                        fontSize: 10,
                                        color: 'var(--txt-3)',
                                        lineHeight: 1.5,
                                    }, children: ["\uD83D\uDCA1 Daraja har oy boshida nolga tushadi. Joriy oy: ", level.currentMonth] })] }) })] })), _jsx("div", { className: "section-title", children: "Obuna" }), _jsx("div", { style: { padding: '0 20px' }, children: _jsx("button", { onClick: () => setSubOpen(true), style: {
                        width: '100%',
                        background: 'var(--s1)',
                        border: `1.5px solid ${isSub ? 'rgba(0,212,170,0.3)' : 'rgba(123,104,238,0.25)'}`,
                        borderRadius: 'var(--br)',
                        padding: 16,
                        cursor: 'pointer',
                        color: 'var(--txt)',
                        textAlign: 'left',
                    }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 12 }, children: [_jsx("div", { style: { fontSize: 28 }, children: plan.emoji }), _jsxs("div", { style: { flex: 1 }, children: [_jsxs("div", { style: { fontWeight: 700, fontSize: 14, color: plan.color }, children: [plan.name, " ", isSub ? 'faol' : 'rejim'] }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-3)', marginTop: 3 }, children: isSub ? `${daysLeft} kun qoldi` : 'Imkoniyatlarni cheksiz oching' })] }), _jsx("div", { style: { fontSize: 11, color: 'var(--acc-l)', fontWeight: 700 }, children: isSub ? 'Uzaytirish ↗' : 'Obuna ↗' })] }) }) }), _jsx("div", { style: { padding: '12px 20px 0' }, children: _jsxs("div", { className: "card", children: [_jsx("div", { style: { fontWeight: 700, fontSize: 12, marginBottom: 10, color: 'var(--txt-2)' }, children: "Bugungi AI limit" }), [
                            { key: 'hints', name: '💡 Tushuntirish', limit: user?.aiLimits?.hints, used: user?.aiUsage?.hints },
                            { key: 'chats', name: '💬 Chat', limit: user?.aiLimits?.chats, used: user?.aiUsage?.chats },
                            { key: 'docs', name: '📄 Hujjat', limit: user?.aiLimits?.docs, used: user?.aiUsage?.docs },
                            { key: 'images', name: '🎨 Rasm', limit: user?.aiLimits?.images, used: user?.aiUsage?.images },
                        ].map(item => {
                            const used = item.used ?? 0;
                            const limit = item.limit;
                            const isUnlimited = limit === null;
                            const isLocked = limit === 0;
                            const pct = isUnlimited ? 0 : isLocked ? 0 : Math.min(100, (used / limit) * 100);
                            return (_jsxs("div", { style: { marginBottom: 10 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }, children: [_jsx("span", { children: item.name }), _jsx("span", { style: { color: isLocked ? 'var(--r)' : 'var(--txt-2)', fontWeight: 700 }, children: isLocked ? 'Yopiq' : isUnlimited ? '∞ Cheksiz' : `${used}/${limit}` })] }), !isLocked && !isUnlimited && (_jsx("div", { style: { height: 4, background: 'var(--s2)', borderRadius: 100 }, children: _jsx("div", { style: {
                                                height: '100%',
                                                background: pct >= 100 ? 'var(--r)' : 'var(--acc)',
                                                width: `${pct}%`,
                                                borderRadius: 100,
                                                transition: 'width 0.3s',
                                            } }) }))] }, item.key));
                        })] }) }), matLimits && (_jsx("div", { style: { padding: '12px 20px 0' }, children: _jsxs("div", { className: "card", children: [_jsx("div", { style: { fontWeight: 700, fontSize: 12, marginBottom: 10, color: 'var(--txt-2)' }, children: "\uD83D\uDCDA Material limitlari (bugun)" }), [
                            { key: 'ocrUploads', name: '📷 OCR rasm', obj: matLimits.ocrUploads },
                            { key: 'fileUploads', name: '📁 Fayl', obj: matLimits.fileUploads },
                            { key: 'testsGen', name: '🤖 AI Test', obj: matLimits.testsGen },
                        ].map(item => {
                            const limit = item.obj.limit;
                            const used = item.obj.used;
                            const isUnlimited = limit === null;
                            const isLocked = limit === 0;
                            const pct = isUnlimited ? 0 : isLocked ? 0 : Math.min(100, (used / limit) * 100);
                            return (_jsxs("div", { style: { marginBottom: 10 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }, children: [_jsx("span", { children: item.name }), _jsx("span", { style: { color: isLocked ? 'var(--r)' : 'var(--txt-2)', fontWeight: 700 }, children: isLocked ? 'Yopiq' : isUnlimited ? '∞ Cheksiz' : `${used}/${limit}` })] }), !isLocked && !isUnlimited && (_jsx("div", { style: { height: 4, background: 'var(--s2)', borderRadius: 100 }, children: _jsx("div", { style: {
                                                height: '100%',
                                                background: pct >= 100 ? 'var(--r)' : 'var(--g)',
                                                width: `${pct}%`,
                                                borderRadius: 100,
                                                transition: 'width 0.3s',
                                            } }) }))] }, item.key));
                        }), matLimits.plan === 'free' && (_jsx("div", { style: {
                                marginTop: 6,
                                padding: 10,
                                background: 'rgba(255,204,68,0.08)',
                                border: '1px solid rgba(255,204,68,0.2)',
                                borderRadius: 10,
                                fontSize: 11,
                                color: 'var(--txt-2)',
                            }, children: "\uD83D\uDCA1 Pro tarifda har fanga 20 ta material, kuniga 15 OCR va 12 fayl yuklash" }))] }) })), _jsx("div", { className: "section-title", children: "Akkount" }), _jsxs("div", { style: { padding: '0 20px 24px' }, children: [_jsxs("div", { className: "card", children: [user?.email && (_jsxs("div", { style: {
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '8px 0',
                                    borderBottom: user?.phone ? '1px solid var(--f)' : 'none',
                                }, children: [_jsx("span", { style: { fontSize: 18 }, children: "\uD83D\uDCE7" }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { fontSize: 10, color: 'var(--txt-3)', fontWeight: 700, letterSpacing: 0.3 }, children: "EMAIL" }), _jsx("div", { style: { fontSize: 13, color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis' }, children: user.email })] })] })), user?.phone && (_jsxs("div", { style: {
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '8px 0',
                                }, children: [_jsx("span", { style: { fontSize: 18 }, children: "\uD83D\uDCF1" }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { fontSize: 10, color: 'var(--txt-3)', fontWeight: 700, letterSpacing: 0.3 }, children: "TELEFON" }), _jsx("div", { style: { fontSize: 13, color: 'var(--txt)' }, children: user.phone })] })] }))] }), _jsx("button", { onClick: handleLogout, style: {
                            width: '100%',
                            background: 'rgba(255,95,126,0.1)',
                            border: '1px solid rgba(255,95,126,0.3)',
                            color: 'var(--r)',
                            borderRadius: 12,
                            padding: '12px 16px',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            marginTop: 18,
                        }, children: "\uD83D\uDEAA Chiqish" }), _jsx("div", { style: { height: 30 } })] }), _jsx(SubscriptionModal, { open: subOpen, onClose: () => setSubOpen(false) })] }));
}
function StatBox({ label, value, sub, color }) {
    return (_jsxs("div", { style: {
            background: 'var(--s2)',
            borderRadius: 10,
            padding: '10px 8px',
            textAlign: 'center',
        }, children: [_jsx("div", { style: { fontSize: 18, fontWeight: 800, color }, children: value }), _jsx("div", { style: { fontSize: 10, color: 'var(--txt-3)', marginTop: 2 }, children: label }), _jsx("div", { style: { fontSize: 9, color: 'var(--txt-3)', marginTop: 1 }, children: sub })] }));
}
