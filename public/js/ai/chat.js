// ─── AI Chat Module ───────────────────────────────────────────────────────────
// Best practice limits:
// - Max xabar uzunligi: 2000 belgi (~500 token)
// - Max chat tarixi: 30 xabar (~8000 token jami)
// - Saqlanadigan chatlar: oxirgi 3 ta
// - Xabarlar orasidagi limit: 2 soniya (spam oldi)

const CHAT = (() => {
  const MAX_MSG_CHARS = 2000;
  const MAX_HISTORY = 30;
  const MAX_CONTEXT = 15; // AI ga yuboriladigan oxirgi xabarlar
  const MIN_INTERVAL_MS = 2000;

  let history = []; // { role, content, ts }
  let currentChatId = 'general';
  let lastSendAt = 0;

  function addMessage(role, content) {
    const msg = { role, content, ts: Date.now() };
    history.push(msg);
    if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);
    _saveToLocal();
  }

  function getHistory() { return history; }
  function getContext() { return history.slice(-MAX_CONTEXT); }

  function canSend() {
    const now = Date.now();
    if (now - lastSendAt < MIN_INTERVAL_MS) {
      return { ok: false, reason: 'Juda tez yubormoqdasiz. 2 soniya kuting.' };
    }
    if (history.length >= MAX_HISTORY) {
      return { ok: false, reason: `Chat to'ldi (${MAX_HISTORY} xabar). Yangi chat boshlang.`, code: 'CHAT_FULL' };
    }
    return { ok: true };
  }

  function markSent() { lastSendAt = Date.now(); }

  function validateMessage(text) {
    if (!text || !text.trim()) return { ok: false, reason: 'Bo\'sh xabar' };
    if (text.length > MAX_MSG_CHARS) {
      return { ok: false, reason: `Xabar juda uzun (${text.length} belgi). Maksimal ${MAX_MSG_CHARS}.` };
    }
    return { ok: true };
  }

  function loadFromLocal(chatId) {
    currentChatId = chatId || 'general';
    try {
      const saved = localStorage.getItem(`fikra_chat_${currentChatId}`);
      if (saved) {
        const data = JSON.parse(saved);
        history = Array.isArray(data) ? data : (data.messages || []);
      } else {
        history = [];
      }
    } catch { history = []; }
  }

  function _saveToLocal() {
    try {
      localStorage.setItem(`fikra_chat_${currentChatId}`, JSON.stringify(history.slice(-MAX_HISTORY)));
      // Timestamp ham saqla
      localStorage.setItem(`fikra_chat_${currentChatId}_meta`, JSON.stringify({
        lastUpdate: Date.now(),
        count: history.length,
      }));
    } catch {}
  }

  function clear() {
    history = [];
    try {
      localStorage.removeItem(`fikra_chat_${currentChatId}`);
      localStorage.removeItem(`fikra_chat_${currentChatId}_meta`);
    } catch {}
  }

  function startNew() {
    clear();
    currentChatId = 'general';
  }

  function getChatList() {
    const list = [];
    try {
      // General chat
      const general = localStorage.getItem('fikra_chat_general');
      const generalMeta = localStorage.getItem('fikra_chat_general_meta');
      if (general) {
        const msgs = JSON.parse(general);
        const last = msgs[msgs.length - 1];
        const meta = generalMeta ? JSON.parse(generalMeta) : null;
        if (msgs.length > 0) {
          list.push({
            id: 'general', type: 'chat', name: 'AI Chat',
            lastMsg: last ? last.content.slice(0, 60) : '',
            time: _formatTime(meta?.lastUpdate),
            count: msgs.length,
            icon: '💬',
          });
        }
      }
      // Doc chat
      const doc = localStorage.getItem('fikra_chat_doc');
      const docMeta = localStorage.getItem('fikra_chat_doc_meta');
      if (doc) {
        const msgs = JSON.parse(doc);
        const last = msgs[msgs.length - 1];
        const meta = docMeta ? JSON.parse(docMeta) : null;
        const fmt = localStorage.getItem('fikra_doc_format') || 'DOCX';
        if (msgs.length > 0) {
          list.push({
            id: 'doc', type: 'doc', name: 'Hujjat yaratish',
            lastMsg: last ? last.content.slice(0, 60) : '',
            time: _formatTime(meta?.lastUpdate),
            count: msgs.length,
            icon: '📄', format: fmt,
          });
        }
      }
    } catch {}
    return list;
  }

  function _formatTime(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Hozir';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' daq';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' soat';
    if (diff < 172800000) return 'Kecha';
    return new Date(ts).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' });
  }

  return {
    addMessage, getHistory, getContext,
    loadFromLocal, clear, startNew, getChatList,
    canSend, markSent, validateMessage,
    limits: { MAX_MSG_CHARS, MAX_HISTORY },
  };
})();

window.CHAT = CHAT;
