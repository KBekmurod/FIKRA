// ─── FIKRA Main App ───────────────────────────────────────────────────────────

(async function () {
  // ─── Telegram WebApp init ─────────────────────────────────────────────────
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#07070e');
    tg.setBackgroundColor('#07070e');
  }

  // ─── State ────────────────────────────────────────────────────────────────
  let user = null;
  let tokens = 0;
  let activePanel = 'home';
  let adsTimer = null;
  let adsResolve = null;
  let adsPendingTokens = 0;

  // User obyektini ADS moduliga sinxronlash (obuna tekshiruvi uchun)
  function _syncUserToWindow() {
    window.user = user;
  }

  // Haptic feedback — Telegram ichida tugma bosganda tebranish
  function hapticTap(style) {
    // style: 'light', 'medium', 'heavy', 'rigid', 'soft'
    try {
      if (tg && tg.HapticFeedback && tg.HapticFeedback.impactOccurred) {
        tg.HapticFeedback.impactOccurred(style || 'light');
      }
    } catch {}
  }
  function hapticNotify(type) {
    // type: 'error', 'success', 'warning'
    try {
      if (tg && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred) {
        tg.HapticFeedback.notificationOccurred(type || 'success');
      }
    } catch {}
  }

  // ─── Auth ─────────────────────────────────────────────────────────────────
  async function login() {
    const initData = tg?.initData || '';
    const initUser = tg?.initDataUnsafe?.user;
    const currentTgId = initUser?.id || null;
    const refCode = new URLSearchParams(window.location.search).get('ref') ||
                    tg?.initDataUnsafe?.start_param || null;

    // MUHIM: Saqlangan tokenlarni faqat joriy Telegram ID ga tegishli bo'lsa ishlat
    window._loadSavedTokens(currentTgId);

    // Saqlangan token bor va joriy foydalanuvchiga tegishli — tekshirish
    const savedOwner = window.getTokenOwner();
    if (savedOwner && savedOwner === currentTgId) {
      try {
        const me = await API.me();
        if (me && me.telegramId === currentTgId) {
          user = me;
          _syncUserToWindow();
          tokens = me.tokens;
          console.log('[Auth] Saved token valid');
          return;
        }
      } catch (e) {
        console.warn('[Auth] Saved token invalid:', e.code);
        window.clearTokens();
      }
    } else if (savedOwner && savedOwner !== currentTgId) {
      // Boshqa foydalanuvchi tokeni — darhol o'chir
      console.warn('[Auth] Different user detected, clearing tokens');
      window.clearTokens();
    }

    // Brauzerdan kirgan (Telegram WebApp emas) — demo rejim, lekin JWT bermaymiz
    if (!initData || !currentTgId) {
      console.log('[Auth] Brauzer rejimi (Telegram tashqarida)');
      tokens = 0;
      user = { firstName: 'Mehmon', username: 'guest', tokens: 0, streakDays: 0, _demo: true };
      _syncUserToWindow();
      return;
    }

    // Haqiqiy Telegram login — initData server da HMAC bilan tekshiriladi
    try {
      const res = await API.login(initData, refCode);
      if (res && res.user) {
        // Serverdan qaytgan user ID joriy Telegram ID ga mos kelishi shart
        if (res.user.telegramId !== currentTgId) {
          console.error('[Auth] User ID mismatch!', res.user.telegramId, currentTgId);
          throw new Error('Identifikatsiya xatoligi');
        }
        setTokens(res.accessToken, res.refreshToken, currentTgId);
        user = res.user;
        _syncUserToWindow();
        tokens = res.user.tokens;
        console.log('[Auth] Logged in as:', user.firstName, 'tgId:', currentTgId);
      }
    } catch (e) {
      console.error('[Auth] Login failed:', e.message);
      // Brauzer-like demo rejimga tushmaymiz, chunki Telegram ichidamiz
      tokens = 0;
      user = { firstName: initUser?.first_name || 'Xatolik', username: initUser?.username || '', tokens: 0, streakDays: 0, _authError: e.message };
      showToast && showToast('Kirish xatoligi: ' + e.message);
    }
  }

  // Ilova boshqa hisobga o'tganligini aniqlash — har 30s bir tekshiramiz
  async function verifyAuth() {
    if (!user || user._demo) return;
    const currentTgId = tg?.initDataUnsafe?.user?.id;
    if (!currentTgId) return;
    if (user.telegramId && user.telegramId !== currentTgId) {
      console.warn('[Auth] Telegram account switched! Re-login required');
      window.clearTokens();
      await login();
      buildUI(); // UI ni qayta qur
    }
  }

  // ─── Build UI ─────────────────────────────────────────────────────────────
  function buildUI() {
    document.getElementById('app').innerHTML = `
<div class="main-wrap" id="main">
  <div class="status-bar">
    <span class="status-time" id="clock"></span>
    <div class="status-tokens" id="tok-pill" onclick="FIKRA.showAdsModal(5,'bonus')">
      <div class="tok-dot"></div>
      <span id="tok-val">${tokens.toLocaleString()}</span>
    </div>
  </div>
  <div class="app-header">
    <div class="app-logo">FIKRA<span>.</span></div>
  </div>

  <div class="scroll" id="scroll">
    ${buildHome()}
    ${buildGames()}
    ${buildAI()}
    ${buildProfile()}
  </div>

  <nav class="bottom-nav">
    <button class="nav-item active" id="ni-home" onclick="FIKRA.switchPanel('home')">
      <div class="nav-icon">⚡</div><div class="nav-label">Bosh</div>
    </button>
    <button class="nav-item" id="ni-games" onclick="FIKRA.switchPanel('games')">
      <div class="nav-icon">🎮</div><div class="nav-label">O'yinlar</div>
    </button>
    <button class="nav-item" id="ni-ai" onclick="FIKRA.switchPanel('ai')">
      <div class="nav-icon">🤖</div><div class="nav-label">AI</div>
    </button>
    <button class="nav-item" id="ni-profile" onclick="FIKRA.switchPanel('profile')">
      <div class="nav-icon">👤</div><div class="nav-label">Profil</div>
    </button>
  </nav>
</div>

<div id="toast"></div>

<div id="ads-overlay">
  <div class="ads-modal">
    <div class="ads-modal-icon">📺</div>
    <div class="ads-modal-title">Reklama</div>
    <div class="ads-modal-sub" id="ads-sub">Ko'rib bo'lgach <strong>+5 token</strong></div>
    <div class="ads-progress"><div class="ads-progress-fill" id="ads-fill"></div></div>
    <div class="ads-skip" id="ads-skip">5 soniya...</div>
  </div>
</div>
`;
    updateClock();
    setInterval(updateClock, 10000);
    setTimeout(() => {
      document.getElementById('main').classList.add('visible');
    }, 50);
    initGames();
  }

  function updateClock() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const el = document.getElementById('clock');
    if (el) el.textContent = `${h}:${m}`;
  }

  // ─── Panel builder helpers ────────────────────────────────────────────────
  function buildHome() {
    return `<div class="panel active" id="p-home">
  <!-- SLIDER (obunasiz: reklama, obunali: musiqa/quotes) -->
  <div style="overflow:hidden;position:relative;height:90px;margin-bottom:4px">
    <div id="home-slides" style="display:flex;transition:transform .4s ease;height:90px">
      <!-- Slide 1: Reklama banner -->
      <div style="min-width:375px;height:90px;display:flex;align-items:center;padding:0 16px;background:linear-gradient(135deg,rgba(123,104,238,.1),rgba(0,212,170,.07));border-bottom:1px solid rgba(123,104,238,.1)">
        <div style="width:40px;height:40px;background:var(--s2);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;margin-right:12px">🏪</div>
        <div style="flex:1"><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;margin-bottom:2px">Texnomart — chegirmalar</div><div style="font-size:11px;color:var(--m)">Laptop va telefonlarda 30% chegirma</div></div>
        <button class="btn btn-acc btn-sm" style="flex-shrink:0" onclick="FIKRA.showToast('Reklama ochildi')">Ko'rish</button>
      </div>
      <!-- Slide 2: Musiqa (Pro uchun) -->
      <div style="min-width:375px;height:90px;display:flex;align-items:center;padding:0 16px;background:linear-gradient(135deg,rgba(0,212,170,.09),rgba(123,104,238,.09));border-bottom:1px solid rgba(0,212,170,.12)">
        <div style="width:44px;height:44px;border-radius:11px;background:linear-gradient(135deg,var(--g),var(--acc));display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;margin-right:12px">🧠</div>
        <div style="flex:1;min-width:0"><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;margin-bottom:2px">Miya faolligi musiqasi</div><div style="font-size:11px;color:var(--m);line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Alpha · Binaural · Lofi · Focus</div></div>
        <button id="home-music-btn" style="width:36px;height:36px;background:var(--g);border:none;border-radius:50%;font-size:14px;color:#000;cursor:pointer;flex-shrink:0;font-weight:700" onclick="FIKRA.openMusicPlayer()">▶</button>
      </div>
      <!-- Slide 3: Iqtibos -->
      <div style="min-width:375px;height:90px;display:flex;align-items:center;padding:0 18px;border-bottom:1px solid var(--f)">
        <div><div style="font-family:'Syne',sans-serif;font-size:24px;color:var(--acc);line-height:.8;margin-bottom:4px">"</div><div style="font-size:13px;font-weight:500;line-height:1.5">Muvaffaqiyat — bu har kuni bir oz yaxshilanishning natijasidir.</div><div style="font-size:11px;color:var(--m);margin-top:3px">— James Clear</div></div>
      </div>
    </div>
    <div id="home-dots" style="display:flex;justify-content:center;gap:5px;position:absolute;bottom:6px;width:100%">
      <div style="width:14px;height:4px;border-radius:2px;background:var(--acc);transition:all .3s"></div>
      <div style="width:5px;height:4px;border-radius:50%;background:var(--f);transition:all .3s"></div>
      <div style="width:5px;height:4px;border-radius:50%;background:var(--f);transition:all .3s"></div>
    </div>
  </div>
  <div id="home-tournament-banner" style="margin:4px 14px 10px;background:var(--s2);border:1px solid rgba(123,104,238,.2);border-radius:var(--br);padding:16px;position:relative;overflow:hidden;cursor:pointer" onclick="FIKRA.openTournament()">
    <div style="position:absolute;right:-20px;top:-20px;width:100px;height:100px;background:radial-gradient(circle,rgba(123,104,238,.2),transparent 70%);pointer-events:none"></div>
    <div id="tourn-label" style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--al);margin-bottom:6px">Turnir · Yuklanmoqda...</div>
    <div id="tourn-title" style="font-family:'Syne',sans-serif;font-weight:700;font-size:18px;line-height:1.3;margin-bottom:5px">Haftalik XP turniri</div>
    <div id="tourn-sub" style="font-size:11px;color:var(--m);margin-bottom:14px">Eng ko'p XP to'plagan 500 token yutib oladi</div>
    <button class="btn btn-acc btn-sm" onclick="event.stopPropagation();FIKRA.openTournament()">Reyting ↗</button>
  </div>
  <div class="sl" style="margin-top:2px">Tezkor kirish</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;padding:0 14px 10px">
    <div class="qi-btn" onclick="FIKRA.openAIChat('general')">💬<span>AI Chat</span></div>
    <div class="qi-btn" onclick="FIKRA.openAIChat('doc')">📄<span>Hujjat</span></div>
    <div class="qi-btn" onclick="FIKRA.goGame('stroop')">🎮<span>O'yin</span></div>
    <div class="qi-btn" style="position:relative" onclick="FIKRA.openKal()">🥗<span>Kaloriya</span>
      <span style="position:absolute;top:-3px;right:-3px;background:var(--r);color:#fff;font-size:8px;font-weight:700;padding:1px 5px;border-radius:100px;border:1.5px solid var(--bg)">AI</span>
    </div>
  </div>
  <div class="sl">Bugun</div>
  <div class="stats-row" style="grid-template-columns:repeat(4,1fr)">
    <div class="stat-card"><div class="stat-val" style="color:var(--y)" id="h-tok">${tokens.toLocaleString()}</div><div class="stat-key">Token</div></div>
    <div class="stat-card" onclick="FIKRA.switchPanel('profile')" style="cursor:pointer">
      <div class="stat-val" style="color:var(--al);display:flex;align-items:center;justify-content:center;gap:3px" id="h-xp">
        ${user?.rank?.current?.emoji || '🌱'}<span style="font-size:14px">${(user?.xp || 0) > 999 ? ((user.xp/1000).toFixed(1) + 'k') : (user?.xp || 0)}</span>
      </div>
      <div class="stat-key">XP</div>
    </div>
    <div class="stat-card"><div class="stat-val" style="color:var(--al)" id="h-rank-pos">12</div><div class="stat-key">O'rin</div></div>
    <div class="stat-card"><div class="stat-val" style="color:var(--g)">${user?.streakDays || 0}🔥</div><div class="stat-key">Streak</div></div>
  </div>
  <div id="daily-bonus-banner" style="margin:0 14px 9px;display:none;background:linear-gradient(135deg,rgba(255,204,68,.09),rgba(0,212,170,.06));border:1px solid rgba(255,204,68,.22);border-radius:var(--br);padding:12px 14px;align-items:center;gap:11px">
    <div style="width:38px;height:38px;border-radius:11px;background:rgba(255,204,68,.15);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🎁</div>
    <div style="flex:1">
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px" id="daily-bonus-title">Kunlik bonus</div>
      <div style="font-size:11px;color:var(--m)" id="daily-bonus-sub">Har kuni token olish</div>
    </div>
    <button class="btn btn-sm" style="background:var(--y);color:#000;flex-shrink:0" onclick="FIKRA.claimDaily()">Olish</button>
  </div>
  <div class="ads-strip">
    <div><div class="ads-strip-title">+5 token ol</div><div class="ads-strip-sub">Reklama ko'rib yig'</div></div>
    <button class="watch-btn" onclick="FIKRA.showAdsModal(5,'daily_bonus')">Ko'rish</button>
  </div>
  <div class="sl">Liderlar</div>
  <div class="lb">
    <div class="lb-head"><span class="lb-title">⚡ Top XP — global</span><span class="live-dot">Jonli</span></div>
    <div id="lb-home-rows"><div style="padding:12px 14px;font-size:12px;color:var(--m)">Yuklanmoqda...</div></div>
  </div>
</div>`;
  }

  function buildGames() {
    return `<div class="panel" id="p-games">
  <div class="subpanel active" id="sg-list">
    <div class="sl" style="margin-top:6px">O'yinlar</div>
    <div class="sl" style="margin-top:6px">🧠 Miya faolligi</div>
    <div style="margin:0 14px 9px;background:var(--s1);border:1px solid var(--f);border-radius:var(--br);overflow:hidden;cursor:pointer" onclick="FIKRA.goGame('stroop')">
      <div style="height:82px;background:linear-gradient(135deg,#0a0820,#1a1060,#2a1890);display:flex;align-items:center;justify-content:space-between;padding:0 16px">
        <div><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:16px">Stroop Brain</div><div style="font-size:10px;color:rgba(255,255,255,.4);margin-top:2px">2 tur · Rang / To'g'ri-Noto'g'ri</div></div>
        <div style="display:flex;gap:5px"><div style="width:20px;height:20px;border-radius:50%;background:#ff5f7e;opacity:.7"></div><div style="width:20px;height:20px;border-radius:50%;background:#7b68ee;opacity:.7"></div><div style="width:20px;height:20px;border-radius:50%;background:#00d4aa;opacity:.7"></div></div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 14px">
        <div><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px">Stroop Challenge</div><div style="font-size:10px;color:var(--m);margin-top:2px">Rekord: 4,820 · Sening: <span id="my-stroop-score">0</span></div></div>
        <button class="btn btn-acc btn-sm">O'yna</button>
      </div>
    </div>

    <div class="sl">📚 O'rganish</div>
    <div style="margin:0 14px 9px;background:var(--s1);border:1px solid var(--f);border-radius:var(--br);overflow:hidden;cursor:pointer" onclick="FIKRA.goGame('test')">
      <div style="height:82px;background:linear-gradient(135deg,#080f08,#0e200e,#144018);display:flex;align-items:center;justify-content:space-between;padding:0 16px">
        <div><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:16px">Abituriyent</div><div style="font-size:10px;color:rgba(255,255,255,.4);margin-top:2px">Majburiy + Mutaxassislik fanlar</div></div>
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:22px;color:rgba(0,212,170,.3)">DTM</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 14px">
        <div><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px">DTM Test</div><div style="font-size:10px;color:var(--m);margin-top:2px">9 fan · 155+ savol · Ballar</div></div>
        <button class="btn btn-acc btn-sm">O'yna</button>
      </div>
    </div>

    <div class="sl">🎨 Dam olish</div>
    <div style="margin:0 14px 9px;background:var(--s1);border:1px solid var(--f);border-radius:var(--br);overflow:hidden;cursor:pointer" onclick="FIKRA.openNewGame('auto')">
      <div style="height:82px;background:linear-gradient(135deg,#1a0510,#2e0e1d,#4a1830);display:flex;align-items:center;justify-content:space-between;padding:0 16px">
        <div><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:16px">Avto Tuning</div><div style="font-size:10px;color:rgba(255,255,255,.4);margin-top:2px">Mashina yarating, sotib olsin</div></div>
        <div style="font-size:26px">🏎️</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 14px">
        <div><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px">Avto garaj</div><div style="font-size:10px;color:var(--m);margin-top:2px">8 model · Tuning · Bozor</div></div>
        <button class="btn btn-acc btn-sm">Boshlash</button>
      </div>
    </div>

    <div style="margin:0 14px 9px;background:var(--s1);border:1px solid var(--f);border-radius:var(--br);overflow:hidden;cursor:pointer" onclick="FIKRA.openNewGame('fashion')">
      <div style="height:82px;background:linear-gradient(135deg,#200a0f,#400e20,#700a3a);display:flex;align-items:center;justify-content:space-between;padding:0 16px">
        <div><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:16px">Fashion Design</div><div style="font-size:10px;color:rgba(255,255,255,.4);margin-top:2px">Dizaynlar yarating</div></div>
        <div style="font-size:26px">👗</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 14px">
        <div><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px">Moda studiyasi</div><div style="font-size:10px;color:var(--m);margin-top:2px">5 uslub · Rang · Naqsh · Bozor</div></div>
        <button class="btn btn-acc btn-sm">Boshlash</button>
      </div>
    </div>

    <div style="margin:0 14px 9px;background:var(--s1);border:1px solid var(--f);border-radius:var(--br);overflow:hidden;cursor:pointer" onclick="FIKRA.openNewGame('football')">
      <div style="height:82px;background:linear-gradient(135deg,#081810,#0e3018,#145028);display:flex;align-items:center;justify-content:space-between;padding:0 16px">
        <div><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:16px">Master Liga</div><div style="font-size:10px;color:rgba(255,255,255,.4);margin-top:2px">Klub tanlang, jamoa tuzing</div></div>
        <div style="font-size:26px">⚽</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 14px">
        <div><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px">Futbol manager</div><div style="font-size:10px;color:var(--m);margin-top:2px">8 klub · Transfer · O'yin</div></div>
        <button class="btn btn-acc btn-sm">Boshlash</button>
      </div>
    </div>
    <div class="sl">Reyting</div>
    <div class="lb" style="margin:0 14px 14px">
      <div class="lb-head"><span class="lb-title">O'yinlar reytingi</span><span class="live-dot">Jonli</span></div>
      <div style="display:flex;gap:5px;padding:8px 13px;border-bottom:1px solid var(--f);overflow-x:auto" id="lb-tabs">
        <button class="lb-tab-btn active" onclick="FIKRA.switchLbTab(this,'xp')">⚡ XP</button>
        <button class="lb-tab-btn" onclick="FIKRA.switchLbTab(this,'stroop-color')">Stroop rang</button>
        <button class="lb-tab-btn" onclick="FIKRA.switchLbTab(this,'stroop-tf')">Stroop t/n</button>
        <button class="lb-tab-btn" onclick="FIKRA.switchLbTab(this,'stroop-avg')">Stroop o'rt</button>
        <button class="lb-tab-btn" onclick="FIKRA.switchLbTab(this,'test-maj')">Test maj.</button>
        <button class="lb-tab-btn" onclick="FIKRA.switchLbTab(this,'test-mut')">Test mut.</button>
      </div>
      <div id="lb-game-rows"><div style="padding:12px 14px;font-size:12px;color:var(--m)">Yuklanmoqda...</div></div>
    </div>
  </div>
  <div class="subpanel" id="sg-stroop"></div>
  <div class="subpanel" id="sg-test"></div>
  <div class="subpanel" id="sg-result"></div>
</div>`;
  }

  function buildAI() {
    return `<div class="panel" id="p-ai">
  <div class="subpanel active" id="sa-home">
    <div class="sl" style="margin-top:6px">AI xizmatlar</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 14px 10px">
      <div class="ai-svc-card" onclick="FIKRA.openAIChat('general')">💬<div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;margin:8px 0 2px">AI Chat</div><div style="font-size:10px;color:var(--m)">1 savol = <strong style="color:var(--y)">5t</strong></div></div>
      <div class="ai-svc-card" onclick="FIKRA.openAIChat('doc')">📄<div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;margin:8px 0 2px">Hujjat yaratish</div><div style="font-size:10px;color:var(--m)">DOCX·PDF·PPTX · <strong style="color:var(--y)">10t</strong></div></div>
      <div class="ai-svc-card" onclick="FIKRA.openImage()">🎨<div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;margin:8px 0 2px">Rasm yaratish</div><div style="font-size:10px;color:var(--m)">1 rasm = <strong style="color:var(--y)">30t</strong></div></div>
      <div class="ai-svc-card" onclick="FIKRA.openKal()">🥗<div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;margin:8px 0 2px">Kaloriya AI</div><div style="font-size:10px;color:var(--m)">1 skan = <strong style="color:var(--y)">15t</strong></div></div>
    </div>
    <div class="sl">Chatlar tarixi</div>
    <div id="chat-history-list" style="padding:0 14px"></div>
  </div>
  <div class="subpanel" id="sa-chat"></div>
  <div class="subpanel" id="sa-doc"></div>
  <div class="subpanel" id="sa-image"></div>
  <div class="subpanel" id="sa-kal"></div>
</div>`;
  }

  function buildProfile() {
    const name = user ? (user.firstName || user.username || 'Foydalanuvchi') : 'Foydalanuvchi';
    const initials = name.slice(0, 2).toUpperCase();
    const refLink = user?.telegramId
      ? `https://t.me/${window.BOT_USERNAME || 'fikra_bot'}?start=ref_${user.telegramId}`
      : '';
    const rank = user?.rank || null;
    const rankCurrent = rank?.current;
    const rankNext = rank?.next;
    const rankPct = rank?.percent || 0;

    return `<div class="panel" id="p-profile">
  <div style="height:5px"></div>

  <!-- PROFILE + RANK BADGE -->
  <div style="display:flex;align-items:center;gap:12px;background:var(--s2);border:1px solid var(--f);border-radius:var(--br);padding:13px;margin:0 14px 9px">
    <div style="position:relative;flex-shrink:0">
      <div style="width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,var(--acc),var(--r));display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:20px">${initials}</div>
      ${rankCurrent ? `
        <div style="position:absolute;right:-4px;bottom:-4px;width:24px;height:24px;border-radius:50%;background:${rankCurrent.color};display:flex;align-items:center;justify-content:center;font-size:13px;border:2px solid var(--bg);box-shadow:0 0 12px ${rankCurrent.glow}" title="${rankCurrent.name}">${rankCurrent.emoji}</div>
      ` : ''}
    </div>
    <div style="flex:1;min-width:0">
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px">${name}</div>
      <div style="font-size:11px;color:var(--m);margin-top:2px">@${user?.username || 'user'}</div>
      ${rankCurrent ? `
        <div style="display:flex;align-items:center;gap:5px;margin-top:4px;font-size:10px;font-weight:700">
          <span style="color:${rankCurrent.color}">${rankCurrent.name}</span>
          <span style="color:var(--m)">·</span>
          <span style="color:var(--y)">${(user.xp || 0).toLocaleString()} XP</span>
        </div>
      ` : ''}
    </div>
    <button onclick="FIKRA.showRankDetail()" style="width:30px;height:30px;border-radius:50%;background:var(--s3);border:1px solid var(--f);color:var(--m);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0" title="Barcha lavozimlar">ℹ</button>
  </div>

  ${rankCurrent ? `
  <!-- RANK PROGRESS BAR -->
  <div style="background:var(--s2);border:1px solid ${rankCurrent.color}33;border-radius:var(--br);padding:12px 14px;margin:0 14px 9px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:12px;color:${rankCurrent.color}">
        ${rankCurrent.emoji} ${rankCurrent.name} · Daraja ${rankCurrent.level}
      </div>
      <div style="font-size:11px;color:var(--m);font-weight:700">${rankPct}%</div>
    </div>
    <div style="height:8px;background:var(--s3);border-radius:100px;overflow:hidden;margin-bottom:6px">
      <div style="height:100%;background:linear-gradient(90deg,${rankCurrent.color},${rankNext ? rankNext.color : rankCurrent.color});width:${rankPct}%;border-radius:100px;transition:width .5s ease;box-shadow:0 0 8px ${rankCurrent.glow}"></div>
    </div>
    ${rankNext ? `
      <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--m)">
        <span>${(rank.xpInLevel || 0).toLocaleString()} / ${(rankNext.minXp - rankCurrent.minXp).toLocaleString()}</span>
        <span>Keyingi: <span style="color:${rankNext.color};font-weight:700">${rankNext.emoji} ${rankNext.name}</span> · ${rank.xpToNext.toLocaleString()} XP qoldi</span>
      </div>
    ` : `
      <div style="font-size:10px;color:var(--y);font-weight:700;text-align:center">🏆 Eng yuqori daraja!</div>
    `}
  </div>
  ` : ''}

  <div class="stats-row">
    <div class="stat-card"><div class="stat-val" style="color:var(--y)" id="p-tok">${tokens.toLocaleString()}</div><div class="stat-key">Token</div></div>
    <div class="stat-card"><div class="stat-val" style="color:var(--al)" id="p-games">${user?.totalGamesPlayed || 0}</div><div class="stat-key">O'yin</div></div>
    <div class="stat-card"><div class="stat-val" style="color:var(--g)" id="p-ai">${user?.totalAiRequests || 0}</div><div class="stat-key">AI so'rov</div></div>
  </div>

  <!-- REFERRAL BO'LIMI -->
  <div style="background:var(--s2);border:1px solid rgba(0,212,170,.22);border-radius:var(--br);padding:14px;margin:0 14px 9px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <div style="width:34px;height:34px;border-radius:10px;background:rgba(0,212,170,.15);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0">🎯</div>
      <div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px">Do'stni taklif qil</div>
        <div style="font-size:10px;color:var(--m)">Har taklif = <strong style="color:var(--g)">+50t</strong> senga · +25t do'stga</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:6px;background:var(--s3);border:1px solid var(--f);border-radius:var(--br2);padding:8px 10px;margin-bottom:8px">
      <input id="ref-link" value="${refLink}" readonly style="flex:1;background:transparent;border:none;color:var(--txt);font-size:11px;font-family:monospace;outline:none;overflow:hidden;text-overflow:ellipsis">
      <button onclick="FIKRA.copyRef()" style="background:var(--acc);color:#fff;border:none;padding:5px 10px;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;flex-shrink:0">Nusxa</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
      <button onclick="FIKRA.shareRef()" style="padding:8px;background:var(--g);color:#000;border:none;border-radius:var(--br2);font-family:'Syne',sans-serif;font-weight:700;font-size:11px;cursor:pointer">📤 Ulashish</button>
      <div style="padding:8px;background:var(--s3);border:1px solid var(--f);border-radius:var(--br2);text-align:center">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:var(--g)">${user?.referralCount || 0}</div>
        <div style="font-size:9px;color:var(--m);margin-top:1px;text-transform:uppercase;font-weight:700">Do'stlar</div>
      </div>
    </div>
  </div>

  <!-- TOKEN TARIXI -->
  <div style="background:var(--s2);border:1px solid var(--f);border-radius:var(--br);padding:12px 14px;margin:0 14px 9px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px">Token tarixi</div>
      <button onclick="FIKRA.loadTokenHistory()" style="font-size:10px;color:var(--al);background:transparent;border:none;cursor:pointer;font-weight:700">Ko'rish ↓</button>
    </div>
    <div id="token-history-list"></div>
  </div>

  <!-- OBUNA VA TOKEN HARID -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 14px 9px">
    <div onclick="FIKRA.openSubscriptions()" style="background:linear-gradient(135deg,rgba(123,104,238,.15),rgba(255,111,163,.08));border:1px solid rgba(123,104,238,.28);border-radius:var(--br);padding:14px;cursor:pointer;transition:all .15s">
      <div style="font-size:22px;margin-bottom:6px">✨</div>
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;margin-bottom:2px">Obuna</div>
      <div style="font-size:10px;color:var(--m)">Basic · Pro · VIP</div>
    </div>
    <div onclick="FIKRA.openTokenShop()" style="background:linear-gradient(135deg,rgba(255,204,68,.15),rgba(0,212,170,.08));border:1px solid rgba(255,204,68,.28);border-radius:var(--br);padding:14px;cursor:pointer;transition:all .15s">
      <div style="font-size:22px;margin-bottom:6px">🪙</div>
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;margin-bottom:2px">Token harid</div>
      <div style="font-size:10px;color:var(--m)">50t dan 1500t gacha</div>
    </div>
  </div>

  <div class="ads-strip">
    <div><div class="ads-strip-title">Token yig'</div><div class="ads-strip-sub">+5t reklama ko'rib</div></div>
    <button class="watch-btn" onclick="FIKRA.showAdsModal(5,'profile_bonus')">Ko'rish</button>
  </div>
</div>`;
  }

  // ─── Navigation ───────────────────────────────────────────────────────────
  function switchPanel(name) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('p-' + name)?.classList.add('active');
    document.getElementById('ni-' + name)?.classList.add('active');
    document.getElementById('scroll').scrollTop = 0;
    activePanel = name;
    if (name === 'games') showSubpanel('games', 'sg-list');
    if (name === 'ai') { showSubpanel('ai', 'sa-home'); renderChatHistory(); }
    if (name === 'home') {
      // Turnir banneri yangilansin
      loadHomeTournament();
      // Musiqa tugmasi holati
      const homeBtn = document.getElementById('home-music-btn');
      if (homeBtn && window.MUSIC) {
        homeBtn.textContent = MUSIC.isPlaying() ? '❚❚' : '▶';
      }
    }
  }

  function showSubpanel(panel, subId) {
    const target = document.getElementById(subId);
    if (!target) return;
    target.parentElement.querySelectorAll(':scope > .subpanel')
      .forEach(s => s.classList.remove('active'));
    target.classList.add('active');
  }

  function goGame(game) {
    switchPanel('games');
    setTimeout(() => {
      if (game === 'stroop') renderStroop();
      else if (game === 'test') renderTest();
    }, 20);
  }

  function openAIChat(type) {
    switchPanel('ai');
    setTimeout(() => {
      // Chat tarixidan kirilganda mavjud chatni ochish
      // Oddiy tugmadan kirilganda (general/doc) — yangi chat
      if (type === 'doc' || type === 'doc_new') renderDocChat('doc_new');
      else if (type === 'doc_continue') renderDocChat('doc');
      else if (type === 'general_continue') renderGeneralChat('general');
      else renderGeneralChat('general_new'); // default: yangi chat
    }, 20);
  }

  function openKal() {
    switchPanel('ai');
    setTimeout(() => renderKaloriya(), 20);
  }

  function openImage() {
    switchPanel('ai');
    setTimeout(() => renderImage(), 20);
  }

  function renderImage() {
    IMG.loadHistory();
    const history = IMG.getHistory();
    document.getElementById('sa-image').innerHTML = `
<div class="back-btn" onclick="FIKRA.backToAI()">← AI</div>
<div style="padding:0 14px">
  <div style="background:var(--s2);border:1px solid var(--f);border-radius:var(--br);padding:14px;margin-bottom:10px">
    <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;margin-bottom:8px">🎨 Rasm yaratish</div>
    <textarea id="img-prompt" rows="3" placeholder="Masalan: futuristik shahar kechki payt, neon chiroqlar..." style="width:100%;background:var(--s3);border:1px solid var(--f);border-radius:var(--br2);padding:10px;color:var(--txt);font-family:'Nunito',sans-serif;font-size:13px;resize:none;outline:none;line-height:1.5"></textarea>
    <div style="display:flex;align-items:center;gap:8px;margin-top:10px">
      <span style="font-size:10px;color:var(--y);background:rgba(255,204,68,.08);padding:3px 8px;border-radius:100px;border:1px solid rgba(255,204,68,.2);font-weight:700">−30t</span>
      <button class="btn btn-acc btn-sm" style="flex:1" onclick="FIKRA.genImage()">Yaratish ✨</button>
    </div>
  </div>
  <div id="img-result"></div>
  ${history.length > 0 ? `
    <div class="sl" style="margin:14px 0 6px">Oxirgi rasmlar</div>
    <div id="img-history" style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-bottom:14px">
      ${history.slice(0,4).map((h, i) => `
        <div onclick="FIKRA.showOldImage(${i})" style="background:var(--s2);border:1px solid var(--f);border-radius:var(--br2);padding:5px;cursor:pointer">
          <img src="data:${h.mimeType};base64,${h.base64}" style="width:100%;height:90px;object-fit:cover;border-radius:6px;display:block">
          <div style="font-size:10px;color:var(--m);margin-top:4px;padding:0 3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${h.prompt.slice(0,24)}</div>
        </div>
      `).join('')}
    </div>
  ` : ''}
</div>`;
    showSubpanel('ai', 'sa-image');
  }

  async function genImage() {
    const inp = document.getElementById('img-prompt');
    const prompt = inp.value.trim();
    if (!prompt) {
      showToast('Avval tavsif yozing');
      return;
    }

    const resultDiv = document.getElementById('img-result');
    resultDiv.innerHTML = `
<div style="background:var(--s2);border:1px solid var(--f);border-radius:var(--br);padding:22px;text-align:center;margin-bottom:10px">
  <div style="display:inline-block;width:24px;height:24px;border:2.5px solid var(--acc);border-top-color:transparent;border-radius:50%;animation:spin .7s linear infinite;margin-bottom:10px"></div>
  <div style="font-size:12px;color:var(--m)">Rasm yaratilmoqda... (15-30 soniya)</div>
</div>`;

    try {
      const res = await IMG.generate(prompt);
      _showImageResult(res);
      updateTokenDisplay();
      showToast('Rasm tayyor!');
      inp.value = '';
      // History bo'limini yangilash uchun qayta render
      setTimeout(() => renderImage(), 100);
    } catch (e) {
      resultDiv.innerHTML = `<div style="background:rgba(255,95,126,.07);border:1px solid rgba(255,95,126,.2);border-radius:var(--br);padding:14px;margin-bottom:10px"><div style="font-size:13px;color:var(--r);font-weight:600">❌ ${e.message || 'Xatolik'}</div></div>`;
      if (e.code === 'INSUFFICIENT_TOKENS') {
        showAdsModal(5, 'image_retry');
      }
    }
  }

  function _showImageResult(res) {
    const resultDiv = document.getElementById('img-result');
    if (!resultDiv) return;
    const btnId = 'img-dl-' + Date.now();
    const shareBtnId = 'img-sh-' + Date.now();
    resultDiv.innerHTML = `
<div style="background:var(--s2);border:1px solid var(--f);border-radius:var(--br);padding:10px;margin-bottom:10px">
  <img src="data:${res.mimeType};base64,${res.base64}" style="width:100%;border-radius:var(--br2);display:block;margin-bottom:10px">
  <div style="font-size:11px;color:var(--m);padding:0 4px 10px;line-height:1.5">"${res.prompt}"</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
    <button id="${btnId}" style="padding:9px;background:var(--acc);color:#fff;border:none;border-radius:var(--br2);font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer">⬇ Yuklab olish</button>
    <button id="${shareBtnId}" style="padding:9px;background:var(--s3);color:var(--txt);border:1px solid var(--f);border-radius:var(--br2);font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer">↗ Ulashish</button>
  </div>
</div>`;

    // Download
    const dl = document.getElementById(btnId);
    if (dl) {
      dl.onclick = () => {
        try {
          const bytes = atob(res.base64);
          const arr = new Uint8Array(bytes.length);
          for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
          const blob = new Blob([arr], { type: res.mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'fikra_ai_' + Date.now() + '.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          showToast('Yuklab olindi!');
        } catch (e) {
          showToast('Xatolik: ' + e.message);
        }
      };
    }

    // Share — Telegram orqali
    const sh = document.getElementById(shareBtnId);
    if (sh) {
      sh.onclick = () => {
        if (tg && tg.shareURL) {
          tg.shareURL('Mening FIKRA AI rasmim', res.prompt);
        } else {
          showToast('Ulashish Telegram ichida ishlaydi');
        }
      };
    }
  }

  function showOldImage(idx) {
    const history = IMG.getHistory();
    const item = history[idx];
    if (item) _showImageResult(item);
  }

  // ─── Stroop render ────────────────────────────────────────────────────────
  function renderStroop() {
    document.getElementById('sg-stroop').innerHTML = `
<div class="back-btn" onclick="FIKRA.backToGames()">← O'yinlar</div>
<div style="padding:13px">
  <div style="display:flex;gap:8px;margin-bottom:13px" id="stroop-mode-sel">
    <div id="sm0" class="mode-btn active" onclick="FIKRA.selectStroopMode(0)">
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:12px">Rang turi</div>
      <div style="font-size:10px;color:var(--m);margin-top:2px">So'z rangini top</div>
    </div>
    <div id="sm1" class="mode-btn" onclick="FIKRA.selectStroopMode(1)">
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:12px">To'g'ri / Noto'g'ri</div>
      <div style="font-size:10px;color:var(--m);margin-top:2px">Mos keladimi?</div>
    </div>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
    <div class="stimer" id="stimer">12</div>
    <div style="display:flex;gap:3px;font-size:14px" id="shearts">
      <span>❤️</span><span>❤️</span><span>❤️</span>
    </div>
    <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:var(--y)" id="sscore">0 ball</div>
  </div>
  <div class="prog-bar" style="margin-bottom:14px"><div class="prog-fill" id="spf" style="width:100%"></div></div>

  <div id="mode0-ui">
    <div style="background:var(--s2);border:1px solid var(--f);border-radius:var(--br);padding:20px 14px;text-align:center;margin-bottom:14px">
      <div style="font-size:11px;color:var(--m);margin-bottom:8px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Bu so'z qaysi RANGDA yozilgan?</div>
      <div class="stroop-word" id="sw">KO'K</div>
      <div style="font-size:11px;color:var(--m);margin-top:8px">Rangni bosing</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px">
      <div class="stroop-ans" id="sa0" onclick="FIKRA.sAns(this)">Qizil</div>
      <div class="stroop-ans" id="sa1" onclick="FIKRA.sAns(this)">Ko'k</div>
      <div class="stroop-ans" id="sa2" onclick="FIKRA.sAns(this)">Yashil</div>
      <div class="stroop-ans" id="sa3" onclick="FIKRA.sAns(this)">Sariq</div>
    </div>
  </div>

  <div id="mode1-ui" style="display:none">
    <div style="text-align:center;font-size:11px;color:var(--m);font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">So'z va rang MOS keladimi?</div>
    <div id="tf-circle" style="width:160px;height:160px;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;border:3px solid rgba(255,255,255,.1);transition:border-color .2s">
      <span id="tf-word" style="font-family:'Syne',sans-serif;font-size:26px;font-weight:800">QIZIL</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div onclick="FIKRA.tfAns(true)" style="height:56px;border-radius:var(--br);background:rgba(0,212,170,.15);border:2px solid rgba(0,212,170,.3);color:var(--g);cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:18px;transition:all .15s" onmousedown="this.style.background='rgba(0,212,170,.3)'">✓ Ha</div>
      <div onclick="FIKRA.tfAns(false)" style="height:56px;border-radius:var(--br);background:rgba(255,95,126,.12);border:2px solid rgba(255,95,126,.25);color:var(--r);cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:18px;transition:all .15s" onmousedown="this.style.background='rgba(255,95,126,.25)'">✗ Yo'q</div>
    </div>
  </div>
</div>`;
    showSubpanel('games', 'sg-stroop');
    STROOP.init({
      word: document.getElementById('sw'),
      timerEl: document.getElementById('stimer'),
      scoreEl: document.getElementById('sscore'),
      prog: document.getElementById('spf'),
      hearts: Array.from(document.getElementById('shearts').children),
      answerBtns: [0,1,2,3].map(i => document.getElementById('sa'+i)),
      tfCircle: document.getElementById('tf-circle'),
      tfWord: document.getElementById('tf-word'),
    });
    STROOP.start(0);
  }

  function selectStroopMode(m) {
    // Birinchi marta ochgan foydalanuvchi uchun qisqa tushuntirish
    const key = 'fikra_stroop_tut_' + m;
    const seen = (() => { try { return localStorage.getItem(key); } catch { return true; } })();
    if (!seen) {
      const explain = m === 0
        ? "Ekranga so'z chiqadi. Lekin so'z o'qishingiz shart emas — uning RANGI qaysi, o'shani tanlang!\n\nMasalan: QIZIL so'zi ko'k rangda yozilgan bo'lsa — \"Ko'k\" ni tanlaysiz."
        : "Ekranda so'z va rang chiqadi. Agar so'z matni o'z rangiga mos kelsa — \"To'g'ri\"; aks holda — \"Noto'g'ri\".\n\nMasalan: QIZIL so'zi qizil rangda — \"To'g'ri\".\nQIZIL so'zi ko'k rangda — \"Noto'g'ri\".";

      uiConfirm(explain, {
        title: m === 0 ? "Rang tanlash — qoida" : "To'g'ri/Noto'g'ri — qoida",
        okLabel: "Tushundim, boshlash",
        cancelLabel: "Orqaga",
      }).then(ok => {
        if (!ok) { backToGames(); return; }
        try { localStorage.setItem(key, '1'); } catch {}
        _startStroopWithMode(m);
      });
      return;
    }
    _startStroopWithMode(m);
  }

  function _startStroopWithMode(m) {
    document.querySelectorAll('.mode-btn').forEach((b, i) => b.classList.toggle('active', i === m));
    document.getElementById('mode0-ui').style.display = m === 0 ? 'block' : 'none';
    document.getElementById('mode1-ui').style.display = m === 1 ? 'block' : 'none';
    STROOP.start(m);
  }

  function sAns(btn) { STROOP.answerColor(btn); }
  function tfAns(val) { STROOP.answerTF(val); }

  // ─── Stroop natija ekrani ─────────────────────────────────────────────────
  function showStroopResult(r) {
    const accuracy = r.correctCount + r.wrongCount > 0
      ? Math.round((r.correctCount / (r.correctCount + r.wrongCount)) * 100)
      : 0;
    const overlay = document.createElement('div');
    overlay.id = 'stroop-result';
    overlay.className = 'ui-modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9998;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(10px);animation:fadeIn .3s ease';

    const reasonText = r.reason === 'no_lives'
      ? "3 ta xatoga yo'l qo'ydingiz"
      : "Vaqt tugadi";

    overlay.innerHTML = `
<div style="max-width:360px;width:100%;background:var(--s1);border:1px solid var(--f);border-radius:20px;padding:22px;animation:scaleIn .4s cubic-bezier(.34,1.56,.64,1);text-align:center">
  <div style="font-size:38px;margin-bottom:6px">${r.isNewBest ? '🏆' : '🎯'}</div>
  <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:17px;margin-bottom:4px">${r.isNewBest ? 'Yangi rekord!' : 'O\'yin tugadi'}</div>
  <div style="font-size:11px;color:var(--m);margin-bottom:16px">${reasonText}</div>

  <div style="background:var(--s2);border:1px solid var(--f);border-radius:14px;padding:16px 12px;margin-bottom:14px">
    <div style="font-size:10px;color:var(--m);font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px">Natijangiz</div>
    <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:40px;color:var(--y);line-height:1">${r.score}</div>
    <div style="font-size:11px;color:var(--m);margin-top:3px">ball</div>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:14px">
      <div><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--g)">${r.correctCount}</div><div style="font-size:9px;color:var(--m);margin-top:1px">To'g'ri</div></div>
      <div><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--r)">${r.wrongCount}</div><div style="font-size:9px;color:var(--m);margin-top:1px">Xato</div></div>
      <div><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--al)">${accuracy}%</div><div style="font-size:9px;color:var(--m);margin-top:1px">Aniqlik</div></div>
    </div>
  </div>

  ${r.tokensEarned > 0 ? `
    <div style="background:linear-gradient(135deg,rgba(255,204,68,.1),rgba(0,212,170,.08));border:1px solid rgba(255,204,68,.25);border-radius:10px;padding:10px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between">
      <div style="font-size:12px;font-weight:700;color:var(--y);display:flex;align-items:center;gap:5px">🪙 Token</div>
      <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:14px;color:var(--y)">+${r.tokensEarned}</div>
    </div>
  ` : ''}

  ${r.xp && r.xp.added ? `
    <div style="background:linear-gradient(135deg,rgba(123,104,238,.1),rgba(0,212,170,.08));border:1px solid rgba(123,104,238,.25);border-radius:10px;padding:10px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between">
      <div style="font-size:12px;font-weight:700;color:var(--al)">⚡ XP</div>
      <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:14px;color:var(--al)">+${r.xp.added}</div>
    </div>
  ` : ''}

  ${r.bestScore > 0 && !r.isNewBest ? `
    <div style="font-size:11px;color:var(--m);margin-bottom:14px">Sizning rekord: <span style="color:var(--y);font-weight:700">${r.bestScore}</span></div>
  ` : ''}

  <div style="display:flex;gap:8px">
    <button onclick="FIKRA.stroopWatchAd()" style="flex:1;padding:12px 10px;background:var(--s3);color:var(--txt);border:1px solid var(--y);border-radius:12px;font-family:'Syne',sans-serif;font-weight:700;font-size:11px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px">
      <span>Reklama ko'rish</span>
      <span style="font-size:9px;color:var(--y)">+5 token</span>
    </button>
    <button onclick="FIKRA.stroopRetry()" style="flex:1.3;padding:12px;background:var(--acc);color:#fff;border:none;border-radius:12px;font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer">Qayta o'ynash</button>
  </div>
  <button onclick="FIKRA.stroopExit()" style="width:100%;margin-top:8px;padding:11px;background:transparent;color:var(--m);border:1px solid var(--f);border-radius:12px;font-family:'Syne',sans-serif;font-weight:700;font-size:11px;cursor:pointer">Chiqish</button>
</div>`;

    document.body.appendChild(overlay);

    // Haptic success agar yangi rekord
    if (r.isNewBest) hapticNotify('success');
  }

  function stroopWatchAd() {
    const overlay = document.getElementById('stroop-result');
    if (overlay) overlay.remove();
    if (window.ADS && window.ADS.showRewardedAd) {
      window.ADS.showRewardedAd('stroop_bonus').then(() => {
        updateTokenDisplay();
      });
    }
  }

  function stroopRetry() {
    const overlay = document.getElementById('stroop-result');
    if (overlay) overlay.remove();
    // Joriy mode ni qayta boshlash
    const activeMode = document.querySelector('.mode-btn.active');
    const modeIdx = activeMode ? Array.from(document.querySelectorAll('.mode-btn')).indexOf(activeMode) : 0;
    STROOP.start(modeIdx);
  }

  function stroopExit() {
    const overlay = document.getElementById('stroop-result');
    if (overlay) overlay.remove();
    backToGames();
  }

  // ─── Test render ──────────────────────────────────────────────────────────
  function renderTest() {
    TEST.resetStats();
    document.getElementById('sg-test').innerHTML = `
<div class="back-btn" onclick="FIKRA.backToGames()">← O'yinlar</div>
<div style="display:flex;gap:6px;padding:6px 14px 8px">
  <button class="test-nav-btn active" id="tn-maj" onclick="FIKRA.switchTestNav('maj')">Majburiy fanlar</button>
  <button class="test-nav-btn" id="tn-mut" onclick="FIKRA.switchTestNav('mut')">Mutaxassislik</button>
</div>
<div id="test-content"></div>`;
    showSubpanel('games', 'sg-test');
    renderMajSection();
  }

  function switchTestNav(type) {
    ['maj','mut'].forEach(t => {
      document.getElementById('tn-'+t)?.classList.toggle('active', t === type);
    });
    if (type === 'maj') renderMajSection();
    else renderMutSection();
  }

  function renderMajSection() {
    document.getElementById('test-content').innerHTML = `
<div style="padding:0 14px">
  <div style="background:var(--s2);border:1px solid var(--f);border-radius:var(--br2);padding:11px 13px;margin-bottom:10px">
    <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;margin-bottom:3px">Majburiy fanlar bloki</div>
    <div style="font-size:11px;color:var(--m)">3 fan · 10 ta savol · To'g'ri javob: 1.1 ball</div>
  </div>
  <div style="display:flex;gap:6px;margin-bottom:10px">
    <button class="fan-tab active" id="ft-uztil" onclick="FIKRA.selMajFan('uztil',this)">Ona tili</button>
    <button class="fan-tab" id="ft-math" onclick="FIKRA.selMajFan('math',this)">Matematika</button>
    <button class="fan-tab" id="ft-tarix" onclick="FIKRA.selMajFan('tarix',this)">Tarix</button>
  </div>
  <div id="maj-q-wrap"></div>
</div>`;
    selMajFan('uztil', document.getElementById('ft-uztil'));
  }

  async function selMajFan(subject, btn) {
    document.querySelectorAll('.fan-tab').forEach(b => b.classList.remove('active'));
    btn && btn.classList.add('active');
    const qs = await TEST.startMaj(subject);
    renderMajQuestion(qs[0], 0, qs.length);
  }

  function renderMajQuestion(q, idx, total) {
    const letters = ['A','B','C','D'];
    document.getElementById('maj-q-wrap').innerHTML = `
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
  <span style="font-size:11px;color:var(--m);font-weight:600">${idx+1} / ${total} savol</span>
  <span style="font-size:10px;font-weight:700;color:var(--y);background:rgba(255,204,68,.1);padding:2px 8px;border-radius:100px;border:1px solid rgba(255,204,68,.2)">1.1 ball</span>
</div>
<div class="prog-bar" style="margin-bottom:10px"><div class="prog-fill gradient" style="width:${((idx+1)/total)*100}%"></div></div>
<div style="background:var(--s2);border:1px solid var(--f);border-radius:var(--br);padding:15px">
  <div style="font-size:14px;font-weight:600;line-height:1.5;margin-bottom:12px">${_escapeHtml(q.question)}</div>
  <div id="maj-opts">${q.options.map((o,i) => `
    <div class="test-opt" onclick="FIKRA.selMajOpt(this,${i},'${q._id}')" data-idx="${i}" data-qid="${q._id}">
      <div class="opt-letter">${letters[i]}</div>
      <div style="font-size:13px;font-weight:500">${_escapeHtml(o)}</div>
    </div>`).join('')}
  </div>
  <div id="maj-explanation" style="display:none;margin-top:12px;padding:10px;background:rgba(123,104,238,.06);border:1px solid rgba(123,104,238,.15);border-radius:var(--br2)"></div>
</div>
<div style="display:flex;gap:7px;margin-top:10px">
  <button style="flex:1;padding:10px;border-radius:var(--br2);background:var(--s3);border:1px solid var(--f);color:var(--m);font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px" onclick="FIKRA.getHint('${q._id}','${q.question.replace(/'/g,"\\'").replace(/"/g,'&quot;')}')">
    AI hint <span style="font-size:10px;color:var(--y);font-weight:700">−10t</span>
  </button>
  <button id="maj-next-btn" style="flex:2;padding:10px;border-radius:var(--br2);background:var(--acc);color:#fff;border:none;font-family:'Syne',sans-serif;font-weight:700;font-size:14px;cursor:pointer" onclick="FIKRA.nextMajQ()">Keyingisi →</button>
</div>`;
  }

  let _majSelectedIdx = -1;
  let _majSelectedQId = '';

  let _majAnswered = false;

  async function selMajOpt(el, idx, qId) {
    if (_majAnswered) return; // Javob tanlangan, qayta tanlash yo'q
    _majAnswered = true;
    document.querySelectorAll('#maj-opts .test-opt').forEach(o => {
      o.className = 'test-opt';
      o.style.pointerEvents = 'none';
    });
    el.classList.add('sel');
    _majSelectedIdx = idx;
    _majSelectedQId = qId;

    // Darhol javobni tekshirish
    const res = await TEST.checkMajAnswer(qId, idx);
    const opts = document.querySelectorAll('#maj-opts .test-opt');
    if (res.isCorrect) {
      opts[idx].classList.add('ok');
      showToast('+2 token — to\'g\'ri!');
      updateTokenDisplay();
    } else {
      opts[idx].classList.add('no');
      if (opts[res.correctIndex]) opts[res.correctIndex].classList.add('ok');
    }

    // Tushuntirish ko'rsatish (agar bo'lsa)
    if (res.explanation) {
      const exp = document.getElementById('maj-explanation');
      if (exp) {
        exp.style.display = 'block';
        exp.innerHTML = `<div style="font-size:10px;color:var(--al);font-weight:700;margin-bottom:4px">💡 Tushuntirish</div><div style="font-size:12px;line-height:1.5;color:var(--txt)">${_escapeHtml(res.explanation)}</div>`;
      }
    }

    // "Keyingisi" tugmasini yoqish (pulse animatsiya bilan)
    const nextBtn = document.getElementById('maj-next-btn');
    if (nextBtn) {
      nextBtn.style.background = res.isCorrect ? 'var(--g)' : 'var(--acc)';
      nextBtn.style.animation = 'pulse 1.5s ease-in-out infinite';
    }
  }

  async function nextMajQ() {
    if (!_majAnswered) {
      showToast('Avval javobni tanlang');
      return;
    }
    _majAnswered = false;
    _majSelectedIdx = -1;
    const { done } = await TEST.nextMajQuestion();
    if (done) {
      setTimeout(async () => {
        await ADS.showInterstitialAd('test_result');
        const result = await TEST.finishAndSave('maj');
        renderTestResult(result);
      }, 300);
      return;
    }
    const q = TEST.getCurrentQ();
    renderMajQuestion(q, TEST.getQIdx(), TEST.getTotal());
  }

  function renderMutSection() {
    const dirs = TEST.getDirections();
    document.getElementById('test-content').innerHTML = `
<div style="padding:0 14px">
  <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:17px;margin-bottom:4px">Yo'nalish tanlang</div>
  <div style="font-size:12px;color:var(--m);margin-bottom:14px;line-height:1.5">Mutaxassislik fanlari yo'nalishingizga qarab belgilanadi</div>
  ${Object.entries(dirs).map(([key, dir]) => `
  <div class="dir-card" id="dc-${key}" onclick="FIKRA.selDir('${key}',this)">
    <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;margin-bottom:2px">${dir.name}</div>
    <div style="font-size:11px;color:var(--m);margin-bottom:3px">${dir.fans.map(f => TEST.getSubjectName(f)).join(' + ')}</div>
    <div style="font-size:10px;color:var(--al);font-weight:600">${dir.balls[0]} + ${dir.balls[1]} ball/savol</div>
  </div>`).join('')}
  <button id="dir-start-btn" class="btn btn-acc btn-full" style="margin-top:8px;opacity:.4;pointer-events:none" onclick="FIKRA.startMut()">Yo'nalishni tanlang</button>
</div>`;
  }

  let _selDir = null;
  function selDir(key, el) {
    _selDir = key;
    document.querySelectorAll('.dir-card').forEach(c => c.classList.remove('sel'));
    el.classList.add('sel');
    const btn = document.getElementById('dir-start-btn');
    btn.style.opacity = '1'; btn.style.pointerEvents = 'auto';
    btn.textContent = TEST.getDirections()[key].name + ' yo\'nalishi →';
  }

  async function startMut() {
    if (!_selDir) return;
    const qs = await TEST.startMut(_selDir, 0);
    renderMutTest(qs, 0);
  }

  function renderMutTest(qs, fanIdx) {
    const dir = TEST.getDirections()[_selDir];
    const letters = ['A','B','C','D'];
    const q = qs[0];
    document.getElementById('test-content').innerHTML = `
<div style="display:flex;gap:7px;padding:0 0 8px">
  <div style="flex:1;padding:9px 12px;border-radius:var(--br2);background:var(--s2);border:1px solid var(--f)">
    <div style="font-size:10px;color:var(--m);font-weight:700;margin-bottom:2px">1-fan</div>
    <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:12px">${TEST.getSubjectName(dir.fans[0])}</div>
    <div style="font-size:10px;color:var(--y);font-weight:700;margin-top:2px">${dir.balls[0]} ball/savol</div>
  </div>
  <div style="flex:1;padding:9px 12px;border-radius:var(--br2);background:var(--s2);border:1px solid var(--f)">
    <div style="font-size:10px;color:var(--m);font-weight:700;margin-bottom:2px">2-fan</div>
    <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:12px">${TEST.getSubjectName(dir.fans[1])}</div>
    <div style="font-size:10px;color:var(--al);font-weight:700;margin-top:2px">${dir.balls[1]} ball/savol</div>
  </div>
</div>
<div style="display:flex;gap:6px;margin-bottom:8px">
  <button class="fan-tab active" id="mt-f0" onclick="FIKRA.switchMutFan(0)">1-fan</button>
  <button class="fan-tab" id="mt-f1" onclick="FIKRA.switchMutFan(1)">2-fan</button>
</div>
<div id="mut-q-wrap" style="padding:0 14px"></div>`;
    renderMutQuestion(q, 0, qs.length);
  }

  async function switchMutFan(fi) {
    ['mt-f0','mt-f1'].forEach((id,i) => document.getElementById(id)?.classList.toggle('active', i === fi));
    const qs = await TEST.startMut(_selDir, fi);
    renderMutQuestion(qs[0], 0, qs.length);
  }

  let _mutSelIdx = -1, _mutSelQId = '';
  function renderMutQuestion(q, idx, total) {
    const letters = ['A','B','C','D'];
    _mutSelIdx = -1;
    _mutAnswered = false;
    document.getElementById('mut-q-wrap').innerHTML = `
<div style="display:flex;justify-content:space-between;margin-bottom:6px">
  <span style="font-size:11px;color:var(--m);font-weight:600">${idx+1} / ${total} savol</span>
  <span style="font-size:10px;font-weight:700;color:var(--y);background:rgba(255,204,68,.1);padding:2px 8px;border-radius:100px;border:1px solid rgba(255,204,68,.2)" id="mut-ball-tag">ball</span>
</div>
<div class="prog-bar" style="margin-bottom:10px"><div class="prog-fill gradient" style="width:${((idx+1)/total)*100}%"></div></div>
<div style="background:var(--s2);border:1px solid var(--f);border-radius:var(--br);padding:15px">
  <div style="font-size:14px;font-weight:600;line-height:1.5;margin-bottom:12px">${_escapeHtml(q.question)}</div>
  <div id="mut-opts">${q.options.map((o,i) => `
    <div class="test-opt" onclick="FIKRA.selMutOpt(this,${i},'${q._id}')" data-idx="${i}">
      <div class="opt-letter">${letters[i]}</div>
      <div style="font-size:13px;font-weight:500">${_escapeHtml(o)}</div>
    </div>`).join('')}
  </div>
  <div id="mut-explanation" style="display:none;margin-top:12px;padding:10px;background:rgba(123,104,238,.06);border:1px solid rgba(123,104,238,.15);border-radius:var(--br2)"></div>
</div>
<div style="display:flex;gap:7px;margin-top:10px">
  <button style="flex:1;padding:10px;border-radius:var(--br2);background:var(--s3);border:1px solid var(--f);color:var(--m);font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px" onclick="FIKRA.getHint('${q._id}','${q.question.replace(/'/g,"\\'").replace(/"/g,'&quot;')}')">
    AI hint <span style="font-size:10px;color:var(--y)">−10t</span>
  </button>
  <button id="mut-next-btn" style="flex:2;padding:10px;border-radius:var(--br2);background:var(--acc);color:#fff;border:none;font-family:'Syne',sans-serif;font-weight:700;font-size:14px;cursor:pointer" onclick="FIKRA.nextMutQ()">Keyingisi →</button>
</div>`;
  }

  let _mutAnswered = false;

  async function selMutOpt(el, idx, qId) {
    if (_mutAnswered) return;
    _mutAnswered = true;
    document.querySelectorAll('#mut-opts .test-opt').forEach(o => {
      o.className = 'test-opt';
      o.style.pointerEvents = 'none';
    });
    el.classList.add('sel');
    _mutSelIdx = idx; _mutSelQId = qId;

    const res = await TEST.checkMutAnswer(qId, idx);
    const opts = document.querySelectorAll('#mut-opts .test-opt');
    if (res.isCorrect) {
      opts[idx].classList.add('ok');
      showToast('+2t · to\'g\'ri!');
      updateTokenDisplay();
    } else {
      opts[idx].classList.add('no');
      if (opts[res.correctIndex]) opts[res.correctIndex].classList.add('ok');
    }

    if (res.explanation) {
      const exp = document.getElementById('mut-explanation');
      if (exp) {
        exp.style.display = 'block';
        exp.innerHTML = `<div style="font-size:10px;color:var(--al);font-weight:700;margin-bottom:4px">💡 Tushuntirish</div><div style="font-size:12px;line-height:1.5;color:var(--txt)">${_escapeHtml(res.explanation)}</div>`;
      }
    }
  }

  async function nextMutQ() {
    if (!_mutAnswered) {
      showToast('Avval javobni tanlang');
      return;
    }
    _mutAnswered = false;
    _mutSelIdx = -1;
    const { done } = await TEST.nextMajQuestion();
    if (done) {
      setTimeout(async () => {
        await ADS.showInterstitialAd('test_result');
        const result = await TEST.finishAndSave('mut');
        renderTestResult(result);
      }, 300);
      return;
    }
    renderMutQuestion(TEST.getCurrentQ(), TEST.getQIdx(), TEST.getTotal());
  }

  function renderTestResult(result) {
    const pct = result.maxBall > 0 ? Math.round((result.totalBall / result.maxBall) * 100) : 0;
    const grade = pct >= 90 ? "A'lo" : pct >= 70 ? 'Yaxshi' : pct >= 50 ? "O'rta" : 'Qoniqarsiz';
    const gc = pct >= 90 ? 'var(--g)' : pct >= 70 ? 'var(--y)' : pct >= 50 ? 'var(--al)' : 'var(--r)';
    document.getElementById('sg-result').innerHTML = `
<div class="back-btn" onclick="FIKRA.backToGames()">← O'yinlar</div>
<div style="padding:14px;text-align:center">
  <div style="background:linear-gradient(135deg,rgba(123,104,238,.1),rgba(0,212,170,.08));border:1px solid rgba(0,212,170,.2);border-radius:var(--br);padding:16px;margin-bottom:14px">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--g);margin-bottom:5px">DTM umumiy bali</div>
    <div style="font-family:'Syne',sans-serif;font-size:46px;font-weight:800;color:var(--y)">${result.totalBall}</div>
    <div style="font-size:12px;color:var(--m);margin-top:2px">${result.maxBall} baldan</div>
    <div class="prog-bar" style="margin:10px 0 4px"><div class="prog-fill gradient" style="width:${pct}%"></div></div>
    <div style="font-size:11px;color:var(--m)">${pct}% — <span style="font-weight:700;color:${gc}">${grade}</span></div>
  </div>
  ${result.xp ? `
    <div style="background:linear-gradient(135deg,rgba(123,104,238,.12),rgba(0,212,170,.08));border:1px solid rgba(123,104,238,.25);border-radius:var(--br);padding:12px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between">
      <div style="text-align:left">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:var(--al);margin-bottom:2px">Tajriba</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:var(--txt)">+${result.xp.added} XP</div>
        <div style="font-size:10px;color:var(--m);margin-top:1px">Jami: ${(result.xp.total || 0).toLocaleString()} XP</div>
      </div>
      ${result.xp.newRank ? `
        <div style="text-align:center">
          <div style="font-size:9px;font-weight:700;color:${result.xp.newRank.color};margin-bottom:2px">YANGI!</div>
          <div style="font-size:24px">${result.xp.newRank.emoji}</div>
          <div style="font-size:9px;color:${result.xp.newRank.color};font-weight:700">${result.xp.newRank.name}</div>
        </div>
      ` : `
        <div style="font-size:22px">⚡</div>
      `}
    </div>
  ` : ''}
  <div style="background:var(--s2);border:1px solid var(--f);border-radius:var(--br);padding:14px;margin-bottom:14px;text-align:left">
    ${result.breakdown.map(b => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--f)">
      <span style="font-size:12px;color:var(--m);font-weight:600">${b.name}</span>
      <span style="font-family:'Syne',sans-serif;font-weight:700;font-size:12px">${b.correct}/${b.total} · <span style="color:var(--y)">${b.ball.toFixed(1)} ball</span></span>
    </div>`).join('')}
    <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px">
      <span style="font-weight:700;font-size:13px">Jami</span>
      <span style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:var(--y)">${result.totalBall}</span>
    </div>
  </div>
  <button class="btn btn-acc btn-full" onclick="FIKRA.goGame('test')">Qayta boshlash</button>
  <button class="btn btn-full" style="background:var(--s3);color:var(--txt);margin-top:8px" onclick="FIKRA.backToGames()">O'yinlarga qaytish</button>
</div>`;
    showSubpanel('games', 'sg-result');

    // Level up ko'rsatish
    if (result.xp && result.xp.newRank) {
      setTimeout(() => showLevelUp(result.xp.newRank), 500);
    }
  }

  // ─── AI Chat render ───────────────────────────────────────────────────────
  // openChatId=null → yangi chat | 'general' → davom etgan chat
  function renderGeneralChat(openChatId) {
    // Yangi chat — default
    if (!openChatId || openChatId === 'general_new') {
      CHAT.startNew();
    } else {
      CHAT.loadFromLocal(openChatId);
    }
    const history = CHAT.getHistory();
    const limits = CHAT.limits;
    const emptyGreeting = history.length === 0;

    document.getElementById('sa-chat').innerHTML = `
<div style="display:flex;flex-direction:column;height:100%;width:100%">
  <div style="display:flex;align-items:center;gap:9px;padding:9px 14px;background:var(--bg);border-bottom:1px solid var(--f);flex-shrink:0">
    <div class="back-btn" style="padding:0;cursor:pointer" onclick="FIKRA.backToAI()">←</div>
    <div style="flex:1;min-width:0">
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px">AI Chat</div>
      <div style="font-size:10px;color:var(--m)">DeepSeek V3.2 · <span id="chat-count">${history.length}</span>/${limits.MAX_HISTORY}</div>
    </div>
    <button onclick="FIKRA.newChat()" title="Yangi chat" style="width:28px;height:28px;border-radius:50%;background:var(--s3);border:1px solid var(--f);color:var(--txt);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0" ${emptyGreeting?'style="display:none"':''}>+</button>
    <div style="font-size:10px;color:var(--y);font-weight:700;background:rgba(255,204,68,.08);padding:3px 8px;border-radius:100px;border:1px solid rgba(255,204,68,.2);flex-shrink:0">−5t</div>
  </div>
  <div id="chat-msgs" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:10px 14px;display:flex;flex-direction:column;gap:9px">
    ${emptyGreeting ? `<div class="msg-ai"><div class="msg-av-ai">🤖</div><div class="bbl-ai">Salom! Savolingizni yozing.</div></div>` : ''}
    ${history.map(h => h.role === 'user'
      ? `<div class="msg-me"><div class="bbl-me">${_escapeHtml(h.content)}</div><div class="msg-av-u">😊</div></div>`
      : `<div class="msg-ai"><div class="msg-av-ai">🤖</div><div class="bbl-ai">${_escapeHtml(h.content)}</div></div>`
    ).join('')}
  </div>
  <div style="flex-shrink:0">
    <div id="chat-input-warn" style="display:none;padding:6px 14px;font-size:11px;color:var(--r);background:rgba(255,95,126,.07);border-top:1px solid rgba(255,95,126,.15)"></div>
    <div class="chat-input-row">
      <input class="chat-input" id="chat-inp" maxlength="${limits.MAX_MSG_CHARS}" inputmode="text" autocomplete="off" placeholder="Xabar yozing..." oninput="FIKRA._chatInputChange(this)" onkeydown="if(event.key==='Enter')FIKRA.sendChat()">
      <button class="send-btn" id="chat-send-btn" onclick="FIKRA.sendChat()">↑</button>
    </div>
  </div>
</div>`;
    showSubpanel('ai', 'sa-chat');
    const msgs = document.getElementById('chat-msgs');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;

    // Telegram BackButton
    if (tg && tg.BackButton) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => backToAI());
    }
  }

  function newChat() {
    uiConfirm('Joriy suhbat tarixga saqlanadi. Yangi chat boshlaysizmi?', {
      title: 'Yangi chat', okLabel: 'Ha', cancelLabel: 'Bekor'
    }).then(ok => {
      if (ok) {
        CHAT.startNew();
        renderGeneralChat();
        showToast('Yangi chat boshlandi');
      }
    });
  }

  function _chatInputChange(el) {
    const len = el.value.length;
    const max = CHAT.limits.MAX_MSG_CHARS;
    const warn = document.getElementById('chat-input-warn');
    if (warn) {
      if (len > max * 0.9) {
        warn.style.display = 'block';
        warn.textContent = `${len}/${max} belgi`;
      } else {
        warn.style.display = 'none';
      }
    }
  }

  function _escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function sendChat() {
    const inp = document.getElementById('chat-inp');
    const sendBtn = document.getElementById('chat-send-btn');
    const text = inp.value.trim();

    // Validatsiya
    const validation = CHAT.validateMessage(text);
    if (!validation.ok) {
      showToast(validation.reason);
      return;
    }

    // Spam/limit tekshiruvi
    const check = CHAT.canSend();
    if (!check.ok) {
      if (check.code === 'CHAT_FULL') {
        uiConfirm(check.reason, { title: 'Chat to\'ldi', okLabel: 'Yangi chat', cancelLabel: 'Bekor' }).then(ok => {
          if (ok) { CHAT.startNew(); renderGeneralChat(); }
        });
      } else {
        showToast(check.reason);
      }
      return;
    }
    CHAT.markSent();

    inp.value = '';
    inp.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    const msgs = document.getElementById('chat-msgs');
    // Greeting ni olib tashlash agar birinchi xabar bo'lsa
    if (CHAT.getHistory().length === 0) {
      msgs.innerHTML = '';
    }
    msgs.innerHTML += `<div class="msg-me"><div class="bbl-me">${_escapeHtml(text)}</div><div class="msg-av-u">😊</div></div>`;
    CHAT.addMessage('user', text);
    _updateChatCount();

    const typingId = 'typing-' + Date.now();
    msgs.innerHTML += `<div id="${typingId}" class="msg-ai"><div class="msg-av-ai">🤖</div><div class="bbl-ai" style="display:flex;gap:4px;align-items:center"><span style="width:6px;height:6px;background:var(--m);border-radius:50%;animation:td .8s ease-in-out infinite"></span><span style="width:6px;height:6px;background:var(--m);border-radius:50%;animation:td .8s ease-in-out .15s infinite"></span><span style="width:6px;height:6px;background:var(--m);border-radius:50%;animation:td .8s ease-in-out .3s infinite"></span></div></div>`;
    msgs.scrollTop = msgs.scrollHeight;

    let reply = '';
    const replyDiv = document.createElement('div');
    replyDiv.className = 'msg-ai';
    replyDiv.innerHTML = '<div class="msg-av-ai">🤖</div><div class="bbl-ai" id="streaming-reply"></div>';

    try {
      await API.chat(text, CHAT.getContext().slice(0, -1), // oxirgisi yangi xabar
        (chunk) => {
          const tw = document.getElementById(typingId);
          if (tw) { tw.replaceWith(replyDiv); }
          reply += chunk;
          const el = document.getElementById('streaming-reply');
          if (el) el.textContent = reply;
          msgs.scrollTop = msgs.scrollHeight;
        },
        () => {
          if (reply) {
            CHAT.addMessage('assistant', reply);
            _updateChatCount();
          }
          updateTokenDisplay();
        }
      );
    } catch (e) {
      const tw = document.getElementById(typingId);
      if (tw) tw.remove();
      if (e.code === 'INSUFFICIENT_TOKENS') {
        msgs.innerHTML += `<div class="msg-ai"><div class="msg-av-ai">⚠️</div><div class="bbl-ai">Token yetarli emas (−5t kerak). Reklama ko'rib bepul token oling!</div></div>`;
        showAdsModal(5, 'chat_retry');
      } else {
        msgs.innerHTML += `<div class="msg-ai"><div class="msg-av-ai">⚠️</div><div class="bbl-ai">Xatolik: ${_escapeHtml(e.message || 'Noma\'lum')}</div></div>`;
      }
    } finally {
      inp.disabled = false;
      if (sendBtn) sendBtn.disabled = false;
      inp.focus();
    }
  }

  function _updateChatCount() {
    const c = document.getElementById('chat-count');
    if (c) c.textContent = CHAT.getHistory().length;
    const warn = document.getElementById('chat-input-warn');
    const remaining = CHAT.limits.MAX_HISTORY - CHAT.getHistory().length;
    if (remaining <= 3 && warn) {
      warn.style.display = 'block';
      warn.style.color = 'var(--y)';
      warn.textContent = `Chat to'lishga yaqin (${remaining} xabar qoldi). Yangi chat boshlang.`;
    }
  }

  function renderDocChat(openChatId) {
    // Yangi hujjat chati — default
    if (!openChatId || openChatId === 'doc_new') {
      DOC.clear();
    } else {
      DOC.loadHistory();
    }
    const fmt = DOC.getFormat();
    const history = DOC.getHistory();
    const emptyState = history.length === 0;

    document.getElementById('sa-doc').innerHTML = `
<div style="display:flex;flex-direction:column;height:100%;width:100%">
  <div style="display:flex;align-items:center;gap:9px;padding:9px 14px;background:var(--bg);border-bottom:1px solid var(--f);flex-shrink:0">
    <div class="back-btn" style="padding:0;cursor:pointer" onclick="FIKRA.backToAI()">←</div>
    <div style="flex:1;min-width:0">
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px">Hujjat yaratish</div>
      <div style="font-size:10px;color:var(--m)">AI bilan suhbatlashib fayl yarating</div>
    </div>
    <button onclick="FIKRA.newDocChat()" title="Yangi hujjat" style="width:28px;height:28px;border-radius:50%;background:var(--s3);border:1px solid var(--f);color:var(--txt);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0">+</button>
    <div style="font-size:10px;color:var(--y);font-weight:700;background:rgba(255,204,68,.08);padding:3px 8px;border-radius:100px;border:1px solid rgba(255,204,68,.2);flex-shrink:0">−10t</div>
  </div>
  <div style="padding:8px 14px;border-bottom:1px solid var(--f);background:var(--s1);flex-shrink:0">
    <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--m);margin-bottom:6px">Format tanlang</div>
    <div style="display:flex;gap:5px">
      ${['DOCX','PDF','PPTX'].map(f => `<button class="fmt-btn ${f===fmt?'active':''}" onclick="FIKRA.setDocFmt('${f}',this)">${f}</button>`).join('')}
    </div>
  </div>
  <div id="doc-msgs" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:10px 14px;display:flex;flex-direction:column;gap:9px">
    ${emptyState ? `<div class="msg-ai"><div class="msg-av-ai">📄</div><div class="bbl-ai">Qanday hujjat yaratishni xohlaysiz? Mavzu va tarkibini ayting.</div></div>` : ''}
    ${history.map(h => h.role === 'user'
      ? `<div class="msg-me"><div class="bbl-me">${_escapeHtml(h.content)}</div><div class="msg-av-u">😊</div></div>`
      : `<div class="msg-ai"><div class="msg-av-ai">📄</div><div class="bbl-ai">${_escapeHtml(h.content)}</div></div>`
    ).join('')}
  </div>
  <div style="flex-shrink:0">
    <div class="chat-input-row">
      <input class="chat-input" id="doc-inp" maxlength="2000" inputmode="text" autocomplete="off" placeholder="Hujjat haqida yozing..." onkeydown="if(event.key==='Enter')FIKRA.sendDoc()">
      <button class="send-btn" id="doc-send-btn" onclick="FIKRA.sendDoc()">↑</button>
    </div>
  </div>
</div>`;
    showSubpanel('ai', 'sa-doc');
    if (tg && tg.BackButton) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => backToAI());
    }
  }

  function newDocChat() {
    uiConfirm('Joriy hujjat tarixi tozalanadi.', {
      title: 'Yangi hujjat chati', okLabel: 'Ha', cancelLabel: 'Bekor'
    }).then(ok => {
      if (ok) {
        DOC.clear();
        renderDocChat();
        showToast('Yangi hujjat chati');
      }
    });
  }

  function setDocFmt(fmt, btn) {
    DOC.setFormat(fmt);
    document.querySelectorAll('.fmt-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  async function sendDoc() {
    const inp = document.getElementById('doc-inp');
    const text = inp.value.trim();
    if (!text) return;
    inp.value = '';

    const msgs = document.getElementById('doc-msgs');
    msgs.innerHTML += `<div class="msg-me"><div class="bbl-me">${text}</div><div class="msg-av-u">😊</div></div>`;
    DOC.addMessage('user', text);

    const loadId = 'dl-' + Date.now();
    const fmt = DOC.getFormat();
    msgs.innerHTML += `<div id="${loadId}" class="msg-ai"><div class="msg-av-ai">📄</div><div class="bbl-ai">
      <span style="display:inline-flex;align-items:center;gap:6px">
        <span style="width:14px;height:14px;border:2px solid var(--acc);border-top-color:transparent;border-radius:50%;animation:spin .6s linear infinite;display:inline-block"></span>
        ${fmt} fayl tayyorlanmoqda...
      </span>
    </div></div>`;
    msgs.scrollTop = msgs.scrollHeight;

    try {
      const res = await API.document(text, fmt, DOC.getHistory());
      const tw = document.getElementById(loadId);
      if (!tw) return;

      // Download handler
      const downloadId = 'dl-btn-' + Date.now();
      tw.innerHTML = `<div class="msg-av-ai">📄</div><div class="bbl-ai" style="max-width:260px">
        <div style="font-weight:600;margin-bottom:6px;color:var(--txt)">${res.title}</div>
        <div style="font-size:11px;color:var(--m);margin-bottom:10px;line-height:1.5">${(res.preview || '').slice(0, 140)}...</div>
        <div style="display:flex;align-items:center;gap:9px;padding:9px 11px;background:var(--s1);border:1px solid var(--f);border-radius:9px;margin-bottom:8px">
          <div style="width:34px;height:34px;border-radius:8px;background:${fmt==='PDF'?'rgba(255,95,126,.15)':fmt==='PPTX'?'rgba(255,204,68,.15)':'rgba(123,104,238,.15)'};display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0">📄</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--txt)">${res.fileName}</div>
            <div style="font-size:10px;color:var(--m)">${res.format} · ${res.sizeKb} KB</div>
          </div>
        </div>
        <button id="${downloadId}" style="width:100%;padding:8px;background:var(--acc);color:#fff;border:none;border-radius:8px;font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer">⬇ Yuklab olish</button>
      </div>`;

      // Download tugmasi
      const btn = document.getElementById(downloadId);
      if (btn) {
        btn.onclick = () => {
          try {
            // base64 → Blob → download link
            const byteString = atob(res.base64);
            const arr = new Uint8Array(byteString.length);
            for (let i = 0; i < byteString.length; i++) arr[i] = byteString.charCodeAt(i);
            const blob = new Blob([arr], { type: res.mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = res.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            showToast('Yuklab olindi!');
          } catch (err) {
            showToast('Yuklab olish xatosi');
            console.error(err);
          }
        };
      }

      DOC.addMessage('assistant', `[${res.format}] ${res.title} — ${res.sizeKb} KB`);
      updateTokenDisplay();
    } catch (e) {
      const tw = document.getElementById(loadId);
      if (tw) tw.innerHTML = `<div class="msg-av-ai">⚠️</div><div class="bbl-ai">${e.message || 'Xatolik'}</div>`;
    }
    msgs.scrollTop = msgs.scrollHeight;
  }

  function renderKaloriya() {
    document.getElementById('sa-kal').innerHTML = `
<div class="back-btn" onclick="FIKRA.backToAI()">← AI</div>
<div style="padding:0 14px">
  <div id="kal-upload" style="background:var(--s2);border:1.5px dashed rgba(255,95,126,.3);border-radius:var(--br);padding:26px 16px;text-align:center;cursor:pointer;transition:all .15s;margin-bottom:10px" onclick="document.getElementById('kal-file').click()">
    <div style="font-size:36px;margin-bottom:8px">📸</div>
    <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;margin-bottom:3px">Taom rasmini yuklang</div>
    <div style="font-size:11px;color:var(--m)">AI tahlil qiladi</div>
    <div style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,204,68,.07);border:1px solid rgba(255,204,68,.18);border-radius:100px;padding:3px 10px;font-size:10px;color:var(--y);font-weight:700;margin-top:8px">15t sarflanadi</div>
    <input type="file" id="kal-file" accept="image/*" style="display:none" onchange="FIKRA.doScan(this.files[0])">
  </div>
  <div id="kal-result" style="display:none;background:var(--s2);border:1px solid var(--f);border-radius:var(--br);padding:14px;margin-bottom:10px"></div>
  <button class="btn btn-acc btn-full" onclick="FIKRA.showAdsModal(3,'calorie_weekly')">Haftalik ratsion (+3t)</button>
</div>`;
    showSubpanel('ai', 'sa-kal');
  }

  async function doScan(file) {
    if (!file) return;
    showToast('Skanerlash...');
    try {
      const res = await CALORIE.scanFile(file);
      document.getElementById('kal-result').style.display = 'block';
      document.getElementById('kal-result').innerHTML = `
<div style="font-family:'Syne',sans-serif;font-weight:800;font-size:19px;margin-bottom:12px">${res.foodName}</div>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px">
  <div style="background:var(--s3);border-radius:var(--br2);padding:8px 4px;text-align:center"><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--rl)">${res.calories}</div><div style="font-size:9px;color:var(--m);margin-top:2px;text-transform:uppercase">kal</div></div>
  <div style="background:var(--s3);border-radius:var(--br2);padding:8px 4px;text-align:center"><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--g)">${res.protein}g</div><div style="font-size:9px;color:var(--m);margin-top:2px;text-transform:uppercase">oqsil</div></div>
  <div style="background:var(--s3);border-radius:var(--br2);padding:8px 4px;text-align:center"><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--y)">${res.fat}g</div><div style="font-size:9px;color:var(--m);margin-top:2px;text-transform:uppercase">yog'</div></div>
  <div style="background:var(--s3);border-radius:var(--br2);padding:8px 4px;text-align:center"><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--al)">${res.carbs}g</div><div style="font-size:9px;color:var(--m);margin-top:2px;text-transform:uppercase">uglevod</div></div>
</div>
<div style="font-size:12px;color:var(--m);line-height:1.5">${res.tips || ''}</div>`;
      updateTokenDisplay();
      showToast('Tahlil tayyor!');
    } catch (e) {
      showToast(e.message || 'Xatolik');
    }
  }

  // ─── Leaderboard ──────────────────────────────────────────────────────────
  let _lbPollingTimer = null;
  let _currentLbType = 'xp';
  let _lbPanelVisible = false;

  async function loadHomeLeaderboard() {
    try {
      const data = await API.leaderboard('xp');
      renderLbRows('lb-home-rows', data, user?.telegramId);
    } catch {}
  }

  async function loadGameLeaderboard(type) {
    _currentLbType = type;
    try {
      const data = await API.leaderboard(type, 'week');
      renderLbRows('lb-game-rows', data, user?.telegramId);
    } catch {}
  }

  async function switchLbTab(btn, type) {
    document.querySelectorAll('.lb-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('lb-game-rows').innerHTML =
      '<div style="padding:12px 14px;font-size:12px;color:var(--m)">Yuklanmoqda...</div>';
    await loadGameLeaderboard(type);
  }

  // Real vaqt polling — faqat leaderboard ko'rinib turganda
  function startLbPolling() {
    stopLbPolling();
    _lbPanelVisible = true;
    _lbPollingTimer = setInterval(() => {
      if (!_lbPanelVisible || document.hidden) return;
      if (activePanel === 'home') {
        loadHomeLeaderboard();
      } else if (activePanel === 'games') {
        const gameRows = document.getElementById('lb-game-rows');
        if (gameRows && gameRows.offsetParent !== null) {
          loadGameLeaderboard(_currentLbType);
        }
      }
    }, 30000); // 30 soniya
  }

  function stopLbPolling() {
    if (_lbPollingTimer) {
      clearInterval(_lbPollingTimer);
      _lbPollingTimer = null;
    }
    _lbPanelVisible = false;
  }

  function renderLbRows(containerId, data, myTid) {
    const ranks = ['rank-gold','rank-silver','rank-bronze'];
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!data || data.length === 0) {
      container.innerHTML = '<div style="padding:14px;font-size:12px;color:var(--m);text-align:center">Hali natijalar yo\'q — birinchi bo\'l!</div>';
      return;
    }
    container.innerHTML = data.slice(0, 10).map((r, i) => {
      // XP leaderboard uchun — rank emoji va score XP
      const rankEmoji = r.emoji || '';
      const isMe = r.telegramId === myTid;
      const scoreDisplay = typeof r.score === 'number' && r.score % 1 !== 0 ? r.score.toFixed(1) : (r.score || 0).toLocaleString();
      return `
<div class="lb-row ${isMe ? 'me' : ''}">
  <div class="lb-rank ${ranks[i] || ''}" style="${isMe ? 'color:var(--al)' : ''}">${r.rank}</div>
  <div class="lb-av">${rankEmoji || '😊'}</div>
  <div class="lb-name" style="${isMe ? 'color:var(--al)' : ''}">${_escapeHtml(r.username)}</div>
  <div class="lb-score">${scoreDisplay}</div>
</div>`;
    }).join('');
  }

  // ─── Chat history ─────────────────────────────────────────────────────────
  function renderChatHistory() {
    const list = CHAT.getChatList();
    const container = document.getElementById('chat-history-list');
    if (!container) return;
    if (!list.length) {
      container.innerHTML = '<div style="padding:10px 0;font-size:12px;color:var(--m)">Hali chatlar yo\'q</div>';
      return;
    }
    container.innerHTML = list.map(c => {
      const openArg = c.type === 'doc' ? 'doc_continue' : 'general_continue';
      return `
<div style="display:flex;align-items:center;gap:10px;background:var(--s1);border:1px solid var(--f);border-radius:var(--br2);padding:10px 12px;margin-bottom:7px;cursor:pointer;transition:all .15s" onclick="FIKRA.openAIChat('${openArg}')">
  <div style="width:34px;height:34px;border-radius:9px;background:${c.type==='doc'?'rgba(0,212,170,.1)':'rgba(123,104,238,.14)'};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${c.icon}</div>
  <div style="flex:1;min-width:0">
    <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
      <span style="font-family:'Syne',sans-serif;font-weight:700;font-size:12px">${c.name}</span>
      ${c.format ? `<span style="font-size:8px;font-weight:700;padding:2px 5px;border-radius:3px;background:rgba(0,212,170,.12);color:var(--g)">${c.format}</span>` : ''}
      ${c.count ? `<span style="font-size:9px;font-weight:700;color:var(--al)">· ${c.count} xabar</span>` : ''}
      <span style="font-size:10px;color:var(--m);margin-left:auto">${c.time}</span>
    </div>
    <div style="font-size:11px;color:var(--m);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_escapeHtml(c.lastMsg || 'Yangi chat')}</div>
  </div>
</div>`;
    }).join('');
  }

  // ─── AI Hint ──────────────────────────────────────────────────────────────
  async function getHint(qId, question) {
    showToast('AI tushuntirish tayyorlanmoqda...');
    try {
      const res = await API.hint(question, [], '');
      showToast('Hint tayyor!');
      alert(res.hint); // Keyinchalik modal bilan
      updateTokenDisplay();
    } catch (e) {
      if (e.code === 'INSUFFICIENT_TOKENS') showAdsModal(10, 'hint');
      else showToast(e.message);
    }
  }

  // ─── Ads modal ────────────────────────────────────────────────────────────
  async function showAdsModal(tokensToGive, context, resolve) {
    // Obuna tekshiruvi — Pro/VIP/Business uchun reklamasiz bonus
    const isPremium = user && ['pro', 'vip', 'business'].includes(user.plan);
    if (isPremium) {
      try {
        const res = await API.adsReward ? API.adsReward('rewarded_premium', context) : null;
        if (res) {
          const r = await res;
          if (r && r.tokensGiven > 0) {
            tokens = r.newBalance;
            updateTokenDisplay();
            showToast(`✨ Premium bonus: +${r.tokensGiven} token`);
            resolve && resolve({ success: true, tokensGiven: r.tokensGiven });
            return;
          } else if (r && r.limit === 'daily_max') {
            showToast('Bugungi premium bonus limitiga yetdingiz (5/kun)');
            resolve && resolve({ success: false, reason: 'daily_limit' });
            return;
          }
        }
      } catch (e) {
        console.warn('[Ads] Premium bonus error:', e);
      }
    }

    adsPendingTokens = tokensToGive;
    adsResolve = resolve;
    document.getElementById('ads-sub').innerHTML =
      `Ko'rib bo'lgach <strong>+${tokensToGive} token</strong>`;
    document.getElementById('ads-overlay').classList.add('show');
    document.getElementById('ads-fill').style.width = '0%';
    document.getElementById('ads-skip').textContent = '5 soniya...';

    let p = 0;
    clearInterval(adsTimer);
    adsTimer = setInterval(() => {
      p += 2;
      document.getElementById('ads-fill').style.width = p + '%';
      const left = Math.ceil((100 - p) / 20);
      document.getElementById('ads-skip').textContent = left > 0 ? `${left} soniya...` : 'Yopish ✕';
      if (p >= 100) { clearInterval(adsTimer); _closeAds(); }
    }, 100);

    document.getElementById('ads-skip').onclick = () => {
      if (p >= 100) { clearInterval(adsTimer); _closeAds(); }
    };
  }

  async function _closeAds() {
    document.getElementById('ads-overlay').classList.remove('show');
    try {
      const res = await API.adsReward('rewarded', 'modal');
      tokens = res.newBalance;
      updateTokenDisplay();
      showToast(`+${res.tokensGiven} token qo'shildi!`);
    } catch {}
    adsResolve && adsResolve({ success: true, tokensGiven: adsPendingTokens });
    adsResolve = null;
  }

  // ─── Token display ────────────────────────────────────────────────────────
  async function updateTokenDisplay() {
    try {
      const b = await API.balance();
      tokens = b.tokens;
      ['tok-val','h-tok','p-tok'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = tokens.toLocaleString();
      });
    } catch {}
  }

  // ─── Toast ────────────────────────────────────────────────────────────────
  function showToast(msg, hapticType) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2400);
    // Haptic feedback (agar Telegram ichida)
    if (hapticType === 'success' || hapticType === 'error' || hapticType === 'warning') {
      hapticNotify(hapticType);
    } else {
      hapticTap('light');
    }
  }

  // ─── Nice confirm (native confirm o'rniga) ────────────────────────────────
  function uiConfirm(message, opts) {
    opts = opts || {};
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'ui-modal-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px);animation:fadeIn .2s ease';
      overlay.innerHTML = `
        <div style="background:var(--s1);border:1px solid var(--f);border-radius:16px;max-width:340px;width:100%;padding:20px;animation:scaleIn .25s cubic-bezier(.34,1.56,.64,1)">
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;margin-bottom:10px">${opts.title || 'Tasdiqlash'}</div>
          <div style="font-size:13px;color:var(--m);line-height:1.5;margin-bottom:18px">${_escapeHtml(message)}</div>
          <div style="display:flex;gap:8px">
            <button id="ui-confirm-no" style="flex:1;padding:11px;background:var(--s3);color:var(--txt);border:1px solid var(--f);border-radius:10px;font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer">${opts.cancelLabel || 'Bekor'}</button>
            <button id="ui-confirm-yes" style="flex:1;padding:11px;background:${opts.danger ? 'var(--r)' : 'var(--acc)'};color:#fff;border:none;border-radius:10px;font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer">${opts.okLabel || 'Ha'}</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      const close = (result) => {
        hapticTap('light');
        overlay.style.animation = 'fadeIn .15s ease reverse';
        setTimeout(() => overlay.remove(), 150);
        resolve(result);
      };
      document.getElementById('ui-confirm-yes').onclick = () => close(true);
      document.getElementById('ui-confirm-no').onclick = () => close(false);
      overlay.onclick = (e) => { if (e.target === overlay) close(false); };
      // Escape tugmasi
      const escHandler = (e) => {
        if (e.key === 'Escape') { close(false); document.removeEventListener('keydown', escHandler); }
      };
      document.addEventListener('keydown', escHandler);
    });
  }

  // ─── Nice prompt (native prompt o'rniga) ──────────────────────────────────
  function uiPrompt(message, defaultValue, opts) {
    opts = opts || {};
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'ui-modal-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px);animation:fadeIn .2s ease';
      overlay.innerHTML = `
        <div style="background:var(--s1);border:1px solid var(--f);border-radius:16px;max-width:340px;width:100%;padding:20px;animation:scaleIn .25s cubic-bezier(.34,1.56,.64,1)">
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;margin-bottom:8px">${opts.title || 'Kiritish'}</div>
          <div style="font-size:12px;color:var(--m);line-height:1.5;margin-bottom:12px">${_escapeHtml(message)}</div>
          <input id="ui-prompt-input" type="${opts.type || 'text'}" inputmode="${opts.inputMode || 'text'}" value="${_escapeHtml(defaultValue || '')}" placeholder="${opts.placeholder || ''}" style="width:100%;box-sizing:border-box;padding:12px 14px;background:var(--s2);border:1px solid var(--f);border-radius:10px;color:var(--txt);font-family:'Nunito',sans-serif;font-size:14px;margin-bottom:14px">
          <div style="display:flex;gap:8px">
            <button id="ui-prompt-cancel" style="flex:1;padding:11px;background:var(--s3);color:var(--txt);border:1px solid var(--f);border-radius:10px;font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer">Bekor</button>
            <button id="ui-prompt-ok" style="flex:1;padding:11px;background:var(--acc);color:#fff;border:none;border-radius:10px;font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer">Davom</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      const input = document.getElementById('ui-prompt-input');
      setTimeout(() => input.focus(), 100);
      input.select && input.select();

      const close = (value) => {
        hapticTap('light');
        overlay.style.animation = 'fadeIn .15s ease reverse';
        setTimeout(() => overlay.remove(), 150);
        resolve(value);
      };
      document.getElementById('ui-prompt-ok').onclick = () => close(input.value);
      document.getElementById('ui-prompt-cancel').onclick = () => close(null);
      overlay.onclick = (e) => { if (e.target === overlay) close(null); };
      input.onkeydown = (e) => {
        if (e.key === 'Enter') close(input.value);
        if (e.key === 'Escape') close(null);
      };
    });
  }

  // ─── Back buttons ─────────────────────────────────────────────────────────
  function backToGames() {
    STROOP.stop();
    showSubpanel('games', 'sg-list');
    if (tg && tg.BackButton) tg.BackButton.hide();
  }
  function backToAI() {
    showSubpanel('ai', 'sa-home');
    renderChatHistory();
    if (tg && tg.BackButton) tg.BackButton.hide();
  }

  // ─── Init games ───────────────────────────────────────────────────────────
  async function initGames() {
    // Config yuklash — Adsgram Block ID va Bot username ni olish
    try {
      const resp = await fetch('/api/config');
      const config = await resp.json();
      if (config.adsgramBlockId) {
        window.ADSGRAM_BLOCK_ID = config.adsgramBlockId;
      }
      if (config.botUsername) {
        window.BOT_USERNAME = config.botUsername;
      }
    } catch (e) { console.warn('Config yuklanmadi'); }

    ADS.initAdsgram();
    loadHomeLeaderboard();
    loadHomeTournament(); // Turnir banneri
    startLbPolling();

    // Background ga o'tganda polling to'xtaydi
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopLbPolling();
      else startLbPolling();
    });

    // Kunlik bonus — login qilingan bo'lsa
    setTimeout(() => checkDailyBonus(), 500);
    // Stats
    API.myStats().then(s => {
      const el = document.getElementById('p-games');
      if (el && s.stroopBestScore) {
        const sc = document.getElementById('my-stroop-score');
        if (sc) sc.textContent = s.stroopBestScore;
      }
      const pgames = document.getElementById('p-games');
      const pai = document.getElementById('p-ai');
    }).catch(() => {});

    API.me().then(u => {
      if (!u) return;
      user = u;
      tokens = u.tokens;
      updateTokenDisplay();
      const pg = document.getElementById('p-games');
      const pai = document.getElementById('p-ai');
      document.getElementById('p-games') && document.getElementById('my-stroop-score');
    }).catch(() => {});

    // Slider avtomatik aylanish
    let _slideIdx = 0;
    const _totalSlides = 3;
    setInterval(() => {
      _slideIdx = (_slideIdx + 1) % _totalSlides;
      const sl = document.getElementById('home-slides');
      if (sl) sl.style.transform = 'translateX(-' + (_slideIdx * 375) + 'px)';
      const dots = document.getElementById('home-dots');
      if (dots) {
        Array.from(dots.children).forEach((d, i) => {
          d.style.width = i === _slideIdx ? '14px' : '5px';
          d.style.borderRadius = i === _slideIdx ? '2px' : '50%';
          d.style.background = i === _slideIdx ? 'var(--acc)' : 'var(--f)';
        });
      }
    }, 3500);

    // Inline styles for dynamic elements
    const style = document.createElement('style');
    style.textContent = `
.qi-btn{display:flex;flex-direction:column;align-items:center;gap:5px;background:var(--s2);border:1px solid var(--f);border-radius:var(--br2);padding:11px 4px;cursor:pointer;transition:all .15s;font-size:19px}
.qi-btn span{font-size:9px;font-weight:700;color:var(--m);text-align:center;letter-spacing:.3px}
.qi-btn:active{transform:scale(.91)}
.ai-svc-card{background:var(--s2);border:1px solid var(--f);border-radius:var(--br2);padding:13px;cursor:pointer;transition:all .15s;font-size:22px}
.ai-svc-card:active{transform:scale(.95)}
.stimer{font-family:'Syne',sans-serif;font-size:28px;font-weight:800}
.stimer.warn{color:var(--r)}
.heart.lost{opacity:.18}
.mode-btn{flex:1;padding:10px;border-radius:var(--br2);border:1.5px solid var(--f);background:var(--s2);text-align:center;cursor:pointer;transition:all .15s}
.mode-btn.active{border-color:var(--acc);background:rgba(123,104,238,.1)}
.mode-btn:active{transform:scale(.95)}
.fan-tab{padding:5px 12px;border-radius:100px;font-size:11px;font-weight:700;border:1px solid var(--f);background:transparent;color:var(--m);cursor:pointer;transition:all .15s;font-family:'Syne',sans-serif;white-space:nowrap}
.fan-tab.active{background:var(--acc);border-color:var(--acc);color:#fff}
.fan-tab:active{transform:scale(.92)}
.test-nav-btn{padding:5px 12px;border-radius:100px;font-size:11px;font-weight:700;border:1px solid var(--f);background:transparent;color:var(--m);cursor:pointer;font-family:'Syne',sans-serif;transition:all .15s}
.test-nav-btn.active{background:var(--acc);border-color:var(--acc);color:#fff}
.lb-tab-btn{padding:4px 11px;border-radius:100px;font-size:10px;font-weight:700;border:1px solid var(--f);background:transparent;color:var(--m);cursor:pointer;white-space:nowrap;transition:all .15s;font-family:'Syne',sans-serif;flex-shrink:0}
.lb-tab-btn.active{background:var(--acc);border-color:var(--acc);color:#fff}
.lb-tab-btn:active{transform:scale(.93)}
.fmt-btn{padding:5px 12px;border-radius:100px;font-family:'Syne',sans-serif;font-weight:700;font-size:11px;border:1px solid var(--f);background:transparent;color:var(--m);cursor:pointer;transition:all .15s}
.fmt-btn.active{background:var(--g);color:#000;border-color:var(--g)}
.dir-card{background:var(--s2);border:1.5px solid var(--f);border-radius:var(--br2);padding:13px 14px;margin-bottom:8px;cursor:pointer;transition:all .15s}
.dir-card:active{transform:scale(.97)}
.dir-card.sel{border-color:var(--acc);background:rgba(123,104,238,.08)}
.msg-ai{display:flex;gap:7px;align-items:flex-end}
.msg-me{display:flex;gap:7px;align-items:flex-end;flex-direction:row-reverse}
.msg-av-ai{width:26px;height:26px;border-radius:50%;background:var(--acc);display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0}
.msg-av-u{width:26px;height:26px;border-radius:50%;background:var(--s3);display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0}
.bbl-ai{max-width:222px;padding:9px 12px;border-radius:12px;font-size:12px;line-height:1.55;background:var(--s2);border:1px solid var(--f);border-bottom-left-radius:3px}
.bbl-me{max-width:222px;padding:9px 12px;border-radius:12px;font-size:12px;line-height:1.55;background:var(--acc);color:#fff;border-bottom-right-radius:3px}
@keyframes td{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
`;
    document.head.appendChild(style);
  }

  // ─── Kunlik bonus ─────────────────────────────────────────────────────────
  async function checkDailyBonus() {
    // user ma'lumotlarida lastLoginDate bo'lsa — bugun olinganmi tekshirish
    if (!user) return;
    try {
      const today = new Date().toDateString();
      const last = user.lastLoginDate ? new Date(user.lastLoginDate).toDateString() : null;
      const banner = document.getElementById('daily-bonus-banner');
      if (!banner) return;

      if (last === today) {
        banner.style.display = 'none';
      } else {
        banner.style.display = 'flex';
        const streak = user.streakDays || 0;
        const bonus = streak >= 7 ? 6 : 3;
        const title = document.getElementById('daily-bonus-title');
        const sub = document.getElementById('daily-bonus-sub');
        if (title) title.textContent = `Kunlik bonus +${bonus}t`;
        if (sub) sub.textContent = streak >= 7
          ? `🔥 ${streak} kunlik streak — 2x bonus!`
          : `Har kuni kiring — ${7 - streak} kun qoldi 2x gacha`;
      }
    } catch (e) { console.warn(e); }
  }

  async function claimDaily() {
    try {
      const res = await API.dailyBonus();
      showToast(`+${res.bonus} token olindi! 🎁`);
      const banner = document.getElementById('daily-bonus-banner');
      if (banner) banner.style.display = 'none';
      updateTokenDisplay();

      // XP gain + level up
      if (res.xp && res.xp.added) {
        setTimeout(() => showXpGain(res.xp.added, res.xp.newRank), 500);
      }

      // user ma'lumotini yangilash
      try {
        const me = await API.me();
        if (me) user = me;
          _syncUserToWindow();
      } catch {}
    } catch (e) {
      if (e.code === 'ALREADY_CLAIMED') {
        showToast('Bugungi bonus allaqachon olindi');
        const banner = document.getElementById('daily-bonus-banner');
        if (banner) banner.style.display = 'none';
      } else {
        showToast(e.message || 'Xatolik');
      }
    }
  }

  // ─── Referral ─────────────────────────────────────────────────────────────
  function copyRef() {
    const inp = document.getElementById('ref-link');
    if (!inp) return;
    const link = inp.value;
    if (!link) {
      showToast('Referral link mavjud emas');
      return;
    }
    try {
      // Telegram ichida navigator.clipboard ishlamasligi mumkin
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link)
          .then(() => showToast('Link nusxalandi!'))
          .catch(() => _fallbackCopy(inp));
      } else {
        _fallbackCopy(inp);
      }
    } catch {
      _fallbackCopy(inp);
    }
  }

  function _fallbackCopy(inp) {
    try {
      inp.select();
      inp.setSelectionRange(0, 99999);
      document.execCommand('copy');
      showToast('Link nusxalandi!');
    } catch {
      showToast('Linkni qo\'lda belgilab oling');
    }
  }

  function shareRef() {
    const inp = document.getElementById('ref-link');
    if (!inp || !inp.value) {
      showToast('Link tayyor emas');
      return;
    }
    const link = inp.value;
    const text = `🧠 FIKRA — miya faolligi platformasiga qo'shil!\nBepul token olish uchun:`;

    if (tg && typeof tg.openTelegramLink === 'function') {
      // Telegram'da share oynasi
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
      tg.openTelegramLink(shareUrl);
    } else {
      // Fallback — nusxalash
      copyRef();
    }
  }

  // ─── Token tarixi ─────────────────────────────────────────────────────────
  async function loadTokenHistory() {
    const container = document.getElementById('token-history-list');
    if (!container) return;
    container.innerHTML = '<div style="padding:8px 0;font-size:11px;color:var(--m)">Yuklanmoqda...</div>';
    try {
      const history = await API.tokenHistory();
      if (!history || history.length === 0) {
        container.innerHTML = '<div style="padding:8px 0;font-size:11px;color:var(--m);text-align:center">Tarix bo\'sh</div>';
        return;
      }
      const sourceNames = {
        ai_chat: '💬 AI Chat',
        ai_document: '📄 Hujjat',
        ai_image: '🎨 Rasm',
        ai_calorie: '🥗 Kaloriya',
        ai_video: '🎬 Video',
        game_stroop: '🎮 Stroop',
        game_test: '📝 DTM Test',
        daily_bonus: '🎁 Kunlik bonus',
        ads_rewarded: '📺 Reklama',
        referral_bonus: '🎯 Referral',
      };
      container.innerHTML = history.slice(0, 15).map(h => {
        const date = new Date(h.createdAt);
        const dateStr = date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' })
          + ' ' + date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
        const isPlus = h.amount > 0;
        return `
<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--f);font-size:11px">
  <div style="flex:1;overflow:hidden">
    <div style="color:var(--txt);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sourceNames[h.source] || h.source}</div>
    <div style="color:var(--m);font-size:10px;margin-top:1px">${dateStr}</div>
  </div>
  <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:${isPlus ? 'var(--g)' : 'var(--r)'}">${isPlus ? '+' : ''}${h.amount}t</div>
</div>`;
      }).join('');
    } catch (e) {
      container.innerHTML = `<div style="padding:8px 0;font-size:11px;color:var(--r)">Xatolik: ${e.message}</div>`;
    }
  }

  // ─── Lavozim (Rank) ───────────────────────────────────────────────────────
  async function showRankDetail() {
    try {
      const data = await API.rankInfo();
      const modal = document.createElement('div');
      modal.id = 'rank-modal';
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:14px;backdrop-filter:blur(6px)';
      const currentId = data.progress?.current?.id;
      modal.innerHTML = `
<div style="background:var(--s1);border:1px solid var(--f);border-radius:var(--br);max-width:360px;width:100%;max-height:80vh;overflow-y:auto;padding:18px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
    <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:17px">Lavozimlar</div>
    <button onclick="document.getElementById('rank-modal').remove()" style="width:28px;height:28px;border-radius:50%;background:var(--s3);border:none;color:var(--txt);font-size:16px;cursor:pointer;padding:0">×</button>
  </div>
  <div style="display:flex;flex-direction:column;gap:8px">
    ${data.allRanks.map(r => {
      const active = r.id === currentId;
      const isNext = data.progress?.next?.id === r.id;
      const isLocked = !active && !data.allRanks.slice(0, data.allRanks.findIndex(x => x.id === currentId) + 1).some(x => x.id === r.id);
      return `
      <div style="display:flex;align-items:center;gap:11px;padding:10px 12px;background:${active ? r.color + '1A' : 'var(--s2)'};border:1.5px solid ${active ? r.color : 'var(--f)'};border-radius:var(--br2);${active ? 'box-shadow:0 0 14px ' + r.glow : ''}${isLocked ? 'opacity:.45' : ''}">
        <div style="width:36px;height:36px;border-radius:10px;background:${r.color}1A;border:1px solid ${r.color}33;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${r.emoji}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
            <span style="font-family:'Syne',sans-serif;font-weight:700;font-size:12px;color:${r.color}">${r.name}</span>
            ${active ? `<span style="font-size:8px;font-weight:700;color:#fff;background:${r.color};padding:1px 5px;border-radius:3px">SIZDA</span>` : ''}
            ${isNext ? `<span style="font-size:8px;font-weight:700;color:var(--y);background:rgba(255,204,68,.15);padding:1px 5px;border-radius:3px">KEYINGI</span>` : ''}
          </div>
          <div style="font-size:10px;color:var(--m)">Daraja ${r.level} · ${r.minXp.toLocaleString()}+ XP</div>
        </div>
      </div>`;
    }).join('')}
  </div>
</div>`;
      document.body.appendChild(modal);
      modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    } catch (e) {
      showToast('Ma\'lumot yuklanmadi');
    }
  }

  // Level up toast — katta, diqqatni tortadigan
  function showLevelUp(newRank) {
    if (!newRank) return;
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn .3s ease;backdrop-filter:blur(8px)';
    overlay.innerHTML = `
<div style="text-align:center;padding:32px;animation:scaleIn .5s cubic-bezier(.34,1.56,.64,1)">
  <div style="font-size:12px;font-weight:700;letter-spacing:3px;color:${newRank.color};margin-bottom:12px;text-transform:uppercase">Yangi daraja!</div>
  <div style="width:130px;height:130px;border-radius:50%;background:radial-gradient(circle,${newRank.color}33,transparent 70%);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:70px;filter:drop-shadow(0 0 30px ${newRank.glow});animation:pulse 2s ease-in-out infinite">${newRank.emoji}</div>
  <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:26px;color:${newRank.color};margin-bottom:6px">${newRank.name}</div>
  <div style="font-size:12px;color:var(--m);margin-bottom:20px">Daraja ${newRank.level} · ${newRank.minXp.toLocaleString()} XP</div>
  <button onclick="this.closest('div[style*=\\"fixed\\"]').remove()" style="padding:11px 26px;background:${newRank.color};color:#fff;border:none;border-radius:var(--br2);font-family:'Syne',sans-serif;font-weight:700;font-size:13px;cursor:pointer">Ajoyib! 🎉</button>
</div>`;
    document.body.appendChild(overlay);
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    // Avtomatik yopilish 6 soniyadan keyin
    setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 6000);
  }

  // XP toast — kichik, o'yin natijalarida
  function showXpGain(xp, levelUp) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:9998;background:linear-gradient(135deg,rgba(123,104,238,.95),rgba(0,212,170,.9));color:#fff;padding:10px 18px;border-radius:100px;font-family:\'Syne\',sans-serif;font-weight:700;font-size:13px;box-shadow:0 4px 20px rgba(123,104,238,.4);animation:slideDown .4s ease';
    toast.innerHTML = `⚡ +${xp} XP`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity .4s';
      setTimeout(() => toast.remove(), 400);
    }, 2500);
    if (levelUp) {
      setTimeout(() => showLevelUp(levelUp), 800);
    }
  }

  // ─── Obuna sahifasi (modal) ───────────────────────────────────────────────
  let _currentPlanPeriod = '1m'; // '1m' yoki '3m'

  async function openSubscriptions() {
    try {
      const plans = await API.plans();
      const current = user?.plan || 'free';
      _currentPlanPeriod = '1m';
      _renderSubscriptionsModal(plans, current);
    } catch (e) {
      showToast('Ma\'lumot yuklanmadi');
    }
  }

  function _renderSubscriptionsModal(plans, currentPlan) {
    const existing = document.getElementById('sub-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'sub-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;overflow-y:auto;backdrop-filter:blur(6px);padding:14px 0';

    const filterPlans = (period) => plans.filter(p => p.id.endsWith('_' + period));

    function renderList(period) {
      const list = filterPlans(period);
      return list.map(p => {
        const isCurrent = p.tier === currentPlan;
        const tierColors = {
          basic: 'rgba(0,212,170,.2)',
          pro: 'rgba(123,104,238,.28)',
          vip: 'rgba(255,204,68,.28)',
          business: 'rgba(255,95,126,.28)',
        };
        const tierAccent = {
          basic: 'var(--g)', pro: 'var(--al)', vip: 'var(--y)', business: 'var(--r)',
        };
        const color = tierColors[p.tier] || 'var(--f)';
        const accent = tierAccent[p.tier] || 'var(--acc)';

        return `
<div style="background:var(--s2);border:1.5px solid ${color};border-radius:var(--br);padding:14px;margin-bottom:10px;position:relative">
  ${p.badge ? `<div style="position:absolute;top:-7px;right:10px;background:${accent};color:#000;padding:2px 8px;border-radius:100px;font-size:9px;font-weight:800;letter-spacing:.5px;text-transform:uppercase">${p.badge}</div>` : ''}
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
    <div>
      <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:18px;color:${accent}">${p.name}</div>
      <div style="font-size:10px;color:var(--m);margin-top:1px">${p.durationDays} kun</div>
    </div>
    <div style="text-align:right">
      <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:18px">${p.priceUzs.toLocaleString()} <span style="font-size:11px;color:var(--m);font-weight:500">so'm</span></div>
      <div style="font-size:10px;color:var(--y);font-weight:700;margin-top:1px">⭐ ${p.priceStars} Stars</div>
    </div>
  </div>
  <ul style="list-style:none;padding:0;margin:0 0 10px">
    ${p.features.map(f => `<li style="font-size:11px;color:var(--txt);padding:3px 0;display:flex;align-items:center;gap:6px"><span style="color:${accent};font-weight:700">✓</span>${_escapeHtml(f)}</li>`).join('')}
  </ul>
  <button onclick="FIKRA.buyPlan('${p.id}')" ${isCurrent ? 'disabled' : ''} style="width:100%;padding:10px;background:${isCurrent ? 'var(--s3)' : accent};color:${isCurrent ? 'var(--m)' : (p.tier === 'vip' ? '#000' : '#fff')};border:none;border-radius:var(--br2);font-family:'Syne',sans-serif;font-weight:700;font-size:13px;cursor:${isCurrent ? 'default' : 'pointer'}">${isCurrent ? 'Joriy obuna' : 'Tanlash'}</button>
</div>`;
      }).join('');
    }

    modal.innerHTML = `
<div style="max-width:420px;margin:0 auto;background:var(--s1);border-radius:var(--br);padding:16px;min-height:calc(100vh - 28px)">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
    <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:18px">Obuna tariflari</div>
    <button onclick="document.getElementById('sub-modal').remove()" style="width:30px;height:30px;border-radius:50%;background:var(--s3);border:none;color:var(--txt);font-size:17px;cursor:pointer;padding:0">×</button>
  </div>

  <div style="display:flex;gap:6px;background:var(--s3);border-radius:var(--br2);padding:4px;margin-bottom:14px">
    <button id="per-1m" onclick="FIKRA.switchPlanPeriod('1m')" style="flex:1;padding:8px;border:none;border-radius:var(--br2);background:var(--acc);color:#fff;font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer">1 oy</button>
    <button id="per-3m" onclick="FIKRA.switchPlanPeriod('3m')" style="flex:1;padding:8px;border:none;border-radius:var(--br2);background:transparent;color:var(--m);font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer">3 oy · chegirma</button>
  </div>

  <div id="sub-list">${renderList('1m')}</div>

  <div style="padding:12px;background:rgba(123,104,238,.06);border:1px solid rgba(123,104,238,.15);border-radius:var(--br2);font-size:10px;color:var(--m);line-height:1.6;margin-top:10px">
    💡 Obuna har oy avtomatik yangilanmaydi. Muddati tugagach qaytadan sotib olasiz.
  </div>
</div>`;

    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    // "1 oy" va "3 oy" tablarni ishlatish uchun plans global saqlaymiz
    window._currentPlansList = plans;
  }

  function switchPlanPeriod(period) {
    _currentPlanPeriod = period;
    const plans = window._currentPlansList || [];
    const list = plans.filter(p => p.id.endsWith('_' + period));
    const currentPlan = user?.plan || 'free';
    document.getElementById('per-1m').style.background = period === '1m' ? 'var(--acc)' : 'transparent';
    document.getElementById('per-1m').style.color = period === '1m' ? '#fff' : 'var(--m)';
    document.getElementById('per-3m').style.background = period === '3m' ? 'var(--acc)' : 'transparent';
    document.getElementById('per-3m').style.color = period === '3m' ? '#fff' : 'var(--m)';
    // Re-render
    _renderSubscriptionsModal(plans, currentPlan);
  }

  // ─── Token shop (modal) ───────────────────────────────────────────────────
  async function openTokenShop() {
    try {
      const packs = await API.packs();
      _renderTokenShopModal(packs);
    } catch (e) {
      showToast('Ma\'lumot yuklanmadi');
    }
  }

  function _renderTokenShopModal(packs) {
    const existing = document.getElementById('shop-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'shop-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;overflow-y:auto;backdrop-filter:blur(6px);padding:14px 0';

    modal.innerHTML = `
<div style="max-width:420px;margin:0 auto;background:var(--s1);border-radius:var(--br);padding:16px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
    <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:18px">🪙 Token do'kon</div>
    <button onclick="document.getElementById('shop-modal').remove()" style="width:30px;height:30px;border-radius:50%;background:var(--s3);border:none;color:var(--txt);font-size:17px;cursor:pointer;padding:0">×</button>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px">
    ${packs.map(p => {
      const total = p.tokens + (p.bonus || 0);
      return `
      <div onclick="FIKRA.buyPack('${p.id}')" style="background:var(--s2);border:1.5px solid ${p.badge ? 'rgba(255,204,68,.3)' : 'var(--f)'};border-radius:var(--br);padding:12px;cursor:pointer;position:relative;transition:all .15s;text-align:center">
        ${p.badge ? `<div style="position:absolute;top:-7px;right:8px;background:var(--y);color:#000;padding:2px 7px;border-radius:100px;font-size:8px;font-weight:800;letter-spacing:.5px;text-transform:uppercase">${p.badge}</div>` : ''}
        <div style="font-size:28px;margin-bottom:4px">🪙</div>
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:22px;color:var(--y);margin-bottom:2px">${total}</div>
        <div style="font-size:10px;color:var(--m);margin-bottom:8px">token${p.bonus > 0 ? ` (+${p.bonus} bonus)` : ''}</div>
        <div style="border-top:1px solid var(--f);padding-top:8px">
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px">${p.priceUzs.toLocaleString()} <span style="font-size:9px;color:var(--m);font-weight:500">so'm</span></div>
          <div style="font-size:9px;color:var(--y);margin-top:1px">⭐ ${p.priceStars}</div>
        </div>
      </div>`;
    }).join('')}
  </div>

  <div style="padding:12px;background:rgba(0,212,170,.07);border:1px solid rgba(0,212,170,.15);border-radius:var(--br2);font-size:10px;color:var(--m);line-height:1.6;margin-top:12px">
    💡 Yoki reklama ko'rib bepul token yig'ing. Profildan "Token yig'" tugmasini bosing.
  </div>
</div>`;

    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  }

  // ─── Yangi o'yinlar (Avto, Fashion, Football) ─────────────────────────────
  let _newGamesCatalog = null;
  let _currentNewGameType = null;

  async function openNewGame(gameType) {
    try {
      if (!_newGamesCatalog) {
        _newGamesCatalog = await API.newGamesCatalog();
      }
      _currentNewGameType = gameType;

      // Football uchun alohida — avval klub tanlash
      if (gameType === 'football') {
        const inv = await API.inventory('football');
        if (!inv.items || inv.items.length === 0) {
          return _renderFootballClubSelect();
        }
        return _renderNewGameModal(gameType, inv.items);
      }

      const inv = await API.inventory(gameType);
      _renderNewGameModal(gameType, inv.items);
    } catch (e) {
      showToast('Yuklanmadi: ' + (e.message || ''));
    }
  }

  function _renderFootballClubSelect() {
    const existing = document.getElementById('ng-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'ng-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:9999;overflow-y:auto;backdrop-filter:blur(8px);padding:14px 0';

    const clubs = _newGamesCatalog.clubs || [];
    const tierColors = {
      common: 'var(--g)', rare: 'var(--al)', epic: 'var(--y)', legendary: 'var(--r)',
    };

    modal.innerHTML = `
<div style="max-width:420px;margin:0 auto;background:var(--s1);border-radius:var(--br);padding:16px;min-height:calc(100vh - 28px)">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
    <div>
      <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:17px">⚽ Master Liga</div>
      <div style="font-size:10px;color:var(--m);margin-top:2px">Klub tanlang va jamoa tuzing</div>
    </div>
    <button onclick="document.getElementById('ng-modal').remove()" style="width:30px;height:30px;border-radius:50%;background:var(--s3);border:none;color:var(--txt);font-size:17px;cursor:pointer;padding:0">×</button>
  </div>
  <div style="padding:12px;background:rgba(123,104,238,.08);border:1px solid rgba(123,104,238,.2);border-radius:var(--br2);font-size:11px;color:var(--m);line-height:1.5;margin-bottom:14px">
    💡 Klub tanlagandan so'ng 4 ta boshlang'ich futbolchi (GK + DEF + MID + FWD) beriladi.
  </div>
  <div style="display:flex;flex-direction:column;gap:8px">
    ${clubs.map(c => `
    <div onclick="FIKRA.startFootballClub('${c.id}')" style="display:flex;align-items:center;gap:11px;padding:11px 12px;background:var(--s2);border:1.5px solid ${tierColors[c.tier]}33;border-radius:var(--br2);cursor:pointer;transition:all .15s">
      <div style="width:36px;height:36px;border-radius:9px;background:${tierColors[c.tier]}1A;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${c.emoji}</div>
      <div style="flex:1;min-width:0">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:${tierColors[c.tier]}">${_escapeHtml(c.name)}</div>
        <div style="font-size:10px;color:var(--m)">${c.country} · ${c.tier}</div>
      </div>
      <div style="font-size:18px">➔</div>
    </div>`).join('')}
  </div>
</div>`;

    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  }

  async function startFootballClub(clubId) {
    try {
      await API.footballStart(clubId);
      showToast('Jamoa yaratildi! 🎉');
      // Qayta ochish
      setTimeout(() => openNewGame('football'), 500);
    } catch (e) {
      showToast(e.message || 'Xatolik');
    }
  }

  function _renderNewGameModal(gameType, items) {
    const existing = document.getElementById('ng-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'ng-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:9999;overflow-y:auto;backdrop-filter:blur(8px);padding:14px 0';

    const titles = {
      auto: { emoji: '🏎️', name: 'Avto garaj', tab1: 'Mashinalarim', tab2: 'Do\'kon', tab3: 'Bozor' },
      fashion: { emoji: '👗', name: 'Moda studiyasi', tab1: 'Liboslarim', tab2: 'Uslublar', tab3: 'Bozor' },
      football: { emoji: '⚽', name: 'Master Liga', tab1: 'Jamoam', tab2: 'Transfer', tab3: 'Bozor' },
    };
    const info = titles[gameType];

    modal.innerHTML = `
<div style="max-width:420px;margin:0 auto;background:var(--s1);border-radius:var(--br);padding:16px;min-height:calc(100vh - 28px)">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
    <div>
      <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:17px">${info.emoji} ${info.name}</div>
      <div style="font-size:10px;color:var(--m);margin-top:2px">Token: <span style="color:var(--y);font-weight:700">${tokens.toLocaleString()}</span></div>
    </div>
    <button onclick="document.getElementById('ng-modal').remove()" style="width:30px;height:30px;border-radius:50%;background:var(--s3);border:none;color:var(--txt);font-size:17px;cursor:pointer;padding:0">×</button>
  </div>

  <div style="display:flex;gap:4px;background:var(--s3);border-radius:var(--br2);padding:3px;margin-bottom:14px">
    <button class="ng-tab active" data-tab="my" onclick="FIKRA.ngTab('my')" style="flex:1;padding:7px;border:none;border-radius:6px;background:var(--acc);color:#fff;font-family:'Syne',sans-serif;font-weight:700;font-size:11px;cursor:pointer">${info.tab1}</button>
    <button class="ng-tab" data-tab="shop" onclick="FIKRA.ngTab('shop')" style="flex:1;padding:7px;border:none;border-radius:6px;background:transparent;color:var(--m);font-family:'Syne',sans-serif;font-weight:700;font-size:11px;cursor:pointer">${info.tab2}</button>
    <button class="ng-tab" data-tab="market" onclick="FIKRA.ngTab('market')" style="flex:1;padding:7px;border:none;border-radius:6px;background:transparent;color:var(--m);font-family:'Syne',sans-serif;font-weight:700;font-size:11px;cursor:pointer">${info.tab3}</button>
  </div>

  <div id="ng-content">${_renderMyItems(gameType, items)}</div>
</div>`;

    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    window._currentNewGameItems = items;
  }

  function _renderMyItems(gameType, items) {
    if (!items || items.length === 0) {
      const shopName = gameType === 'auto' ? "Do'kon" : 'Uslublar';
      return `<div style="padding:24px;text-align:center;color:var(--m);font-size:12px">Hali obyektlaringiz yo'q. "${shopName}" tabida tanlang.</div>`;
    }

    let header = '';
    if (gameType === 'football' && items.length >= 4) {
      // Jamoa rating va o'yin tugmasi
      const totalStat = items.reduce((sum, p) => {
        const s = p.playerStats || {};
        return sum + (s.speed || 0) + (s.skill || 0) + (s.shot || 0) + (s.defense || 0);
      }, 0);
      const avgRating = Math.round(totalStat / (items.length * 4));
      header = `
<div style="background:linear-gradient(135deg,rgba(0,212,170,.1),rgba(123,104,238,.1));border:1px solid rgba(0,212,170,.25);border-radius:var(--br);padding:14px;margin-bottom:12px">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
    <div>
      <div style="font-size:10px;color:var(--m);font-weight:700;letter-spacing:1.2px;text-transform:uppercase">Jamoa reytingi</div>
      <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:24px;color:var(--g)">${avgRating}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:10px;color:var(--m)">Jamoa a'zolari</div>
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px">${items.length}</div>
    </div>
  </div>
  <button onclick="FIKRA.openFootballMatch()" style="width:100%;padding:11px;background:linear-gradient(135deg,var(--g),var(--acc));color:#000;border:none;border-radius:var(--br2);font-family:'Syne',sans-serif;font-weight:800;font-size:13px;cursor:pointer">⚽ Bot bilan o'ynash</button>
</div>`;
    }

    return header + `<div style="display:flex;flex-direction:column;gap:10px">
${items.map(it => {
  if (gameType === 'auto') return _renderCarCard(it);
  if (gameType === 'fashion') return _renderOutfitCard(it);
  if (gameType === 'football') return _renderPlayerCard(it);
  return '';
}).join('')}
</div>`;
  }

  function _renderCarCard(car) {
    const model = _newGamesCatalog.cars.find(c => c.id === car.carModel) || {};
    const tuning = car.tuning || {};
    const parts = ['engine', 'suspension', 'tires', 'paint', 'spoiler', 'rims'];
    const partNames = { engine: 'Dvigatel', suspension: 'Amortizator', tires: 'Shina', paint: 'Rang', spoiler: 'Spoiler', rims: 'Disk' };

    // SVG vizual
    const svg = window.SVG_ILLUSTRATOR ? SVG_ILLUSTRATOR.carSvg(car, { size: 200 }) : `<div style="font-size:32px">${model.emoji || '🚗'}</div>`;

    return `
<div style="background:var(--s2);border:1px solid var(--f);border-radius:var(--br);padding:12px">
  <div style="margin-bottom:10px;background:linear-gradient(180deg,#0a0a14,#1a1a26);border-radius:var(--br2);padding:6px;text-align:center">${svg}</div>

  <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
    <div style="flex:1;min-width:0">
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px">${_escapeHtml(model.name || car.name)}</div>
      <div style="font-size:10px;color:var(--m)">Rang: ${car.carColor || 'white'} · <span style="color:var(--y);font-weight:700">${car.value} t</span></div>
    </div>
    ${car.acquiredFrom !== 'starter' ? `<button onclick="FIKRA.ngListItem('${car._id}', ${car.value})" style="padding:5px 10px;background:var(--g);color:#000;border:none;border-radius:100px;font-size:10px;font-weight:700;cursor:pointer">Sotish</button>` : ''}
  </div>

  <!-- Rang o'zgartirish tugmasi -->
  <div style="display:flex;gap:4px;margin-bottom:8px;overflow-x:auto;padding-bottom:2px">
    ${(_newGamesCatalog.carColors || ['white','black','red','blue','silver']).map(c => `
      <button onclick="FIKRA.ngPaintCar('${car._id}', '${c}')" title="${c}" style="width:24px;height:24px;flex-shrink:0;border-radius:50%;border:2px solid ${car.carColor === c ? 'var(--g)' : 'var(--f)'};background:${({white:'#eeeaff',black:'#1a1a1f',red:'#ff5f7e',blue:'#4a7dcc',silver:'#c0c0c0',orange:'#ff9844',yellow:'#ffcc44'}[c]) || '#eee'};cursor:pointer;padding:0"></button>
    `).join('')}
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
    ${parts.map(p => {
      const level = tuning[p] || 0;
      const nextCost = level < 5 ? _newGamesCatalog.tuningCosts[p][level + 1] : null;
      return `
      <div style="background:var(--s3);border:1px solid var(--f);border-radius:var(--br2);padding:8px 10px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="font-size:10px;font-weight:700;color:var(--m)">${partNames[p]}</span>
          <span style="font-size:10px;color:var(--y);font-weight:700">${level}/5</span>
        </div>
        <div style="height:4px;background:var(--s2);border-radius:3px;margin-bottom:6px;overflow:hidden">
          <div style="width:${level * 20}%;height:100%;background:var(--acc);border-radius:3px"></div>
        </div>
        ${level < 5 ? `
          <button onclick="FIKRA.ngTuning('${car._id}', '${p}')" style="width:100%;padding:4px;background:var(--acc);color:#fff;border:none;border-radius:5px;font-size:10px;font-weight:700;cursor:pointer">+1 · ${nextCost}t</button>
        ` : `
          <div style="text-align:center;font-size:9px;color:var(--g);font-weight:700;padding:3px">✓ MAX</div>
        `}
      </div>`;
    }).join('')}
  </div>
</div>`;
  }

  function _renderOutfitCard(outfit) {
    const style = _newGamesCatalog.outfitStyles.find(s => s.id === outfit.outfitStyle) || {};
    const parts = outfit.outfitParts || {};

    const svg = window.SVG_ILLUSTRATOR ? SVG_ILLUSTRATOR.outfitSvg(outfit, { size: 110 }) : `<div style="font-size:32px">${style.emoji || '👗'}</div>`;

    return `
<div style="background:var(--s2);border:1px solid var(--f);border-radius:var(--br);padding:12px">
  <div style="display:flex;gap:12px;margin-bottom:10px">
    <div style="background:linear-gradient(180deg,#0a0a14,#1a1a26);border-radius:var(--br2);padding:6px;flex-shrink:0">${svg}</div>
    <div style="flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center">
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;margin-bottom:3px">${_escapeHtml(outfit.name || style.name)}</div>
      <div style="font-size:10px;color:var(--m);margin-bottom:5px">${style.emoji} ${_escapeHtml(style.name || '-')}</div>
      <div style="font-size:11px;color:var(--y);font-weight:700">${outfit.value} t</div>
      ${outfit.acquiredFrom !== 'starter' ? `<button onclick="FIKRA.ngListItem('${outfit._id}', ${outfit.value})" style="margin-top:6px;padding:5px 10px;background:var(--g);color:#000;border:none;border-radius:100px;font-size:10px;font-weight:700;cursor:pointer;align-self:flex-start">Sotish</button>` : ''}
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px">
    <div style="background:var(--s3);border-radius:var(--br2);padding:7px;text-align:center">
      <div style="font-size:9px;color:var(--m);margin-bottom:3px">Ustki</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:4px">
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${({white:'#eeeaff',black:'#1a1a1f',red:'#ff5f7e',blue:'#4a7dcc',pink:'#ff6fa3',green:'#00d4aa',gold:'#d4af37',beige:'#e8d7b8',purple:'#7b68ee'}[parts.top?.color] || '#eee')};border:1px solid var(--f)"></span>
        <span style="font-size:10px;font-weight:700">${parts.top?.color || '-'}</span>
      </div>
    </div>
    <div style="background:var(--s3);border-radius:var(--br2);padding:7px;text-align:center">
      <div style="font-size:9px;color:var(--m);margin-bottom:3px">Pastki</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:4px">
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${({white:'#eeeaff',black:'#1a1a1f',red:'#ff5f7e',blue:'#4a7dcc',pink:'#ff6fa3',green:'#00d4aa',gold:'#d4af37',beige:'#e8d7b8',purple:'#7b68ee'}[parts.bottom?.color] || '#eee')};border:1px solid var(--f)"></span>
        <span style="font-size:10px;font-weight:700">${parts.bottom?.color || '-'}</span>
      </div>
    </div>
    <div style="background:var(--s3);border-radius:var(--br2);padding:7px;text-align:center">
      <div style="font-size:9px;color:var(--m);margin-bottom:3px">Oyoq</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:4px">
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${({white:'#eeeaff',black:'#1a1a1f',red:'#ff5f7e',blue:'#4a7dcc',pink:'#ff6fa3',green:'#00d4aa',gold:'#d4af37',beige:'#e8d7b8',purple:'#7b68ee'}[parts.shoes?.color] || '#eee')};border:1px solid var(--f)"></span>
        <span style="font-size:10px;font-weight:700">${parts.shoes?.color || '-'}</span>
      </div>
    </div>
  </div>

  <button onclick="FIKRA.ngDesignOutfit('${outfit._id}')" style="width:100%;padding:8px;background:var(--acc);color:#fff;border:none;border-radius:var(--br2);font-family:'Syne',sans-serif;font-weight:700;font-size:11px;cursor:pointer">🎨 Dizayn qilish</button>
</div>`;
  }

  function _renderPlayerCard(player) {
    const stats = player.playerStats || {};
    const posColors = { GK: 'var(--y)', DEF: 'var(--g)', MID: 'var(--al)', FWD: 'var(--r)' };
    const posColor = posColors[player.playerPosition] || 'var(--acc)';
    const totalStats = (stats.speed || 0) + (stats.skill || 0) + (stats.shot || 0) + (stats.defense || 0);

    return `
<div style="background:var(--s2);border:1px solid var(--f);border-radius:var(--br);padding:12px">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
    <div style="width:48px;height:48px;border-radius:12px;background:${posColor}1A;border:1px solid ${posColor}33;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:14px;color:${posColor}">${player.playerPosition}</div>
    <div style="flex:1;min-width:0">
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px">${_escapeHtml(player.name || 'Futbolchi')}</div>
      <div style="font-size:10px;color:var(--m)">Jami: ${totalStats} · Qiymat: <span style="color:var(--y);font-weight:700">${player.value} t</span></div>
    </div>
    ${player.acquiredFrom !== 'starter' ? `<button onclick="FIKRA.ngListItem('${player._id}', ${player.value})" style="padding:5px 10px;background:var(--g);color:#000;border:none;border-radius:100px;font-size:10px;font-weight:700;cursor:pointer">Sotish</button>` : ''}
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
    ${['speed', 'skill', 'shot', 'defense'].map(s => {
      const val = stats[s] || 0;
      const labels = { speed: 'Tezlik', skill: 'Mahorat', shot: 'Zarba', defense: 'Himoya' };
      return `
      <div style="background:var(--s3);border-radius:var(--br2);padding:7px 10px">
        <div style="display:flex;justify-content:space-between;margin-bottom:3px">
          <span style="font-size:10px;font-weight:700;color:var(--m)">${labels[s]}</span>
          <span style="font-size:11px;color:${posColor};font-weight:700">${val}</span>
        </div>
        <div style="height:3px;background:var(--s2);border-radius:2px;margin-bottom:5px;overflow:hidden">
          <div style="width:${val}%;height:100%;background:${posColor};border-radius:2px"></div>
        </div>
        ${val < 99 ? `
          <button onclick="FIKRA.ngUpgradePlayer('${player._id}', '${s}')" style="width:100%;padding:3px;background:var(--acc);color:#fff;border:none;border-radius:4px;font-size:9px;font-weight:700;cursor:pointer">+1 · ${_newGamesCatalog.statUpgradeCost}t</button>
        ` : `<div style="text-align:center;font-size:9px;color:var(--g);padding:2px">MAX</div>`}
      </div>`;
    }).join('')}
  </div>
</div>`;
  }

  // ─── Tab o'zgartirish ─────────────────────────────────────────────────────
  async function ngTab(tab) {
    document.querySelectorAll('.ng-tab').forEach(t => {
      t.classList.remove('active');
      t.style.background = 'transparent';
      t.style.color = 'var(--m)';
    });
    const btn = document.querySelector(`.ng-tab[data-tab="${tab}"]`);
    if (btn) {
      btn.classList.add('active');
      btn.style.background = 'var(--acc)';
      btn.style.color = '#fff';
    }

    const content = document.getElementById('ng-content');
    if (!content) return;

    if (tab === 'my') {
      const inv = await API.inventory(_currentNewGameType);
      window._currentNewGameItems = inv.items;
      content.innerHTML = _renderMyItems(_currentNewGameType, inv.items);
    } else if (tab === 'shop') {
      content.innerHTML = _renderShop(_currentNewGameType);
    } else if (tab === 'market') {
      content.innerHTML = '<div style="padding:20px;text-align:center;color:var(--m)">Yuklanmoqda...</div>';
      const m = await API.getMarket(_currentNewGameType);
      content.innerHTML = _renderMarket(_currentNewGameType, m.items);
    }
  }

  function _renderShop(gameType) {
    if (gameType === 'auto') {
      return `<div style="display:flex;flex-direction:column;gap:8px">
  ${_newGamesCatalog.cars.filter(c => c.basePrice > 0).map(c => `
    <div style="display:flex;align-items:center;gap:10px;background:var(--s2);border:1px solid var(--f);border-radius:var(--br2);padding:11px">
      <div style="width:44px;height:44px;border-radius:11px;background:rgba(123,104,238,.12);display:flex;align-items:center;justify-content:center;font-size:22px">${c.emoji}</div>
      <div style="flex:1;min-width:0">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:12px">${_escapeHtml(c.name)}</div>
        <div style="font-size:10px;color:var(--m)">${_escapeHtml(c.description)}</div>
      </div>
      <button onclick="FIKRA.ngBuyCar('${c.id}')" style="padding:7px 11px;background:var(--acc);color:#fff;border:none;border-radius:100px;font-size:10px;font-weight:700;cursor:pointer;flex-shrink:0">${c.basePrice.toLocaleString()}t</button>
    </div>`).join('')}
</div>`;
    }
    if (gameType === 'fashion') {
      return `<div style="display:flex;flex-direction:column;gap:8px">
  ${_newGamesCatalog.outfitStyles.filter(s => s.basePrice > 0).map(s => `
    <div style="display:flex;align-items:center;gap:10px;background:var(--s2);border:1px solid var(--f);border-radius:var(--br2);padding:11px">
      <div style="width:44px;height:44px;border-radius:11px;background:rgba(255,111,163,.12);display:flex;align-items:center;justify-content:center;font-size:22px">${s.emoji}</div>
      <div style="flex:1;min-width:0">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:12px">${_escapeHtml(s.name)}</div>
        <div style="font-size:10px;color:var(--m)">${_escapeHtml(s.description)}</div>
      </div>
      <button onclick="FIKRA.ngBuyOutfit('${s.id}')" style="padding:7px 11px;background:var(--acc);color:#fff;border:none;border-radius:100px;font-size:10px;font-weight:700;cursor:pointer;flex-shrink:0">${s.basePrice.toLocaleString()}t</button>
    </div>`).join('')}
</div>`;
    }
    if (gameType === 'football') {
      return `<div style="padding:20px;text-align:center;color:var(--m);font-size:12px;line-height:1.6">
  💡 Futbolchilar faqat bozorda (boshqa o'yinchilardan) sotib olinadi.<br><br>
  "Bozor" tabga o'ting.
</div>`;
    }
    return '';
  }

  function _renderMarket(gameType, items) {
    if (!items || items.length === 0) {
      return '<div style="padding:24px;text-align:center;color:var(--m);font-size:12px">Bozorda obyektlar yo\'q. Birinchi bo\'ling — inventardan obyekt sotishga qo\'ying!</div>';
    }

    return `<div style="display:flex;flex-direction:column;gap:8px">
  ${items.map(it => {
    let icon = '📦', title = it.name || '-', subtitle = '';
    if (gameType === 'auto') {
      const model = _newGamesCatalog.cars.find(c => c.id === it.carModel) || {};
      icon = model.emoji || '🚗';
      title = model.name || it.name;
      subtitle = `Rang: ${it.carColor || '-'}`;
    } else if (gameType === 'fashion') {
      const style = _newGamesCatalog.outfitStyles.find(s => s.id === it.outfitStyle) || {};
      icon = style.emoji || '👗';
      title = style.name || it.name;
    } else if (gameType === 'football') {
      icon = `<span style="font-size:11px;color:var(--y);font-weight:800">${it.playerPosition}</span>`;
      title = it.name || 'Futbolchi';
      const s = it.playerStats || {};
      subtitle = `${s.speed||0}-${s.skill||0}-${s.shot||0}-${s.defense||0}`;
    }
    return `
    <div style="display:flex;align-items:center;gap:10px;background:var(--s2);border:1px solid rgba(0,212,170,.15);border-radius:var(--br2);padding:10px">
      <div style="width:40px;height:40px;border-radius:10px;background:rgba(0,212,170,.08);display:flex;align-items:center;justify-content:center;font-size:20px">${icon}</div>
      <div style="flex:1;min-width:0">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:12px">${_escapeHtml(title)}</div>
        <div style="font-size:10px;color:var(--m)">${_escapeHtml(subtitle)} · Qiymat: ${it.value}t</div>
      </div>
      <button onclick="FIKRA.ngBuyFromMarket('${it._id}', '${it.priceTokens}')" style="padding:7px 11px;background:var(--g);color:#000;border:none;border-radius:100px;font-size:10px;font-weight:700;cursor:pointer;flex-shrink:0">${it.priceTokens.toLocaleString()}t</button>
    </div>`;
  }).join('')}
</div>`;
  }

  // ─── Actions ──────────────────────────────────────────────────────────────
  async function ngPaintCar(carId, color) {
    try {
      await API.carPaint(carId, color);
      showToast(`Rang o'zgartirildi (50t)`, 'success');
      await updateTokenDisplay();
      ngTab('my');
    } catch (e) {
      showToast(e.message || 'Xatolik');
    }
  }

  // ─── Football match ─────────────────────────────────────────────────────
  async function openFootballMatch() {
    const betStr = await uiPrompt(
      'Qancha token tikasiz? (50-5000)\n\n• G\'olib bo\'lsangiz: 1.8x\n• Durang: 0.5x\n• Mag\'lub: 0',
      '100',
      { title: '⚽ Bot bilan o\'yin', inputMode: 'numeric' }
    );
    if (!betStr) return;
    const bet = parseInt(betStr);
    if (isNaN(bet) || bet < 50) {
      showToast('Yaroqsiz miqdor (min 50t)', 'error');
      return;
    }
    if (bet > tokens) {
      showToast('Token yetarli emas', 'error');
      return;
    }

    // Match simulyatsiyasi
    showToast('O\'yin boshlanmoqda...');

    try {
      const result = await API.footballMatch(bet);
      _renderMatchResult(result);
      await updateTokenDisplay();
    } catch (e) {
      showToast(e.message || 'Xatolik', 'error');
    }
  }

  function _renderMatchResult(r) {
    const overlay = document.createElement('div');
    overlay.id = 'match-result';
    overlay.className = 'ui-modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:10001;display:flex;align-items:center;justify-content:center;padding:14px;backdrop-filter:blur(10px);overflow-y:auto';

    const resultColors = { win: 'var(--g)', draw: 'var(--y)', loss: 'var(--r)' };
    const resultText = { win: 'G\'ALABA!', draw: 'DURANG', loss: 'MAG\'LUBIYAT' };
    const resultEmoji = { win: '🏆', draw: '🤝', loss: '😔' };

    // Eventlarni qisqartirish (gollar va kartochkalar)
    const events = (r.events || []).map(e => {
      const teamLabel = e.team === 'user' ? 'Sizning' : (e.team === 'bot' ? 'Bot' : (e.team === 'home' ? 'Uy' : 'Mehmon'));
      const icon = e.type === 'goal' ? '⚽' : (e.type === 'yellow_card' ? '🟨' : '🟥');
      return `<div style="display:flex;align-items:center;gap:6px;font-size:11px;padding:5px 0;border-bottom:1px solid var(--f)">
        <span style="color:var(--m);font-weight:700;width:28px">${e.minute}'</span>
        <span style="font-size:14px">${icon}</span>
        <span style="flex:1;color:${e.team === 'user' || e.team === 'home' ? 'var(--g)' : 'var(--r)'};font-weight:600">${teamLabel}: ${_escapeHtml(e.player || '-')}</span>
      </div>`;
    }).join('');

    overlay.innerHTML = `
<div style="max-width:380px;width:100%;background:var(--s1);border:1px solid var(--f);border-radius:20px;padding:20px;animation:scaleIn .35s cubic-bezier(.34,1.56,.64,1)">
  <div style="text-align:center;margin-bottom:14px">
    <div style="font-size:42px;margin-bottom:4px">${resultEmoji[r.result]}</div>
    <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:18px;color:${resultColors[r.result]}">${resultText[r.result]}</div>
  </div>

  <!-- Score -->
  <div style="background:linear-gradient(135deg,rgba(0,212,170,.08),rgba(123,104,238,.08));border:1px solid var(--f);border-radius:14px;padding:14px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-around">
    <div style="text-align:center">
      <div style="font-size:9px;color:var(--m);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Siz</div>
      <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:32px;color:${r.userGoals >= r.botGoals ? 'var(--g)' : 'var(--m)'}">${r.userGoals}</div>
      <div style="font-size:9px;color:var(--m);margin-top:2px">Reyting: ${r.userRating}</div>
    </div>
    <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:18px;color:var(--m)">VS</div>
    <div style="text-align:center">
      <div style="font-size:9px;color:var(--m);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Bot</div>
      <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:32px;color:${r.botGoals > r.userGoals ? 'var(--r)' : 'var(--m)'}">${r.botGoals}</div>
      <div style="font-size:9px;color:var(--m);margin-top:2px">Reyting: ${r.botRating}</div>
    </div>
  </div>

  <!-- Reward -->
  <div style="display:flex;gap:8px;margin-bottom:12px">
    <div style="flex:1;background:var(--s2);border:1px solid var(--f);border-radius:10px;padding:10px;text-align:center">
      <div style="font-size:9px;color:var(--m);margin-bottom:2px">Tikilgan</div>
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:var(--m)">-${r.betAmount}t</div>
    </div>
    <div style="flex:1;background:var(--s2);border:1px solid var(--f);border-radius:10px;padding:10px;text-align:center">
      <div style="font-size:9px;color:var(--m);margin-bottom:2px">Olindi</div>
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:${r.reward > 0 ? 'var(--y)' : 'var(--m)'}">+${r.reward}t</div>
    </div>
    <div style="flex:1;background:var(--s2);border:1px solid var(--f);border-radius:10px;padding:10px;text-align:center">
      <div style="font-size:9px;color:var(--m);margin-bottom:2px">XP</div>
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:var(--al)">+${r.xpEarned}</div>
    </div>
  </div>

  <!-- Events -->
  ${events ? `
  <div style="background:var(--s2);border:1px solid var(--f);border-radius:10px;padding:10px 12px;max-height:200px;overflow-y:auto;margin-bottom:14px">
    <div style="font-size:10px;color:var(--m);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">O'yin daqiqalari</div>
    ${events}
  </div>
  ` : ''}

  <div style="display:flex;gap:8px">
    <button onclick="document.getElementById('match-result').remove();FIKRA.openFootballMatch()" style="flex:1;padding:11px;background:var(--acc);color:#fff;border:none;border-radius:10px;font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer">Yana o'ynash</button>
    <button onclick="document.getElementById('match-result').remove()" style="flex:1;padding:11px;background:var(--s3);color:var(--txt);border:1px solid var(--f);border-radius:10px;font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer">Yopish</button>
  </div>
</div>`;

    document.body.appendChild(overlay);
    hapticNotify(r.result === 'win' ? 'success' : (r.result === 'loss' ? 'error' : 'warning'));
  }

  async function ngBuyCar(carModel) {
    const car = _newGamesCatalog.cars.find(c => c.id === carModel);
    const ok = await uiConfirm(`${car.name} ni ${car.basePrice.toLocaleString()} token ga sotib olish?`, { title: 'Mashina harid', okLabel: 'Sotib olish' });
    if (!ok) return;
    try {
      await API.buyCar(carModel);
      showToast(`${car.name} garajingizda! 🎉`);
      await updateTokenDisplay();
      ngTab('my');
    } catch (e) {
      showToast(e.message || 'Xatolik');
    }
  }

  async function ngBuyOutfit(styleId) {
    const style = _newGamesCatalog.outfitStyles.find(s => s.id === styleId);
    const ok = await uiConfirm(`${style.name} uslubini ${style.basePrice.toLocaleString()} token ga sotib olish?`, { title: 'Libos harid', okLabel: 'Sotib olish' });
    if (!ok) return;
    try {
      await API.buyOutfit(styleId);
      showToast(`${style.name} yaratildi! 🎉`);
      await updateTokenDisplay();
      ngTab('my');
    } catch (e) {
      showToast(e.message || 'Xatolik');
    }
  }

  async function ngTuning(carId, part) {
    try {
      const r = await API.carTuning(carId, part);
      showToast(`Daraja oshdi! Yangi qiymat: ${r.newValue}t`);
      await updateTokenDisplay();
      ngTab('my');
    } catch (e) {
      showToast(e.message || 'Xatolik');
    }
  }

  async function ngUpgradePlayer(playerId, stat) {
    try {
      const r = await API.upgradePlayer(playerId, stat);
      showToast(`+1 stat! Yangi qiymat: ${r.newValue}t`);
      await updateTokenDisplay();
      ngTab('my');
    } catch (e) {
      showToast(e.message || 'Xatolik');
    }
  }

  async function ngDesignOutfit(outfitId) {
    const colors = _newGamesCatalog.outfitColors;
    const newColor = colors[Math.floor(Math.random() * colors.length)];
    if (!confirm(`Libos rangini "${newColor}" ga o'zgartirish? (100 token)`)) return;
    try {
      const r = await API.outfitDesign(outfitId, { top: { color: newColor } });
      showToast(`Dizayn o'zgartirildi! +${r.newValue - window._currentNewGameItems.find(x => x._id === outfitId).value}t`);
      await updateTokenDisplay();
      ngTab('my');
    } catch (e) {
      showToast(e.message || 'Xatolik');
    }
  }

  async function ngListItem(itemId, currentValue) {
    const priceStr = await uiPrompt(`Qancha tokenga sotmoqchisiz? (Joriy qiymat: ${currentValue}t)`, String(currentValue), { title: 'Bozorga qo\'yish', inputMode: 'numeric' });
    if (!priceStr) return;
    const price = parseInt(priceStr);
    if (isNaN(price) || price < 10) {
      showToast('Yaroqsiz narx (min 10t)');
      return;
    }
    try {
      await API.listItem(itemId, price);
      showToast('Bozorga qo\'yildi!');
      ngTab('my');
    } catch (e) {
      showToast(e.message || 'Xatolik');
    }
  }

  async function ngBuyFromMarket(itemId, priceStr) {
    const price = parseInt(priceStr);
    const okb = await uiConfirm(`${price.toLocaleString()} token ga sotib olasizmi?\n(3% soliq)`, { title: 'Harid tasdiqi', okLabel: 'Sotib olish' });
    if (!okb) return;
    try {
      const r = await API.buyFromMarket(itemId);
      showToast(`Sotib olindi! Soliq: ${r.tax}t`);
      await updateTokenDisplay();
      ngTab('market');
    } catch (e) {
      showToast(e.message || 'Xatolik');
    }
  }

  // ─── Musiqa player ────────────────────────────────────────────────────────
  async function openMusicPlayer() {
    try {
      const data = await API.musicCategories();
      _renderMusicPlayerModal(data);
    } catch (e) {
      showToast('Musiqa yuklanmadi');
    }
  }

  function _renderMusicPlayerModal(data) {
    const existing = document.getElementById('music-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'music-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:9999;overflow-y:auto;backdrop-filter:blur(8px);padding:14px 0';

    let categoriesHtml = '';
    Object.entries(data.categories).forEach(([catKey, cat]) => {
      if (!cat.tracks.length) return;
      categoriesHtml += `
<div style="margin-bottom:14px">
  <div style="display:flex;align-items:center;gap:6px;padding:0 4px;margin-bottom:8px">
    <span style="font-size:15px">${cat.emoji}</span>
    <span style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px">${cat.name}</span>
  </div>
  <div style="display:flex;flex-direction:column;gap:6px">
    ${cat.tracks.map(t => `
    <div onclick="FIKRA.playTrack('${t.id}')" style="display:flex;align-items:center;gap:10px;background:var(--s2);border:1px solid ${t.isLocked ? 'var(--f)' : 'rgba(0,212,170,.2)'};border-radius:var(--br2);padding:10px 12px;cursor:pointer;${t.isLocked ? 'opacity:.55' : ''};transition:all .15s">
      <div style="width:40px;height:40px;border-radius:10px;background:rgba(0,212,170,.12);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${t.coverEmoji}</div>
      <div style="flex:1;min-width:0">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:12px;margin-bottom:1px;display:flex;align-items:center;gap:5px">
          ${_escapeHtml(t.title)}
          ${t.isLocked ? `<span style="font-size:8px;font-weight:700;padding:1px 5px;border-radius:3px;background:rgba(255,204,68,.15);color:var(--y);text-transform:uppercase">${t.tier}</span>` : ''}
        </div>
        <div style="font-size:10px;color:var(--m)">${_escapeHtml(t.artist)} · ${MUSIC.formatTime(t.duration)}${t.frequency > 0 ? ` · ${t.frequency}Hz` : ''}</div>
      </div>
      <div style="width:28px;height:28px;border-radius:50%;background:${t.isLocked ? 'var(--s3)' : 'var(--g)'};display:flex;align-items:center;justify-content:center;font-size:12px;color:${t.isLocked ? 'var(--m)' : '#000'};font-weight:700;flex-shrink:0">${t.isLocked ? '🔒' : '▶'}</div>
    </div>`).join('')}
  </div>
</div>`;
    });

    modal.innerHTML = `
<div style="max-width:420px;margin:0 auto;background:var(--s1);border-radius:var(--br);padding:16px;min-height:calc(100vh - 28px)">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
    <div>
      <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:18px">🎵 Miya musiqasi</div>
      <div style="font-size:10px;color:var(--m);margin-top:2px">Diqqat, dam olish, binaural to'lqinlar</div>
    </div>
    <button onclick="FIKRA.closeMusicPlayer()" style="width:30px;height:30px;border-radius:50%;background:var(--s3);border:none;color:var(--txt);font-size:17px;cursor:pointer;padding:0">×</button>
  </div>

  <div id="now-playing" style="display:none;background:linear-gradient(135deg,rgba(0,212,170,.1),rgba(123,104,238,.1));border:1px solid rgba(0,212,170,.2);border-radius:var(--br);padding:14px;margin-bottom:14px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
      <div id="np-emoji" style="width:48px;height:48px;border-radius:12px;background:rgba(0,212,170,.15);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">🎵</div>
      <div style="flex:1;min-width:0">
        <div id="np-title" style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;margin-bottom:2px">-</div>
        <div id="np-artist" style="font-size:11px;color:var(--m)">-</div>
      </div>
      <button id="np-btn" onclick="FIKRA.togglePlay()" style="width:44px;height:44px;border-radius:50%;background:var(--g);border:none;color:#000;font-size:16px;cursor:pointer;font-weight:800;flex-shrink:0">▶</button>
    </div>
    <div style="display:flex;align-items:center;gap:6px">
      <span style="font-size:10px;color:var(--m);font-weight:700" id="np-current">0:00</span>
      <input id="np-volume" type="range" min="0" max="100" value="50" oninput="FIKRA.setMusicVolume(this.value/100)" style="flex:1;accent-color:var(--g);height:3px">
      <span style="font-size:10px;color:var(--m);font-weight:700">🔊</span>
    </div>
  </div>

  ${!data.userPlan || data.userPlan === 'free' ? `
    <div style="background:linear-gradient(135deg,rgba(255,204,68,.08),rgba(0,212,170,.06));border:1px solid rgba(255,204,68,.22);border-radius:var(--br2);padding:10px 12px;margin-bottom:14px;display:flex;align-items:center;gap:10px">
      <div style="font-size:20px">✨</div>
      <div style="flex:1">
        <div style="font-size:11px;font-weight:700;color:var(--y);margin-bottom:1px">Pro obuna oling</div>
        <div style="font-size:10px;color:var(--m)">Barcha 10+ trek, cheksiz ijro</div>
      </div>
      <button onclick="FIKRA.closeMusicPlayer();FIKRA.openSubscriptions()" style="padding:6px 12px;background:var(--y);color:#000;border:none;border-radius:100px;font-size:11px;font-weight:700;cursor:pointer">Ko'rish</button>
    </div>
  ` : ''}

  ${categoriesHtml}
</div>`;

    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) closeMusicPlayer(); };

    MUSIC.setStateHandler((state) => {
      const btn = document.getElementById('np-btn');
      const homeBtn = document.getElementById('home-music-btn');
      if (state === 'play') {
        if (btn) btn.textContent = '❚❚';
        if (homeBtn) homeBtn.textContent = '❚❚';
      } else if (state === 'pause' || state === 'error') {
        if (btn) btn.textContent = '▶';
        if (homeBtn) homeBtn.textContent = '▶';
      }
    });

    const vol = document.getElementById('np-volume');
    if (vol) vol.value = MUSIC.getVolume() * 100;

    if (window._musicUpdateInterval) clearInterval(window._musicUpdateInterval);
    window._musicUpdateInterval = setInterval(() => {
      const c = document.getElementById('np-current');
      if (c) c.textContent = MUSIC.formatTime(MUSIC.getCurrentTime());
    }, 1000);

    _updateNowPlaying();
    window._currentMusicData = data;
  }

  async function playTrack(trackId) {
    const data = window._currentMusicData;
    if (!data) return;
    let track = null;
    Object.values(data.categories).forEach(cat => {
      const t = cat.tracks.find(x => x.id === trackId);
      if (t) track = t;
    });
    if (!track) return;

    if (track.isLocked) {
      showToast(`Bu trek ${track.tier.toUpperCase()} obuna bilan mavjud`);
      setTimeout(() => { closeMusicPlayer(); openSubscriptions(); }, 800);
      return;
    }

    try {
      const allTracks = Object.values(data.categories).flatMap(c => c.tracks);
      MUSIC.setPlaylist(allTracks);
      await MUSIC.play(track);
      _updateNowPlaying();
    } catch (e) {
      showToast('Trek yuklanmadi: ' + (e.message || 'xatolik'));
    }
  }

  function _updateNowPlaying() {
    const t = MUSIC.getCurrentTrack();
    const np = document.getElementById('now-playing');
    if (!np) return;
    if (t) {
      np.style.display = 'block';
      const title = document.getElementById('np-title');
      const artist = document.getElementById('np-artist');
      const emoji = document.getElementById('np-emoji');
      if (title) title.textContent = t.title;
      if (artist) artist.textContent = t.artist;
      if (emoji) emoji.textContent = t.coverEmoji;
    }
  }

  function togglePlay() {
    const playing = MUSIC.toggle();
    const btn = document.getElementById('np-btn');
    const homeBtn = document.getElementById('home-music-btn');
    if (btn) btn.textContent = playing ? '❚❚' : '▶';
    if (homeBtn) homeBtn.textContent = playing ? '❚❚' : '▶';
  }

  function setMusicVolume(v) {
    MUSIC.setVolume(v);
  }

  function closeMusicPlayer() {
    const m = document.getElementById('music-modal');
    if (m) m.remove();
    if (window._musicUpdateInterval) {
      clearInterval(window._musicUpdateInterval);
      window._musicUpdateInterval = null;
    }
  }

  // ─── Turnir ───────────────────────────────────────────────────────────────
  async function loadHomeTournament() {
    try {
      const data = await API.weeklyTournament();
      if (!data || !data.tournament) return;

      const label = document.getElementById('tourn-label');
      const title = document.getElementById('tourn-title');
      const sub = document.getElementById('tourn-sub');

      const t = data.tournament;
      const tl = data.timeLeft || {};
      let leftText = 'tugagan';
      if (!tl.ended) {
        if (tl.days > 0) leftText = `${tl.days} kun ${tl.hours} soat qoldi`;
        else leftText = `${tl.hours}s ${tl.minutes}d qoldi`;
      }

      if (label) label.textContent = `🏆 Turnir · ${leftText}`;
      if (title) title.textContent = t.title;
      const firstPrize = t.prizes?.[0];
      if (sub) {
        sub.innerHTML = `${t.totalParticipants || 0} ishtirokchi${data.myPosition ? ` · <span style="color:var(--al);font-weight:700">Siz: ${data.myPosition}-o'rin</span>` : ''}${firstPrize ? ` · 1-o'rin: <span style="color:var(--y);font-weight:700">${firstPrize.tokens}t + VIP</span>` : ''}`;
      }
    } catch (e) {
      console.warn('Tournament load:', e.message);
    }
  }

  async function openTournament() {
    try {
      const data = await API.weeklyTournament();
      _renderTournamentModal(data);
    } catch (e) {
      showToast('Turnir ma\'lumoti yuklanmadi');
    }
  }

  function _renderTournamentModal(data) {
    const existing = document.getElementById('tourn-modal');
    if (existing) existing.remove();
    if (!data || !data.tournament) {
      showToast('Faol turnir topilmadi');
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'tourn-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:9999;overflow-y:auto;backdrop-filter:blur(8px);padding:14px 0';

    const t = data.tournament;
    const tl = data.timeLeft || {};
    const ranking = data.ranking || [];
    const myPos = data.myPosition;

    let timeText = 'Tugagan';
    if (!tl.ended) {
      if (tl.days > 0) timeText = `${tl.days} kun · ${tl.hours}s`;
      else timeText = `${tl.hours}s · ${tl.minutes}daq`;
    }

    modal.innerHTML = `
<div style="max-width:420px;margin:0 auto;background:var(--s1);border-radius:var(--br);padding:16px;min-height:calc(100vh - 28px)">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
    <div style="flex:1;min-width:0">
      <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:17px">🏆 ${_escapeHtml(t.title)}</div>
      <div style="font-size:10px;color:var(--m);margin-top:2px">${_escapeHtml(t.description || '')}</div>
    </div>
    <button onclick="document.getElementById('tourn-modal').remove()" style="width:30px;height:30px;border-radius:50%;background:var(--s3);border:none;color:var(--txt);font-size:17px;cursor:pointer;padding:0;margin-left:8px;flex-shrink:0">×</button>
  </div>

  <div style="background:linear-gradient(135deg,rgba(123,104,238,.15),rgba(255,111,163,.08));border:1px solid rgba(123,104,238,.25);border-radius:var(--br);padding:14px;margin-bottom:14px;text-align:center">
    <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--al);margin-bottom:4px">Qoldi</div>
    <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:22px;color:var(--y)">${timeText}</div>
    <div style="font-size:10px;color:var(--m);margin-top:4px">${t.totalParticipants || 0} ishtirokchi</div>
  </div>

  ${myPos ? `
    <div style="background:rgba(0,212,170,.08);border:1px solid rgba(0,212,170,.25);border-radius:var(--br2);padding:10px 12px;margin-bottom:14px;display:flex;align-items:center;gap:10px">
      <div style="font-size:18px">⭐</div>
      <div style="flex:1">
        <div style="font-size:11px;font-weight:700;color:var(--g)">Siz ${myPos}-o'rinda</div>
        <div style="font-size:10px;color:var(--m)">Yana XP yig'ib joyingizni yaxshilang</div>
      </div>
    </div>
  ` : ''}

  <div style="margin-bottom:14px">
    <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--m);margin-bottom:8px;padding:0 4px">🎁 Sovrinlar</div>
    <div style="display:flex;flex-direction:column;gap:5px">
      ${(t.prizes || []).slice(0, 5).map(pr => {
        const medals = ['🥇', '🥈', '🥉', '🏅', '🏅'];
        const colors = ['var(--y)', 'var(--m)', '#cd7f32', 'var(--acc)', 'var(--acc)'];
        return `
        <div style="display:flex;align-items:center;gap:10px;background:var(--s2);border:1px solid var(--f);border-radius:var(--br2);padding:8px 12px">
          <div style="width:30px;height:30px;border-radius:50%;background:rgba(255,204,68,.12);display:flex;align-items:center;justify-content:center;font-size:14px">${medals[pr.position - 1] || '🏅'}</div>
          <div style="flex:1;font-size:11px;color:var(--m);font-weight:600">${pr.position}-o'rin</div>
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:12px;color:${colors[pr.position - 1] || 'var(--y)'}">
            ${pr.tokens}t${pr.vipDays > 0 ? ` + VIP ${pr.vipDays}k` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>

  <div>
    <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--m);margin-bottom:8px;padding:0 4px">📊 Reyting (Top 10)</div>
    ${ranking.length === 0 ? `
      <div style="padding:14px;text-align:center;background:var(--s2);border:1px solid var(--f);border-radius:var(--br2);font-size:12px;color:var(--m)">Birinchi ishtirokchi bo'ling — o'yin o'ynab XP to'plang!</div>
    ` : ranking.slice(0, 10).map(r => {
      const isMe = r.telegramId === user?.telegramId;
      const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
      return `
      <div style="display:flex;align-items:center;gap:10px;background:${isMe ? 'rgba(0,212,170,.1)' : 'var(--s2)'};border:1px solid ${isMe ? 'rgba(0,212,170,.3)' : 'var(--f)'};border-radius:var(--br2);padding:9px 12px;margin-bottom:4px">
        <div style="width:26px;height:26px;border-radius:50%;background:${r.rank <= 3 ? 'rgba(255,204,68,.15)' : 'var(--s3)'};display:flex;align-items:center;justify-content:center;font-size:${r.rank <= 3 ? '14px' : '11px'};font-weight:700;color:${isMe ? 'var(--g)' : 'var(--txt)'}">${medals[r.rank] || r.rank}</div>
        <div style="flex:1;font-size:12px;font-weight:${isMe ? '700' : '600'};color:${isMe ? 'var(--g)' : 'var(--txt)'}">${_escapeHtml(r.username)}${isMe ? ' (Siz)' : ''}</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:12px;color:var(--y)">${r.score.toLocaleString()} XP</div>
      </div>`;
    }).join('')}
  </div>

  <div style="padding:12px;background:rgba(123,104,238,.06);border:1px solid rgba(123,104,238,.15);border-radius:var(--br2);font-size:10px;color:var(--m);line-height:1.6;margin-top:14px">
    💡 XP yig'ish uchun Stroop o'ynang, DTM test ishlang, AI xizmatlardan foydalaning
  </div>
</div>`;

    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  }

  // ─── Obuna sotib olish ────────────────────────────────────────────────────
  async function buyPlan(planId) {
    showToast('To\'lov tayyorlanmoqda...');
    try {
      const res = await API.createInvoice(planId);
      if (!res?.invoiceUrl) {
        showToast('To\'lov linki olinmadi');
        return;
      }
      _openInvoice(res.invoiceUrl, 'obuna');
    } catch (e) {
      showToast(e.message || 'To\'lov xatosi');
      console.error('buyPlan:', e);
    }
  }

  // ─── Token paket sotib olish ──────────────────────────────────────────────
  async function buyPack(packId) {
    showToast('To\'lov tayyorlanmoqda...');
    try {
      const res = await API.buyPack(packId);
      if (!res?.invoiceUrl) {
        showToast('To\'lov linki olinmadi');
        return;
      }
      _openInvoice(res.invoiceUrl, 'tokenlar');
    } catch (e) {
      showToast(e.message || 'To\'lov xatosi');
    }
  }

  async function _openInvoice(invoiceUrl, label) {
    if (tg && typeof tg.openInvoice === 'function') {
      tg.openInvoice(invoiceUrl, async (status) => {
        if (status === 'paid') {
          showToast(`✅ ${label} faollashtirildi!`);
          // Modal yopish
          ['sub-modal', 'shop-modal'].forEach(id => {
            const m = document.getElementById(id);
            if (m) m.remove();
          });
          setTimeout(async () => {
            await updateTokenDisplay();
            try {
              const me = await API.me();
              if (me) user = me;
          _syncUserToWindow();
            } catch {}
            if (activePanel === 'profile') {
              const pp = document.getElementById('p-profile');
              if (pp) pp.outerHTML = buildProfile();
            }
          }, 1000);
        } else if (status === 'failed') {
          showToast('❌ To\'lov amalga oshmadi');
        } else if (status === 'cancelled') {
          showToast('To\'lov bekor qilindi');
        }
      });
    } else {
      const okp = await uiConfirm('Telegram to\'lov oynasi ochiladi.', { title: 'To\'lov davom ettirish', okLabel: 'Davom' });
      if (okp) {
        window.open(invoiceUrl, '_blank');
      }
    }
  }

  // ─── Expose ───────────────────────────────────────────────────────────────
  window.FIKRA = {
    switchPanel, goGame, openAIChat, openKal, openImage, backToGames, backToAI,
    selectStroopMode, sAns, tfAns,
    switchTestNav, selMajFan, selMajOpt, nextMajQ,
    selDir, startMut, switchMutFan, selMutFan: selMajFan, selMutOpt, nextMutQ,
    setDocFmt, sendChat, sendDoc, doScan, getHint,
    genImage, showOldImage,
    showAdsModal, showToast, updateTokenDisplay,
    switchLbTab, reLogin: login,
    buyPlan, buyPack,
    openSubscriptions, openTokenShop, switchPlanPeriod,
    claimDaily, copyRef, shareRef, loadTokenHistory,
    newChat, newDocChat, _chatInputChange,
    showRankDetail, showLevelUp, showXpGain,
    openMusicPlayer, closeMusicPlayer, playTrack, togglePlay, setMusicVolume,
    openTournament,
    openNewGame, startFootballClub, ngTab,
    ngBuyCar, ngBuyOutfit, ngTuning, ngUpgradePlayer, ngDesignOutfit, ngPaintCar,
    ngListItem, ngBuyFromMarket,
    openFootballMatch,
    showStroopResult, stroopWatchAd, stroopRetry, stroopExit,
  };

  // ─── Bootstrap ────────────────────────────────────────────────────────────
  // login() xato bersa ham UI ko'rsatiladi — loading ekranda qotib qolmaydi
  try {
    await Promise.race([
      login(),
      new Promise(resolve => setTimeout(resolve, 3000)) // 3s timeout
    ]);
  } catch(e) {
    console.warn('Login error (ignored):', e);
  }

  const loadingEl = document.getElementById('loading');
  if (loadingEl) {
    loadingEl.style.opacity = '0';
    loadingEl.style.transition = 'opacity .3s';
    setTimeout(() => loadingEl.remove(), 350);
  }
  buildUI();

  // Har 30s — joriy Telegram user = login qilgan user ekanligini tekshirish
  setInterval(() => verifyAuth(), 30000);

  // ─── Global Escape tugmasi: modallarni yopish ─────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    // Eng yuqori z-index dagi ochiq modalni yopish
    const modalIds = [
      'ui-modal-overlay', // eng yuqori
      'ng-modal', 'tourn-modal', 'music-modal', 'rank-modal',
      'sub-modal', 'shop-modal', 'pwa-install-banner',
    ];
    for (const cls of ['ui-modal-overlay']) {
      const els = document.getElementsByClassName(cls);
      if (els.length > 0) { els[els.length - 1].remove(); return; }
    }
    for (const id of modalIds.slice(1)) {
      const m = document.getElementById(id);
      if (m) { m.remove(); return; }
    }
    // Ads modal
    const adsOverlay = document.getElementById('ads-overlay');
    if (adsOverlay && adsOverlay.classList.contains('show')) {
      const skipBtn = document.getElementById('ads-skip');
      if (skipBtn) skipBtn.click();
    }
  });

  // ─── Swipe gesture: bosh sahifa slider uchun ──────────────────────────────
  function _initSliderSwipe() {
    const slides = document.getElementById('home-slides');
    if (!slides) return;
    let startX = 0, startY = 0, startTime = 0, isSwiping = false;
    let currentIdx = 0;
    const slideWidth = 375;

    slides.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
      isSwiping = true;
      slides.style.transition = 'none';
    }, { passive: true });

    slides.addEventListener('touchmove', (e) => {
      if (!isSwiping) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      // Vertikal scroll ustun bo'lsa — swipe emas
      if (Math.abs(dy) > Math.abs(dx)) { isSwiping = false; return; }
      const offset = -currentIdx * slideWidth + dx;
      slides.style.transform = `translateX(${offset}px)`;
    }, { passive: true });

    slides.addEventListener('touchend', (e) => {
      if (!isSwiping) return;
      isSwiping = false;
      const dx = e.changedTouches[0].clientX - startX;
      const duration = Date.now() - startTime;
      const isQuick = duration < 300 && Math.abs(dx) > 30;
      const isFar = Math.abs(dx) > slideWidth / 3;

      const slideCount = slides.children.length;
      if ((isQuick || isFar) && slideCount > 1) {
        if (dx < 0) currentIdx = Math.min(currentIdx + 1, slideCount - 1);
        else currentIdx = Math.max(currentIdx - 1, 0);
        hapticTap('light');
      }
      slides.style.transition = 'transform .3s cubic-bezier(.34,1.56,.64,1)';
      slides.style.transform = `translateX(${-currentIdx * slideWidth}px)`;
    }, { passive: true });
  }

  // Slider avtomatik almashtirish (har 5 sekund)
  function _initSliderAutoplay() {
    let idx = 0;
    setInterval(() => {
      const slides = document.getElementById('home-slides');
      if (!slides || !slides.children.length) return;
      // Agar foydalanuvchi boshqa sahifada bo'lsa - to'xtat
      if (activePanel !== 'home' || document.hidden) return;
      idx = (idx + 1) % slides.children.length;
      slides.style.transition = 'transform .5s cubic-bezier(.34,1.56,.64,1)';
      slides.style.transform = `translateX(${-idx * 375}px)`;
    }, 5000);
  }

  setTimeout(() => {
    _initSliderSwipe();
    _initSliderAutoplay();
  }, 500);

  // ─── PWA: Service Worker Registration ───────────────────────────────────
  if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((reg) => console.log('[PWA] SW registered:', reg.scope))
        .catch((err) => console.warn('[PWA] SW registration failed:', err));
    });
  }

  // PWA Install prompt — foydalanuvchi 3 marta kirgach ko'rsatiladi
  let _deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredPrompt = e;

    // Kirish sonini yig'ish
    try {
      let visits = parseInt(localStorage.getItem('fikra_visits') || '0', 10);
      visits++;
      localStorage.setItem('fikra_visits', String(visits));

      // 3 marta kirgandan keyin yoki allaqachon install qilingan bo'lmasa
      const installed = localStorage.getItem('fikra_pwa_installed') === 'true';
      const dismissed = localStorage.getItem('fikra_pwa_dismissed') === 'true';

      if (visits >= 3 && !installed && !dismissed) {
        setTimeout(() => showInstallPrompt(), 3000);
      }
    } catch (e) {}
  });

  window.addEventListener('appinstalled', () => {
    try { localStorage.setItem('fikra_pwa_installed', 'true'); } catch {}
    _deferredPrompt = null;
    showToast && showToast('FIKRA telefonga yuklandi! 🎉');
  });

  function showInstallPrompt() {
    if (!_deferredPrompt) return;
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.style.cssText = 'position:fixed;bottom:74px;left:10px;right:10px;max-width:460px;margin:0 auto;background:linear-gradient(135deg,rgba(123,104,238,.98),rgba(90,79,212,.98));border-radius:14px;padding:14px;z-index:9998;box-shadow:0 8px 32px rgba(0,0,0,.4);animation:slideDown .4s ease;display:flex;align-items:center;gap:12px;backdrop-filter:blur(10px)';
    banner.innerHTML = `
      <div style="font-size:28px">📱</div>
      <div style="flex:1;min-width:0;color:#fff">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;margin-bottom:2px">FIKRA ni telefonga yuklab oling</div>
        <div style="font-size:11px;opacity:.85">Tezroq ishlaydi, Telegram tashqarida ham ochiladi</div>
      </div>
      <button onclick="FIKRA.installPWA()" style="padding:8px 14px;background:#fff;color:var(--acc);border:none;border-radius:100px;font-family:'Syne',sans-serif;font-weight:700;font-size:11px;cursor:pointer;flex-shrink:0">Yuklash</button>
      <button onclick="FIKRA.dismissInstall()" style="width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.15);border:none;color:#fff;font-size:14px;cursor:pointer;padding:0;flex-shrink:0">×</button>
    `;
    document.body.appendChild(banner);
  }

  async function installPWA() {
    if (!_deferredPrompt) {
      showToast('O\'rnatish imkoniyati mavjud emas');
      return;
    }
    _deferredPrompt.prompt();
    const { outcome } = await _deferredPrompt.userChoice;
    console.log('[PWA] Install choice:', outcome);
    _deferredPrompt = null;
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.remove();
  }

  function dismissInstall() {
    try { localStorage.setItem('fikra_pwa_dismissed', 'true'); } catch {}
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.remove();
  }

  // Expose
  if (window.FIKRA) {
    window.FIKRA.installPWA = installPWA;
    window.FIKRA.dismissInstall = dismissInstall;
  }

})();
