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
    try {
      const initData = tg?.initData || 'test_init_data';
      const refCode = new URLSearchParams(window.location.search).get('ref') ||
                      tg?.initDataUnsafe?.start_param || null;
      const res = await API.login(initData, refCode);
      if (res) {
        setTokens(res.accessToken, res.refreshToken);
        user = res.user;
        tokens = res.user.tokens;
      }
    } catch (e) {
      console.error('Login error:', e);
    }
  }

  // ─── Build UI ─────────────────────────────────────────────────────────────
  function buildUI() {
    document.getElementById('app').innerHTML = `
<div class="main-wrap" id="main">
  <div class="status-bar">
    <span class="status-time" id="clock">9:41</span>
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
    setInterval(updateClock, 30000);
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
      <div class="ai-svc-card" onclick="FIKRA.showToast('Tez kunda...')">🎨<div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;margin:8px 0 2px">Rasm yaratish</div><div style="font-size:10px;color:var(--m)">1 rasm = <strong style="color:var(--y)">30t</strong></div></div>
      <div class="ai-svc-card" onclick="FIKRA.openKal()">🥗<div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;margin:8px 0 2px">Kaloriya AI</div><div style="font-size:10px;color:var(--m)">1 skan = <strong style="color:var(--y)">15t</strong></div></div>
    </div>
    <div class="sl">Chatlar tarixi</div>
    <div id="chat-history-list" style="padding:0 14px"></div>
  </div>
  <div class="subpanel" id="sa-chat"></div>
  <div class="subpanel" id="sa-doc"></div>
  <div class="subpanel" id="sa-kal"></div>
</div>`;
  }

  function buildProfile() {
    const name = user ? (user.firstName || user.username || 'Foydalanuvchi') : 'Foydalanuvchi';
    const initials = name.slice(0, 2).toUpperCase();
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
    <div class="stat-card"><div class="stat-val" style="color:var(--al)" id="p-games">0</div><div class="stat-key">O'yin</div></div>
    <div class="stat-card"><div class="stat-val" style="color:var(--g)" id="p-ai">0</div><div class="stat-key">AI so'rov</div></div>
  </div>
  <div style="background:var(--s2);border:1px solid rgba(123,104,238,.22);border-radius:var(--br);padding:13px;margin:0 14px 9px">
    <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;margin-bottom:3px">Obunani kengaytirish</div>
    <div style="font-size:11px;color:var(--m);margin-bottom:11px;line-height:1.4">Cheksiz AI, ko'p token, reklamasiz tajriba</div>
    <div style="display:flex;gap:7px">
      <div class="plan-card" onclick="FIKRA.showToast('Basic obuna tanlandi!')">
        <div class="plan-price">$5<span style="font-size:10px;font-weight:400;color:var(--m)">/oy</span></div>
        <div class="plan-name">Basic</div>
        <div class="plan-features">500t/oy<br>Kam reklama<br>Barcha AI</div>
      </div>
      <div class="plan-card pro" onclick="FIKRA.showToast('Pro obuna tanlandi!')">
        <div class="plan-price">$12<span style="font-size:10px;font-weight:400;color:rgba(157,143,255,.5)">/oy</span></div>
        <div class="plan-name">Pro ✦</div>
        <div class="plan-features">Cheksiz chat<br>50 rasm · 5 video<br>Musiqa + slider</div>
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
      if (type === 'doc') renderDocChat();
      else renderGeneralChat();
    }, 20);
  }

  function openKal() {
    switchPanel('ai');
    setTimeout(() => renderKaloriya(), 20);
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
  <div style="font-size:14px;font-weight:600;line-height:1.5;margin-bottom:12px">${q.question}</div>
  <div id="maj-opts">${q.options.map((o,i) => `
    <div class="test-opt" onclick="FIKRA.selMajOpt(this,${i},'${q._id}')" data-idx="${i}" data-qid="${q._id}">
      <div class="opt-letter">${letters[i]}</div>
      <div style="font-size:13px;font-weight:500">${o}</div>
    </div>`).join('')}
  </div>
</div>
<div style="display:flex;gap:7px;margin-top:10px">
  <button style="flex:1;padding:10px;border-radius:var(--br2);background:var(--s3);border:1px solid var(--f);color:var(--m);font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px" onclick="FIKRA.getHint('${q._id}','${q.question.replace(/'/g,"\\'")}')">
    AI hint <span style="font-size:10px;color:var(--y);font-weight:700">−10t</span>
  </button>
  <button style="flex:2;padding:10px;border-radius:var(--br2);background:var(--acc);color:#fff;border:none;font-family:'Syne',sans-serif;font-weight:700;font-size:14px;cursor:pointer" onclick="FIKRA.nextMajQ()">Keyingisi →</button>
