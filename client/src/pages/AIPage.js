import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store';
import { aiApi, streamChat } from '../api/endpoints';
import { useToast } from '../components/Toast';
import SubscriptionModal from '../components/SubscriptionModal';
export default function AIPage() {
    const [tab, setTab] = useState('chat');
    const [subOpen, setSubOpen] = useState(false);
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "header", children: _jsxs("div", { className: "header-logo", children: ["FIKRA", _jsx("span", { children: "." })] }) }), _jsx("div", { className: "section-title", children: "\uD83E\uDD16 AI yordamchi" }), _jsxs("div", { style: { padding: '0 20px 8px', display: 'flex', gap: 6 }, children: [_jsx(TabButton, { active: tab === 'chat', onClick: () => setTab('chat'), icon: "\uD83D\uDCAC", label: "Chat" }), _jsx(TabButton, { active: tab === 'doc', onClick: () => setTab('doc'), icon: "\uD83D\uDCC4", label: "Hujjat" }), _jsx(TabButton, { active: tab === 'image', onClick: () => setTab('image'), icon: "\uD83C\uDFA8", label: "Rasm" })] }), tab === 'chat' && _jsx(ChatTab, { onSubOpen: () => setSubOpen(true) }), tab === 'doc' && _jsx(DocTab, { onSubOpen: () => setSubOpen(true) }), tab === 'image' && _jsx(ImageTab, { onSubOpen: () => setSubOpen(true) }), _jsx(SubscriptionModal, { open: subOpen, onClose: () => setSubOpen(false) })] }));
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
    // Keyboard ochilganda scroll oxiriga — requestAnimationFrame bilan (DOM ready)
    useEffect(() => {
        if (!msgsRef.current)
            return;
        const el = msgsRef.current;
        requestAnimationFrame(() => {
            el.scrollTop = el.scrollHeight;
        });
    }, [messages]);
    return (_jsxs("div", { className: "chat-wrap", children: [_jsx("div", { style: { padding: '4px 20px 6px', fontSize: 11, color: 'var(--txt-3)', flexShrink: 0 }, children: chatsLimit === null ? 'Cheksiz' : `${chatsUsed}/${chatsLimit} bugun ishlatildi` }), _jsxs("div", { ref: msgsRef, className: "chat-messages", children: [!messages.length && (_jsxs("div", { className: "empty", children: ["\uD83E\uDD16 AI bilan suhbatni boshlang.", _jsx("br", {}), "DTM mavzularini so'rashingiz mumkin."] })), messages.map((m, i) => (_jsx("div", { style: {
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
                        }, children: m.content || (sending && m.role === 'assistant' ? '...' : '') }, i)))] }), !canChat ? (_jsx("div", { className: "chat-input-bar", children: _jsx("button", { onClick: onSubOpen, className: "btn btn-primary btn-block", children: "Limit tugadi \u00B7 Obuna olish \u2197" }) })) : (_jsxs("div", { className: "chat-input-bar", children: [_jsx("textarea", { className: "textarea", placeholder: "Savol yozing...", value: input, onChange: e => setInput(e.target.value), rows: 2, style: { flex: 1, minHeight: 44, maxHeight: 120, fontSize: 14 }, onKeyDown: e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                send();
                            }
                        } }), _jsx("button", { disabled: sending || !input.trim(), onClick: send, className: "btn btn-primary", style: { width: 44, height: 44, padding: 0, flexShrink: 0 }, children: sending ? _jsx("span", { className: "spin", style: { width: 16, height: 16, borderWidth: 2 } }) : '→' })] }))] }));
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
