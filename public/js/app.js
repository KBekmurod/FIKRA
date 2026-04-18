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
        <div style="flex:1"><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;margin-bottom:2px">Miya faolligi musiqasi</div><div style="font-size:11px;color:var(--m);line-height:1.4">Neural Phase Locking — 3D stereo</div></div>
        <button style="width:36px;height:36px;background:var(--g);border:none;border-radius:50%;font-size:14px;color:#000;cursor:pointer;flex-shrink:0;font-weight:700;transition:transform .15s" onclick="FIKRA.showToast('Musiqa ijro etilmoqda...')">▶</button>
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
  <div style="margin:4px 14px 10px;background:var(--s2);border:1px solid rgba(123,104,238,.2);border-radius:var(--br);padding:16px;position:relative;overflow:hidden">
    <div style="position:absolute;right:-20px;top:-20px;width:100px;height:100px;background:radial-gradient(circle,rgba(123,104,238,.2),transparent 70%);pointer-events:none"></div>
    <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--al);margin-bottom:6px">Turnir · 14 kun qoldi</div>
    <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:18px;line-height:1.3;margin-bottom:5px">Stroop Challenge<br><span style="color:var(--rl)">iPhone 17 Pro</span> yutib ol</div>
    <div style="font-size:11px;color:var(--m);margin-bottom:14px">2,341 ishtirokchi · Haftalik yangilanadi</div>
    <button class="btn btn-acc btn-sm" onclick="FIKRA.goGame('stroop')">O'ynash ↗</button>
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
  <div class="stats-row">
    <div class="stat-card"><div class="stat-val" style="color:var(--y)" id="h-tok">${tokens.toLocaleString()}</div><div class="stat-key">Token</div></div>
    <div class="stat-card"><div class="stat-val" style="color:var(--al)" id="h-rank">12</div><div class="stat-key">O'rin</div></div>
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
    <div class="lb-head"><span class="lb-title">Stroop — bugun</span><span class="live-dot">Jonli</span></div>
    <div id="lb-home-rows"><div style="padding:12px 14px;font-size:12px;color:var(--m)">Yuklanmoqda...</div></div>
  </div>
