// ─── FIKRA API Client v2.0 ─────────────────────────────────────────────────
const API_BASE = window.location.origin;

let _accessToken  = null;
let _refreshToken = null;
let _tokenOwnerTgId = null;

function _loadSavedTokens(currentTgId) {
  try {
    const saved = localStorage.getItem('fikra_auth');
    if (!saved) return;
    const data = JSON.parse(saved);
    if (currentTgId && data.tgId && data.tgId !== currentTgId) {
      console.warn('[API] Boshqa user tokeni — tozalanmoqda');
      localStorage.removeItem('fikra_auth');
      return;
    }
    _accessToken = data.access || null;
    _refreshToken = data.refresh || null;
    _tokenOwnerTgId = data.tgId || null;
  } catch (e) { console.warn('localStorage unavailable:', e); }
}

function setTokens(access, refresh, tgId) {
  _accessToken = access;
  _refreshToken = refresh;
  _tokenOwnerTgId = tgId || null;
  try {
    if (access && refresh) {
      localStorage.setItem('fikra_auth', JSON.stringify({ access, refresh, tgId: tgId || null, ts: Date.now() }));
    } else {
      localStorage.removeItem('fikra_auth');
    }
  } catch {}
}

function clearTokens() { setTokens(null, null, null); }
function getTokenOwner() { return _tokenOwnerTgId; }

// ─── Asosiy so'rov ─────────────────────────────────────────────────────────
async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;

  let res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body && typeof options.body !== 'string'
      ? JSON.stringify(options.body)
      : options.body,
  });

  // Token muddati tugagan — refresh
  if (res.status === 401 && _refreshToken && path !== '/api/auth/refresh') {
    const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: _refreshToken }),
    });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      setTokens(data.accessToken, data.refreshToken, _tokenOwnerTgId);
      headers['Authorization'] = `Bearer ${data.accessToken}`;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } else {
      clearTokens();
      window.FIKRA?.reLogin?.();
      return null;
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Server xatosi' }));
    const e = new Error(err.error || 'Xatolik');
    e.code = err.code;
    e.statusCode = res.status;
    e.data = err;
    throw e;
  }
  return res.json();
}

// ─── Multipart upload ──────────────────────────────────────────────────────
async function apiUpload(path, formData) {
  const headers = {};
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Yuklash xatosi');
  }
  return res.json();
}

// ─── SSE Stream ────────────────────────────────────────────────────────────
async function apiStream(path, body, onChunk, onDone) {
  const headers = {
    'Content-Type': 'application/json',
    ...(_accessToken ? { 'Authorization': `Bearer ${_accessToken}` } : {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = new Error(err.error || 'Stream xatosi');
    e.code = err.code; e.statusCode = res.status;
    throw e;
  }
  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') { onDone?.(); return; }
      try {
        const parsed = JSON.parse(data);
        if (parsed.content) onChunk(parsed.content);
      } catch {}
    }
  }
  onDone?.();
}

