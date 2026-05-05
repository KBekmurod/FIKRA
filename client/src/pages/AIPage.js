import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { aiApi, examApi, streamChat } from '../api/endpoints';
import { useToast } from '../components/Toast';
import SubscriptionModal from '../components/SubscriptionModal';
export default function AIPage() {
    const [tab, setTab] = useState('chat');
    const [subOpen, setSubOpen] = useState(false);
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "header", children: _jsxs("div", { className: "header-logo", children: ["FIKRA", _jsx("span", { children: "." })] }) }), _jsx("div", { className: "section-title", children: "\uD83E\uDD16 AI yordamchi" }), _jsxs("div", { style: { padding: '0 20px 8px', display: 'flex', gap: 6 }, children: [_jsx(TabButton, { active: tab === 'chat', onClick: () => setTab('chat'), icon: "\uD83D\uDCAC", label: "Chat" }), _jsx(TabButton, { active: tab === 'doc', onClick: () => setTab('doc'), icon: "\uD83D\uDCC4", label: "Hujjat" }), _jsx(TabButton, { active: tab === 'image', onClick: () => setTab('image'), icon: "\uD83C\uDFA8", label: "Rasm" }), _jsx(TabButton, { active: tab === 'analysis', onClick: () => setTab('analysis'), icon: "\uD83D\uDCCA", label: "Tahlil" })] }), tab === 'chat' && _jsx(ChatTab, { onSubOpen: () => setSubOpen(true) }), tab === 'doc' && _jsx(DocTab, { onSubOpen: () => setSubOpen(true) }), tab === 'image' && _jsx(ImageTab, { onSubOpen: () => setSubOpen(true) }), tab === 'analysis' && _jsx(AnalysisTab, { onSubOpen: () => setSubOpen(true) }), _jsx(SubscriptionModal, { open: subOpen, onClose: () => setSubOpen(false) })] }));
}
function TabButton({ active, onClick, icon, label }) {
    return (_jsxs("button", { onClick: onClick, style: {
            flex: 1,
            padding: '10px 8px',
            background: active ? 'var(--acc)' : 'var(--s2)',
            color: active ? 'white' : 'var(--txt-2)',
            border: '1px solid ' + (active ? 'var(--acc)' : 'var(--f)'),
            borderRadius: 'var(--br2)',
            fontWeight: 700,
            fontSize: 12,
            cursor: 'pointer',
            transition: 'all 0.15s',
        }, children: [icon, " ", label] }));
}
// ─── CHAT TAB ─────────────────────────────────────────────────────────
function ChatTab({ onSubOpen }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const { user, refreshUser } = useAppStore();
    const { toast } = useToast();
    const msgsRef = useRef(null);
    useEffect(() => {
        msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);
    const send = async () => {
        const text = input.trim();
        if (!text || sending)
            return;
        setInput('');
        setMessages(m => [...m, { role: 'user', content: text }, { role: 'assistant', content: '' }]);
        setSending(true);
        let full = '';
        await streamChat(text, messages.slice(-10), (chunk) => {
            full += chunk;
            setMessages(m => {
                const copy = [...m];
                copy[copy.length - 1] = { role: 'assistant', content: full };
                return copy;
            });
        }, () => {
            setSending(false);
            refreshUser();
        }, (err) => {
            setSending(false);
            if (err?.code === 'DAILY_LIMIT_REACHED') {
                toast('Bugungi limit tugadi', 'err');
                onSubOpen();
            }
            else if (err?.code === 'SUBSCRIPTION_REQUIRED') {
                onSubOpen();
            }
            else {
                toast(err?.error || 'Xatolik', 'err');
            }
            setMessages(m => m.slice(0, -1)); // bo'sh javobni o'chirish
        });
    };
    const chatsUsed = user?.aiUsage?.chats ?? 0;
    const chatsLimit = user?.aiLimits?.chats;
    const canChat = chatsLimit === null || chatsUsed < chatsLimit;
    return (_jsxs("div", { style: { padding: '0 20px', display: 'flex', flexDirection: 'column', minHeight: '60vh' }, children: [_jsx("div", { style: { fontSize: 11, color: 'var(--txt-3)', marginBottom: 8 }, children: chatsLimit === null ? 'Cheksiz' : `${chatsUsed}/${chatsLimit} bugun` }), _jsxs("div", { ref: msgsRef, style: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12, maxHeight: 'calc(100vh - 280px)' }, children: [!messages.length && (_jsxs("div", { className: "empty", children: ["\uD83E\uDD16 AI bilan suhbatni boshlang.", _jsx("br", {}), "DTM mavzularini so'rashingiz mumkin."] })), messages.map((m, i) => (_jsx("div", { style: {
                            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            padding: '10px 14px',
                            borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                            background: m.role === 'user' ? 'var(--acc)' : 'var(--s2)',
                            color: m.role === 'user' ? 'white' : 'var(--txt)',
                            fontSize: 13,
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                        }, children: m.content || (sending && m.role === 'assistant' ? '...' : '') }, i)))] }), !canChat ? (_jsx("button", { onClick: onSubOpen, className: "btn btn-primary btn-block btn-lg", children: "Limit tugadi \u00B7 Obuna olish \u2197" })) : (_jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("textarea", { className: "textarea", placeholder: "Savol yozing...", value: input, onChange: e => setInput(e.target.value), rows: 2, style: { flex: 1, minHeight: 44 }, onKeyDown: e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                send();
                            }
                        } }), _jsx("button", { disabled: sending || !input.trim(), onClick: send, className: "btn btn-primary", style: { width: 44, padding: 0 }, children: sending ? '⏳' : '→' })] }))] }));
}
// ─── DOC TAB ──────────────────────────────────────────────────────────
function DocTab({ onSubOpen }) {
    const [prompt, setPrompt] = useState('');
    const [format, setFormat] = useState('DOCX');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const { user, refreshUser } = useAppStore();
    const { toast } = useToast();
    const generate = async () => {
        const p = prompt.trim();
        if (!p || loading)
            return;
        setLoading(true);
        setResult(null);
        try {
            const { data } = await aiApi.document(p, format);
            setResult(data);
            refreshUser();
        }
        catch (e) {
            const code = e.response?.data?.code;
            if (code === 'DAILY_LIMIT_REACHED' || code === 'SUBSCRIPTION_REQUIRED') {
                onSubOpen();
            }
            else {
                toast(e.response?.data?.error || 'Xatolik', 'err');
            }
        }
        finally {
            setLoading(false);
        }
    };
    const download = () => {
        if (!result?.downloadUrl)
            return;
        const auth = JSON.parse(localStorage.getItem('fikra_auth') || '{}');
        // To'g'ridan-to'g'ri server URL'iga link
        const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000';
        const url = `${API_BASE}${result.downloadUrl}`;
        // Telegram WebApp'da openLink ishlatamiz
        const tg = window.Telegram?.WebApp;
        if (tg && tg.openLink) {
            tg.openLink(url, { try_instant_view: false });
        }
        else {
            // Brauzerda: oddiy link
            window.open(url, '_blank');
        }
        toast('Yuklab olish boshlandi', 'ok');
    };
    const docsUsed = user?.aiUsage?.docs ?? 0;
    const docsLimit = user?.aiLimits?.docs;
    const canDoc = docsLimit === null || docsUsed < docsLimit;
    return (_jsxs("div", { style: { padding: '0 20px' }, children: [_jsx("div", { style: { fontSize: 11, color: 'var(--txt-3)', marginBottom: 8 }, children: docsLimit === null ? 'Cheksiz' : `${docsUsed}/${docsLimit} bugun` }), _jsx("div", { style: { display: 'flex', gap: 6, marginBottom: 10 }, children: ['DOCX', 'PDF', 'PPTX'].map(f => (_jsx("button", { onClick: () => setFormat(f), style: {
                        flex: 1,
                        padding: 8,
                        background: format === f ? 'var(--g)' : 'var(--s2)',
                        color: format === f ? '#00271e' : 'var(--txt-2)',
                        border: '1px solid ' + (format === f ? 'var(--g)' : 'var(--f)'),
                        borderRadius: 'var(--br2)',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                    }, children: f }, f))) }), _jsx("textarea", { className: "textarea", placeholder: "Hujjat mavzusini yozing... Masalan: 'Mendeleyev davriy jadvali haqida 2 sahifalik referat'", value: prompt, onChange: e => setPrompt(e.target.value), rows: 4, style: { marginBottom: 10 } }), !canDoc ? (_jsx("button", { onClick: onSubOpen, className: "btn btn-primary btn-block btn-lg", children: "Limit tugadi \u00B7 Obuna olish \u2197" })) : (_jsx("button", { disabled: loading || !prompt.trim(), onClick: generate, className: "btn btn-primary btn-block btn-lg", children: loading ? '⏳ Yaratilmoqda...' : '✨ Yaratish' })), result && (_jsxs("div", { style: {
                    marginTop: 16,
                    background: 'rgba(0,212,170,0.07)',
                    border: '1px solid rgba(0,212,170,0.25)',
                    borderRadius: 'var(--br)',
                    padding: 14,
                }, children: [_jsxs("div", { style: { fontWeight: 700, fontSize: 13, marginBottom: 4 }, children: ["\u2705 ", result.fileName] }), _jsxs("div", { style: { fontSize: 11, color: 'var(--txt-3)', marginBottom: 8 }, children: [result.sizeKb, " KB \u00B7 ", result.format] }), _jsxs("div", { style: { fontSize: 12, color: 'var(--txt-2)', marginBottom: 12, lineHeight: 1.5 }, children: [result.preview.slice(0, 200), "..."] }), _jsx("button", { onClick: download, className: "btn btn-success btn-block", children: "\u2B07 Yuklab olish" })] }))] }));
}
// ─── IMAGE TAB ────────────────────────────────────────────────────────
function ImageTab({ onSubOpen }) {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const { user, refreshUser } = useAppStore();
    const { toast } = useToast();
    const generate = async () => {
        const p = prompt.trim();
        if (p.length < 3 || loading)
            return;
        setLoading(true);
        setResult(null);
        try {
            const { data } = await aiApi.image(p);
            setResult(data);
            refreshUser();
        }
        catch (e) {
            const code = e.response?.data?.code;
            if (code === 'DAILY_LIMIT_REACHED' || code === 'SUBSCRIPTION_REQUIRED') {
                onSubOpen();
            }
            else {
                toast(e.response?.data?.error || 'Xatolik', 'err');
            }
        }
        finally {
            setLoading(false);
        }
    };
    const download = () => {
        if (!result?.downloadUrl)
            return;
        const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000';
        const tg = window.Telegram?.WebApp;
        const url = `${API_BASE}${result.downloadUrl}`;
        if (tg?.openLink)
            tg.openLink(url);
        else
            window.open(url, '_blank');
        toast('Yuklab olish boshlandi', 'ok');
    };
    const imagesUsed = user?.aiUsage?.images ?? 0;
    const imagesLimit = user?.aiLimits?.images;
    const canImage = imagesLimit !== 0 && (imagesLimit === null || imagesUsed < imagesLimit);
    if (imagesLimit === 0) {
        return (_jsxs("div", { style: { padding: '20px' }, children: [_jsxs("div", { className: "empty", children: ["\uD83C\uDFA8 AI Rasm yaratish", _jsx("br", {}), _jsx("span", { style: { color: 'var(--acc-l)' }, children: "Basic+ obunada ochiladi" })] }), _jsx("button", { onClick: onSubOpen, className: "btn btn-primary btn-block btn-lg", children: "Obuna ko'rish \u2B50" })] }));
    }
    return (_jsxs("div", { style: { padding: '0 20px' }, children: [_jsx("div", { style: { fontSize: 11, color: 'var(--txt-3)', marginBottom: 8 }, children: imagesLimit === null ? 'Cheksiz' : `${imagesUsed}/${imagesLimit} bugun` }), _jsx("input", { className: "input", placeholder: "Rasm tavsifi (ingliz tilida yaxshiroq)...", value: prompt, onChange: e => setPrompt(e.target.value), style: { marginBottom: 10 } }), !canImage ? (_jsx("button", { onClick: onSubOpen, className: "btn btn-primary btn-block btn-lg", children: "Limit tugadi \u00B7 Obuna \u2197" })) : (_jsx("button", { disabled: loading || prompt.length < 3, onClick: generate, className: "btn btn-primary btn-block btn-lg", children: loading ? '🎨 Yaratilmoqda...' : '🎨 Yaratish' })), result && (_jsxs("div", { style: { marginTop: 16 }, children: [_jsx("img", { src: `data:${result.mimeType};base64,${result.base64}`, style: { width: '100%', borderRadius: 'var(--br)' }, alt: "AI generated" }), _jsx("button", { onClick: download, className: "btn btn-success btn-block", style: { marginTop: 10 }, children: "\u2B07 Yuklab olish" })] }))] }));
}
// ─── ANALYSIS TAB ───────────────────────────────────────────────────────────
function AnalysisTab({ onSubOpen }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const navigate = useNavigate();
    useEffect(() => {
        let alive = true;
        setLoading(true);
        examApi.recommendations()
            .then(({ data }) => {
            if (!alive)
                return;
            setData(data);
        })
            .catch(() => {
            if (alive)
                toast('Tahlil yuklanmadi', 'err');
        })
            .finally(() => {
            if (alive)
                setLoading(false);
        });
        return () => { alive = false; };
    }, [toast]);
    const startDrill = (subject, count) => {
        navigate(`/test?drill=1&subject=${encodeURIComponent(subject)}&count=${count}`);
    };
    return (_jsxs("div", { style: { padding: '0 20px 20px' }, children: [_jsxs("div", { className: "card", style: { marginBottom: 12 }, children: [_jsx("div", { style: { fontWeight: 800, fontSize: 14, marginBottom: 6 }, children: "\uD83D\uDCC8 Tarixdan tavsiyalar" }), loading ? (_jsx("div", { style: { color: 'var(--txt-3)', fontSize: 12 }, children: "Tahlil tayyorlanmoqda..." })) : data ? (_jsxs(_Fragment, { children: [_jsx("div", { style: { fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.6 }, children: data.summary }), data.progress && (_jsxs("div", { style: { marginTop: 10, fontSize: 11, color: 'var(--txt-3)' }, children: ["O'rtacha ball: ", data.progress.overallAvg.toFixed(2), " \u00B7 So'nggi trend: ", data.progress.growthTrend >= 0 ? '+' : '', data.progress.growthTrend, "%"] }))] })) : (_jsx("div", { style: { color: 'var(--txt-3)', fontSize: 12 }, children: "Hozircha ma'lumot yo'q." }))] }), !loading && data && data.recommendations.length > 0 && (_jsxs("div", { className: "card", style: { marginBottom: 12 }, children: [_jsx("div", { style: { fontWeight: 800, fontSize: 14, marginBottom: 8 }, children: "\uD83D\uDCA1 AI tavsiyalar" }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 8 }, children: data.recommendations.map((item, idx) => (_jsxs("div", { style: { fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.6 }, children: ["\u2022 ", item] }, idx))) })] })), !loading && data && data.drillTargets.length > 0 && (_jsxs("div", { className: "card", children: [_jsx("div", { style: { fontWeight: 800, fontSize: 14, marginBottom: 8 }, children: "\u26A1 Drill rejimi" }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 10 }, children: data.drillTargets.map(target => (_jsx("div", { style: { paddingBottom: 10, borderBottom: '1px solid var(--f)' }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 700, fontSize: 13 }, children: target.subjectName }), _jsxs("div", { style: { fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }, children: [target.accuracy, "% to'g'rilik \u00B7 ", target.questionCount, " savol"] })] }), _jsx("button", { className: "btn btn-primary btn-sm", onClick: () => startDrill(target.subject, target.questionCount), children: "Mashq" })] }) }, target.subject))) })] })), !loading && data && data.weakAreas.length === 0 && (_jsxs("div", { className: "card", children: [_jsx("div", { style: { fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.7 }, children: "Hali sezilarli zaif fan topilmadi. Istasangiz, kengaytirilgan testlar ishlang." }), _jsx("button", { className: "btn btn-primary btn-block btn-lg", onClick: onSubOpen, style: { marginTop: 10 }, children: "Obuna yoki AI limit" })] }))] }));
}
