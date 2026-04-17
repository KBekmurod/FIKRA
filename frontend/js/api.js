// ─── FIKRA API Client ──────────────────────────────────────────────────────────
// Barcha fetch so'rovlari shu yerdan o'tadi

const API_BASE = window.location.origin;

let _accessToken = localStorage.getItem('fikra_access_token') || null;
let _refreshToken = localStorage.getItem('fikra_refresh_token') || null;

function setTokens(access, refresh) {
  _accessToken = access;
  _refreshToken = refresh;
  localStorage.setItem('fikra_access_token', access);
  localStorage.setItem('fikra_refresh_token', refresh);
}

async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (_accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`;
  }

  let res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body && typeof options.body !== 'string'
      ? JSON.stringify(options.body)
      : options.body,
  });

  // Token muddati tugagan — refresh qilamiz
  if (res.status === 401 && _refreshToken) {
    const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: _refreshToken }),
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      setTokens(data.accessToken, data.refreshToken);
      headers['Authorization'] = `Bearer ${data.accessToken}`;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } else {
      // Refresh ham ishlamadi — qayta login
      setTokens(null, null);
      window.FIKRA && window.FIKRA.reLogin && window.FIKRA.reLogin();
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

// ─── Multipart (rasm yuklash uchun) ─────────────────────────────────────────
async function apiUpload(path, formData) {
  const headers = {};
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Yuklash xatosi');
  }
  return res.json();
}

// ─── SSE Stream (AI chat uchun) ──────────────────────────────────────────────
async function apiStream(path, body, onChunk, onDone) {
  const headers = {
    'Content-Type': 'application/json',
    ..._accessToken ? { 'Authorization': `Bearer ${_accessToken}` } : {},
  };

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error('Stream xatosi');

  const reader = res.body.getReader();
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
      if (data === '[DONE]') { onDone && onDone(); return; }
      try {
        const parsed = JSON.parse(data);
        if (parsed.content) onChunk(parsed.content);
      } catch {}
    }
  }
  onDone && onDone();
}

// ─── API Methods ─────────────────────────────────────────────────────────────
const API = {
  // Auth
  login: (initData, referralCode) =>
    apiRequest('/api/auth/login', { method: 'POST', body: { initData, referralCode } }),
  me: () => apiRequest('/api/auth/me'),

  // Tokens
  balance: () => apiRequest('/api/tokens/balance'),
  dailyBonus: () => apiRequest('/api/tokens/daily-bonus', { method: 'POST' }),
  adsReward: (format, context) =>
    apiRequest('/api/tokens/ads-reward', { method: 'POST', body: { format, context } }),
  referral: (refCode) =>
    apiRequest('/api/tokens/referral', { method: 'POST', body: { refCode } }),
  tokenHistory: () => apiRequest('/api/tokens/history'),

  // Games
  stroopResult: (gameType, score, correctAnswers, wrongAnswers, durationSec) =>
    apiRequest('/api/games/stroop/result', { method: 'POST',
      body: { gameType, score, correctAnswers, wrongAnswers, durationSec } }),
  testQuestions: (subject, block, limit) =>
    apiRequest(`/api/games/test/questions?subject=${subject}&block=${block}&limit=${limit || 10}`),
  checkAnswer: (questionId, selectedIndex) =>
    apiRequest('/api/games/test/check-answer', { method: 'POST', body: { questionId, selectedIndex } }),
  testResult: (data) =>
    apiRequest('/api/games/test/result', { method: 'POST', body: data }),
  leaderboard: (type, period = 'week') =>
    apiRequest(`/api/games/leaderboard/${type}?period=${period}`),
  myStats: () => apiRequest('/api/games/my-stats'),

  // AI
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
  hint: (question, options, subject) =>
    apiRequest('/api/ai/hint', { method: 'POST', body: { question, options, subject } }),
  video: (prompt) =>
    apiRequest('/api/ai/video', { method: 'POST', body: { prompt } }),

  // Subscription
  plans: () => apiRequest('/api/sub/plans'),
  subStatus: () => apiRequest('/api/sub/status'),
};

window.API = API;
window.setTokens = setTokens;
