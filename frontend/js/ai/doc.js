// ─── Document AI Module ───────────────────────────────────────────────────────

const DOC = (() => {
  let currentFormat = 'DOCX';
  let history = [];

  function setFormat(fmt) {
    currentFormat = fmt;
    try { localStorage.setItem('fikra_doc_format', fmt); } catch {}
  }

  function getFormat() {
    try { return localStorage.getItem('fikra_doc_format') || 'DOCX'; } catch { return 'DOCX'; }
  }

  function addMessage(role, content) {
    history.push({ role, content });
    if (history.length > 20) history = history.slice(-20);
    try { localStorage.setItem('fikra_chat_doc', JSON.stringify(history.slice(-10))); } catch {}
  }

  function loadHistory() {
    try {
      const saved = localStorage.getItem('fikra_chat_doc');
      if (saved) history = JSON.parse(saved);
    } catch {}
  }

  function getHistory() { return history; }
  function clear() { history = []; }

  return { setFormat, getFormat, addMessage, loadHistory, getHistory, clear };
})();

window.DOC = DOC;