</div>`;
  }

  let _majSelectedIdx = -1;
  let _majSelectedQId = '';

  function selMajOpt(el, idx, qId) {
    document.querySelectorAll('#maj-opts .test-opt').forEach(o => o.className = 'test-opt');
    el.classList.add('sel');
    _majSelectedIdx = idx;
    _majSelectedQId = qId;
  }

  async function nextMajQ() {
    if (_majSelectedIdx < 0) return;
    const res = await TEST.checkMajAnswer(_majSelectedQId, _majSelectedIdx);
    const opts = document.querySelectorAll('#maj-opts .test-opt');
    if (res.isCorrect) {
      opts[_majSelectedIdx].classList.add('ok');
      showToast('+2 token — to\'g\'ri!');
      updateTokenDisplay();
    } else {
      opts[_majSelectedIdx].classList.add('no');
      if (opts[res.correctIndex]) opts[res.correctIndex].classList.add('ok');
    }
    _majSelectedIdx = -1;
    const { done } = await TEST.nextMajQuestion();
    if (done) {
      setTimeout(async () => {
        // Reklama + natija
        await ADS.showInterstitialAd('test_result');
        const result = await TEST.finishAndSave('maj');
        renderTestResult(result);
      }, 700);
      return;
    }
    setTimeout(() => {
      const q = TEST.getCurrentQ();
      renderMajQuestion(q, TEST.getQIdx(), TEST.getTotal());
    }, 700);
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
    document.getElementById('mut-q-wrap').innerHTML = `
<div style="display:flex;justify-content:space-between;margin-bottom:6px">
  <span style="font-size:11px;color:var(--m);font-weight:600">${idx+1} / ${total} savol</span>
  <span style="font-size:10px;font-weight:700;color:var(--y);background:rgba(255,204,68,.1);padding:2px 8px;border-radius:100px;border:1px solid rgba(255,204,68,.2)" id="mut-ball-tag">ball</span>
</div>
<div class="prog-bar" style="margin-bottom:10px"><div class="prog-fill gradient" style="width:${((idx+1)/total)*100}%"></div></div>
<div style="background:var(--s2);border:1px solid var(--f);border-radius:var(--br);padding:15px">
  <div style="font-size:14px;font-weight:600;line-height:1.5;margin-bottom:12px">${q.question}</div>
  <div id="mut-opts">${q.options.map((o,i) => `
    <div class="test-opt" onclick="FIKRA.selMutOpt(this,${i},'${q._id}')" data-idx="${i}">
      <div class="opt-letter">${letters[i]}</div>
      <div style="font-size:13px;font-weight:500">${o}</div>
    </div>`).join('')}
  </div>
</div>
<div style="display:flex;gap:7px;margin-top:10px">
  <button style="flex:1;padding:10px;border-radius:var(--br2);background:var(--s3);border:1px solid var(--f);color:var(--m);font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px" onclick="FIKRA.getHint('${q._id}','${q.question.replace(/'/g,"\\'")}')">
    AI hint <span style="font-size:10px;color:var(--y)">−10t</span>
  </button>
  <button style="flex:2;padding:10px;border-radius:var(--br2);background:var(--acc);color:#fff;border:none;font-family:'Syne',sans-serif;font-weight:700;font-size:14px;cursor:pointer" onclick="FIKRA.nextMutQ()">Keyingisi →</button>
