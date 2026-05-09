import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useAppStore } from '../store';
import SubscriptionModal from '../components/SubscriptionModal';
import { useToast } from '../components/Toast';
export default function ProfilePage() {
    const { user } = useAppStore();
    const [subOpen, setSubOpen] = useState(false);
    const { toast } = useToast();
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
    const refLink = user?.telegramId
        ? `https://t.me/${window.BOT_USERNAME || 'fikraai_bot'}?start=ref_${user.telegramId}`
        : '';
    const copyRef = () => {
        if (!refLink)
            return;
        navigator.clipboard.writeText(refLink).then(() => toast('Havola nusxalandi!', 'ok'));
    };
    const shareRef = () => {
        if (!refLink)
            return;
        const text = `FIKRA — DTM testlarga AI bilan tayyorlanish!\n${refLink}`;
        const tg = window.Telegram?.WebApp;
        if (tg) {
            tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`);
        }
        else if (navigator.share) {
            navigator.share({ text, url: refLink }).catch(() => { });
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "header", children: _jsxs("div", { className: "header-logo", children: ["FIKRA", _jsx("span", { children: "." })] }) }), _jsx("div", { style: { height: 6 } }), _jsx("div", { style: { padding: '0 20px' }, children: _jsxs("div", { className: "card", style: { display: 'flex', alignItems: 'center', gap: 14 }, children: [_jsx("div", { style: {
                                width: 56,
                                height: 56,
                                borderRadius: 16,
                                background: 'linear-gradient(135deg, var(--acc), var(--r))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: 22,
                                flexShrink: 0,
                            }, children: initials }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 16 }, children: user?.firstName || user?.username || 'Foydalanuvchi' }), user?.username && (_jsxs("div", { style: { fontSize: 12, color: 'var(--txt-3)', marginTop: 2 }, children: ["@", user.username] })), _jsxs("div", { style: { fontSize: 11, color: 'var(--y)', marginTop: 4, fontWeight: 700 }, children: ["\u26A1 ", (user?.xp || 0).toLocaleString(), " XP"] })] })] }) }), _jsxs("div", { style: { padding: '12px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }, children: [_jsxs("div", { className: "card", style: { textAlign: 'center', padding: 12 }, children: [_jsx("div", { style: { fontWeight: 800, fontSize: 22, color: 'var(--acc-l)' }, children: user?.streakDays || 0 }), _jsx("div", { style: { fontSize: 10, color: 'var(--txt-3)' }, children: "\uD83D\uDD25 Streak" })] }), _jsxs("div", { className: "card", style: { textAlign: 'center', padding: 12 }, children: [_jsx("div", { style: { fontWeight: 800, fontSize: 22, color: 'var(--g)' }, children: user?.totalGamesPlayed || 0 }), _jsx("div", { style: { fontSize: 10, color: 'var(--txt-3)' }, children: "\uD83D\uDCDA Test" })] }), _jsxs("div", { className: "card", style: { textAlign: 'center', padding: 12 }, children: [_jsx("div", { style: { fontWeight: 800, fontSize: 22, color: 'var(--y)' }, children: user?.totalAiRequests || 0 }), _jsx("div", { style: { fontSize: 10, color: 'var(--txt-3)' }, children: "\uD83E\uDD16 AI" })] })] }), _jsx("div", { className: "section-title", children: "Obuna" }), _jsx("div", { style: { padding: '0 20px' }, children: _jsx("button", { onClick: () => setSubOpen(true), style: {
                        width: '100%',
                        background: 'var(--s1)',
                        border: `1.5px solid ${isSub ? 'rgba(0,212,170,0.3)' : 'rgba(123,104,238,0.25)'}`,
                        borderRadius: 'var(--br)',
                        padding: 16,
                        cursor: 'pointer',
                        color: 'var(--txt)',
                        textAlign: 'left',
                    }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 12 }, children: [_jsx("div", { style: { fontSize: 28 }, children: plan.emoji }), _jsxs("div", { style: { flex: 1 }, children: [_jsxs("div", { style: { fontWeight: 700, fontSize: 14, color: plan.color }, children: [plan.name, " ", isSub ? 'faol' : 'rejim'] }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-3)', marginTop: 3 }, children: isSub
                                            ? `${daysLeft} kun qoldi`
                                            : 'AI imkoniyatlarni cheksiz oching' })] }), _jsx("div", { style: { fontSize: 11, color: 'var(--acc-l)', fontWeight: 700 }, children: isSub ? 'Uzaytirish ↗' : 'Obuna ↗' })] }) }) }), _jsx("div", { style: { padding: '12px 20px 0' }, children: _jsxs("div", { className: "card", children: [_jsx("div", { style: { fontWeight: 700, fontSize: 12, marginBottom: 10, color: 'var(--txt-2)' }, children: "Bugungi AI limit" }), [
                            { key: 'hints', name: '💡 AI Tushuntirish', limit: user?.aiLimits?.hints, used: user?.aiUsage?.hints },
                            { key: 'chats', name: '💬 AI Chat', limit: user?.aiLimits?.chats, used: user?.aiUsage?.chats },
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
                        })] }) }), _jsx("div", { className: "section-title", children: "Do'stni taklif qiling" }), _jsx("div", { style: { padding: '0 20px 24px' }, children: _jsxs("div", { className: "card", children: [_jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginBottom: 8 }, children: "Sizning havolangiz" }), _jsx("div", { style: {
                                background: 'var(--s2)',
                                border: '1px solid var(--f)',
                                borderRadius: 'var(--br2)',
                                padding: '10px 12px',
                                fontSize: 11,
                                fontFamily: 'monospace',
                                color: 'var(--txt-2)',
                                wordBreak: 'break-all',
                                marginBottom: 10,
                            }, children: refLink }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { onClick: copyRef, className: "btn btn-ghost btn-block", children: "\uD83D\uDCCB Nusxa" }), _jsx("button", { onClick: shareRef, className: "btn btn-success btn-block", children: "\uD83D\uDCE4 Ulashish" })] })] }) }), _jsx(SubscriptionModal, { open: subOpen, onClose: () => setSubOpen(false) })] }));
}