// ─── API Methods ────────────────────────────────────────────────────────────
const API = {
  // Auth
  login: (initData, referralCode) =>
    apiRequest('/api/auth/login', { method: 'POST', body: { initData, referralCode } }),
  me: () => apiRequest('/api/auth/me'),
  rankInfo: () => apiRequest('/api/auth/rank'),
  logout: () => clearTokens(),

  // Obuna
  plans: () => apiRequest('/api/sub/plans'),
  subStatus: () => apiRequest('/api/sub/status'),
  createInvoice: (planId) =>
    apiRequest('/api/sub/create-invoice', { method: 'POST', body: { planId } }),
  cancelInfo: () => apiRequest('/api/sub/cancel-info'),
  createP2POrder: (planId) =>
    apiRequest('/api/sub/create-p2p-order', { method: 'POST', body: { planId } }),
  myOrders: () => apiRequest('/api/sub/my-orders'),

  // DTM Test — loyihaning markazi
  testQuestions: (subject, block, limit) =>
    apiRequest(`/api/games/test/questions?subject=${subject}&block=${block || ''}&limit=${limit || 10}`),
  checkAnswer: (questionId, selectedIndex) =>
    apiRequest('/api/games/test/check-answer', { method: 'POST', body: { questionId, selectedIndex } }),
  testResult: (data) =>
    apiRequest('/api/games/test/result', { method: 'POST', body: data }),

  // AI — DTM uchun markaziy funksiya
  // mode: 'hint' (to'g'ri javobsiz maslahat) | 'explain' (javobdan keyin tushuntirish)
  hint: (question, options, subject, mode = 'hint') =>
    apiRequest('/api/ai/hint', { method: 'POST', body: { question, options, subject, mode } }),

  // AI — obuna bilan
  chat: (message, history, onChunk, onDone) =>
    apiStream('/api/ai/chat', { message, history }, onChunk, onDone),
  document: (prompt, format, history) =>
    apiRequest('/api/ai/document', { method: 'POST', body: { prompt, format, history } }),
  image: (prompt) =>
    apiRequest('/api/ai/image', { method: 'POST', body: { prompt } }),
  calorie: (file) => {
    const fd = new FormData(); fd.append('image', file);
    return apiUpload('/api/ai/calorie', fd);
  },

  // O'yinlar
  stroopResult: (gameType, score, correctAnswers, wrongAnswers, durationSec) =>
    apiRequest('/api/games/stroop/result', { method: 'POST',
      body: { gameType, score, correctAnswers, wrongAnswers, durationSec } }),
  leaderboard: (type, period = 'week') =>
    apiRequest(`/api/games/leaderboard/${type}?period=${period}`),
  myStats: () => apiRequest('/api/games/my-stats'),

  // Musiqa va turnir
  music: () => apiRequest('/api/content/music'),
  musicPlay: (trackId) =>
    apiRequest('/api/content/music/play', { method: 'POST', body: { trackId } }),
  tournaments: () => apiRequest('/api/content/tournaments'),
  weeklyTournament: () => apiRequest('/api/content/tournaments/weekly'),

  // Sovg'alar: yangi o'yinlar
  newGamesCatalog: () => apiRequest('/api/newgames/catalog'),
  inventory: (gameType) => apiRequest(`/api/newgames/inventory/${gameType}`),
  footballStart: (clubId) =>
    apiRequest('/api/newgames/football/start', { method: 'POST', body: { clubId } }),
  carTuning: (carId, part) =>
    apiRequest('/api/newgames/auto/tuning', { method: 'POST', body: { carId, part } }),
  carPaint: (carId, color) =>
    apiRequest('/api/newgames/auto/paint', { method: 'POST', body: { carId, color } }),
  outfitDesign: (outfitId, updates) =>
    apiRequest('/api/newgames/fashion/design', { method: 'POST', body: { outfitId, updates } }),
  upgradePlayer: (playerId, stat) =>
    apiRequest('/api/newgames/football/upgrade', { method: 'POST', body: { playerId, stat } }),
  footballMatch: () =>
    apiRequest('/api/newgames/football/match', { method: 'POST', body: {} }),
  getMarket: (gameType) =>
    apiRequest(`/api/newgames/market?gameType=${gameType || ''}`),
  listItem: (itemId) =>
    apiRequest('/api/newgames/market/list', { method: 'POST', body: { itemId } }),
  cancelListing: (itemId) =>
    apiRequest('/api/newgames/market/cancel', { method: 'POST', body: { itemId } }),
  tradeFromMarket: (itemId) =>
    apiRequest('/api/newgames/market/trade', { method: 'POST', body: { itemId } }),
};

window.API = API;
window.setTokens = setTokens;
window.clearTokens = clearTokens;
window.getTokenOwner = getTokenOwner;
window._loadSavedTokens = _loadSavedTokens;