</div>`;
  }

  function selMutOpt(el, idx, qId) {
    document.querySelectorAll('#mut-opts .test-opt').forEach(o => o.className = 'test-opt');
    el.classList.add('sel');
    _mutSelIdx = idx; _mutSelQId = qId;
  }

  async function nextMutQ() {
    if (_mutSelIdx < 0) return;
    const res = await TEST.checkMutAnswer(_mutSelQId, _mutSelIdx);
    const opts = document.querySelectorAll('#mut-opts .test-opt');
    if (res.isCorrect) {
      opts[_mutSelIdx].classList.add('ok'); showToast('+2t · to\'g\'ri!'); updateTokenDisplay();
    } else {
      opts[_mutSelIdx].classList.add('no');
      if (opts[res.correctIndex]) opts[res.correctIndex].classList.add('ok');
    }
    _mutSelIdx = -1;
    const { done } = await TEST.nextMajQuestion();
    if (done) {
      setTimeout(async () => {
        await ADS.showInterstitialAd('test_result');
        const result = await TEST.finishAndSave('mut');
        renderTestResult(result);
      }, 700);
      return;
    }
    setTimeout(() => renderMutQuestion(TEST.getCurrentQ(), TEST.getQIdx(), TEST.getTotal()), 700);
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
  function renderGeneralChat() {
    CHAT.loadFromLocal('general');
    const history = CHAT.getHistory();
    document.getElementById('sa-chat').innerHTML = `
<div style="display:flex;flex-direction:column;height:calc(100vh - 120px)">
  <div style="display:flex;align-items:center;gap:9px;padding:9px 14px;background:var(--bg);border-bottom:1px solid var(--f);flex-shrink:0">
    <div class="back-btn" style="padding:0" onclick="FIKRA.backToAI()">←</div>
    <div style="flex:1"><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px">AI Chat</div><div style="font-size:10px;color:var(--m)">DeepSeek V3.2</div></div>
    <div style="font-size:10px;color:var(--y);font-weight:700;background:rgba(255,204,68,.08);padding:3px 8px;border-radius:100px;border:1px solid rgba(255,204,68,.2)">−5t/savol</div>
  </div>
  <div id="chat-msgs" style="flex:1;overflow-y:auto;padding:10px 14px;display:flex;flex-direction:column;gap:9px">
    <div class="msg-ai"><div class="msg-av-ai">🤖</div><div class="bbl-ai">Salom! Savolingizni yozing.</div></div>
    ${history.map(h => h.role === 'user'
      ? `<div class="msg-me"><div class="bbl-me">${h.content}</div><div class="msg-av-u">😊</div></div>`
      : `<div class="msg-ai"><div class="msg-av-ai">🤖</div><div class="bbl-ai">${h.content}</div></div>`
    ).join('')}
  </div>
  <div class="chat-input-row">
    <input class="chat-input" id="chat-inp" placeholder="Xabar yozing..." onkeydown="if(event.key==='Enter')FIKRA.sendChat()">
    <button class="send-btn" onclick="FIKRA.sendChat()">↑</button>
  </div>
