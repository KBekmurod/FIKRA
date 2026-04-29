import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { subApi } from '../api/endpoints';
import Modal from './Modal';
import { useToast } from './Toast';
import { useAppStore } from '../store';
export default function SubscriptionModal({ open, onClose }) {
    const [plans, setPlans] = useState([]);
    const [payMode, setPayMode] = useState('stars');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const { user, refreshUser } = useAppStore();
    useEffect(() => {
        if (open) {
            subApi.plans().then(r => setPlans(r.data)).catch(() => { });
        }
    }, [open]);
    const handleBuy = async (planId) => {
        if (user?._demo) {
            toast('Telegram ichida kiring', 'err');
            return;
        }
        setLoading(true);
        try {
            if (payMode === 'stars') {
                const { data } = await subApi.createInvoice(planId);
                const tg = window.Telegram?.WebApp;
                if (data.invoiceUrl && tg) {
                    tg.openInvoice(data.invoiceUrl, async (status) => {
                        if (status === 'paid') {
                            toast('✅ Obuna faollashtirildi!', 'ok');
                            setTimeout(() => { refreshUser(); onClose(); }, 1500);
                        }
                        else if (status === 'cancelled') {
                            toast('To\'lov bekor qilindi');
                        }
                    });
                }
            }
            else {
                // P2P
                const { data } = await subApi.createP2POrder(planId);
                const adminUsername = window.ADMIN_USERNAME || 'admin';
                const text = encodeURIComponent(`Salom! Men FIKRA ilovasidan ${data.order.planName} obunasini olmoqchiman.\n` +
                    `Buyurtma ID: ${data.order.orderId}\n` +
                    `Narx: ${data.order.priceUZS.toLocaleString()} UZS\n\n` +
                    `Rekvizitlarni yuboring!`);
                const url = `https://t.me/${adminUsername}?text=${text}`;
                const tg = window.Telegram?.WebApp;
                if (tg)
                    tg.openTelegramLink(url);
                else
                    window.open(url, '_blank');
                toast('Buyurtma yaratildi! Admin javob beradi.', 'ok');
                onClose();
            }
        }
        catch (e) {
            toast(e.response?.data?.error || 'Xatolik', 'err');
        }
        finally {
            setLoading(false);
        }
    };
    const tierColor = {
        basic: 'var(--y)', pro: 'var(--acc)', vip: 'var(--g)'
    };
    const tierEmoji = { basic: '⭐', pro: '✨', vip: '💎' };
    return (_jsxs(Modal, { open: open, onClose: onClose, title: "\u2B50 Obuna rejalari", children: [_jsxs("div", { style: { display: 'flex', gap: 8, marginBottom: 14 }, children: [_jsx("button", { onClick: () => setPayMode('stars'), className: "btn btn-block", style: {
                            background: payMode === 'stars' ? 'rgba(123,104,238,0.15)' : 'var(--s2)',
                            color: payMode === 'stars' ? 'var(--acc-l)' : 'var(--txt-2)',
                            border: `1.5px solid ${payMode === 'stars' ? 'var(--acc)' : 'var(--f)'}`,
                        }, children: "\u2B50 Telegram Stars" }), _jsx("button", { onClick: () => setPayMode('p2p'), className: "btn btn-block", style: {
                            background: payMode === 'p2p' ? 'rgba(0,212,170,0.1)' : 'var(--s2)',
                            color: payMode === 'p2p' ? 'var(--g)' : 'var(--txt-2)',
                            border: `1.5px solid ${payMode === 'p2p' ? 'var(--g)' : 'var(--f)'}`,
                        }, children: "\uD83D\uDCB3 P2P (Bank)" })] }), _jsx("div", { style: {
                    background: payMode === 'stars' ? 'rgba(123,104,238,0.07)' : 'rgba(0,212,170,0.07)',
                    border: '1px solid var(--f)',
                    borderRadius: 'var(--br2)',
                    padding: '10px 12px',
                    marginBottom: 14,
                    fontSize: 12,
                    color: 'var(--txt-2)',
                }, children: payMode === 'stars'
                    ? 'Telegram Stars orqali to\'g\'ridan-to\'g\'ri. Darhol faollanadi.'
                    : 'Karta orqali: ID olasiz → Adminga chek yuborasiz → Admin tasdiqlaydi.' }), plans.map(p => (_jsxs("div", { style: {
                    background: 'var(--s2)',
                    border: `1.5px solid ${p.tier === 'pro' ? 'var(--acc)' : 'var(--f)'}`,
                    borderRadius: 'var(--br)',
                    padding: 14,
                    marginBottom: 10,
                    position: 'relative',
                }, children: [p.badge && (_jsx("div", { style: {
                            position: 'absolute', top: -8, right: 12,
                            background: tierColor[p.tier], color: '#000',
                            fontSize: 10, fontWeight: 800, padding: '2px 10px', borderRadius: 100
                        }, children: p.badge })), _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 6 }, children: [_jsx("span", { style: { fontSize: 18 }, children: tierEmoji[p.tier] }), _jsx("span", { style: { fontWeight: 800, fontSize: 15, color: tierColor[p.tier] }, children: p.name }), _jsx("span", { style: { fontSize: 12, color: 'var(--txt-3)' }, children: p.period })] }), _jsx("div", { style: { fontWeight: 800, fontSize: 16 }, children: payMode === 'stars' ? `${p.priceStars}⭐` : `${p.priceUZS.toLocaleString()} UZS` })] }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }, children: p.features.map((f, i) => (_jsx("div", { style: {
                                fontSize: 11, color: 'var(--txt-2)',
                                background: 'var(--s3)', borderRadius: 6, padding: '3px 8px'
                            }, children: f }, i))) }), _jsx("button", { disabled: loading, onClick: () => handleBuy(p.id), className: `btn btn-block ${p.tier === 'pro' ? 'btn-primary' : 'btn-ghost'}`, children: "Obuna olish \u2192" })] }, p.id))), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-3)', textAlign: 'center', paddingTop: 8 }, children: "Telegram Stars to'lovlari qaytarilmaydi" })] }));
}
