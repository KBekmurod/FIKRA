// ─── Image AI Module ──────────────────────────────────────────────────────────

const IMG = (() => {
  let lastResult = null;
  let history = [];

  async function generate(prompt) {
    if (!prompt || prompt.trim().length < 3) {
      throw new Error('Kamida 3 ta belgi yozing');
    }
    const result = await API.image(prompt);
    lastResult = { ...result, prompt, ts: Date.now() };
    history.unshift(lastResult);
    if (history.length > 10) history = history.slice(0, 10);
    try { localStorage.setItem('fikra_images', JSON.stringify(history.slice(0, 5))); } catch {}
    return lastResult;
  }

  function loadHistory() {
    try {
      const saved = localStorage.getItem('fikra_images');
      if (saved) history = JSON.parse(saved);
    } catch {}
    return history;
  }

  function getLast() { return lastResult; }
  function getHistory() { return history; }

  return { generate, loadHistory, getLast, getHistory };
})();

window.IMG = IMG;
