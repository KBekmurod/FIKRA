var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
import { useState, useRef, useEffect } from 'react';
import { useAppStore, useAiStore } from '../store';
import { aiApi, streamChat } from '../api/endpoints';
import { useToast } from '../components/Toast';
import SubscriptionModal from '../components/SubscriptionModal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
export default function AIPage() {
    var _a = useState('chat'), tab = _a[0], setTab = _a[1];
    var _b = useState(false), subOpen = _b[0], setSubOpen = _b[1];
    return (<>
      <div className="header">
        <div className="header-logo">FIKRA<span>.</span></div>
      </div>

      <div className="section-title">🤖 AI yordamchi</div>

      
      <div style={{ padding: '0 20px 8px', display: 'flex', gap: 6 }}>
        <TabButton active={tab === 'chat'} onClick={function () { return setTab('chat'); }} icon="💬" label="Suhbat (Chat)"/>
        <TabButton active={tab === 'doc'} onClick={function () { return setTab('doc'); }} icon="📄" label="Hujjat yaratish"/>
      </div>

      {tab === 'chat' && <ChatTab onSubOpen={function () { return setSubOpen(true); }}/>}
      {tab === 'doc' && <DocTab onSubOpen={function () { return setSubOpen(true); }}/>}

      <SubscriptionModal open={subOpen} onClose={function () { return setSubOpen(false); }}/>
    </>);
}
function TabButton(_a) {
    var active = _a.active, onClick = _a.onClick, icon = _a.icon, label = _a.label;
    return (<button onClick={onClick} style={{
        flex: 1,
        padding: '10px 8px',
        background: active ? 'var(--acc)' : 'var(--s2)',
        color: active ? 'white' : 'var(--txt-2)',
        border: '1px solid ' + (active ? 'var(--acc)' : 'var(--f)'),
        borderRadius: 'var(--br2)',
        fontWeight: 700,
        fontSize: 12,
        cursor: 'pointer',
        transition: 'all 0.15s'
    }}>
      {icon} {label}
    </button>);
}
// ─── CHAT TAB ─────────────────────────────────────────────────────────
function ChatTab(_a) {
    var _this = this;
    var onSubOpen = _a.onSubOpen;
    var _b = useAppStore(), user = _b.user, refreshUser = _b.refreshUser, setAuthModalOpen = _b.setAuthModalOpen;
    var _c = useAiStore(), sessionId = _c.chatSessionId, messages = _c.chatMessages, input = _c.chatInput, sending = _c.chatSending, setChatState = _c.setChatState;
    var _d = useState(false), showHistoryModal = _d[0], setShowHistoryModal = _d[1];
    var _e = useState([]), sessions = _e[0], setSessions = _e[1];
    var toast = useToast().toast;
    var msgsRef = useRef(null);
    // Fetch sessions on mount
    useEffect(function () {
        if (!user)
            return;
        fetchSessions();
    }, [user]);
    var fetchSessions = function () { return __awaiter(_this, void 0, void 0, function () {
        var data, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, aiApi.chatSessions()];
                case 1:
                    data = (_a.sent()).data;
                    setSessions(data.sessions || []);
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    console.error(e_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var loadSession = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var data, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, aiApi.chatSession(id)];
                case 1:
                    data = (_a.sent()).data;
                    if (data.session) {
                        setChatState({ chatSessionId: data.session._id, chatMessages: data.session.messages, chatSending: false });
                        setShowHistoryModal(false);
                    }
                    return [3 /*break*/, 3];
                case 2:
                    e_2 = _a.sent();
                    toast('Sessiyani yuklashda xatolik', 'err');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var deleteSession = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!window.confirm("Haqiqatan ham bu suhbatni o'chirmoqchimisiz?"))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, aiApi.deleteChatSession(id)];
                case 2:
                    _a.sent();
                    setSessions(function (s) { return s.filter(function (x) { return x._id !== id; }); });
                    if (sessionId === id) {
                        setChatState({ chatSessionId: null, chatMessages: [] });
                    }
                    toast("Suhbat o'chirildi", 'ok');
                    return [3 /*break*/, 4];
                case 3:
                    e_3 = _a.sent();
                    toast("Xatolik", 'err');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var startNewSession = function () {
        setChatState({ chatSessionId: null, chatMessages: [] });
        setShowHistoryModal(false);
    };
    var send = function () { return __awaiter(_this, void 0, void 0, function () {
        var text, full;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!user)
                        return [2 /*return*/, setAuthModalOpen(true)];
                    text = input.trim();
                    if (!text || sending)
                        return [2 /*return*/];
                    setChatState({ chatInput: '', chatMessages: messages.concat([{ role: 'user', content: text }, { role: 'assistant', content: '' }]), chatSending: true });
                    full = '';
                    return [4 /*yield*/, streamChat(text, sessionId, function (chunk) {
                            full += chunk;
                            setChatState({ chatMessages: messages.concat([{ role: 'user', content: text }, { role: 'assistant', content: full }]) });
                        }, function (newId) {
                            if (!sessionId)
                                setChatState({ chatSessionId: newId });
                        }, function () {
                            setChatState({ chatSending: false });
                            refreshUser();
                            fetchSessions(); // Update history titles
                        }, function (err) {
                            setChatState({ chatSending: false, chatMessages: messages.concat([{ role: 'user', content: text }]) });
                            if (err ? .code === 'DAILY_LIMIT_REACHED' : ) {
                                toast('Bugungi limit tugadi', 'err');
                                onSubOpen();
                            }
                            else if (err ? .code === 'SUBSCRIPTION_REQUIRED' : ) {
                                onSubOpen();
                            }
                            else {
                                toast(err ? .error || 'Xatolik' : , 'err');
                            }
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var chatsUsed = user ? .aiUsage ? .chats ?  ? 0
        :
        :
        :
        :
    ;
    var chatsLimit = user ? .aiLimits ? .chats
        :
        :
    ;
    var canChat = chatsLimit === null || chatsUsed < chatsLimit;
    useEffect(function () {
        if (!msgsRef.current)
            return;
        var el = msgsRef.current;
        requestAnimationFrame(function () {
            el.scrollTop = el.scrollHeight;
        });
    }, [messages]);
    return (<div className="chat-wrap">
      <div style={{
        padding: '4px 20px 6px',
        fontSize: 11,
        color: 'var(--txt-3)',
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    }}>
        <span>{chatsLimit === null ? 'Cheksiz' : chatsUsed + "/" + chatsLimit + " bugun ishlatildi"}</span>
        <button onClick={function () { return setShowHistoryModal(true); }} style={{
        background: 'none',
        border: '1px solid var(--f)',
        borderRadius: 100,
        color: 'var(--txt-2)',
        fontSize: 10,
        fontWeight: 700,
        padding: '4px 12px',
        cursor: 'pointer',
        display: 'flex', gap: 4, alignItems: 'center'
    }}>
          📂 Suhbatlar
        </button>
      </div>

      {showHistoryModal && (<div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '60px 20px', overflowY: 'auto'
    }}>
          <div style={{
        background: 'var(--s1)', border: '1px solid var(--f)',
        borderRadius: 18, padding: 22, width: '100%', maxWidth: 400
    }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Suhbatlar tarixi</div>
              <button onClick={function () { return setShowHistoryModal(false); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            
            <button onClick={startNewSession} className="btn btn-success btn-block" style={{ marginBottom: 16 }}>
              + Yangi suhbat
            </button>

            <div style={{ maxHeight: '50vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!sessions.length && <div style={{ fontSize: 12, color: 'var(--txt-3)', textAlign: 'center', padding: '20px 0' }}>Suhbatlar yo'q</div>}
              {sessions.map(function (s) { return (<div key={s._id} style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 14px', background: s._id === sessionId ? 'var(--acc-10)' : 'var(--s2)',
        border: '1px solid ' + (s._id === sessionId ? 'var(--acc)' : 'var(--f)'),
        borderRadius: 12, cursor: 'pointer'
    }}>
                  <div onClick={function () { return loadSession(s._id); }} style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {s.title || 'Yangi suhbat'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 4 }}>
                      {new Date(s.updatedAt).toLocaleString('uz-UZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                    </div>
                  </div>
                  <button onClick={function () { return deleteSession(s._id); }} style={{
        background: 'none', border: 'none', color: 'var(--r)', padding: '5px', cursor: 'pointer'
    }}>🗑</button>
                </div>); })}
            </div>
          </div>
        </div>)}

      <div ref={msgsRef} className="chat-messages">
        {!messages.length && (<div className="empty">
            🤖 AI bilan suhbatni boshlang.<br />
            Savol bering yoki yordam so'rang.
          </div>)}
        {messages.map(function (m, i) { return (<div key={i} style={{
        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
        maxWidth: '90%',
        padding: m.role === 'user' ? '10px 14px' : '0px 0px',
        borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        background: m.role === 'user' ? 'var(--acc)' : 'transparent',
        color: m.role === 'user' ? 'white' : 'var(--txt)',
        fontSize: 13,
        lineHeight: 1.5,
        wordBreak: 'break-word'
    }}>
            {m.role === 'user' ? (<div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>) : (<div className="markdown-body" style={{
        background: 'var(--s2)', padding: '14px', borderRadius: '14px 14px 14px 4px', border: '1px solid var(--f)'
    }}>
                {m.content ? (<ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        code: function (_a) {
            var node = _a.node, inline = _a.inline, className = _a.className, children = _a.children, props = __rest(_a, ["node", "inline", "className", "children"]);
            var match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (<SyntaxHighlighter style={atomDark} language={match[1]} PreTag="div" {...props}>
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>) : (<code className={className} {...props}>
                            {children}
                          </code>);
        }
    }}>
                    {m.content}
                  </ReactMarkdown>) : (sending && i === messages.length - 1 ? <span className="spin" style={{ display: 'inline-block', width: 12, height: 12, borderWidth: 2 }}/> : '')}
              </div>)}
          </div>); })}
      </div>

      {!canChat ? (<div className="chat-input-bar">
          <button onClick={onSubOpen} className="btn btn-primary btn-block">
            Limit tugadi · Obuna olish ↗
          </button>
        </div>) : (<div className="chat-input-bar">
          <textarea className="textarea" placeholder="Xabar yozing..." value={input} onChange={function (e) { return setChatState({ chatInput: e.target.value }); }} rows={2} style={{ flex: 1, minHeight: 44, maxHeight: 120, fontSize: 14 }} onKeyDown={function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    }}/>
          <button disabled={sending || !input.trim()} onClick={send} className="btn btn-primary" style={{ width: 44, height: 44, padding: 0, flexShrink: 0 }}>
            {sending ? <span className="spin" style={{ width: 16, height: 16, borderWidth: 2 }}/> : '→'}
          </button>
        </div>)}
    </div>);
}
// ─── DOC TAB ──────────────────────────────────────────────────────────
function DocTab(_a) {
    var _this = this;
    var onSubOpen = _a.onSubOpen;
    var _b = useAiStore(), prompt = _b.docPrompt, format = _b.docFormat, maxPages = _b.docMaxPages, removeWatermark = _b.docRemoveWatermark, loading = _b.docLoading, statusMsg = _b.docStatusMsg, result = _b.docResult, setDocState = _b.setDocState;
    var _c = useAppStore(), user = _c.user, refreshUser = _c.refreshUser, setAuthModalOpen = _c.setAuthModalOpen;
    var triggerEditText = useEntityStore().triggerEditText;
    var toast = useToast().toast;
    var isFree = !user ? .effectivePlan || user.effectivePlan === 'free' : ;
    var generate = function () { return __awaiter(_this, void 0, void 0, function () {
        var p, auth, API_BASE, res, err, reader, decoder, buffer, _a, done, value, lines, _i, lines_1, line, data, parsed, e_4;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!user)
                        return [2 /*return*/, setAuthModalOpen(true)];
                    p = prompt.trim();
                    if (!p || loading)
                        return [2 /*return*/];
                    setDocState({ docLoading: true, docResult: null, docStatusMsg: 'Boshlanmoqda...' });
                    triggerEditText();
                    auth = JSON.parse(localStorage.getItem('fikra_auth') || '{}');
                    API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000';
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 8, , 9]);
                    return [4 /*yield*/, fetch(API_BASE + "/api/ai/document/stream", {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': "Bearer " + (auth.access || '')
                            },
                            body: JSON.stringify({ prompt: p, format: format, maxPages: maxPages, removeWatermark: removeWatermark })
                        })];
                case 2:
                    res = _b.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json()["catch"](function () { return ({}); })];
                case 3:
                    err = _b.sent();
                    if (err ? .code === 'DAILY_LIMIT_REACHED' || err ? .code === 'SUBSCRIPTION_REQUIRED' :  : ) {
                        onSubOpen();
                    }
                    else {
                        toast(err ? .error || 'Xatolik' : , 'err');
                    }
                    setDocState({ docLoading: false });
                    return [2 /*return*/];
                case 4:
                    reader = res.body.getReader();
                    decoder = new TextDecoder();
                    buffer = '';
                    _b.label = 5;
                case 5:
                    if (!true) return [3 /*break*/, 7];
                    return [4 /*yield*/, reader.read()];
                case 6:
                    _a = _b.sent(), done = _a.done, value = _a.value;
                    if (done)
                        return [3 /*break*/, 7];
                    buffer += decoder.decode(value, { stream: true });
                    lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    for (_i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                        line = lines_1[_i];
                        if (!line.startsWith('data: '))
                            continue;
                        data = line.slice(6);
                        if (data === '[DONE]') {
                            setDocState({ docLoading: false });
                            refreshUser();
                            return [2 /*return*/];
                        }
                        try {
                            parsed = JSON.parse(data);
                            if (parsed.error) {
                                toast(parsed.error, 'err');
                                setDocState({ docLoading: false });
                                return [2 /*return*/];
                            }
                            if (parsed.status === 'tayyor') {
                                setDocState({ docResult: parsed });
                            }
                            else if (parsed.message) {
                                setDocState({ docStatusMsg: parsed.message });
                            }
                        }
                        catch (_c) { }
                    }
                    return [3 /*break*/, 5];
                case 7: return [3 /*break*/, 9];
                case 8:
                    e_4 = _b.sent();
                    toast('Aloqada xatolik', 'err');
                    return [3 /*break*/, 9];
                case 9:
                    setDocState({ docLoading: false });
                    return [2 /*return*/];
            }
        });
    }); };
    var download = function () {
        if (!result ? .downloadUrl : )
            return;
        var API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000';
        var url = "" + API_BASE + result.downloadUrl;
        window.open(url, '_blank');
        toast('Yuklab olish boshlandi', 'ok');
    };
    var docsUsed = user ? .aiUsage ? .docs ?  ? 0
        :
        :
        :
        :
    ;
    var docsLimit = user ? .aiLimits ? .docs
        :
        :
    ;
    var targetChunks = Math.max(1, Math.min(Math.ceil(maxPages / 2), 8));
    var canDoc = docsLimit === null || (docsUsed + targetChunks) <= docsLimit;
    var handleWatermarkToggle = function () {
        if (isFree) {
            toast("Suv belgisini olib tashlash faqat Pro/VIP obunachilar uchun!", "err");
            onSubOpen();
            return;
        }
        setDocState({ docRemoveWatermark: !removeWatermark });
    };
    return (<div style={{ padding: '0 20px', overflowY: 'auto' }}>
      {isFree && (<div style={{
        background: 'linear-gradient(90deg, rgba(255,160,0,0.1), rgba(255,100,0,0.1))',
        border: '1px solid rgba(255,160,0,0.3)',
        borderRadius: 'var(--br)',
        padding: '12px 16px',
        marginBottom: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>Pro obunaga o'ting 🚀</div>
            <div style={{ fontSize: 11, color: 'var(--txt-2)' }}>Limitlarsiz va suv belgisisiz fayllar yarating</div>
          </div>
          <button onClick={onSubOpen} style={{
        background: 'var(--y)', color: '#000', border: 'none',
        padding: '6px 12px', borderRadius: 100, fontSize: 11, fontWeight: 800, cursor: 'pointer'
    }}>Sotib olish</button>
        </div>)}

      <div style={{ fontSize: 11, color: 'var(--txt-3)', marginBottom: 14 }}>
        {docsLimit === null ? 'Cheksiz' : docsUsed + "/" + docsLimit + " bugun ishlatildi. (Max: " + docsLimit + ")"}
      </div>

      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--txt-2)' }}>1. Hujjat turi (Format)</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {['DOCX', 'PDF', 'PPTX'].map(function (f) { return (<button key={f} onClick={function () { return setDocState({ docFormat: f }); }} style={{
        flex: 1, padding: '10px 8px',
        background: format === f ? 'var(--acc)' : 'var(--s2)',
        color: format === f ? 'white' : 'var(--txt-2)',
        border: '1px solid ' + (format === f ? 'var(--acc)' : 'var(--f)'),
        borderRadius: 'var(--br2)', fontWeight: 700, fontSize: 13, cursor: 'pointer'
    }}>
            {f}
          </button>); })}
      </div>

      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--txt-2)' }}>2. Sahifalar soni (Limit sarflanadi)</div>
      <div style={{ marginBottom: 20 }}>
        <input type="number" className="input" min={1} max={30} value={maxPages} onChange={function (e) { return setDocState({ docMaxPages: Math.max(1, Math.min(30, parseInt(e.target.value) || 1)) }); }}/>
        <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 6 }}>
          💡 Har {maxPages > 1 ? "2 sahifa (taxminan) uchun 1 ta limit ketadi. (Jami: " + targetChunks + " ta limit)" : '1 ta limit ketadi.'}
        </div>
      </div>

      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--txt-2)' }}>3. Mavzu (Batafsil yozing)</div>
      <textarea className="textarea" placeholder="Mavzuni yozing... Masalan: 'Sun'iy intellektning ta'limdagi o'rni va kelajagi'" value={prompt} onChange={function (e) { return setDocState({ docPrompt: e.target.value }); }} rows={4} style={{ marginBottom: 16 }}/>

      <label style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
        background: 'var(--s2)', padding: '12px 14px', borderRadius: 'var(--br)',
        cursor: isFree ? 'pointer' : 'pointer',
        border: '1px solid ' + (removeWatermark ? 'var(--acc)' : 'var(--f)')
    }}>
        <input type="checkbox" checked={removeWatermark} onChange={handleWatermarkToggle} style={{ width: 18, height: 18, accentColor: 'var(--acc)' }}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>Suv belgisisiz (Watermark'siz)</div>
          <div style={{ fontSize: 11, color: 'var(--txt-3)' }}>Hujjatdan "FIKRA AI" yozuvini olib tashlash {isFree ? '👑 (Pro)' : ''}</div>
        </div>
      </label>

      {!canDoc ? (<button onClick={onSubOpen} className="btn btn-primary btn-block btn-lg" style={{ background: 'var(--r)' }}>
          Limit yetarli emas (Obuna kerak)
        </button>) : (<button disabled={loading || !prompt.trim()} onClick={generate} className="btn btn-primary btn-block btn-lg" style={{ position: 'relative' }}>
          {loading ? (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span className="spin" style={{ width: 18, height: 18, borderWidth: 2 }}/>
              {statusMsg}
            </div>) : '✨ Hujjatni Yaratish'}
        </button>)}

      {result && !loading && (<div style={{
        marginTop: 20,
        background: 'rgba(0,212,170,0.07)',
        border: '1px solid rgba(0,212,170,0.25)',
        borderRadius: 'var(--br)',
        padding: 16
    }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
            ✅ {result.fileName}
          </div>
          <div style={{ fontSize: 12, color: 'var(--txt-3)', marginBottom: 12 }}>
            {result.sizeKb} KB · {result.format}
          </div>
          <div style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 16, lineHeight: 1.6 }}>
            {result.preview.slice(0, 200)}...
          </div>
          <button onClick={download} className="btn btn-success btn-block btn-lg">
            ⬇ Yuklab olish
          </button>
        </div>)}
      
      <div style={{ height: 40 }}/>
    </div>);
}
