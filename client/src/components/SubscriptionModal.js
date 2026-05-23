import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { subApi } from '../api/endpoints';
import { useAppStore } from '../store';
import { useToast } from './Toast';
import Modal from './Modal';
export default function SubscriptionModal({ open, onClose }) {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [period, setPeriod] = useState('1m');
    const [promoCode, setPromoCode] = useState('');
    const [promoDiscount, setPromoDiscount] = useState(0);
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoApplied, setPromoApplied] = useState(false);
    const { user } = useAppStore();
    const toast = useToast();
    useEffect(() => {
        if (open) {
            subApi.plans().then(r => setPlans(r.data)).catch(() => { });
        }
    }, [open]);
    const visiblePlans = useMemo(() => {
        return plans.filter(p => p.id.endsWith(`_${period}`));
    }, [plans, period]);
    const applyPromo = async () => {
        if (!promoCode.trim())
            return;
        setPromoLoading(true);
        try {
            const res = await subApi.validatePromo(promoCode.trim());
            setPromoDiscount(res.data.discountPercent);
            setPromoApplied(true);
            toast.success(`Tabriklaymiz! ${res.data.discountPercent}% chegirma qo'llanildi.`);
        }
        catch (e) {
            toast.error(e.response?.data?.error || 'Promokod xato yoki muddati tugagan');
            setPromoDiscount(0);
            setPromoApplied(false);
        }
        finally {
            setPromoLoading(false);
        }
    };
    const handleBuy = async (planId) => {
        if (!user) {
            toast.error('Avval tizimga kiring');
            return;
        }
        setLoading(true);
        try {
            const { data } = await subApi.createP2POrder(planId, promoApplied ? promoCode.trim() : undefined);
            const adminUsername = window.ADMIN_USERNAME || 'fikra_support';
            if (adminUsername) {
                const text = encodeURIComponent(`Salom! Men FIKRA ilovasidan ${data.order.planName} obunasini olmoqchiman.\n` +
                    `Buyurtma ID: ${data.order.orderId}\n` +
                    `Narx: ${data.order.priceUZS.toLocaleString()} UZS\n\n` +
                    `Rekvizitlarni yuboring!`);
                // Use location.href instead of window.open to avoid popup blockers on mobile PWA
                window.location.href = `https://t.me/${adminUsername}?text=${text}`;
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
    const isFree = !user?.effectivePlan || user.effectivePlan === 'free';
    return (_jsxs(Modal, { open: open, onClose: onClose, title: "\uD83D\uDC8E Obuna rejalari", children: [isFree && (_jsxs("div", { style: {
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--f)',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 16,
                }, children: [_jsxs("div", { style: { fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }, children: [_jsx("span", { children: "\uD83C\uDD93" }), " Bepul tarifingiz cheklovlari (kunlik):"] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, color: 'var(--txt-2)' }, children: [_jsxs("div", { children: ["\u2022 ", _jsx("b", { children: "10 ta" }), " AI tushuntirish"] }), _jsxs("div", { children: ["\u2022 ", _jsx("b", { children: "15 ta" }), " AI xabar"] }), _jsxs("div", { children: ["\u2022 ", _jsx("b", { children: "1 ta" }), " Hujjat (PDF/Doc)"] }), _jsxs("div", { children: ["\u2022 ", _jsx("b", { children: "3 ta" }), " Rasm (OCR)"] }), _jsxs("div", { children: ["\u2022 ", _jsx("b", { children: "2 ta" }), " AI test generatsiya"] }), _jsxs("div", { children: ["\u2022 ", _jsx("b", { children: "3 ta" }), " Material saqlash (har fanga)"] })] }), _jsx("div", { style: { fontSize: 10, color: 'var(--acc-l)', marginTop: 8, fontWeight: 700 }, children: "Cheklovlardan xalos bo'lish uchun obunani tanlang \u2193" })] })), _jsxs("div", { style: {
                    display: 'flex',
                    background: 'var(--s2)',
                    borderRadius: 10,
                    padding: 4,
                    marginBottom: 16,
                    border: '1px solid var(--f)',
                }, children: [_jsx("button", { onClick: () => setPeriod('1m'), style: {
                            flex: 1, padding: '8px 0', border: 'none', borderRadius: 8,
                            background: period === '1m' ? 'var(--s1)' : 'transparent',
                            color: period === '1m' ? 'var(--txt)' : 'var(--txt-3)',
                            fontWeight: period === '1m' ? 800 : 600,
                            fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: period === '1m' ? '0 2px 5px rgba(0,0,0,0.2)' : 'none',
                        }, children: "1 oy" }), _jsx("button", { onClick: () => setPeriod('3m'), style: {
                            flex: 1, padding: '8px 0', border: 'none', borderRadius: 8,
                            background: period === '3m' ? 'var(--s1)' : 'transparent',
                            color: period === '3m' ? 'var(--txt)' : 'var(--txt-3)',
                            fontWeight: period === '3m' ? 800 : 600,
                            fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: period === '3m' ? '0 2px 5px rgba(0,0,0,0.2)' : 'none',
                        }, children: "3 oy" }), _jsxs("button", { onClick: () => setPeriod('12m'), style: {
                            flex: 1, padding: '8px 0', border: 'none', borderRadius: 8,
                            background: period === '12m' ? 'var(--s1)' : 'transparent',
                            color: period === '12m' ? 'var(--txt)' : 'var(--txt-3)',
                            fontWeight: period === '12m' ? 800 : 600,
                            fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: period === '12m' ? '0 2px 5px rgba(0,0,0,0.2)' : 'none',
                        }, children: ["12 oy ", _jsx("span", { style: { color: 'var(--g)', fontSize: 10, verticalAlign: 'top' }, children: "%" })] })] }), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 6,
                    marginBottom: 14,
                }, children: [_jsxs("div", { style: { padding: '8px 6px', background: 'rgba(0,212,170,0.12)', border: '1.5px solid rgba(0,212,170,0.35)', borderRadius: 10, textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: 16 }, children: "\uD83E\uDD1D" }), _jsx("div", { style: { fontSize: 9, fontWeight: 800, color: 'var(--g)', marginTop: 2 }, children: "P2P" }), _jsx("div", { style: { fontSize: 8, color: 'var(--g)' }, children: "Faol" })] }), _jsxs("div", { style: { padding: '8px 6px', background: 'var(--s2)', border: '1px solid var(--f)', borderRadius: 10, textAlign: 'center', opacity: 0.6 }, children: [_jsx("div", { style: { fontSize: 16 }, children: "\uD83D\uDCB3" }), _jsx("div", { style: { fontSize: 9, fontWeight: 800, color: 'var(--txt-2)', marginTop: 2 }, children: "Payme" }), _jsx("div", { style: { fontSize: 8, color: 'var(--txt-3)' }, children: "Tez orada" })] }), _jsxs("div", { style: { padding: '8px 6px', background: 'var(--s2)', border: '1px solid var(--f)', borderRadius: 10, textAlign: 'center', opacity: 0.6 }, children: [_jsx("div", { style: { fontSize: 16 }, children: "\uD83D\uDCB3" }), _jsx("div", { style: { fontSize: 9, fontWeight: 800, color: 'var(--txt-2)', marginTop: 2 }, children: "Click" }), _jsx("div", { style: { fontSize: 8, color: 'var(--txt-3)' }, children: "Tez orada" })] })] }), _jsxs("div", { style: {
                    background: 'var(--s2)', borderRadius: 10, padding: 12, marginBottom: 16, border: '1px solid var(--f)',
                    display: 'flex', gap: 8, alignItems: 'center'
                }, children: [_jsx("div", { style: { fontSize: 16 }, children: "\uD83C\uDF9F\uFE0F" }), _jsx("input", { type: "text", placeholder: "Promokod (agar bo'lsa)", value: promoCode, onChange: e => { setPromoCode(e.target.value); setPromoApplied(false); setPromoDiscount(0); }, style: {
                            flex: 1, background: 'transparent', border: 'none', color: 'var(--txt)',
                            fontSize: 13, outline: 'none', textTransform: 'uppercase'
                        }, disabled: promoApplied || promoLoading }), promoApplied ? (_jsx("span", { style: { color: 'var(--g)', fontSize: 12, fontWeight: 700 }, children: "\u2713 Qo'llanildi" })) : (_jsx("button", { onClick: applyPromo, disabled: !promoCode.trim() || promoLoading, style: {
                            background: 'var(--s3)', border: '1px solid var(--f)', color: 'var(--txt)',
                            padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                            opacity: !promoCode.trim() || promoLoading ? 0.5 : 1
                        }, children: promoLoading ? '...' : "Qo'llash" }))] }), _jsx("div", { style: { display: 'grid', gap: 10 }, children: visiblePlans.map(plan => {
                    const color = tierColor[plan.tier] || 'var(--txt-2)';
                    const emoji = tierEmoji[plan.tier] || '⭐';
                    const isPro = plan.tier === 'pro';
                    const finalPrice = promoApplied
                        ? Math.max(0, Math.round(plan.priceUZS * (1 - promoDiscount / 100)))
                        : plan.priceUZS;
                    return (_jsxs("div", { style: {
                            background: 'var(--s1)',
                            border: `1.5px solid ${isPro ? color : 'var(--f)'}`,
                            borderRadius: 14,
                            padding: 14,
                            position: 'relative',
                        }, children: [isPro && (_jsx("div", { style: {
                                    position: 'absolute', top: -10, right: 12,
                                    background: color, color: '#0a0a14',
                                    fontSize: 9, fontWeight: 800, padding: '3px 10px',
                                    borderRadius: 100, letterSpacing: 0.5,
                                }, children: "OMMABOP" })), plan.badge && !isPro && (_jsx("div", { style: {
                                    position: 'absolute', top: -10, right: 12,
                                    background: 'var(--s2)', color: 'var(--txt-2)', border: '1px solid var(--f)',
                                    fontSize: 9, fontWeight: 800, padding: '2px 8px',
                                    borderRadius: 100,
                                }, children: plan.badge })), plan.badge && isPro && (_jsx("div", { style: {
                                    position: 'absolute', top: -10, right: 90,
                                    background: 'var(--s2)', color: 'var(--txt)', border: `1px solid ${color}`,
                                    fontSize: 9, fontWeight: 800, padding: '2px 8px',
                                    borderRadius: 100,
                                }, children: plan.badge })), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }, children: [_jsx("div", { style: { fontSize: 26 }, children: emoji }), _jsx("div", { style: { flex: 1 }, children: _jsx("div", { style: { fontWeight: 800, fontSize: 16, color }, children: plan.name }) }), _jsxs("div", { style: { textAlign: 'right' }, children: [promoApplied && (_jsx("div", { style: { fontSize: 11, textDecoration: 'line-through', color: 'var(--txt-3)', marginBottom: -2 }, children: plan.priceUZS.toLocaleString() })), _jsx("div", { style: { fontWeight: 900, fontSize: 18, color: promoApplied ? 'var(--g)' : 'inherit' }, children: finalPrice.toLocaleString() }), _jsxs("div", { style: { fontSize: 10, color: 'var(--txt-3)' }, children: ["UZS / ", plan.period] })] })] }), _jsx("div", { style: { display: 'grid', gap: 4, marginBottom: 10 }, children: plan.features.slice(0, 4).map((f, i) => (_jsxs("div", { style: { fontSize: 11, color: 'var(--txt)', display: 'flex', gap: 6 }, children: [_jsx("span", { style: { color }, children: "\u2713" }), _jsx("span", { children: f })] }, i))) }), _jsx("button", { onClick: () => handleBuy(plan.id), disabled: loading, style: {
                                    width: '100%',
                                    background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                                    color: '#0a0a14',
                                    border: 'none',
                                    borderRadius: 10,
                                    padding: '10px 14px',
                                    fontSize: 13,
                                    fontWeight: 800,
                                    cursor: loading ? 'wait' : 'pointer',
                                    opacity: loading ? 0.6 : 1,
                                }, children: loading ? '⏳ ...' : '🤝 P2P orqali olish' })] }, plan.id));
                }) }), _jsxs("div", { style: {
                    marginTop: 14, padding: 12,
                    background: 'rgba(123,104,238,0.06)', border: '1px solid rgba(123,104,238,0.18)',
                    borderRadius: 10, fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.5,
                }, children: ["\uD83E\uDD1D ", _jsx("strong", { children: "P2P (Peer-to-Peer)" }), " \u2014 admin bilan to'g'ridan-to'g'ri to'lov. Admin'ga yozib, kartani to'ldirib chek yuborasiz. Admin obunani faollashtiradi."] })] }));
}