</div>`;
    showSubpanel('ai', 'sa-chat');
    const msgs = document.getElementById('chat-msgs');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  async function sendChat() {
    const inp = document.getElementById('chat-inp');
    const text = inp.value.trim();
    if (!text) return;
    inp.value = '';

    const msgs = document.getElementById('chat-msgs');
    msgs.innerHTML += `<div class="msg-me"><div class="bbl-me">${text}</div><div class="msg-av-u">😊</div></div>`;
    CHAT.addMessage('user', text);

    const typingId = 'typing-' + Date.now();
    msgs.innerHTML += `<div id="${typingId}" class="msg-ai"><div class="msg-av-ai">🤖</div><div class="bbl-ai" style="display:flex;gap:4px;align-items:center"><span style="width:6px;height:6px;background:var(--m);border-radius:50%;animation:td .8s ease-in-out infinite"></span><span style="width:6px;height:6px;background:var(--m);border-radius:50%;animation:td .8s ease-in-out .15s infinite"></span><span style="width:6px;height:6px;background:var(--m);border-radius:50%;animation:td .8s ease-in-out .3s infinite"></span></div></div>`;
    msgs.scrollTop = msgs.scrollHeight;

    let reply = '';
    const replyDiv = document.createElement('div');
    replyDiv.className = 'msg-ai';
    replyDiv.innerHTML = '<div class="msg-av-ai">🤖</div><div class="bbl-ai" id="streaming-reply"></div>';

    try {
      await API.chat(text, CHAT.getHistory(),
        (chunk) => {
          const tw = document.getElementById(typingId);
          if (tw) { tw.replaceWith(replyDiv); }
          reply += chunk;
          const el = document.getElementById('streaming-reply');
          if (el) el.textContent = reply;
          msgs.scrollTop = msgs.scrollHeight;
        },
        () => {
          CHAT.addMessage('assistant', reply);
          updateTokenDisplay();
        }
      );
    } catch (e) {
      const tw = document.getElementById(typingId);
      if (tw) tw.remove();
      if (e.code === 'INSUFFICIENT_TOKENS') {
        msgs.innerHTML += `<div class="msg-ai"><div class="msg-av-ai">⚠️</div><div class="bbl-ai">Token yetarli emas. Reklama ko'ring!</div></div>`;
        showAdsModal(5, 'chat_retry');
      }
    }
  }

  function renderDocChat() {
    DOC.loadHistory();
    const fmt = DOC.getFormat();
    const history = DOC.getHistory();
    document.getElementById('sa-doc').innerHTML = `
<div style="display:flex;flex-direction:column;height:calc(100vh - 120px)">
  <div style="display:flex;align-items:center;gap:9px;padding:9px 14px;background:var(--bg);border-bottom:1px solid var(--f);flex-shrink:0">
    <div class="back-btn" style="padding:0" onclick="FIKRA.backToAI()">←</div>
    <div style="flex:1"><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px">Hujjat yaratish</div><div style="font-size:10px;color:var(--m)">AI bilan suhbatlashib istagan formatni yarating</div></div>
    <div style="font-size:10px;color:var(--y);font-weight:700;background:rgba(255,204,68,.08);padding:3px 8px;border-radius:100px;border:1px solid rgba(255,204,68,.2)">−10t</div>
  </div>
  <div style="padding:8px 14px;border-bottom:1px solid var(--f);background:var(--s1);flex-shrink:0">
    <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--m);margin-bottom:6px">Format tanlang</div>
    <div style="display:flex;gap:5px">
      ${['DOCX','PDF','PPTX'].map(f => `<button class="fmt-btn ${f===fmt?'active':''}" onclick="FIKRA.setDocFmt('${f}',this)">${f}</button>`).join('')}
    </div>
  </div>
  <div id="doc-msgs" style="flex:1;overflow-y:auto;padding:10px 14px;display:flex;flex-direction:column;gap:9px">
    <div class="msg-ai"><div class="msg-av-ai">📄</div><div class="bbl-ai">Qanday hujjat yaratishni xohlaysiz? Mavzu va tarkibini ayting.</div></div>
    ${history.map(h => h.role === 'user'
      ? `<div class="msg-me"><div class="bbl-me">${h.content}</div><div class="msg-av-u">😊</div></div>`
      : `<div class="msg-ai"><div class="msg-av-ai">📄</div><div class="bbl-ai">${h.content}</div></div>`
    ).join('')}
  </div>
  <div class="chat-input-row">
    <input class="chat-input" id="doc-inp" placeholder="Hujjat haqida yozing..." onkeydown="if(event.key==='Enter')FIKRA.sendDoc()">
    <button class="send-btn" onclick="FIKRA.sendDoc()">↑</button>
  </div>
</div>`;
    showSubpanel('ai', 'sa-doc');
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
    msgs.innerHTML += `<div id="${loadId}" class="msg-ai"><div class="msg-av-ai">📄</div><div class="bbl-ai">Tayyorlanmoqda...</div></div>`;
    msgs.scrollTop = msgs.scrollHeight;

    try {
      const res = await API.document(text, DOC.getFormat(), DOC.getHistory());
      const tw = document.getElementById(loadId);
      if (tw) tw.innerHTML = `<div class="msg-av-ai">📄</div><div class="bbl-ai">${res.content?.slice(0,300)}...<br><br><strong>[${res.format}]</strong> ✓ Tayyor</div>`;
      DOC.addMessage('assistant', res.content || '');
      updateTokenDisplay();
    } catch (e) {
      const tw = document.getElementById(loadId);
      if (tw) tw.innerHTML = `<div class="msg-av-ai">⚠️</div><div class="bbl-ai">${e.message}</div>`;
    }
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
  async function loadHomeLeaderboard() {
    try {
      const data = await API.leaderboard('stroop-color', 'today');
      renderLbRows('lb-home-rows', data, user?.telegramId);
    } catch {}
  }

  async function switchLbTab(btn, type) {
    document.querySelectorAll('.lb-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('lb-game-rows').innerHTML =
      '<div style="padding:12px 14px;font-size:12px;color:var(--m)">Yuklanmoqda...</div>';
    try {
      const data = await API.leaderboard(type, 'week');
      renderLbRows('lb-game-rows', data, user?.telegramId);
    } catch {}
  }

  function renderLbRows(containerId, data, myTid) {
    const ranks = ['rank-gold','rank-silver','rank-bronze'];
    const container = document.getElementById(containerId);
    if (!container) return;
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
    container.innerHTML = list.map(c => `
<div style="display:flex;align-items:center;gap:10px;background:var(--s1);border:1px solid var(--f);border-radius:var(--br2);padding:10px 12px;margin-bottom:7px;cursor:pointer;transition:all .15s" onclick="FIKRA.openAIChat('${c.id}')">
  <div style="width:34px;height:34px;border-radius:9px;background:${c.type==='doc'?'rgba(0,212,170,.1)':'rgba(123,104,238,.14)'};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${c.icon}</div>
  <div style="flex:1;min-width:0">
    <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
      <span style="font-family:'Syne',sans-serif;font-weight:700;font-size:12px">${c.name}</span>
      ${c.format ? `<span style="font-size:8px;font-weight:700;padding:2px 5px;border-radius:3px;background:rgba(0,212,170,.12);color:var(--g)">${c.format}</span>` : ''}
      <span style="font-size:10px;color:var(--m);margin-left:auto">${c.time}</span>
    </div>
    <div style="font-size:11px;color:var(--m);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.lastMsg || 'Yangi chat'}</div>
  </div>
</div>`).join('');
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
  function backToGames() { STROOP.stop(); showSubpanel('games', 'sg-list'); }
  function backToAI() { showSubpanel('ai', 'sa-home'); renderChatHistory(); }

  // ─── Init games ───────────────────────────────────────────────────────────
  function initGames() {
    ADS.initAdsgram();
    loadHomeLeaderboard();
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

  // ─── Expose ───────────────────────────────────────────────────────────────
  window.FIKRA = {
    switchPanel, goGame, openAIChat, openKal, backToGames, backToAI,
    selectStroopMode, sAns, tfAns,
    switchTestNav, selMajFan, selMajOpt, nextMajQ,
    selDir, startMut, switchMutFan, selMutFan: selMajFan, selMutOpt, nextMutQ,
    setDocFmt, sendChat, sendDoc, doScan, getHint,
    showAdsModal, showToast, updateTokenDisplay,
    switchLbTab, reLogin: login,
  };

  // ─── Bootstrap ────────────────────────────────────────────────────────────
  await login();
  document.getElementById('loading').classList.add('hide');
  setTimeout(() => { document.getElementById('loading')?.remove(); }, 350);
  buildUI();

})();
