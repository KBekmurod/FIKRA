import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { examApi, profileApi } from '../api/endpoints';
import SubscriptionModal from '../components/SubscriptionModal';
import { useToast } from '../components/Toast';
export default function ProfilePage() {
    const { user } = useAppStore();
    const [subOpen, setSubOpen] = useState(false);
    const [installOpen, setInstallOpen] = useState(false);
    const [certOpen, setCertOpen] = useState(false);
    const [certificates, setCertificates] = useState([]);
    const [certForm, setCertForm] = useState({ type: 'ielts', subjectId: 'ingliz', level: '', certificateNumber: '' });
    const [certLoading, setCertLoading] = useState(false);
    const [weakSubjects, setWeakSubjects] = useState([]);
    const [weakLoading, setWeakLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();
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
    const addCertificate = async () => {
        setCertLoading(true);
        try {
            await profileApi.addCertificate(certForm);
            toast('Sertifikat saqlandi! Adminning tasdiqini kutishda...', 'ok');
            setCertForm({ type: 'ielts', subjectId: 'ingliz', level: '', certificateNumber: '' });
            setCertOpen(false);
        }
        catch (err) {
            toast(err.message || 'Xato', 'err');
        }
        finally {
            setCertLoading(false);
        }
    };
    useEffect(() => {
        let alive = true;
        setWeakLoading(true);
        profileApi.certificates()
            .then(({ data }) => {
            if (!alive)
                return;
            setCertificates(data.certificates || []);
        })
            .catch(() => {
            if (alive)
                setCertificates([]);
        });
        examApi.weakSubjects()
            .then(({ data }) => {
            if (!alive)
                return;
            setWeakSubjects(data.weakSubjects || []);
        })
            .catch(() => {
            if (alive)
                setWeakSubjects([]);
        })
            .finally(() => {
            if (alive)
                setWeakLoading(false);
        });
        return () => { alive = false; };
    }, []);
    const startDrill = (subject, count = 5) => {
        navigate(`/test?drill=1&subject=${encodeURIComponent(subject)}&count=${count}`);
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
                            }, children: initials }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 16 }, children: user?.firstName || user?.username || 'Foydalanuvchi' }), user?.username && (_jsxs("div", { style: { fontSize: 12, color: 'var(--txt-3)', marginTop: 2 }, children: ["@", user.username] })), _jsxs("div", { style: { fontSize: 11, color: 'var(--y)', marginTop: 4, fontWeight: 700 }, children: ["\u26A1 ", (user?.xp || 0).toLocaleString(), " XP"] })] })] }) }), _jsxs("div", { style: { padding: '12px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }, children: [_jsxs("div", { className: "card", style: { textAlign: 'center', padding: 12 }, children: [_jsx("div", { style: { fontWeight: 800, fontSize: 22, color: 'var(--acc-l)' }, children: user?.streakDays || 0 }), _jsx("div", { style: { fontSize: 10, color: 'var(--txt-3)' }, children: "\uD83D\uDD25 Streak" })] }), _jsxs("div", { className: "card", style: { textAlign: 'center', padding: 12 }, children: [_jsx("div", { style: { fontWeight: 800, fontSize: 22, color: 'var(--g)' }, children: user?.totalGamesPlayed || 0 }), _jsx("div", { style: { fontSize: 10, color: 'var(--txt-3)' }, children: "\uD83D\uDCDA Test" })] }), _jsxs("div", { className: "card", style: { textAlign: 'center', padding: 12 }, children: [_jsx("div", { style: { fontWeight: 800, fontSize: 22, color: 'var(--y)' }, children: user?.totalAiRequests || 0 }), _jsx("div", { style: { fontSize: 10, color: 'var(--txt-3)' }, children: "\uD83E\uDD16 AI" })] })] }), _jsx("div", { className: "section-title", children: "\uD83D\uDCCA Zaif fanlar" }), _jsx("div", { style: { padding: '0 20px 0' }, children: _jsx("div", { className: "card", children: weakLoading ? (_jsx("div", { style: { fontSize: 12, color: 'var(--txt-3)' }, children: "Tahlil yuklanmoqda..." })) : weakSubjects.length ? (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 10 }, children: weakSubjects.slice(0, 3).map(item => (_jsxs("div", { style: { paddingBottom: 10, borderBottom: '1px solid var(--f)' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 700, fontSize: 13 }, children: item.subjectName }), _jsxs("div", { style: { fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }, children: [item.correctAnswers, "/", item.totalAnswered, " to'g'ri \u00B7 ", item.accuracy.toFixed(1), "%"] })] }), _jsx("button", { onClick: () => startDrill(item.subject, item.level === 'veryWeak' ? 7 : 5), className: "btn btn-ghost btn-sm", children: "\u26A1 Drill" })] }), _jsx("div", { style: { height: 4, background: 'var(--s2)', borderRadius: 100, marginTop: 8 }, children: _jsx("div", { style: {
                                            height: '100%',
                                            width: `${Math.max(10, item.accuracy)}%`,
                                            background: item.accuracy < 50 ? 'var(--r)' : 'var(--y)',
                                            borderRadius: 100,
                                        } }) })] }, item.subject))) })) : (_jsx("div", { style: { fontSize: 12, color: 'var(--txt-3)', lineHeight: 1.6 }, children: "Hali yetarli test tarixi yo'q. Bir nechta test ishlang, keyin zaif fanlar tahlili chiqadi." })) }) }), _jsx("div", { className: "section-title", children: "Obuna" }), _jsx("div", { style: { padding: '0 20px' }, children: _jsx("button", { onClick: () => setSubOpen(true), style: {
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
                                            : 'AI imkoniyatlarni cheksiz oching' })] }), _jsx("div", { style: { fontSize: 11, color: 'var(--acc-l)', fontWeight: 700 }, children: isSub ? 'Uzaytirish ↗' : 'Obuna ↗' })] }) }) }), _jsx("div", { className: "section-title", children: "\uD83D\uDE80 Ilovani boshqaruvi" }), _jsx("div", { style: { padding: '0 20px' }, children: _jsxs("button", { onClick: () => setInstallOpen(true), style: {
                        width: '100%',
                        background: 'linear-gradient(135deg, var(--acc), var(--acc-l))',
                        border: 'none',
                        borderRadius: 'var(--br)',
                        padding: 16,
                        cursor: 'pointer',
                        color: 'white',
                        textAlign: 'left',
                        fontWeight: 700,
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        transition: 'transform 0.2s'
                    }, onMouseEnter: (e) => (e.currentTarget.style.transform = 'scale(1.02)'), onMouseLeave: (e) => (e.currentTarget.style.transform = 'scale(1)'), children: ["\uD83D\uDCF1 Ilovani o'rnating / Yangilash", _jsx("span", { style: { marginLeft: 'auto' }, children: "\u2197" })] }) }), installOpen && (_jsx("div", { style: {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    zIndex: 2000
                }, onClick: () => setInstallOpen(false), children: _jsxs("div", { onClick: (e) => e.stopPropagation(), style: {
                        width: '100%',
                        background: 'var(--bg)',
                        borderTopLeftRadius: '20px',
                        borderTopRightRadius: '20px',
                        padding: '20px',
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }, children: [_jsxs("div", { style: {
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '20px'
                            }, children: [_jsx("h2", { style: { margin: 0, fontSize: '20px' }, children: "\uD83D\uDCF1 Ilovani o'rnating" }), _jsx("button", { onClick: () => setInstallOpen(false), style: {
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '20px',
                                        cursor: 'pointer',
                                        color: 'var(--txt-2)'
                                    }, children: "\u2715" })] }), _jsxs("div", { style: {
                                background: 'var(--s2)',
                                padding: '15px',
                                borderRadius: '10px',
                                marginBottom: '15px'
                            }, children: [_jsx("p", { style: { margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '12px' }, children: "\uD83D\uDCCC Ilovaning URL manzili:" }), _jsxs("div", { style: {
                                        background: 'var(--bg)',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '10px',
                                        borderLeft: '3px solid var(--acc)'
                                    }, children: [_jsx("code", { style: {
                                                fontSize: '11px',
                                                color: 'var(--acc)',
                                                flex: 1,
                                                wordBreak: 'break-all',
                                                fontFamily: 'monospace'
                                            }, children: window.location.origin }), _jsx("button", { onClick: () => {
                                                navigator.clipboard.writeText(window.location.origin);
                                                toast('✓ URL nusxalandi!', 'ok');
                                            }, style: {
                                                padding: '8px 12px',
                                                background: 'var(--acc)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap'
                                            }, children: "\uD83D\uDCCB Nusxa" })] })] }), _jsxs("div", { style: {
                                background: 'var(--s2)',
                                padding: '15px',
                                borderRadius: '10px',
                                marginBottom: '15px'
                            }, children: [_jsx("p", { style: {
                                        margin: '0 0 12px 0',
                                        fontWeight: 'bold',
                                        fontSize: '12px'
                                    }, children: "\uD83D\uDCF1 Bosqichma-bosqich (Telegram ichidan):" }), _jsxs("ol", { style: {
                                        margin: 0,
                                        paddingLeft: '20px',
                                        fontSize: '13px',
                                        lineHeight: '1.8',
                                        color: 'var(--txt-2)'
                                    }, children: [_jsxs("li", { children: [_jsx("strong", { children: "Chrome brauzerini oching" }), " (Telegram brauzer emas)"] }), _jsxs("li", { children: ["URL nusxasini ", _jsx("strong", { children: "manzil sariyasiga paste qiling" })] }), _jsxs("li", { children: [_jsx("strong", { children: "3 nuqta tugmasini bosing" }), " (\u22EE) o\u02BBng burchakda"] }), _jsxs("li", { children: [_jsx("strong", { children: "\"Ekranga qo\u02BBshish\"" }), " yoki ", _jsx("strong", { children: "\"O'rnatish\"" }), " bosing"] }), _jsxs("li", { children: [_jsx("strong", { children: "\u2705 Tayyor!" }), " Ilovasi smartfonyungizda paydo bo\u02BBladi"] })] })] }), _jsx("button", { onClick: () => {
                                window.open(window.location.origin, '_blank');
                                setInstallOpen(false);
                            }, style: {
                                width: '100%',
                                padding: '12px',
                                background: 'var(--acc)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                cursor: 'pointer',
                                marginBottom: '8px'
                            }, children: "\uD83C\uDF10 Chrome-da ochish" }), _jsx("button", { onClick: () => setInstallOpen(false), style: {
                                width: '100%',
                                padding: '12px',
                                background: 'var(--s2)',
                                color: 'var(--txt-2)',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }, children: "Yopish" })] }) })), _jsx("div", { style: { padding: '12px 20px 0' }, children: _jsxs("div", { className: "card", children: [_jsx("div", { style: { fontWeight: 700, fontSize: 12, marginBottom: 10, color: 'var(--txt-2)' }, children: "Bugungi AI limit" }), [
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
                        })] }) }), _jsx("div", { className: "section-title", children: "\uD83D\uDCDC Sertifikatlar" }), _jsxs("div", { style: { padding: '0 20px 24px' }, children: [_jsx("button", { onClick: () => setCertOpen(true), style: {
                            width: '100%',
                            background: 'var(--s1)',
                            border: '1.5px dashed rgba(123,104,238,0.4)',
                            borderRadius: 'var(--br)',
                            padding: 16,
                            cursor: 'pointer',
                            color: 'var(--acc)',
                            textAlign: 'center',
                            fontWeight: 700,
                            fontSize: 14,
                            marginBottom: 12,
                        }, children: "\uFF0B Sertifikat qo'shish" }), certificates.length > 0 && (_jsx("div", { className: "card", children: certificates.map((cert, idx) => (_jsx("div", { style: { padding: '10px 0', borderBottom: idx < certificates.length - 1 ? '1px solid var(--f)' : 'none' }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }, children: [_jsxs("div", { children: [_jsxs("div", { style: { fontSize: 12, fontWeight: 700, color: 'var(--txt)' }, children: [cert.type === 'ielts' ? 'IELTS' : cert.type === 'cefr' ? 'CEFR' : 'Milliy', " \u2014 ", cert.subjectId] }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }, children: cert.level && `Level: ${cert.level}` })] }), _jsx("div", { style: {
                                            padding: '4px 8px',
                                            borderRadius: 6,
                                            fontSize: 10,
                                            fontWeight: 700,
                                            background: cert.verificationStatus === 'verified' ? 'rgba(0,212,170,0.15)' : cert.verificationStatus === 'pending' ? 'rgba(241,196,15,0.15)' : 'rgba(231,76,60,0.15)',
                                            color: cert.verificationStatus === 'verified' ? 'var(--g)' : cert.verificationStatus === 'pending' ? 'var(--y)' : 'var(--r)',
                                        }, children: cert.verificationStatus === 'verified' ? '✓ Tasdiqlangan' : cert.verificationStatus === 'pending' ? '⏳ Kutilmoqda' : '✕ Rad etildi' })] }) }, idx))) })), certificates.length === 0 && (_jsx("div", { style: {
                            padding: 16,
                            background: 'var(--s1)',
                            borderRadius: 'var(--br)',
                            textAlign: 'center',
                            color: 'var(--txt-3)',
                            fontSize: 12,
                        }, children: "Sertifikat qo'shilmagan. Sertifikat qo'shsangiz, belgilangan fanlardan avtomatik to'la ball olasiz." }))] }), certOpen && (_jsx("div", { style: {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    zIndex: 2000
                }, onClick: () => setCertOpen(false), children: _jsxs("div", { onClick: (e) => e.stopPropagation(), style: {
                        width: '100%',
                        background: 'var(--bg)',
                        borderTopLeftRadius: '20px',
                        borderTopRightRadius: '20px',
                        padding: '20px',
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }, children: [_jsx("h2", { style: { margin: 0, fontSize: '20px' }, children: "\uD83D\uDCDC Sertifikat qo'shish" }), _jsx("button", { onClick: () => setCertOpen(false), style: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--txt-2)' }, children: "\u2715" })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }, children: [_jsxs("div", { children: [_jsx("label", { style: { fontSize: 12, fontWeight: 700, color: 'var(--txt-2)' }, children: "Sertifikat turi" }), _jsxs("select", { value: certForm.type, onChange: (e) => setCertForm({ ...certForm, type: e.target.value }), style: {
                                                width: '100%',
                                                padding: '10px',
                                                marginTop: 6,
                                                borderRadius: 'var(--br2)',
                                                border: '1px solid var(--f)',
                                                background: 'var(--bg)',
                                                color: 'var(--txt)',
                                                fontSize: 14,
                                            }, children: [_jsx("option", { value: "ielts", children: "IELTS (ingliz tili)" }), _jsx("option", { value: "cefr", children: "CEFR (ingliz tili sertifikati)" }), _jsx("option", { value: "national", children: "Milliy sertifikat" })] })] }), _jsxs("div", { children: [_jsx("label", { style: { fontSize: 12, fontWeight: 700, color: 'var(--txt-2)' }, children: "Fan" }), _jsxs("select", { value: certForm.subjectId, onChange: (e) => setCertForm({ ...certForm, subjectId: e.target.value }), style: {
                                                width: '100%',
                                                padding: '10px',
                                                marginTop: 6,
                                                borderRadius: 'var(--br2)',
                                                border: '1px solid var(--f)',
                                                background: 'var(--bg)',
                                                color: 'var(--txt)',
                                                fontSize: 14,
                                            }, children: [_jsx("option", { value: "ingliz", children: "Ingliz tili" }), _jsx("option", { value: "uztil", children: "Ona tili" }), _jsx("option", { value: "math", children: "Matematika" }), _jsx("option", { value: "tarix", children: "O'zbekiston tarixi" }), _jsx("option", { value: "bio", children: "Biologiya" }), _jsx("option", { value: "kimyo", children: "Kimyo" }), _jsx("option", { value: "fizika", children: "Fizika" }), _jsx("option", { value: "inform", children: "Informatika" }), _jsx("option", { value: "iqtisod", children: "Iqtisodiyot" }), _jsx("option", { value: "rus", children: "Rus tili" }), _jsx("option", { value: "geo", children: "Geografiya" }), _jsx("option", { value: "adab", children: "Adabiyot" })] })] }), _jsxs("div", { children: [_jsx("label", { style: { fontSize: 12, fontWeight: 700, color: 'var(--txt-2)' }, children: "Level/Band (ixtiyoriy)" }), _jsx("input", { type: "text", placeholder: "IELTS: 7.5, CEFR: C1", value: certForm.level, onChange: (e) => setCertForm({ ...certForm, level: e.target.value }), style: {
                                                width: '100%',
                                                padding: '10px',
                                                marginTop: 6,
                                                borderRadius: 'var(--br2)',
                                                border: '1px solid var(--f)',
                                                background: 'var(--bg)',
                                                color: 'var(--txt)',
                                                fontSize: 14,
                                            } })] }), _jsxs("div", { children: [_jsx("label", { style: { fontSize: 12, fontWeight: 700, color: 'var(--txt-2)' }, children: "Sertifikat raqami (ixtiyoriy)" }), _jsx("input", { type: "text", placeholder: "Certificate number", value: certForm.certificateNumber, onChange: (e) => setCertForm({ ...certForm, certificateNumber: e.target.value }), style: {
                                                width: '100%',
                                                padding: '10px',
                                                marginTop: 6,
                                                borderRadius: 'var(--br2)',
                                                border: '1px solid var(--f)',
                                                background: 'var(--bg)',
                                                color: 'var(--txt)',
                                                fontSize: 14,
                                            } })] })] }), _jsx("button", { onClick: addCertificate, disabled: certLoading, style: {
                                width: '100%',
                                padding: '12px',
                                background: 'var(--acc)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                cursor: certLoading ? 'not-allowed' : 'pointer',
                                opacity: certLoading ? 0.7 : 1,
                            }, children: certLoading ? '⏳ Saqlanimoqda...' : '✓ Saqlash' })] }) })), _jsx("div", { className: "section-title", children: "Do'stni taklif qiling" }), _jsx("div", { style: { padding: '0 20px 24px' }, children: _jsxs("div", { className: "card", children: [_jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginBottom: 8 }, children: "Sizning havolangiz" }), _jsx("div", { style: {
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
