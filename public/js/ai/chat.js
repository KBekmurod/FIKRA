// ─── AI Chat Module ───────────────────────────────────────────────────────────

const CHAT = (() => {
  let history = []; // { role, content }
  const MAX_HISTORY = 20;

  function addMessage(role, content) {
    history.push({ role, content });
    if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);
    _saveToLocal();
  }

  function getHistory() { return history; }

  function loadFromLocal(chatId = 'general') {
    try {
      const saved = localStorage.getItem(`fikra_chat_${chatId}`);
      if (saved) history = JSON.parse(saved);
    } catch {}
  }

  function _saveToLocal(chatId = 'general') {
    try {
      localStorage.setItem(`fikra_chat_${chatId}`, JSON.stringify(history.slice(-10)));
    } catch {}
  }

  function clear() { history = []; }

  // Chatlar ro'yxatini localStorage dan olish
  function getChatList() {
    const list = [];
    try {
      const general = localStorage.getItem('fikra_chat_general');
      if (general) {
        const msgs = JSON.parse(general);
        const last = msgs[msgs.length - 1];
        list.push({ id: 'general', type: 'chat', name: 'AI Chat',
          lastMsg: last ? last.content.slice(0, 60) + '...' : '',
          time: 'Bugun', icon: '💬' });
      }
      const doc = localStorage.getItem('fikra_chat_doc');
      if (doc) {
        const msgs = JSON.parse(doc);
        const last = msgs[msgs.length - 1];
        const fmt = localStorage.getItem('fikra_doc_format') || 'DOCX';
        list.push({ id: 'doc', type: 'doc', name: 'Hujjat yaratish',
          lastMsg: last ? last.content.slice(0, 60) + '...' : '',
          time: 'Kecha', icon: '📄', format: fmt });
      }
    } catch {}
    return list;
  }

  return { addMessage, getHistory, loadFromLocal, clear, getChatList };
})();

window.CHAT = CHAT;
