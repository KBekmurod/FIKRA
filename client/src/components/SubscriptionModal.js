import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { subApi } from '../api/endpoints';
import { useAppStore } from '../store';
import { useToast } from './Toast';
import Modal from './Modal';
export default function SubscriptionModal({ open, onClose }) {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAppStore();
    const toast = useToast();
    useEffect(() => {
        if (open) {
            subApi.plans().then(r => setPlans(r.data)).catch(() => { });
        }
    }, [open]);
    // P2P faqat — Payme/Click kelajakda
    const handleBuy = async (planId) => {
        if (!user) {
            toast.error('Avval tizimga kiring');
            return;
        }
        setLoading(true);
        try {
            const { data } = await subApi.createP2POrder(planId);
            const adminUsername = window.ADMIN_USERNAME || '';
            if (adminUsername) {
                const text = encodeURIComponent(`Salom! Men FIKRA ilovasidan ${data.order.planName} obunasini olmoqchiman.\n` +
                    `Buyurtma ID: ${data.order.orderId}\n` +
                    `Narx: ${data.order.priceUZS.toLocaleString()} UZS\n\n` +
                    `Rekvizitlarni yuboring!`);
                window.open(`https://t.me/${adminUsername}?text=${text}`, '_blank');
            }
            toast.success(`Buyurtma yaratildi (${data.order.orderId})! Admin javob beradi.`);
            onClose();
        }
        catch (e) {
            toast.error(e.response?.data?.error || 'Xatolik');
        }
        finally {
            setLoading(false);
        }
    };
    const tierColor = {
        basic: 'var(--y)', pro: 'var(--acc)', vip: 'var(--g)'
    };
    const tierEmoji = { basic: '⭐', pro: '✨', vip: '💎' };
    return (_jsxs(Modal, { open: open, onClose: onClose, title: "\u2B50 Obuna rejalari", children: [_jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 6,
                    marginBottom: 14,
                }, children: [_jsxs("div", { style: {
                            padding: '8px 6px',
                            background: 'rgba(0,212,170,0.12)',
                            border: '1.5px solid rgba(0,212,170,0.35)',
                            borderRadius: 10,
                            textAlign: 'center',
                        }, children: [_jsx("div", { style: { fontSize: 16 }, children: "\uD83E\uDD1D" }), _jsx("div", { style: { fontSize: 9, fontWeight: 800, color: 'var(--g)', marginTop: 2 }, children: "P2P" }), _jsx("div", { style: { fontSize: 8, color: 'var(--g)' }, children: "Faol" })] }), _jsxs("div", { style: {
                            padding: '8px 6px',
                            background: 'var(--s2)',
                            border: '1px solid var(--f)',
                            borderRadius: 10,
                            textAlign: 'center',
                            opacity: 0.6,
                        }, children: [_jsx("div", { style: { fontSize: 16 }, children: "\uD83D\uDCB3" }), _jsx("div", { style: { fontSize: 9, fontWeight: 800, color: 'var(--txt-2)', marginTop: 2 }, children: "Payme" }), _jsx("div", { style: { fontSize: 8, color: 'var(--txt-3)' }, children: "Tez orada" })] }), _jsxs("div", { style: {
                            padding: '8px 6px',
                            background: 'var(--s2)',
                            border: '1px solid var(--f)',
                            borderRadius: 10,
                            textAlign: 'center',
                            opacity: 0.6,
                        }, children: [_jsx("div", { style: { fontSize: 16 }, children: "\uD83D\uDCB3" }), _jsx("div", { style: { fontSize: 9, fontWeight: 800, color: 'var(--txt-2)', marginTop: 2 }, children: "Click" }), _jsx("div", { style: { fontSize: 8, color: 'var(--txt-3)' }, children: "Tez orada" })] })] }), _jsx("div", { style: { display: 'grid', gap: 10 }, children: plans.map(plan => {
                    const color = tierColor[plan.tier] || 'var(--txt-2)';
                    const emoji = tierEmoji[plan.tier] || '⭐';
                    const isMostPopular = plan.tier === 'pro' && plan.durationDays >= 30 && plan.durationDays < 90;
                    return (_jsxs("div", { style: {
                            background: 'var(--s1)',
                            border: `1.5px solid ${isMostPopular ? color : 'var(--f)'}`,
                            borderRadius: 14,
                            padding: 14,
                            position: 'relative',
                        }, children: [isMostPopular && (_jsx("div", { style: {
                                    position: 'absolute',
                                    top: -10,
                                    right: 12,
                                    background: color,
                                    color: '#0a0a14',
                                    fontSize: 9,
                                    fontWeight: 800,
                                    padding: '3px 10px',
                                    borderRadius: 100,
                                    letterSpacing: 0.5,
                                }, children: "OMMABOP" })), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }, children: [_jsx("div", { style: { fontSize: 26 }, children: emoji }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 800, fontSize: 14, color }, children: plan.name }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }, children: plan.period })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsx("div", { style: { fontWeight: 900, fontSize: 16 }, children: plan.priceUZS.toLocaleString() }), _jsx("div", { style: { fontSize: 10, color: 'var(--txt-3)' }, children: "UZS" })] })] }), _jsx("div", { style: { display: 'grid', gap: 4, marginBottom: 10 }, children: plan.features.slice(0, 4).map((f, i) => (_jsxs("div", { style: { fontSize: 11, color: 'var(--txt-2)', display: 'flex', gap: 6 }, children: [_jsx("span", { style: { color }, children: "\u2713" }), _jsx("span", { children: f })] }, i))) }), _jsx("button", { onClick: () => handleBuy(plan.id), disabled: loading, style: {
                                    width: '100%',
                                    background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                                    color: 'var(--txt)',
                                    border: 'none',
                                    borderRadius: 10,
                                    padding: '10px 14px',
                                    fontSize: 13,
                                    fontWeight: 800,
                                    cursor: loading ? 'wait' : 'pointer',
                                    opacity: loading ? 0.6 : 1,
                                }, children: loading ? '⏳ ...' : '🤝 P2P orqali olish' })] }, plan.id));
                }) }), _jsxs("div", { style: {
                    marginTop: 14,
                    padding: 12,
                    background: 'rgba(123,104,238,0.06)',
                    border: '1px solid rgba(123,104,238,0.18)',
                    borderRadius: 10,
                    fontSize: 11,
                    color: 'var(--txt-2)',
                    lineHeight: 1.5,
                }, children: ["\uD83E\uDD1D ", _jsx("strong", { children: "P2P (Peer-to-Peer)" }), " \u2014 admin bilan to'g'ridan-to'g'ri to'lov. Admin'ga yozib, kartani to'ldirib chek yuborasiz. Admin obunani faollashtiradi.", _jsx("br", {}), _jsx("br", {}), "\uD83D\uDCB3 ", _jsx("strong", { children: "Payme va Click" }), " tez orada qo'shiladi."] })] }));
}