</div>`;
  }

  function buildGames() {
    return `<div class="panel" id="p-games">
  <div class="subpanel active" id="sg-list">
    <div class="sl" style="margin-top:6px">O'yinlar</div>
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
    <div style="margin:0 14px 9px;background:var(--s1);border:1px solid var(--f);border-radius:var(--br);overflow:hidden;cursor:pointer" onclick="FIKRA.goGame('test')">
      <div style="height:82px;background:linear-gradient(135deg,#080f08,#0e200e,#144018);display:flex;align-items:center;justify-content:space-between;padding:0 16px">
        <div><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:16px">Abituriyent</div><div style="font-size:10px;color:rgba(255,255,255,.4);margin-top:2px">Majburiy + Mutaxassislik fanlar</div></div>
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:22px;color:rgba(0,212,170,.3)">DTM</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 14px">
        <div><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px">DTM Test</div><div style="font-size:10px;color:var(--m);margin-top:2px">5 fan · Statistika · Ballar</div></div>
        <button class="btn btn-acc btn-sm">O'yna</button>
      </div>
    </div>
    <div style="margin:0 14px 9px;background:var(--s1);border:1px solid var(--f);border-radius:var(--br);overflow:hidden;opacity:.65">
      <div style="height:82px;background:linear-gradient(135deg,#0f0a00,#1f1500,#2e2000);display:flex;align-items:center;justify-content:space-between;padding:0 16px">
        <div><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:16px">Math Skill</div><div style="font-size:10px;color:rgba(255,255,255,.4);margin-top:2px">Tez hisoblash</div></div>
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:22px;color:rgba(255,204,68,.25)">2×8</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 14px">
        <div><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px">Math Skill</div><div style="font-size:10px;color:var(--al);margin-top:2px">Tez kunda...</div></div>
        <button class="btn btn-sm" style="background:rgba(123,104,238,.1);color:var(--al);border:1px solid rgba(123,104,238,.2)">Kutish</button>
      </div>
    </div>
    <div class="sl">Reyting</div>
    <div class="lb" style="margin:0 14px 14px">
      <div class="lb-head"><span class="lb-title">O'yinlar reytingi</span><span class="live-dot">Jonli</span></div>
      <div style="display:flex;gap:5px;padding:8px 13px;border-bottom:1px solid var(--f);overflow-x:auto" id="lb-tabs">
        <button class="lb-tab-btn active" onclick="FIKRA.switchLbTab(this,'stroop-color')">Stroop rang</button>
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
    return `<div class="panel" id="p-profile">
  <div style="height:5px"></div>
  <div style="display:flex;align-items:center;gap:12px;background:var(--s2);border:1px solid var(--f);border-radius:var(--br);padding:13px;margin:0 14px 9px">
    <div style="width:48px;height:48px;border-radius:13px;background:linear-gradient(135deg,var(--acc),var(--r));display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:19px;flex-shrink:0">${initials}</div>
    <div>
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px">${name}</div>
      <div style="font-size:11px;color:var(--m);margin-top:2px">@${user?.username || 'user'}</div>
      <div style="font-size:10px;color:var(--al);margin-top:3px;font-weight:700">12-o'rin · Stroop haftalik</div>
    </div>
  </div>
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

  <div style="background:var(--s2);border:1px solid rgba(123,104,238,.22);border-radius:var(--br);padding:13px;margin:0 14px 9px">
    <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;margin-bottom:3px">Obunani kengaytirish</div>
    <div style="font-size:11px;color:var(--m);margin-bottom:11px;line-height:1.4">Cheksiz AI, ko'p token, reklamasiz tajriba</div>
    <div style="display:flex;gap:7px">
      <div class="plan-card" onclick="FIKRA.buyPlan('basic')">
        <div class="plan-price">$5<span style="font-size:10px;font-weight:400;color:var(--m)">/oy</span></div>
        <div class="plan-name">Basic</div>
        <div class="plan-features">500t/oy<br>Kam reklama<br>Barcha AI</div>
        <div style="margin-top:6px;font-size:9px;color:var(--y);font-weight:700">⭐ 385 Stars</div>
      </div>
      <div class="plan-card pro" onclick="FIKRA.buyPlan('pro')">
        <div class="plan-price">$12<span style="font-size:10px;font-weight:400;color:rgba(157,143,255,.5)">/oy</span></div>
        <div class="plan-name">Pro ✦</div>
        <div class="plan-features">Cheksiz chat<br>50 rasm · 5 video<br>Musiqa + slider</div>
        <div style="margin-top:6px;font-size:9px;color:var(--y);font-weight:700">⭐ 923 Stars</div>
      </div>
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
    document.querySelectorAll('.mode-btn').forEach((b, i) => b.classList.toggle('active', i === m));
    document.getElementById('mode0-ui').style.display = m === 0 ? 'block' : 'none';
    document.getElementById('mode1-ui').style.display = m === 1 ? 'block' : 'none';
    STROOP.start(m);
  }

  function sAns(btn) { STROOP.answerColor(btn); }
  function tfAns(val) { STROOP.answerTF(val); }

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
      <input class="chat-input" id="chat-inp" maxlength="${limits.MAX_MSG_CHARS}" placeholder="Xabar yozing..." oninput="FIKRA._chatInputChange(this)" onkeydown="if(event.key==='Enter')FIKRA.sendChat()">
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
    if (confirm('Yangi chat boshlaysizmi? Joriy suhbat tarixga saqlanadi.')) {
      CHAT.startNew();
      renderGeneralChat();
      showToast('Yangi chat boshlandi');
    }
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
        if (confirm(check.reason + ' Yangi chat boshlash?')) {
          CHAT.startNew();
          renderGeneralChat();
        }
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
      <input class="chat-input" id="doc-inp" maxlength="2000" placeholder="Hujjat haqida yozing..." onkeydown="if(event.key==='Enter')FIKRA.sendDoc()">
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
    if (confirm('Yangi hujjat chatini boshlaysizmi?')) {
      DOC.clear();
      renderDocChat();
      showToast('Yangi hujjat chati');
    }
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
  let _currentLbType = 'stroop-color';
  let _lbPanelVisible = false;

  async function loadHomeLeaderboard() {
    try {
      const data = await API.leaderboard('stroop-color', 'today');
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
    container.innerHTML = data.slice(0, 10).map((r, i) => `
<div class="lb-row ${r.telegramId === myTid ? 'me' : ''}">
  <div class="lb-rank ${ranks[i] || ''}" style="${r.telegramId === myTid ? 'color:var(--al)' : ''}">${r.rank}</div>
  <div class="lb-av">😊</div>
  <div class="lb-name" style="${r.telegramId === myTid ? 'color:var(--al)' : ''}">${r.username}</div>
  <div class="lb-score">${typeof r.score === 'number' && r.score % 1 !== 0 ? r.score.toFixed(1) : r.score}</div>
</div>`).join('');
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
  function showAdsModal(tokensToGive, context, resolve) {
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
  function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2400);
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
    startLbPolling(); // Real vaqt leaderboard

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
      // user ma'lumotini yangilash
      try {
        const me = await API.me();
        if (me) user = me;
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

  // ─── Stars to'lovi ────────────────────────────────────────────────────────
  async function buyPlan(planId) {
    showToast('To\'lov tayyorlanmoqda...');
    try {
      const res = await API.createInvoice(planId);
      if (!res?.invoiceUrl) {
        showToast('To\'lov linki olinmadi');
        return;
      }

      // Telegram WebApp openInvoice
      if (tg && typeof tg.openInvoice === 'function') {
        tg.openInvoice(res.invoiceUrl, (status) => {
          if (status === 'paid') {
            showToast('✅ Obuna faollashtirildi!');
            setTimeout(async () => {
              await updateTokenDisplay();
              try {
                const me = await API.me();
                if (me) user = me;
              } catch {}
              // Profilni qayta render qilish
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
        // Brauzerda — link orqali ochish
        if (window.confirm('Telegram to\'lov oynasi ochiladi. Davom etamizmi?')) {
          window.open(res.invoiceUrl, '_blank');
        }
      }
    } catch (e) {
      showToast(e.message || 'To\'lov xatosi');
      console.error('buyPlan:', e);
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
    buyPlan,
    claimDaily, copyRef, shareRef, loadTokenHistory,
    newChat, newDocChat, _chatInputChange,
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

})();
