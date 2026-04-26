// ─── FIKRA v2.0 — Abituriyent platformasi ────────────────────────────────────
// Token tizimi yo'q. Reklama yo'q. Video yo'q.
// Asosiy: DTM Test + AI tushuntirish (har savol yonida 💡)
// Obuna: Telegram Stars orqali to'g'ridan-to'g'ri.

(async function () {
  const tg = window.Telegram?.WebApp;
  if (tg) { tg.ready(); tg.expand(); tg.setHeaderColor('#07070e'); tg.setBackgroundColor('#07070e'); }

  // ─── State ──────────────────────────────────────────────────────────────
  let user = null;
  let activePanel = 'home';

  function _e(t) {
    return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function _syncUser() { window.user = user; }
  function haptic(s) { try { tg?.HapticFeedback?.impactOccurred(s||'light'); } catch {} }
  function hapticN(t) { try { tg?.HapticFeedback?.notificationOccurred(t||'success'); } catch {} }

  // ─── AI limit helpers ─────────────────────────────────────────────────────
  function aiLimit(k) { return user?.aiLimits?.[k] ?? 0; }   // null = cheksiz
  function aiUsed(k)  { return user?.aiUsage?.[k]  ?? 0; }
  function canAi(k) {
    const l = aiLimit(k);
    return l === null ? true : l > 0 && aiUsed(k) < l;
  }
  function aiText(k) {
    const l = aiLimit(k);
    if (l === null) return 'Cheksiz';
    if (l <= 0) return 'Obuna kerak';
    return aiUsed(k) + '/' + l + ' bugun';
  }

  // ─── Auth ─────────────────────────────────────────────────────────────────
  async function login() {
    const initData = tg?.initData || '';
    const initUser = tg?.initDataUnsafe?.user;
    const tid = initUser?.id || null;
    const ref = new URLSearchParams(window.location.search).get('ref') || tg?.initDataUnsafe?.start_param || null;
    window._loadSavedTokens(tid);
    const owner = window.getTokenOwner();
    if (owner && owner === tid) {
      try {
        const me = await API.me();
        if (me && me.telegramId === tid) { user = me; _syncUser(); return; }
      } catch { window.clearTokens(); }
    } else if (owner && owner !== tid) { window.clearTokens(); }
    if (!initData || !tid) {
      user = { firstName:'Mehmon', plan:'free', streakDays:0, aiUsage:{},
        aiLimits:{hints:5,chats:0,docs:0,images:0,calories:0,games:3}, _demo:true };
      _syncUser(); return;
    }
    try {
      const res = await API.login(initData, ref);
      if (res?.user) {
        if (res.user.telegramId !== tid) throw new Error('ID mismatch');
        window.setTokens(res.accessToken, res.refreshToken, tid);
        user = res.user; _syncUser();
      }
    } catch(e) {
      console.error('[Auth]', e.message);
      user = { firstName: initUser?.first_name||'Xatolik', plan:'free',
        aiUsage:{}, aiLimits:{hints:5,chats:0,docs:0,images:0,calories:0,games:3} };
      _syncUser();
    }
  }

  async function verifyAuth() {
    if (!user || user._demo) return;
    const tid = tg?.initDataUnsafe?.user?.id;
    if (!tid || user.telegramId === tid) return;
    window.clearTokens(); await login(); buildUI();
  }

  function plan() {
    if (!user) return 'free';
    if (user.plan !== 'free' && user.planExpiresAt && new Date(user.planExpiresAt) <= new Date()) return 'free';
    return user.effectivePlan || user.plan || 'free';
  }
  function isSub() { return plan() !== 'free'; }
  function planBadge(p) { return {free:'',basic:'⭐ Basic',pro:'✨ Pro',vip:'💎 VIP'}[p]||''; }

  // ─── Limit modal ──────────────────────────────────────────────────────────
  function limitModal(k) {
    const msgs = {
      hints: 'Bugungi AI tushuntirish (5/5) tugadi.\nBasic obuna — cheksiz AI tushuntirish.',
      chats: 'AI Chat Basic obunada ochiladi (50/kun).',
      docs:  'AI Hujjat Pro obunada ochiladi (10/kun).',
      images:'AI Rasm Pro obunada ochiladi (20/kun).',
      calories:'Kaloriya AI VIP obunada ochiladi.',
      games: 'Kunlik o\'yin limiti tugadi. Ertaga yoki obuna oling.',
    };
    uiConfirm(msgs[k]||'Bu xizmat obuna talab qiladi.', {ok:"Obuna ko'rish ⭐",cancel:'Keyinroq'})
      .then(ok => { if (ok) openSubs(); });
  }

  // ─── BUILD UI ─────────────────────────────────────────────────────────────
  function buildUI() {
    document.getElementById('app').innerHTML = `
<div class="main-wrap" id="main">
  <div class="status-bar">
    <span id="clock" class="status-time"></span>
    <div class="status-plan" onclick="FIKRA.openSubs()">
      ${isSub()
        ? `<span style="color:var(--y);font-weight:700;font-size:10px">${planBadge(plan())}</span>`
        : `<span style="font-size:10px;color:var(--m)">Bepul</span><span style="font-size:9px;color:var(--acc);margin-left:4px">Obuna ↗</span>`
      }
    </div>
  </div>
  <div class="app-header"><div class="app-logo">FIKRA<span>.</span></div><div style="font-size:10px;color:var(--m);font-weight:600">DTM tayyorlik</div></div>
  <div class="scroll" id="scroll">
    ${buildHome()}${buildTest()}${buildGifts()}${buildProfile()}
  </div>
  <nav class="bottom-nav">
    <button class="nav-item active" id="ni-home"    onclick="FIKRA.sw('home')">   <div class="nav-icon">⚡</div><div class="nav-label">Bosh</div></button>
    <button class="nav-item"        id="ni-test"    onclick="FIKRA.sw('test')">   <div class="nav-icon">📚</div><div class="nav-label">Test</div></button>
    <button class="nav-item"        id="ni-gifts"   onclick="FIKRA.sw('gifts')">  <div class="nav-icon">🎁</div><div class="nav-label">Sovg'alar</div></button>
    <button class="nav-item"        id="ni-profile" onclick="FIKRA.sw('profile')"><div class="nav-icon">👤</div><div class="nav-label">Profil</div></button>
  </nav>
</div>
<div id="toast"></div>`;
    updateClock(); setInterval(updateClock, 10000);
    setTimeout(() => document.getElementById('main')?.classList.add('visible'), 40);
    initApp();
  }

  function updateClock() {
    const n = new Date(), el = document.getElementById('clock');
    if (el) el.textContent = String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0');
  }

  // ─── HOME PANEL ───────────────────────────────────────────────────────────
  function buildHome() {
    const streak = user?.streakDays || 0;
    const rankCur = user?.rank?.current;
    return `<div class="panel active" id="p-home">
  <div style="margin:8px 14px 6px;background:linear-gradient(135deg,rgba(123,104,238,.12),rgba(0,212,170,.08));border:1px solid rgba(123,104,238,.2);border-radius:var(--br);padding:16px">
    <div style="display:flex;align-items:center;gap:10px">
      <div style="font-size:32px">🎓</div>
      <div style="flex:1">
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:15px">Salom, ${_e(user?.firstName||'Abituriyent')}!</div>
        <div style="font-size:11px;color:var(--m);margin-top:2px">${isSub() ? planBadge(plan())+' · AI imkoniyatlari ochiq' : 'Bugun '+aiText('hints')+' AI tushuntirish'}</div>
      </div>
      ${streak>0?`<div style="background:rgba(255,204,68,.15);border:1px solid rgba(255,204,68,.3);border-radius:10px;padding:6px 10px;text-align:center;flex-shrink:0"><div style="font-size:16px">🔥</div><div style="font-size:10px;font-weight:700;color:var(--y)">${streak} kun</div></div>`:''}
    </div>
  </div>
  <div class="sl" style="margin-top:8px">Tezkor kirish</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;padding:0 14px 10px">
    <div class="qi-btn" onclick="FIKRA.sw('test')">📚<span>DTM Test</span></div>
    <div class="qi-btn" onclick="FIKRA.goStroop()">🧠<span>Stroop</span></div>
    <div class="qi-btn" onclick="FIKRA.goAIChat()">💬<span>AI Chat</span></div>
  </div>
  ${!isSub()?`<div style="margin:0 14px 10px;background:linear-gradient(135deg,rgba(123,104,238,.13),rgba(0,212,170,.07));border:1px solid rgba(123,104,238,.25);border-radius:var(--br);padding:14px;cursor:pointer" onclick="FIKRA.openSubs()">
    <div style="display:flex;align-items:center;gap:10px">
      <div style="font-size:26px">⭐</div>
      <div style="flex:1"><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;margin-bottom:2px">AI yordamchi — cheksiz</div>
      <div style="font-size:11px;color:var(--m)">Basic: har savol uchun AI · Chat · va yana ko'p</div></div>
      <div style="font-size:11px;font-weight:700;color:var(--acc);flex-shrink:0">149⭐ ↗</div>
    </div></div>`:''}
  <div id="tourn-banner" style="margin:0 14px 10px;background:var(--s2);border:1px solid rgba(123,104,238,.2);border-radius:var(--br);padding:14px;cursor:pointer" onclick="FIKRA.openTournament()">
    <div id="tourn-label" style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--al);margin-bottom:4px">Turnir · yuklanmoqda...</div>
    <div id="tourn-title" style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;margin-bottom:2px">Haftalik XP turniri</div>
    <div id="tourn-sub" style="font-size:11px;color:var(--m)">Eng ko'p XP to'plagan g'olib</div>
  </div>
  <div class="sl">Liderlar (XP)</div>
  <div class="lb">
    <div class="lb-head"><span class="lb-title">⚡ Top XP — global</span><span class="live-dot">Jonli</span></div>
    <div id="lb-rows"><div style="padding:12px 14px;font-size:12px;color:var(--m)">Yuklanmoqda...</div></div>
  </div>
</div>`;
  }

  // ─── TEST PANEL (LOYIHA MARKAZI) ──────────────────────────────────────────
  function buildTest() {
    return `<div class="panel" id="p-test">
  <div class="subpanel active" id="st-home">
    <div class="sl" style="margin-top:6px">DTM Test</div>
    <div style="display:flex;align-items:center;gap:8px;background:${canAi('hints')?'rgba(0,212,170,.08)':'rgba(255,95,95,.07)'};border:1px solid ${canAi('hints')?'rgba(0,212,170,.2)':'rgba(255,95,95,.2)'};border-radius:var(--br2);padding:10px 14px;margin:0 14px 10px">
      <div style="font-size:18px">💡</div>
      <div style="flex:1">
        <div style="font-size:12px;font-weight:700">AI tushuntirish: <span id="hint-limit-display">${aiText('hints')}</span></div>
        <div style="font-size:10px;color:var(--m);margin-top:1px">${canAi('hints')?'Savollar yonidagi 💡 tugmasini bosing':'Bugungi limit tugadi. Ertaga yoki obuna oling'}</div>
      </div>
      ${!isSub()?`<button onclick="FIKRA.openSubs()" style="font-size:10px;font-weight:700;color:var(--acc);background:transparent;border:none;cursor:pointer;flex-shrink:0">Obuna ↗</button>`:''}
    </div>
    <div class="sl">📌 Majburiy fanlar</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;padding:0 14px 10px">
      <div class="fan-card" onclick="FIKRA.startFan('uztil','majburiy')">🔤<span>Ona tili</span></div>
      <div class="fan-card" onclick="FIKRA.startFan('math','majburiy')">➕<span>Matematika</span></div>
      <div class="fan-card" onclick="FIKRA.startFan('tarix','majburiy')">🏛️<span>Tarix</span></div>
    </div>
    <div class="sl">🎯 Mutaxassislik</div>
    <div style="padding:0 14px 10px;display:flex;flex-direction:column;gap:8px">
      <div class="dir-card" onclick="FIKRA.startDir('iqtisodiyot')"><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px">💰 Iqtisodiyot</div><div style="font-size:10px;color:var(--m);margin-top:2px">Matematika + Ingliz · 2.1+3.1 ball</div></div>
      <div class="dir-card" onclick="FIKRA.startDir('tibbiyot')"><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px">⚕️ Tibbiyot</div><div style="font-size:10px;color:var(--m);margin-top:2px">Biologiya + Kimyo · 2.1+3.1 ball</div></div>
      <div class="dir-card" onclick="FIKRA.startDir('huquq')"><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px">⚖️ Huquq</div><div style="font-size:10px;color:var(--m);margin-top:2px">Tarix + Ingliz · 2.1+3.1 ball</div></div>
      <div class="dir-card" onclick="FIKRA.startDir('it')"><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px">💻 IT / Texnika</div><div style="font-size:10px;color:var(--m);margin-top:2px">Matematika + Fizika · 2.1+3.1 ball</div></div>
    </div>
  </div>
  <div class="subpanel" id="st-quiz"></div>
  <div class="subpanel" id="st-result"></div>
</div>`;
  }

  // ─── GIFTS PANEL ──────────────────────────────────────────────────────────
  function buildGifts() {
    return `<div class="panel" id="p-gifts">
  <div class="subpanel active" id="sg-home">
    <div class="sl" style="margin-top:6px">Sovg'alar</div>
    ${!isSub()?`<div style="margin:0 14px 10px;background:rgba(123,104,238,.07);border:1px solid rgba(123,104,238,.18);border-radius:var(--br);padding:11px 14px;font-size:11px;color:var(--m);line-height:1.5">🎁 Obuna bilan barcha imkoniyatlar ochiladi. <span style="color:var(--acc);cursor:pointer" onclick="FIKRA.openSubs()">Obuna ↗</span></div>`:''}
    <div class="sl">🤖 AI xizmatlar</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 14px 10px">
      <div class="ai-svc-card ${!canAi('chats')?'locked':''}" onclick="FIKRA.goAIChat()">💬<div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;margin:7px 0 2px">AI Chat</div><div style="font-size:10px;color:var(--m)">${aiText('chats')}</div>${!canAi('chats')?'<div style="font-size:9px;color:var(--acc);font-weight:700;margin-top:2px">Basic+</div>':''}</div>
      <div class="ai-svc-card ${!canAi('docs')?'locked':''}" onclick="FIKRA.goAIDoc()">📄<div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;margin:7px 0 2px">Hujjat</div><div style="font-size:10px;color:var(--m)">${aiText('docs')}</div>${!canAi('docs')?'<div style="font-size:9px;color:var(--acc);font-weight:700;margin-top:2px">Pro+</div>':''}</div>
      <div class="ai-svc-card ${!canAi('images')?'locked':''}" onclick="FIKRA.goAIImage()">🎨<div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;margin:7px 0 2px">Rasm</div><div style="font-size:10px;color:var(--m)">${aiText('images')}</div>${!canAi('images')?'<div style="font-size:9px;color:var(--acc);font-weight:700;margin-top:2px">Pro+</div>':''}</div>
      <div class="ai-svc-card ${!canAi('calories')?'locked':''}" onclick="FIKRA.goKal()">🥗<div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;margin:7px 0 2px">Kaloriya</div><div style="font-size:10px;color:var(--m)">${aiText('calories')}</div>${!canAi('calories')?'<div style="font-size:9px;color:var(--acc);font-weight:700;margin-top:2px">VIP</div>':''}</div>
    </div>
    <div class="sl">🎮 O'yinlar</div>
    <div style="padding:0 14px 10px;display:flex;flex-direction:column;gap:8px">
      <div class="game-card" onclick="FIKRA.goStroop()"><div class="game-card-hdr" style="background:linear-gradient(135deg,#0a0820,#1a1060)"><span>🧠 Stroop Brain</span><span style="font-size:10px;opacity:.5">${aiText('games')}</span></div><div class="game-card-ftr"><span style="font-size:10px;color:var(--m)">Rekord: <b id="my-stroop-score">0</b></span><button class="btn btn-acc btn-sm">O'yna</button></div></div>
      <div class="game-card" onclick="FIKRA.openNG('auto')"><div class="game-card-hdr" style="background:linear-gradient(135deg,#100820,#200c40)"><span>🚗 Avto Tuning</span><span style="font-size:10px;opacity:.5">Lada → Tesla</span></div><div class="game-card-ftr"><span style="font-size:10px;color:var(--m)">Tuning · Rang · Bozor</span><button class="btn btn-acc btn-sm">Ochish</button></div></div>
      <div class="game-card" onclick="FIKRA.openNG('football')"><div class="game-card-hdr" style="background:linear-gradient(135deg,#081808,#0e300e)"><span>⚽ Master Liga</span><span style="font-size:10px;opacity:.5">Bunyodkor → Real</span></div><div class="game-card-ftr"><span style="font-size:10px;color:var(--m)">O'yinchilar · Stat · Match</span><button class="btn btn-acc btn-sm">Ochish</button></div></div>
      <div class="game-card" onclick="FIKRA.openNG('fashion')"><div class="game-card-hdr" style="background:linear-gradient(135deg,#20081a,#400c30)"><span>👗 Fashion Design</span><span style="font-size:10px;opacity:.5">Uslub · Rang · Naqsh</span></div><div class="game-card-ftr"><span style="font-size:10px;color:var(--m)">Klassik · Formal · Sport</span><button class="btn btn-acc btn-sm">Ochish</button></div></div>
    </div>
    <div class="sl">🎵 Binaural musiqa</div>
    <div style="margin:0 14px 20px;background:linear-gradient(135deg,rgba(0,212,170,.08),rgba(123,104,238,.06));border:1px solid rgba(0,212,170,.2);border-radius:var(--br);padding:12px 14px;display:flex;align-items:center;gap:10px;cursor:pointer" onclick="FIKRA.openMusic()">
      <div style="width:38px;height:38px;border-radius:10px;background:rgba(0,212,170,.15);display:flex;align-items:center;justify-content:center;font-size:20px">🎧</div>
      <div style="flex:1"><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:12px">Alpha · Theta · Beta · Gamma</div><div style="font-size:10px;color:var(--m);margin-top:2px">O'qish uchun miya faolligini oshiradi</div></div>
      <div id="music-play-btn" style="width:34px;height:34px;background:var(--g);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;color:#000;font-weight:700;flex-shrink:0">▶</div>
    </div>
  </div>
  <div class="subpanel" id="sg-stroop"></div>
  <div class="subpanel" id="sg-res"></div>
  <div class="subpanel" id="sg-chat"></div>
  <div class="subpanel" id="sg-doc"></div>
  <div class="subpanel" id="sg-img"></div>
  <div class="subpanel" id="sg-kal"></div>
</div>`;
  }

  // ─── PROFILE PANEL ────────────────────────────────────────────────────────
  function buildProfile() {
    const nm  = _e(user?.firstName||user?.username||'Foydalanuvchi');
    const ini = (user?.firstName||'F').slice(0,2).toUpperCase();
    const p   = plan();
    const rc  = user?.rank?.current;
    const rn  = user?.rank?.next;
    const rp  = user?.rank?.percent||0;
    const ref = user?.telegramId ? `https://t.me/${window.BOT_USERNAME||'fikraai_bot'}?start=ref_${user.telegramId}` : '';
    return `<div class="panel" id="p-profile"><div style="height:5px"></div>
  <div style="display:flex;align-items:center;gap:12px;background:var(--s2);border:1px solid var(--f);border-radius:var(--br);padding:13px;margin:0 14px 9px">
    <div style="position:relative;flex-shrink:0">
      <div style="width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,var(--acc),var(--r));display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:20px">${ini}</div>
      ${rc?`<div style="position:absolute;right:-4px;bottom:-4px;width:24px;height:24px;border-radius:50%;background:${rc.color};display:flex;align-items:center;justify-content:center;font-size:13px;border:2px solid var(--bg)">${rc.emoji}</div>`:''}
    </div>
    <div style="flex:1;min-width:0">
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px">${nm}</div>
      <div style="font-size:11px;color:var(--m);margin-top:1px">@${_e(user?.username||'user')}</div>
      ${rc?`<div style="display:flex;align-items:center;gap:5px;margin-top:3px;font-size:10px;font-weight:700"><span style="color:${rc.color}">${rc.name}</span><span style="color:var(--m)">·</span><span style="color:var(--y)">${(user.xp||0).toLocaleString()} XP</span></div>`:''}
    </div>
    <button onclick="FIKRA.rankDetail()" style="width:30px;height:30px;border-radius:50%;background:var(--s3);border:1px solid var(--f);color:var(--m);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0">ℹ</button>
  </div>
  ${rc?`<div style="background:var(--s2);border:1px solid ${rc.color}33;border-radius:var(--br);padding:12px 14px;margin:0 14px 9px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:12px;color:${rc.color}">${rc.emoji} ${rc.name} · Daraja ${rc.level}</div>
      <div style="font-size:11px;color:var(--m);font-weight:700">${rp}%</div>
    </div>
    <div style="height:8px;background:var(--s3);border-radius:100px;overflow:hidden;margin-bottom:6px">
      <div style="height:100%;background:linear-gradient(90deg,${rc.color},${rn?rn.color:rc.color});width:${rp}%;border-radius:100px;box-shadow:0 0 8px ${rc.glow}"></div>
    </div>
    ${rn?`<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--m)"><span>${(user.rank.xpInLevel||0).toLocaleString()} / ${(rn.minXp-rc.minXp).toLocaleString()}</span><span>Keyingi: <span style="color:${rn.color};font-weight:700">${rn.emoji} ${rn.name}</span> · ${user.rank.xpToNext.toLocaleString()} XP</span></div>`:`<div style="font-size:10px;color:var(--y);font-weight:700;text-align:center">🏆 Eng yuqori daraja!</div>`}
  </div>`:''}
  <div class="stats-row">
    <div class="stat-card"><div class="stat-val" style="color:var(--al)">${user?.xp||0}</div><div class="stat-key">XP</div></div>
    <div class="stat-card"><div class="stat-val" style="color:var(--g)">${user?.totalGamesPlayed||0}</div><div class="stat-key">O'yin</div></div>
    <div class="stat-card"><div class="stat-val" style="color:var(--acc)">${user?.totalAiRequests||0}</div><div class="stat-key">AI</div></div>
  </div>
  <div style="background:var(--s2);border:1.5px solid ${isSub()?'rgba(0,212,170,.3)':'rgba(123,104,238,.22)'};border-radius:var(--br);padding:14px;margin:0 14px 9px;cursor:pointer" onclick="FIKRA.openSubs()">
    <div style="display:flex;align-items:center;gap:10px">
      <div style="font-size:24px">${isSub()?(p==='vip'?'💎':p==='pro'?'✨':'⭐'):'🔓'}</div>
      <div style="flex:1"><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px">${isSub()?planBadge(p)+' faol':'Bepul rejim'}</div>
      <div style="font-size:10px;color:var(--m);margin-top:2px">${isSub()&&user?.planExpiresAt?Math.max(0,Math.ceil((new Date(user.planExpiresAt)-new Date())/86400000))+' kun qoldi':'AI imkoniyatlarni ochish uchun obuna oling'}</div></div>
      <div style="font-size:10px;font-weight:700;color:var(--acc);flex-shrink:0">${isSub()?'Uzaytirish ↗':'Obuna ↗'}</div>
    </div>
    ${isSub()?'':`<div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;font-size:10px">
      <div style="background:var(--s3);border-radius:6px;padding:5px;text-align:center">⭐ Basic<br><span style="color:var(--m)">149⭐/oy</span></div>
      <div style="background:rgba(123,104,238,.1);border:1px solid rgba(123,104,238,.3);border-radius:6px;padding:5px;text-align:center">✨ Pro<br><span style="color:var(--acc)">299⭐/oy</span></div>
      <div style="background:var(--s3);border-radius:6px;padding:5px;text-align:center">💎 VIP<br><span style="color:var(--m)">499⭐/oy</span></div>
    </div>`}
  </div>
  <div style="background:var(--s2);border:1px solid rgba(0,212,170,.2);border-radius:var(--br);padding:14px;margin:0 14px 24px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <div style="font-size:20px">🎯</div>
      <div><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px">Do'stni taklif qil</div>
      <div style="font-size:10px;color:var(--m)">${_e(user?.referralCount||0)} ta do'st</div></div>
    </div>
    <div style="display:flex;align-items:center;gap:6px;background:var(--s3);border:1px solid var(--f);border-radius:var(--br2);padding:8px 10px;margin-bottom:8px">
      <input id="ref-link" value="${ref}" readonly style="flex:1;background:transparent;border:none;color:var(--txt);font-size:11px;font-family:monospace;outline:none;overflow:hidden;text-overflow:ellipsis">
      <button onclick="FIKRA.copyRef()" style="background:var(--acc);color:#fff;border:none;padding:5px 10px;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer">Nusxa</button>
    </div>
    <button onclick="FIKRA.shareRef()" style="width:100%;padding:8px;background:var(--g);color:#000;border:none;border-radius:var(--br2);font-family:'Syne',sans-serif;font-weight:700;font-size:11px;cursor:pointer">📤 Ulashish</button>
  </div>
</div>`;
  }

  // ─── NAVIGATSIYA ──────────────────────────────────────────────────────────
  function sw(name) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('p-'+name)?.classList.add('active');
    document.getElementById('ni-'+name)?.classList.add('active');
    document.getElementById('scroll').scrollTop = 0;
    activePanel = name;
    if (name==='home') loadHomeTournament();
  }

  function subpanel(panelId, subId) {
    const par = document.getElementById('p-'+panelId);
    if (!par) return;
    par.querySelectorAll('.subpanel').forEach(s => s.classList.remove('active'));
    document.getElementById(subId)?.classList.add('active');
  }

  // ─── DTM TEST ─────────────────────────────────────────────────────────────
  const FANS = { uztil:'Ona tili',math:'Matematika',tarix:'Tarix',bio:'Biologiya',
    kimyo:'Kimyo',fizika:'Fizika',ingliz:'Ingliz',rus:'Rus tili',inform:'Informatika',iqtisod:'Iqtisodiyot' };
  const DIRS = {
    iqtisodiyot:{fans:['math','ingliz']},tibbiyot:{fans:['bio','kimyo']},
    huquq:{fans:['tarix','ingliz']},it:{fans:['math','fizika']}
  };

  let ts = { q:[],idx:0,sub:'',block:'majburiy',dir:null,stats:{},type:'maj' };
  let _checked=false;

  async function startFan(subject, block) {
    haptic(); ts = {...ts,q:[],idx:0,sub:subject,block:block||'majburiy',type:'maj'};
    sw('test'); subpanel('test','st-quiz');
    document.getElementById('st-quiz').innerHTML = loading('Savollar yuklanmoqda...');
    try {
      ts.q = await API.testQuestions(subject, ts.block, 10);
      _checked=false; renderQ();
    } catch(e) { document.getElementById('st-quiz').innerHTML=`<div style="padding:30px;text-align:center;color:var(--r)">${_e(e.message)}</div>`; }
  }

  async function startDir(dir) {
    haptic();
    const d = DIRS[dir]; if (!d) return;
    ts = {...ts,dir,type:'dir',stats:{},sub:d.fans[0],block:'mutaxassislik',q:[],idx:0};
    sw('test'); subpanel('test','st-quiz');
    document.getElementById('st-quiz').innerHTML = loading('Savollar yuklanmoqda...');
    try {
      ts.q = await API.testQuestions(ts.sub,'mutaxassislik',30);
      _checked=false; renderQ();
    } catch(e) { document.getElementById('st-quiz').innerHTML=`<div style="padding:30px;text-align:center;color:var(--r)">${_e(e.message)}</div>`; }
  }

  function renderQ() {
    const q = ts.q[ts.idx]; if (!q) { finishTest(); return; }
    const ha = canAi('hints');
    document.getElementById('st-quiz').innerHTML=`
<div style="display:flex;flex-direction:column;height:100%;padding:12px 14px">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
    <button onclick="FIKRA.backTest()" style="background:var(--s2);border:1px solid var(--f);border-radius:8px;padding:6px 10px;color:var(--m);font-size:12px;cursor:pointer">← Orqaga</button>
    <div style="flex:1;text-align:center;font-size:11px;color:var(--m);font-weight:600">${FANS[ts.sub]||ts.sub} · ${ts.idx+1}/${ts.q.length}</div>
    <div style="font-size:10px;color:var(--m)" id="qlim">${aiText('hints')} 💡</div>
  </div>
  <div style="height:4px;background:var(--s3);border-radius:100px;margin-bottom:14px">
    <div style="height:100%;background:var(--acc);width:${(ts.idx/ts.q.length*100).toFixed(0)}%;border-radius:100px;transition:width .3s"></div>
  </div>
  <div style="background:var(--s2);border:1px solid var(--f);border-radius:var(--br);padding:14px;margin-bottom:12px;flex-shrink:0">
    <div style="font-size:13px;line-height:1.6;font-weight:500">${_e(q.question)}</div>
  </div>
  <div id="hint-area" style="margin-bottom:10px">
    <button id="hbtn" onclick="FIKRA.getHint()" style="width:100%;padding:8px;background:${ha?'rgba(0,212,170,.1)':'rgba(255,255,255,.03)'};border:1px solid ${ha?'rgba(0,212,170,.3)':'rgba(255,255,255,.07)'};border-radius:var(--br2);color:${ha?'var(--g)':'var(--m)'};font-size:11px;font-weight:700;cursor:pointer">
      💡 AI maslahat ${ha?'':'(limit tugadi)'}
    </button>
    <div id="htxt" style="display:none;background:rgba(0,212,170,.07);border:1px solid rgba(0,212,170,.2);border-radius:var(--br2);padding:10px;margin-top:6px;font-size:11px;line-height:1.6"></div>
  </div>
  <div style="display:flex;flex-direction:column;gap:8px" id="opts">
    ${q.options.map((o,i)=>`<button class="opt-btn" id="opt-${i}" onclick="FIKRA.pick(${i},'${q._id}')" style="padding:11px 14px;background:var(--s2);border:1.5px solid var(--f);border-radius:var(--br2);text-align:left;cursor:pointer;font-size:12px;line-height:1.45;color:var(--txt);width:100%"><span style="font-weight:700;color:var(--m);margin-right:8px">${['A','B','C','D'][i]}</span>${_e(o)}</button>`).join('')}
  </div>
</div>`;
  }

  async function pick(idx, qId) {
    if (_checked) return; _checked=true; haptic('medium');
    document.querySelectorAll('.opt-btn').forEach(b=>b.style.pointerEvents='none');
    const selBtn = document.getElementById('opt-'+idx);
    if (selBtn) selBtn.style.borderColor='var(--acc)';
    try {
      const r = await API.checkAnswer(qId, idx);
      const { isCorrect, correctIndex, explanation } = r;
      if (isCorrect) {
        selBtn.style.borderColor='var(--g)'; selBtn.style.background='rgba(0,212,170,.1)'; hapticN('success');
      } else {
        selBtn.style.borderColor='var(--r)'; selBtn.style.background='rgba(255,95,95,.08)'; hapticN('error');
        const cb = document.getElementById('opt-'+correctIndex);
        if (cb) { cb.style.borderColor='var(--g)'; cb.style.background='rgba(0,212,170,.1)'; }
        if (explanation) {
          setTimeout(()=>{
            const ht=document.getElementById('htxt');
            if (ht) { ht.textContent=explanation; ht.style.display='block'; }
          }, 400);
        }
      }
      setTimeout(()=>{
        const o=document.getElementById('opts');
        if (o) o.insertAdjacentHTML('afterend',`<div style="padding-top:10px"><button onclick="FIKRA.nextQ()" style="width:100%;padding:12px;background:var(--acc);color:#fff;border:none;border-radius:var(--br2);font-family:'Syne',sans-serif;font-weight:700;font-size:13px;cursor:pointer">${ts.idx+1>=ts.q.length?'Natijani ko\'rish':'Keyingi savol →'}</button></div>`);
      }, 600);
      const s=ts.sub; if (!ts.stats[s]) ts.stats[s]={correct:0,wrong:0,ball:0};
      if (isCorrect) { ts.stats[s].correct++; ts.stats[s].ball+=1.1; } else ts.stats[s].wrong++;
    } catch(e) { toast(e.message||'Xatolik'); }
  }

  async function getHint() {
    if (!canAi('hints')) { limitModal('hints'); return; }
    const q = ts.q[ts.idx]; if (!q) return;
    const hb = document.getElementById('hbtn');
    if (hb) { hb.textContent='💡 Yuklanmoqda...'; hb.disabled=true; }
    try {
      const r = await API.hint(q.question, q.options, FANS[ts.sub]||ts.sub, 'hint');
      const ht=document.getElementById('htxt');
      if (ht) { ht.textContent=r.hint; ht.style.display='block'; }
      if (hb) hb.style.display='none';
      if (r.used!==undefined && r.limit!==null) {
        if (user.aiUsage) user.aiUsage.hints=r.used;
        const el=document.getElementById('qlim');
        if (el) el.textContent=r.used+'/'+r.limit+' bugun 💡';
        const eld=document.getElementById('hint-limit-display');
        if (eld) eld.textContent=r.used+'/'+r.limit+' bugun';
      }
    } catch(e) {
      if (e.code==='DAILY_LIMIT_REACHED') limitModal('hints');
      else toast(e.message||'AI xatolik');
      if (hb) { hb.textContent='💡 AI maslahat'; hb.disabled=false; }
    }
  }

  function nextQ() {
    ts.idx++; _checked=false;
    if (ts.idx>=ts.q.length) finishTest(); else renderQ();
  }
  function backTest() { _checked=false; subpanel('test','st-home'); }

  async function finishTest() {
    subpanel('test','st-result');
    document.getElementById('st-result').innerHTML=loading('Natija saqlanmoqda...');
    const stats=ts.stats;
    const subs=Object.keys(stats).filter(s=>stats[s].correct+stats[s].wrong>0);
    let ball=0,maxBall=0,correct=0,total=0;
    subs.forEach(s=>{ ball+=stats[s].ball; correct+=stats[s].correct; total+=stats[s].correct+stats[s].wrong; maxBall+=(stats[s].correct+stats[s].wrong)*1.1; });
    let xp=null;
    try {
      const r=await API.testResult({gameType:ts.type==='maj'?'test-maj':'test-mut',subject:ts.sub,direction:ts.dir,ballAmount:+ball.toFixed(1),maxBall:+maxBall.toFixed(1),correctCount:correct,totalQuestions:total});
      xp=r?.xp||null;
    } catch {}
    const pct=maxBall>0?Math.round(ball/maxBall*100):0;
    const em=pct>=80?'🏆':pct>=60?'👏':pct>=40?'💪':'📖';
    document.getElementById('st-result').innerHTML=`
<div style="padding:20px 14px">
  <div style="text-align:center;margin-bottom:20px">
    <div style="font-size:48px;margin-bottom:8px">${em}</div>
    <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:28px;color:var(--acc)">${ball.toFixed(1)}</div>
    <div style="font-size:12px;color:var(--m)">ball (${pct}%)</div>
  </div>
  ${subs.map(s=>`<div style="display:flex;justify-content:space-between;align-items:center;background:var(--s2);border:1px solid var(--f);border-radius:var(--br2);padding:10px 12px;margin-bottom:6px"><div style="font-size:12px;font-weight:600">${FANS[s]||s}</div><div style="text-align:right"><div style="font-size:12px;font-weight:700;color:var(--g)">${stats[s].ball.toFixed(1)} ball</div><div style="font-size:10px;color:var(--m)">${stats[s].correct}✓ ${stats[s].wrong}✗</div></div></div>`).join('')}
  ${xp?`<div style="background:rgba(123,104,238,.1);border:1px solid rgba(123,104,238,.3);border-radius:var(--br2);padding:10px 12px;margin-top:6px;text-align:center"><div style="font-size:11px;color:var(--acc);font-weight:700">+${xp.added} XP${xp.levelUp?' · Yangi daraja! 🎉':''}</div></div>`:''}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px">
    <button onclick="FIKRA.backTest()" style="padding:12px;background:var(--s2);border:1px solid var(--f);border-radius:var(--br2);color:var(--txt);font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer">← Orqaga</button>
    <button onclick="FIKRA.startFan('${ts.sub}','${ts.block}')" style="padding:12px;background:var(--acc);color:#fff;border:none;border-radius:var(--br2);font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer">🔄 Qayta</button>
  </div>
</div>`;
    if (xp?.levelUp&&xp?.newRank) setTimeout(()=>levelUp(xp.newRank),600);
  }

  // ─── STROOP ────────────────────────────────────────────────────────────────
  let _sm=-1;
  function goStroop() { sw('gifts'); subpanel('gifts','sg-stroop'); renderStroop(); }

  function renderStroop() {
    const sub=document.getElementById('sg-stroop'); if (!sub) return;
    sub.innerHTML=`
<div style="padding:14px">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
    <button onclick="FIKRA.backGifts()" style="background:var(--s2);border:1px solid var(--f);border-radius:8px;padding:6px 10px;color:var(--m);font-size:12px;cursor:pointer">← Orqaga</button>
    <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:16px">🧠 Stroop Brain</div>
  </div>
  <div style="font-size:11px;color:var(--m);margin-bottom:16px;text-align:center">Miya tezligini sinang!</div>
  <div style="display:flex;gap:8px">
    <div class="mode-btn" id="mb-0" onclick="FIKRA.setSm(0)"><div style="font-size:18px;margin-bottom:4px">🎨</div><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:12px">Rang</div><div style="font-size:10px;color:var(--m);margin-top:2px">To'g'ri rangni tanla</div></div>
    <div class="mode-btn" id="mb-1" onclick="FIKRA.setSm(1)"><div style="font-size:18px;margin-bottom:4px">✅</div><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:12px">Ha/Yo'q</div><div style="font-size:10px;color:var(--m);margin-top:2px">Mos kelishini tekshir</div></div>
  </div>
  <button id="sb-start" disabled onclick="FIKRA.doStroop()" style="width:100%;margin-top:14px;padding:14px;background:var(--s3);color:var(--m);border:1px solid var(--f);border-radius:var(--br2);font-family:'Syne',sans-serif;font-weight:700;font-size:14px;cursor:not-allowed">Rejim tanlang</button>
</div>`;
  }

  function setSm(m) {
    _sm=m;
    document.querySelectorAll('.mode-btn').forEach((b,i)=>b.classList.toggle('active',i===m));
    const btn=document.getElementById('sb-start');
    if (btn) { btn.disabled=false; btn.style.background='var(--acc)'; btn.style.color='#fff'; btn.style.borderColor='var(--acc)'; btn.style.cursor='pointer'; btn.textContent="O'yinni boshlash"; }
    haptic('light');
  }

  function doStroop() {
    if (_sm<0) return; haptic('medium');
    const sub=document.getElementById('sg-stroop'); if (!sub) return;
    const isColor=_sm===0;
    sub.innerHTML=`
<div style="display:flex;flex-direction:column;align-items:center;padding:20px 14px;height:100%">
  <div style="display:flex;justify-content:space-between;width:100%;margin-bottom:20px">
    <div><div class="stimer" id="s-timer">15</div><div style="font-size:10px;color:var(--m)">sekund</div></div>
    <div style="text-align:center"><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:20px;color:var(--acc)" id="s-score">0 ball</div></div>
    <div style="display:flex;gap:5px;align-items:center" id="s-hearts"><span class="heart">❤️</span><span class="heart">❤️</span><span class="heart">❤️</span></div>
  </div>
  <div style="width:100%;height:4px;background:var(--s3);border-radius:100px;margin-bottom:28px"><div id="s-prog" style="height:100%;background:var(--acc);width:100%;border-radius:100px;transition:width .2s linear"></div></div>
  ${isColor?`<div id="s-word" style="font-size:42px;font-weight:800;letter-spacing:4px;margin-bottom:32px;font-family:'Syne',sans-serif;min-height:60px;display:flex;align-items:center;justify-content:center">...</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%">
    <button class="stroop-ans" id="sa0" onclick="FIKRA._sa(this)" style="padding:14px;border-radius:var(--br2);border:1.5px solid var(--f);background:var(--s2);font-size:13px;font-weight:700;cursor:pointer;color:var(--txt)">...</button>
    <button class="stroop-ans" id="sa1" onclick="FIKRA._sa(this)" style="padding:14px;border-radius:var(--br2);border:1.5px solid var(--f);background:var(--s2);font-size:13px;font-weight:700;cursor:pointer;color:var(--txt)">...</button>
    <button class="stroop-ans" id="sa2" onclick="FIKRA._sa(this)" style="padding:14px;border-radius:var(--br2);border:1.5px solid var(--f);background:var(--s2);font-size:13px;font-weight:700;cursor:pointer;color:var(--txt)">...</button>
    <button class="stroop-ans" id="sa3" onclick="FIKRA._sa(this)" style="padding:14px;border-radius:var(--br2);border:1.5px solid var(--f);background:var(--s2);font-size:13px;font-weight:700;cursor:pointer;color:var(--txt)">...</button>
  </div>`:`<div id="s-tfc" style="width:120px;height:120px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:4px solid var(--f);margin-bottom:28px"><div style="font-size:32px;font-weight:800;font-family:'Syne',sans-serif" id="s-tfw">...</div></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%">
    <button onclick="FIKRA._tf(true)" style="padding:16px;border-radius:var(--br2);background:rgba(0,212,170,.15);border:1.5px solid rgba(0,212,170,.4);font-size:14px;font-weight:800;cursor:pointer;color:var(--g);font-family:'Syne',sans-serif">✅ Ha</button>
    <button onclick="FIKRA._tf(false)" style="padding:16px;border-radius:var(--br2);background:rgba(255,95,95,.12);border:1.5px solid rgba(255,95,95,.35);font-size:14px;font-weight:800;cursor:pointer;color:var(--r);font-family:'Syne',sans-serif">❌ Yo'q</button>
  </div>`}
</div>`;
    const els = {
      scoreEl:document.getElementById('s-score'), timerEl:document.getElementById('s-timer'),
      prog:document.getElementById('s-prog'), hearts:Array.from(document.querySelectorAll('.heart')),
      ...(isColor?{word:document.getElementById('s-word'),answerBtns:[0,1,2,3].map(i=>document.getElementById('sa'+i))}
        :{tfCircle:document.getElementById('s-tfc'),tfWord:document.getElementById('s-tfw')}),
    };
    if (window.STROOP) { STROOP.init(els); STROOP.start(_sm); }
  }

  function _sa(btn) { if (window.STROOP) STROOP.answerColor(btn); }
  function _tf(v)   { if (window.STROOP) STROOP.answerTF(v); }

  function showStroopResult(r) {
    const sub=document.getElementById('sg-stroop'); if (!sub) return;
    sub.innerHTML=`
<div style="padding:20px 14px;text-align:center">
  <div style="font-size:48px;margin-bottom:8px">${r.isNewBest?'🏆':r.score>100?'🎉':'🎮'}</div>
  <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:32px;color:var(--acc)">${r.score}</div>
  <div style="font-size:12px;color:var(--m);margin-bottom:4px">ball</div>
  ${r.isNewBest?'<div style="font-size:11px;color:var(--y);font-weight:700;margin-bottom:12px">🏆 Yangi rekord!</div>':`<div style="font-size:11px;color:var(--m);margin-bottom:12px">Rekord: ${r.bestScore}</div>`}
  <div style="display:flex;justify-content:center;gap:20px;margin-bottom:16px">
    <div><div style="font-size:18px;font-weight:800;color:var(--g)">${r.correctCount}</div><div style="font-size:10px;color:var(--m)">To'g'ri</div></div>
    <div><div style="font-size:18px;font-weight:800;color:var(--r)">${r.wrongCount}</div><div style="font-size:10px;color:var(--m)">Xato</div></div>
    <div><div style="font-size:18px;font-weight:800;color:var(--y)">${r.durationSec}s</div><div style="font-size:10px;color:var(--m)">Vaqt</div></div>
  </div>
  ${r.xp?`<div style="background:rgba(123,104,238,.1);border:1px solid rgba(123,104,238,.2);border-radius:var(--br2);padding:8px;margin-bottom:14px;font-size:11px;color:var(--acc);font-weight:700">+${r.xp.added} XP${r.xp.levelUp?' · Yangi daraja! 🎉':''}</div>`:''}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
    <button onclick="FIKRA.backGifts()" style="padding:12px;background:var(--s2);border:1px solid var(--f);border-radius:var(--br2);color:var(--txt);font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer">← Orqaga</button>
    <button onclick="FIKRA.goStroop()" style="padding:12px;background:var(--acc);color:#fff;border:none;border-radius:var(--br2);font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer">🔄 Qayta</button>
  </div>
</div>`;
    if (r.xp?.levelUp) setTimeout(()=>levelUp(r.xp.newRank),500);
  }

  function backGifts() { if(window.STROOP)STROOP.stop(); subpanel('gifts','sg-home'); }

  // ─── AI CHAT ──────────────────────────────────────────────────────────────
  function goAIChat() { if (!canAi('chats')) { limitModal('chats'); return; } sw('gifts'); subpanel('gifts','sg-chat'); renderChat(); }
  function goAIDoc()  { if (!canAi('docs'))  { limitModal('docs');  return; } sw('gifts'); subpanel('gifts','sg-doc');  renderDoc();  }
  function goAIImage(){ if (!canAi('images')){ limitModal('images');return; } sw('gifts'); subpanel('gifts','sg-img');  renderImg();  }
  function goKal()    { if (!canAi('calories')){ limitModal('calories');return; } sw('gifts'); subpanel('gifts','sg-kal'); renderKal(); }

  function renderChat() {
    if (window.CHAT) CHAT.loadFromLocal('general');
    const sub=document.getElementById('sg-chat'); if (!sub) return;
    sub.innerHTML=`
<div style="display:flex;flex-direction:column;height:100%">
  <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--f);flex-shrink:0">
    <button onclick="FIKRA.backGiftsAI()" style="background:var(--s2);border:1px solid var(--f);border-radius:8px;padding:6px 10px;color:var(--m);font-size:12px;cursor:pointer">←</button>
    <div style="flex:1;font-family:'Syne',sans-serif;font-weight:700;font-size:14px">💬 AI Chat</div>
    <div style="font-size:10px;color:var(--m)">${aiText('chats')}</div>
    <button onclick="FIKRA.newChat()" style="background:var(--s2);border:1px solid var(--f);border-radius:8px;padding:5px 8px;color:var(--m);font-size:11px;cursor:pointer;font-weight:600">Yangi</button>
  </div>
  <div id="chat-msgs" style="flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:8px">${chatHTML()}</div>
  <div style="padding:10px 14px;border-top:1px solid var(--f);flex-shrink:0">
    <div style="display:flex;gap:7px;align-items:flex-end">
      <textarea id="cinp" placeholder="Savol yozing..." rows="1" oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,100)+'px'" style="flex:1;background:var(--s2);border:1px solid var(--f);border-radius:var(--br2);padding:9px 11px;color:var(--txt);font-size:12px;resize:none;outline:none;font-family:'Nunito',sans-serif;max-height:100px"></textarea>
      <button onclick="FIKRA.sendChat()" style="width:38px;height:38px;background:var(--acc);border:none;border-radius:50%;color:#fff;font-size:16px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center">↑</button>
    </div>
  </div>
</div>`;
  }

  function chatHTML() {
    const hist=window.CHAT?CHAT.getHistory():[];
    if (!hist.length) return `<div style="text-align:center;color:var(--m);font-size:12px;padding:20px">Savol bering...</div>`;
    return hist.map(m=>m.role==='user'
      ?`<div class="msg-me"><div class="msg-av-u">👤</div><div class="bbl-me">${_e(m.content)}</div></div>`
      :`<div class="msg-ai"><div class="msg-av-ai">🤖</div><div class="bbl-ai">${_e(m.content)}</div></div>`
    ).join('');
  }

  function newChat() { if(window.CHAT)CHAT.startNew(); renderChat(); }
  function backGiftsAI() { subpanel('gifts','sg-home'); }

  async function sendChat() {
    const inp=document.getElementById('cinp'); const msg=inp?.value?.trim(); if (!msg) return;
    if (window.CHAT) { const c=CHAT.canSend(); if(!c.ok){toast(c.reason);return;} const v=CHAT.validateMessage(msg); if(!v.ok){toast(v.reason);return;} }
    inp.value=''; inp.style.height='auto';
    if (window.CHAT) { CHAT.addMessage('user',msg); CHAT.markSent(); }
    const msgs=document.getElementById('chat-msgs');
    if (msgs) {
      msgs.innerHTML=chatHTML();
      const tp=document.createElement('div'); tp.className='msg-ai'; tp.id='typing';
      tp.innerHTML='<div class="msg-av-ai">🤖</div><div class="bbl-ai" style="color:var(--m)">...</div>';
      msgs.appendChild(tp); msgs.scrollTop=msgs.scrollHeight;
    }
    try {
      let full=''; const tp=document.getElementById('typing'); const bbl=tp?.querySelector('.bbl-ai');
      await API.chat(msg, window.CHAT?CHAT.getContext().slice(-10).map(m=>({role:m.role,content:m.content})):[],
        chunk=>{ full+=chunk; if(bbl)bbl.textContent=full; if(msgs)msgs.scrollTop=msgs.scrollHeight; },
        ()=>{ if(window.CHAT)CHAT.addMessage('assistant',full); if(msgs){msgs.innerHTML=chatHTML();msgs.scrollTop=msgs.scrollHeight;} if(user.aiUsage)user.aiUsage.chats=(user.aiUsage.chats||0)+1; }
      );
    } catch(e) {
      document.getElementById('typing')?.remove();
      if(e.code==='DAILY_LIMIT_REACHED') limitModal('chats'); else toast(e.message||'Chat xatosi');
    }
  }

  // ─── AI DOC ───────────────────────────────────────────────────────────────
  let _fmt='DOCX';
  function renderDoc() {
    if (window.DOC) DOC.loadHistory(); _fmt=window.DOC?DOC.getFormat():'DOCX';
    const sub=document.getElementById('sg-doc'); if (!sub) return;
    sub.innerHTML=`
<div style="display:flex;flex-direction:column;height:100%">
  <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--f);flex-shrink:0">
    <button onclick="FIKRA.backGiftsAI()" style="background:var(--s2);border:1px solid var(--f);border-radius:8px;padding:6px 10px;color:var(--m);font-size:12px;cursor:pointer">←</button>
    <div style="flex:1;font-family:'Syne',sans-serif;font-weight:700;font-size:14px">📄 Hujjat</div>
    <div style="font-size:10px;color:var(--m)">${aiText('docs')}</div>
  </div>
  <div style="padding:8px 14px;border-bottom:1px solid var(--f);flex-shrink:0;display:flex;gap:6px">
    ${['DOCX','PDF','PPTX'].map(f=>`<button class="fmt-btn ${f===_fmt?'active':''}" onclick="FIKRA.setFmt('${f}',this)">${f}</button>`).join('')}
  </div>
  <div id="doc-msgs" style="flex:1;overflow-y:auto;padding:12px 14px"></div>
  <div style="padding:10px 14px;border-top:1px solid var(--f);flex-shrink:0;display:flex;gap:7px;align-items:flex-end">
    <textarea id="dinp" placeholder="Hujjat mavzusini yozing..." rows="2" style="flex:1;background:var(--s2);border:1px solid var(--f);border-radius:var(--br2);padding:9px 11px;color:var(--txt);font-size:12px;resize:none;outline:none;font-family:'Nunito',sans-serif"></textarea>
    <button onclick="FIKRA.sendDoc()" style="width:38px;height:38px;background:var(--acc);border:none;border-radius:50%;color:#fff;font-size:16px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center">↑</button>
  </div>
</div>`;
  }

  function setFmt(f,btn) { _fmt=f; if(window.DOC)DOC.setFormat(f); document.querySelectorAll('.fmt-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); }

  async function sendDoc() {
    const inp=document.getElementById('dinp'); const prompt=inp?.value?.trim(); if (!prompt) return;
    inp.value='';
    const msgs=document.getElementById('doc-msgs');
    if (msgs) msgs.innerHTML=`<div style="padding:20px;text-align:center;color:var(--m)">🤖 Hujjat yaratilmoqda...</div>`;
    try {
      const hist=window.DOC?DOC.getHistory().slice(-6).map(m=>({role:m.role,content:m.content})):[];
      if (window.DOC) DOC.addMessage('user',prompt);
      const res=await API.document(prompt,_fmt,hist);
      if (window.DOC) DOC.addMessage('assistant',res.preview||'');
      if (msgs) msgs.innerHTML=`<div style="padding:14px"><div style="background:rgba(0,212,170,.08);border:1px solid rgba(0,212,170,.2);border-radius:var(--br2);padding:12px"><div style="font-weight:700;font-size:12px;margin-bottom:4px">✅ ${_e(res.fileName)} (${res.sizeKb} KB)</div><div style="font-size:11px;color:var(--m);margin-bottom:8px">${_e((res.preview||'').slice(0,120))}...</div><button onclick="FIKRA._dlDoc(this,'${res.mimeType}','${_e(res.fileName)}')" data-b64="${res.base64||''}" style="padding:7px 14px;background:var(--g);color:#000;border:none;border-radius:var(--br2);font-weight:700;font-size:11px;cursor:pointer">⬇ Yuklab olish</button></div></div>`;
      if (user.aiUsage) user.aiUsage.docs=(user.aiUsage.docs||0)+1;
    } catch(e) {
      if (msgs) msgs.innerHTML=`<div style="padding:20px;text-align:center;color:var(--r)">${_e(e.message)}</div>`;
    }
  }

  function _dlDoc(btn,mime,name) {
    try {
      const b64=btn.dataset.b64; const bin=atob(b64); const arr=new Uint8Array(bin.length);
      for (let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
      const blob=new Blob([arr],{type:mime}); const url=URL.createObjectURL(blob);
      const a=document.createElement('a'); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url);
    } catch { toast('Yuklab olishda xatolik'); }
  }

  // ─── AI IMAGE ─────────────────────────────────────────────────────────────
  function renderImg() {
    const sub=document.getElementById('sg-img'); if (!sub) return;
    const saved=window.IMG?IMG.loadHistory():[];
    sub.innerHTML=`
<div style="display:flex;flex-direction:column;height:100%">
  <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--f);flex-shrink:0">
    <button onclick="FIKRA.backGiftsAI()" style="background:var(--s2);border:1px solid var(--f);border-radius:8px;padding:6px 10px;color:var(--m);font-size:12px;cursor:pointer">←</button>
    <div style="flex:1;font-family:'Syne',sans-serif;font-weight:700;font-size:14px">🎨 Rasm yaratish</div>
    <div style="font-size:10px;color:var(--m)">${aiText('images')}</div>
  </div>
  <div id="img-res" style="flex:1;overflow-y:auto;padding:12px 14px">${saved.length?`<img src="data:${saved[0].mimeType};base64,${saved[0].base64}" style="width:100%;border-radius:var(--br)">`:''}</div>
  <div style="padding:10px 14px;border-top:1px solid var(--f);flex-shrink:0;display:flex;gap:7px">
    <input id="iinp" placeholder="Rasm tavsifi..." style="flex:1;background:var(--s2);border:1px solid var(--f);border-radius:var(--br2);padding:9px 11px;color:var(--txt);font-size:12px;outline:none">
    <button onclick="FIKRA.genImg()" style="padding:9px 14px;background:var(--acc);border:none;border-radius:var(--br2);color:#fff;font-weight:700;font-size:12px;cursor:pointer">Yaratish</button>
  </div>
</div>`;
  }

  async function genImg() {
    const inp=document.getElementById('iinp'); const p=inp?.value?.trim(); if (!p||p.length<3){toast('Kamida 3 ta belgi');return;} inp.value='';
    const res=document.getElementById('img-res');
    if (res) res.innerHTML=`<div style="text-align:center;padding:30px;color:var(--m)">🎨 Yaratilmoqda...</div>`;
    try {
      const d=window.IMG?await IMG.generate(p):await API.image(p);
      if (res) res.innerHTML=`<img src="data:${d.mimeType};base64,${d.base64}" style="width:100%;border-radius:var(--br)">`;
      if (user.aiUsage) user.aiUsage.images=(user.aiUsage.images||0)+1;
    } catch(e) {
      if (e.code==='DAILY_LIMIT_REACHED') limitModal('images');
      else if (res) res.innerHTML=`<div style="padding:20px;text-align:center;color:var(--r)">${_e(e.message)}</div>`;
    }
  }

  // ─── KALORIYA ─────────────────────────────────────────────────────────────
  function renderKal() {
    const sub=document.getElementById('sg-kal'); if (!sub) return;
    sub.innerHTML=`
<div style="padding:14px">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
    <button onclick="FIKRA.backGiftsAI()" style="background:var(--s2);border:1px solid var(--f);border-radius:8px;padding:6px 10px;color:var(--m);font-size:12px;cursor:pointer">←</button>
    <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:14px">🥗 Kaloriya AI</div>
    <div style="font-size:10px;color:var(--m);margin-left:auto">${aiText('calories')}</div>
  </div>
  <div id="kal-res"></div>
  <label style="display:flex;flex-direction:column;align-items:center;gap:10px;background:var(--s2);border:2px dashed var(--f);border-radius:var(--br);padding:24px;cursor:pointer">
    <div style="font-size:36px">📷</div><div style="font-size:12px;color:var(--m);text-align:center">Ovqat rasmini yuklang<br>AI kaloriyani hisoblab beradi</div>
    <input type="file" accept="image/*" onchange="FIKRA.doScan(this.files[0])" style="display:none">
  </label>
</div>`;
  }

  async function doScan(file) {
    if (!file) return;
    const res=document.getElementById('kal-res');
    if (res) res.innerHTML=`<div style="padding:12px;text-align:center;color:var(--m)">🔍 Tahlil qilinmoqda...</div>`;
    try {
      const d=window.CALORIE?await CALORIE.scanFile(file):await API.calorie(file);
      if (res) res.innerHTML=`<div style="background:rgba(0,212,170,.08);border:1px solid rgba(0,212,170,.2);border-radius:var(--br);padding:14px;margin-bottom:14px"><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;margin-bottom:8px">${_e(d.foodName||'Ovqat')}</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:8px"><div style="text-align:center"><div style="font-size:16px;font-weight:800;color:var(--y)">${d.calories}</div><div style="font-size:9px;color:var(--m)">kcal</div></div><div style="text-align:center"><div style="font-size:16px;font-weight:800;color:var(--g)">${d.protein}g</div><div style="font-size:9px;color:var(--m)">Oqsil</div></div><div style="text-align:center"><div style="font-size:16px;font-weight:800;color:var(--r)">${d.fat}g</div><div style="font-size:9px;color:var(--m)">Yog'</div></div><div style="text-align:center"><div style="font-size:16px;font-weight:800;color:var(--acc)">${d.carbs}g</div><div style="font-size:9px;color:var(--m)">Uglerod</div></div></div><div style="font-size:11px;color:var(--m);line-height:1.5">${_e(d.tips||'')}</div></div>`;
      if (user.aiUsage) user.aiUsage.calories=(user.aiUsage.calories||0)+1;
    } catch(e) {
      if (e.code==='DAILY_LIMIT_REACHED') limitModal('calories');
      else if (res) res.innerHTML=`<div style="padding:12px;text-align:center;color:var(--r)">${_e(e.message)}</div>`;
    }
  }

  // ─── OBUNA MODALI ─────────────────────────────────────────────────────────
  async function openSubs() {
    haptic('light'); let plans=[];
    try { plans=await API.plans(); } catch {}
    const tc={basic:'var(--y)',pro:'var(--acc)',vip:'var(--g)'};
    const te={basic:'⭐',pro:'✨',vip:'💎'};
    uiOverlay(`
<div style="width:100%;max-width:480px;margin:0 auto;background:var(--s1);border-radius:20px 20px 0 0;max-height:85vh;overflow-y:auto">
  <div style="padding:16px 14px;border-bottom:1px solid var(--f);display:flex;align-items:center;justify-content:space-between">
    <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:18px">⭐ Obuna rejalari</div>
    <button onclick="this.closest('.ov').remove()" style="width:30px;height:30px;border-radius:50%;background:var(--s2);border:1px solid var(--f);color:var(--m);cursor:pointer;font-size:16px">×</button>
  </div>
  <div style="padding:14px">
    <div style="font-size:11px;color:var(--m);margin-bottom:12px">Telegram Stars orqali to'g'ridan-to'g'ri. Darhol faollanadi.</div>
    ${plans.map(p=>`
    <div style="background:var(--s2);border:1.5px solid ${p.tier==='pro'?'var(--acc)':'var(--f)'};border-radius:var(--br);padding:14px;margin-bottom:10px;cursor:pointer;position:relative" onclick="FIKRA._buyPlan('${p.id}')">
      ${p.badge?`<div style="position:absolute;top:-8px;right:12px;background:${tc[p.tier]};color:#000;font-size:9px;font-weight:800;padding:2px 8px;border-radius:100px">${p.badge}</div>`:''}
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:6px"><span style="font-size:18px">${te[p.tier]}</span><span style="font-family:'Syne',sans-serif;font-weight:800;font-size:15px;color:${tc[p.tier]}">${p.name}</span><span style="font-size:11px;color:var(--m)">${p.period}</span></div>
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:15px">${p.priceStars}⭐</div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">${p.features.map(f=>`<div style="font-size:10px;color:var(--m);background:var(--s3);border-radius:6px;padding:3px 7px">${_e(f)}</div>`).join('')}</div>
    </div>`).join('')}
    <div style="font-size:10px;color:var(--m);text-align:center;padding:4px 0 8px">Telegram Stars to'lovlari qaytarilmaydi</div>
  </div>
</div>`);
  }

  async function _buyPlan(planId) {
    if (!user||user._demo) { toast('Telegram ichida kiring'); return; }
    haptic('medium');
    try {
      const res=await API.createInvoice(planId);
      if (res?.invoiceUrl&&tg) {
        tg.openInvoice(res.invoiceUrl, async (status) => {
          if (status==='paid') {
            toast('✅ Obuna faollashtirildi!');
            document.querySelector('.ov')?.remove();
            setTimeout(async()=>{ const me=await API.me().catch(()=>null); if(me){user=me;_syncUser();} }, 1500);
          } else if (status==='cancelled') toast("To'lov bekor qilindi");
        });
      } else toast('Invoice yaratilmadi');
    } catch(e) { toast(e.message||'Xatolik'); }
  }

  // ─── LEADERBOARD ──────────────────────────────────────────────────────────
  async function loadLB() {
    try {
      const data=await API.leaderboard('xp','week');
      const el=document.getElementById('lb-rows'); if (!el) return;
      if (!data?.length) { el.innerHTML=`<div style="padding:12px 14px;font-size:12px;color:var(--m)">Hali yozuvlar yo'q</div>`; return; }
      const myTid=user?.telegramId;
      el.innerHTML=data.slice(0,10).map((r,i)=>`
        <div style="display:flex;align-items:center;gap:10px;padding:9px 14px;${String(r.telegramId)===String(myTid)?'background:rgba(123,104,238,.07);':''}${i<9?'border-bottom:1px solid var(--f)':''}">
          <div style="width:22px;text-align:center;font-size:11px;font-weight:700;color:${i<3?'var(--y)':'var(--m)'}">${i===0?'🥇':i===1?'🥈':i===2?'🥉':r.rank}</div>
          <div style="flex:1;font-size:12px;font-weight:${String(r.telegramId)===String(myTid)?'700':'500'}">${_e(r.username||'Anonim')}</div>
          <div style="font-size:11px;font-weight:700;color:var(--y)">${(r.score||0).toLocaleString()} XP</div>
        </div>`).join('');
    } catch {}
  }

  let _lbt=null;
  function startLB() { loadLB(); _lbt=setInterval(loadLB,15000); }
  function stopLB()  { clearInterval(_lbt); }

  // ─── TURNIR ───────────────────────────────────────────────────────────────
  async function loadHomeTournament() {
    try {
      const d=await API.weeklyTournament(); if (!d?.tournament) return;
      const t=d.tournament; const now=new Date(); const end=new Date(t.endAt);
      const diff=end-now; let ts='';
      if (diff>0) { const d2=Math.floor(diff/86400000); const h=Math.floor((diff%86400000)/3600000); ts=d2>0?`${d2} kun ${h}s`:`${h} soat`; }
      const label=document.getElementById('tourn-label'); const title=document.getElementById('tourn-title'); const sub=document.getElementById('tourn-sub');
      if (label) label.textContent=`Haftalik turnir · ${d.tournament.totalParticipants||0} ishtirokchi · ${ts} qoldi`;
      if (title) title.textContent=t.title||'Haftalik XP turniri';
      if (sub)   sub.textContent="Eng ko'p XP to'plagan g'olib bo'ladi";
    } catch {}
  }

  async function openTournament() {
    haptic('light'); let d=null;
    try { d=await API.weeklyTournament(); } catch {}
    if (!d) { toast("Turnir ma'lumotlari yuklanmadi"); return; }
    const ranking=d.ranking||[]; const myTid=user?.telegramId;
    uiOverlay(`
<div style="width:100%;max-width:480px;margin:0 auto;background:var(--s1);border-radius:20px 20px 0 0;max-height:80vh;overflow-y:auto">
  <div style="padding:16px 14px;border-bottom:1px solid var(--f);display:flex;align-items:center;justify-content:space-between">
    <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:16px">🏆 ${_e(d.tournament?.title||'Turnir')}</div>
    <button onclick="this.closest('.ov').remove()" style="width:28px;height:28px;border-radius:50%;background:var(--s2);border:1px solid var(--f);color:var(--m);cursor:pointer;font-size:15px">×</button>
  </div>
  <div style="padding:10px 14px">
    ${ranking.length?ranking.map((r,i)=>`
      <div style="display:flex;align-items:center;gap:10px;padding:9px 0;${i<ranking.length-1?'border-bottom:1px solid var(--f)':''}${String(r.telegramId)===String(myTid)?';background:rgba(123,104,238,.07);padding:9px 10px;border-radius:var(--br2);margin:2px -10px':''}">
        <div style="width:24px;text-align:center;font-weight:700;font-size:12px;color:${i<3?'var(--y)':'var(--m)'}">${i===0?'🥇':i===1?'🥈':i===2?'🥉':r.rank}</div>
        <div style="flex:1;font-size:12px;font-weight:${String(r.telegramId)===String(myTid)?'700':'500'}">${_e(r.username||'Anonim')}</div>
        <div style="font-size:11px;font-weight:700;color:var(--y)">${(r.score||0).toLocaleString()} XP</div>
        ${r.prize?.vipDays>0?`<div style="font-size:10px;color:var(--g)">${r.prize.vipDays}d VIP</div>`:''}
      </div>`).join(''):`<div style="padding:20px;text-align:center;color:var(--m);font-size:12px">Hali ishtirokchilar yo'q</div>`}
  </div>
</div>`);
  }

  // ─── RANK ─────────────────────────────────────────────────────────────────
  async function rankDetail() {
    haptic('light'); let allRanks=[],prog=null;
    try { const r=await API.rankInfo(); allRanks=r.allRanks||[]; prog=r.progress||null; } catch {}
    uiOverlay(`
<div style="width:100%;max-width:480px;margin:0 auto;background:var(--s1);border-radius:20px 20px 0 0;max-height:80vh;overflow-y:auto">
  <div style="padding:16px 14px;border-bottom:1px solid var(--f);display:flex;align-items:center;justify-content:space-between">
    <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:16px">🏅 Lavozimlar</div>
    <button onclick="this.closest('.ov').remove()" style="width:28px;height:28px;border-radius:50%;background:var(--s2);border:1px solid var(--f);color:var(--m);cursor:pointer;font-size:15px">×</button>
  </div>
  <div style="padding:12px 14px">
    ${allRanks.map(r=>{ const isA=prog?.current?.id===r.id; return `<div style="display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:var(--br2);margin-bottom:4px;${isA?`background:${r.color}18;border:1px solid ${r.color}44`:'border:1px solid transparent'}"><div style="width:32px;height:32px;border-radius:50%;background:${r.color}22;display:flex;align-items:center;justify-content:center;font-size:16px">${r.emoji}</div><div style="flex:1"><div style="font-family:'Syne',sans-serif;font-weight:700;font-size:12px;color:${r.color}">${_e(r.name)}</div><div style="font-size:10px;color:var(--m)">${r.minXp.toLocaleString()} XP</div></div>${isA?`<div style="font-size:10px;font-weight:700;color:${r.color}">Hozir ✓</div>`:''}</div>`; }).join('')}
  </div>
</div>`);
  }

  function levelUp(rank) {
    if (!rank) return;
    const el=document.createElement('div');
    el.style.cssText='position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.85);backdrop-filter:blur(8px)';
    el.innerHTML=`<div style="text-align:center;padding:32px 24px;animation:luA .4s ease"><div style="font-size:64px;margin-bottom:8px">${rank.emoji}</div><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:24px;color:${rank.color};margin-bottom:8px">Yangi daraja!</div><div style="font-size:18px;font-weight:700;margin-bottom:16px">${_e(rank.name)}</div><button onclick="this.closest('div[style]').remove()" style="padding:12px 28px;background:${rank.color};color:#000;border:none;border-radius:100px;font-family:'Syne',sans-serif;font-weight:700;cursor:pointer">🎉 Zo'r!</button></div>`;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),4000);
  }

  function xpGain(xp,lu) {
    const el=document.createElement('div');
    el.style.cssText='position:fixed;bottom:80px;right:16px;background:rgba(123,104,238,.9);color:#fff;padding:6px 14px;border-radius:100px;font-size:11px;font-weight:700;z-index:9999;pointer-events:none;animation:fuA .3s ease';
    el.textContent=`+${xp} XP${lu?' 🎉':''}`;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),2500);
  }

  // ─── MUSIQA ───────────────────────────────────────────────────────────────
  async function openMusic() {
    haptic('light'); let tracks=[];
    try { const r=await API.music(); tracks=r.tracks||[]; } catch {}
    if (window.MUSIC&&tracks.length) MUSIC.setPlaylist(tracks.filter(t=>!t.isLocked));
    uiOverlay(`
<div style="width:100%;max-width:480px;margin:0 auto;background:var(--s1);border-radius:20px 20px 0 0;max-height:75vh;overflow-y:auto">
  <div style="padding:16px 14px;border-bottom:1px solid var(--f);display:flex;align-items:center;justify-content:space-between">
    <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:16px">🎵 Binaural musiqa</div>
    <button onclick="this.closest('.ov').remove()" style="width:28px;height:28px;border-radius:50%;background:var(--s2);border:1px solid var(--f);color:var(--m);cursor:pointer;font-size:15px">×</button>
  </div>
  <div style="padding:12px 14px">
    ${tracks.map(t=>`<div style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:var(--br2);margin-bottom:6px;background:var(--s2);border:1px solid ${t.isLocked?'var(--f)':'rgba(0,212,170,.15)'};cursor:${t.isLocked?'default':'pointer'};opacity:${t.isLocked?.6:1}" ${!t.isLocked?`onclick="FIKRA.playTrack('${t.id}')"`:''}><div style="width:36px;height:36px;border-radius:10px;background:rgba(0,212,170,.12);display:flex;align-items:center;justify-content:center;font-size:18px">${t.coverEmoji||'🎵'}</div><div style="flex:1"><div style="font-size:12px;font-weight:700">${_e(t.title)}</div><div style="font-size:10px;color:var(--m)">${_e(t.description||'')}</div></div>${t.isLocked?`<div style="font-size:10px;color:var(--acc);font-weight:700">${t.tier.toUpperCase()}</div>`:`<button style="width:32px;height:32px;border-radius:50%;background:var(--g);border:none;color:#000;font-size:12px;cursor:pointer;font-weight:700">▶</button>`}</div>`).join('')}
  </div>
</div>`);
  }

  async function playTrack(trackId) {
    try {
      const r=await API.music(); const t=(r.tracks||[]).find(t=>t.id===trackId); if (!t) return;
      if (window.MUSIC) { await MUSIC.play(t); toast('▶ '+t.title); const b=document.getElementById('music-play-btn'); if(b)b.textContent='❚❚'; }
    } catch(e) { toast(e.message); }
  }

  // ─── YANGI O'YINLAR ────────────────────────────────────────────────────────
  async function openNG(gameType) {
    haptic('light');
    if (gameType==='football') {
      const inv=await API.inventory('football').catch(()=>null);
      if (!inv?.items?.length) { _fbClubs(); return; }
    }
    const inv=await API.inventory(gameType).catch(()=>({items:[]}));
    _ngModal(gameType,inv?.items||[]);
  }

  async function _fbClubs() {
    const cat=await API.newGamesCatalog().catch(()=>({})); const clubs=cat?.clubs||[];
    uiOverlay(`
<div style="width:100%;max-width:480px;margin:0 auto;background:var(--s1);border-radius:20px 20px 0 0;max-height:80vh;overflow-y:auto">
  <div style="padding:16px 14px;border-bottom:1px solid var(--f);display:flex;align-items:center;justify-content:space-between">
    <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:16px">⚽ Klub tanlang</div>
    <button onclick="this.closest('.ov').remove()" style="width:28px;height:28px;border-radius:50%;background:var(--s2);border:1px solid var(--f);color:var(--m);cursor:pointer;font-size:15px">×</button>
  </div>
  <div style="padding:12px 14px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
    ${clubs.map(c=>`<button onclick="FIKRA._fbStart('${c.id}')" style="padding:12px;background:var(--s2);border:1.5px solid var(--f);border-radius:var(--br2);cursor:pointer;text-align:center;font-size:11px;font-weight:700;color:var(--txt)"><div style="font-size:20px;margin-bottom:4px">${c.emoji||'⚽'}</div>${_e(c.name)}</button>`).join('')}
  </div>
</div>`);
  }

  async function _fbStart(clubId) {
    try { await API.footballStart(clubId); document.querySelector('.ov')?.remove(); toast('Jamoa tuzildi!'); const inv=await API.inventory('football'); _ngModal('football',inv?.items||[]); } catch(e) { toast(e.message); }
  }

  function _ngModal(gameType,items) {
    const titles={auto:'🚗 Avto Tuning',fashion:'👗 Fashion',football:'⚽ Master Liga'};
    uiOverlay(`
<div style="width:100%;max-width:480px;margin:0 auto;background:var(--s1);border-radius:20px 20px 0 0;max-height:82vh;overflow-y:auto">
  <div style="padding:16px 14px;border-bottom:1px solid var(--f);display:flex;align-items:center;justify-content:space-between">
    <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:16px">${titles[gameType]||gameType}</div>
    <button onclick="this.closest('.ov').remove()" style="width:28px;height:28px;border-radius:50%;background:var(--s2);border:1px solid var(--f);color:var(--m);cursor:pointer;font-size:15px">×</button>
  </div>
  <div id="ng-body" style="padding:12px 14px">
    ${items.map(it=>{
      if (gameType==='auto') return `<div style="background:var(--s2);border:1px solid var(--f);border-radius:var(--br2);padding:12px;margin-bottom:8px"><div style="font-size:12px;font-weight:700;margin-bottom:6px">${_e(it.name||it.carModel||'Mashina')}</div><div style="display:flex;gap:5px;flex-wrap:wrap">${['engine','suspension','tires','paint'].map(p=>`<div style="font-size:10px;background:var(--s3);padding:2px 6px;border-radius:4px;color:var(--m)">${p} Lv${it.tuning?.[p]||0}</div>`).join('')}<button onclick="FIKRA._ngt('${it._id}')" style="font-size:10px;background:var(--acc);color:#fff;border:none;padding:3px 8px;border-radius:4px;cursor:pointer">Tuning +</button></div></div>`;
      if (gameType==='fashion') return `<div style="background:var(--s2);border:1px solid var(--f);border-radius:var(--br2);padding:12px;margin-bottom:8px"><div style="font-size:12px;font-weight:700;margin-bottom:6px">${_e(it.name||'Libos')}</div><div style="font-size:10px;color:var(--m)">Uslub: ${it.outfitStyle||'—'}</div></div>`;
      if (gameType==='football') return `<div style="background:var(--s2);border:1px solid var(--f);border-radius:var(--br2);padding:10px;margin-bottom:6px;display:flex;align-items:center;gap:8px"><div style="flex:1"><div style="font-size:11px;font-weight:700">${_e(it.playerPosition)} · ${_e(it.clubId||'')}</div><div style="font-size:10px;color:var(--m)">${Object.entries(it.playerStats||{}).map(([k,v])=>k.slice(0,3)+':'+v).join(' ')}</div></div><button onclick="FIKRA._ngu('${it._id}')" style="font-size:10px;background:var(--acc);color:#fff;border:none;padding:4px 8px;border-radius:6px;cursor:pointer">+Stat</button></div>`;
      return '';
    }).join('')}
    ${gameType==='football'&&items.length?`<button onclick="FIKRA._fbMatch()" style="width:100%;padding:12px;background:var(--g);color:#000;border:none;border-radius:var(--br2);font-family:'Syne',sans-serif;font-weight:700;cursor:pointer;margin-top:4px">⚽ Bot bilan o'yna (XP uchun)</button>`:''}
  </div>
</div>`);
  }

  async function _ngt(carId) {
    const part=await uiPrompt('Tuning qismi?','engine',{hint:'engine, suspension, tires, paint, spoiler, rims'});
    if (!part) return;
    try { const r=await API.carTuning(carId,part); toast('✅ Tuning! Qiymat: '+r.newValue); } catch(e) { toast(e.message); }
  }
  async function _ngu(playerId) {
    const stat=await uiPrompt('Stat?','speed',{hint:'speed, skill, shot, defense'});
    if (!stat) return;
    try { await API.upgradePlayer(playerId,stat); toast('✅ '+stat+' oshdi!'); xpGain(5,false); } catch(e) { toast(e.message); }
  }
  async function _fbMatch() {
    try { const r=await API.footballMatch(); const em=r.result==='win'?'🏆':r.result==='draw'?'🤝':'😔'; toast(`${em} ${r.userGoals}-${r.botGoals} | +${r.xpEarned} XP`); if(r.xp?.levelUp)setTimeout(()=>levelUp(r.xp.newRank),500); } catch(e) { toast(e.message); }
  }

  // ─── PROFIL QOLGAN FUNKSIYALAR ────────────────────────────────────────────
  function copyRef() {
    const inp=document.getElementById('ref-link'); const link=inp?.value; if (!link) return;
    navigator.clipboard?.writeText(link).then(()=>toast('Havola nusxalandi!')).catch(()=>{inp.select();document.execCommand('copy');toast('Nusxalandi!');});
    haptic('medium');
  }
  function shareRef() {
    const link=document.getElementById('ref-link')?.value; if (!link) return;
    const text=`FIKRA — DTM testlarga AI bilan tayyorlanish!\n${link}`;
    if (tg) tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
    else if (navigator.share) navigator.share({text,url:link}).catch(()=>{});
    haptic('light');
  }

  // ─── UI HELPERS ───────────────────────────────────────────────────────────
  function uiOverlay(html) {
    const el=document.createElement('div');
    el.className='ov';
    el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:flex-end;backdrop-filter:blur(4px)';
    el.onclick=e=>{ if(e.target===el)el.remove(); };
    el.innerHTML=html;
    document.body.appendChild(el);
    return el;
  }

  function uiConfirm(msg,opts={}) {
    return new Promise(resolve=>{
      const el=uiOverlay(`<div style="width:100%;max-width:480px;margin:0 auto;background:var(--s2);border-radius:20px 20px 0 0;padding:20px">`+
        `<div style="font-size:13px;line-height:1.5;margin-bottom:16px">${_e(msg)}</div>`+
        `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">`+
        `<button id="uc-no" style="padding:10px;background:var(--s3);border:1px solid var(--f);border-radius:var(--br2);cursor:pointer;font-size:12px;color:var(--txt)">${opts.cancel||'Bekor'}</button>`+
        `<button id="uc-ok" style="padding:10px;background:var(--acc);color:#fff;border:none;border-radius:var(--br2);cursor:pointer;font-size:12px;font-weight:700">${opts.ok||'OK'}</button>`+
        `</div></div>`);
      el.querySelector('#uc-no').onclick=()=>{el.remove();resolve(false);};
      el.querySelector('#uc-ok').onclick=()=>{el.remove();resolve(true);};
    });
  }

  function uiPrompt(msg,def='',opts={}) {
    return new Promise(resolve=>{
      const el=uiOverlay(`<div style="width:100%;max-width:480px;margin:0 auto;background:var(--s2);border-radius:20px 20px 0 0;padding:20px">`+
        `<div style="font-size:13px;font-weight:600;margin-bottom:${opts.hint?'4px':'12px'}">${_e(msg)}</div>`+
        (opts.hint?`<div style="font-size:10px;color:var(--m);margin-bottom:8px">${_e(opts.hint)}</div>`:'')+
        `<input id="up-inp" value="${_e(def)}" style="width:100%;background:var(--s3);border:1px solid var(--f);border-radius:var(--br2);padding:9px 11px;color:var(--txt);font-size:12px;outline:none;margin-bottom:12px;box-sizing:border-box">`+
        `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">`+
        `<button id="up-no" style="padding:10px;background:var(--s3);border:1px solid var(--f);border-radius:var(--br2);cursor:pointer;font-size:12px;color:var(--txt)">Bekor</button>`+
        `<button id="up-ok" style="padding:10px;background:var(--acc);color:#fff;border:none;border-radius:var(--br2);cursor:pointer;font-size:12px;font-weight:700">OK</button>`+
        `</div></div>`);
      el.querySelector('#up-no').onclick=()=>{el.remove();resolve(null);};
      el.querySelector('#up-ok').onclick=()=>{const v=el.querySelector('#up-inp')?.value?.trim();el.remove();resolve(v||null);};
      el.querySelector('#up-inp')?.focus();
    });
  }

  function toast(msg) {
    const t=document.getElementById('toast'); if (!t) return;
    t.textContent=msg; t.className='show';
    clearTimeout(t._t); t._t=setTimeout(()=>t.className='',2500);
  }

  function loading(msg) {
    return `<div style="padding:30px;text-align:center;color:var(--m);font-size:12px">${_e(msg||'Yuklanmoqda...')}</div>`;
  }

  // ─── INIT APP ─────────────────────────────────────────────────────────────
  function initApp() {
    fetch('/api/config').then(r=>r.json()).then(c=>{if(c.botUsername)window.BOT_USERNAME=c.botUsername;}).catch(()=>{});
    startLB();
    loadHomeTournament();
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stopLB();else startLB();});
    API.myStats().then(s=>{const el=document.getElementById('my-stroop-score');if(el&&s?.stroopBestScore)el.textContent=s.stroopBestScore;}).catch(()=>{});
    API.me().then(u=>{if(u){user=u;_syncUser();}}).catch(()=>{});

    const style=document.createElement('style');
    style.textContent=`
.qi-btn{display:flex;flex-direction:column;align-items:center;gap:5px;background:var(--s2);border:1px solid var(--f);border-radius:var(--br2);padding:11px 4px;cursor:pointer;transition:all .15s;font-size:19px;-webkit-tap-highlight-color:transparent}
.qi-btn span{font-size:9px;font-weight:700;color:var(--m);text-align:center;letter-spacing:.3px}
.qi-btn:active{transform:scale(.91)}
.fan-card{display:flex;flex-direction:column;align-items:center;gap:5px;background:var(--s2);border:1px solid var(--f);border-radius:var(--br2);padding:11px 4px;cursor:pointer;transition:all .15s;font-size:22px;text-align:center}
.fan-card span{font-size:10px;font-weight:700;color:var(--m)}
.fan-card:active{transform:scale(.92);border-color:var(--acc)}
.dir-card{background:var(--s2);border:1.5px solid var(--f);border-radius:var(--br2);padding:12px 14px;cursor:pointer;transition:all .15s}
.dir-card:active{transform:scale(.97);border-color:var(--acc)}
.ai-svc-card{background:var(--s2);border:1px solid var(--f);border-radius:var(--br2);padding:13px;cursor:pointer;transition:all .15s;font-size:22px}
.ai-svc-card.locked{opacity:.6}
.ai-svc-card:active{transform:scale(.95)}
.game-card{background:var(--s1);border:1px solid var(--f);border-radius:var(--br);overflow:hidden;cursor:pointer}
.game-card-hdr{height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 14px;color:#fff;font-family:'Syne',sans-serif;font-weight:800;font-size:14px}
.game-card-ftr{display:flex;align-items:center;justify-content:space-between;padding:8px 14px}
.mode-btn{flex:1;padding:12px;border-radius:var(--br2);border:1.5px solid var(--f);background:var(--s2);text-align:center;cursor:pointer;transition:all .15s}
.mode-btn.active{border-color:var(--acc);background:rgba(123,104,238,.1)}
.mode-btn:active{transform:scale(.95)}
.fmt-btn{padding:5px 12px;border-radius:100px;font-family:'Syne',sans-serif;font-weight:700;font-size:11px;border:1px solid var(--f);background:transparent;color:var(--m);cursor:pointer;transition:all .15s}
.fmt-btn.active{background:var(--g);color:#000;border-color:var(--g)}
.status-plan{display:flex;align-items:center;gap:4px;background:var(--s2);border:1px solid var(--f);border-radius:100px;padding:4px 10px;cursor:pointer}
.stimer{font-family:'Syne',sans-serif;font-size:28px;font-weight:800}
.stimer.warn{color:var(--r)}
.heart{font-size:18px;transition:opacity .2s}
.heart.lost{opacity:.18}
.msg-ai{display:flex;gap:7px;align-items:flex-end}
.msg-me{display:flex;gap:7px;align-items:flex-end;flex-direction:row-reverse}
.msg-av-ai{width:26px;height:26px;border-radius:50%;background:var(--acc);display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0}
.msg-av-u{width:26px;height:26px;border-radius:50%;background:var(--s3);display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0}
.bbl-ai{max-width:240px;padding:9px 12px;border-radius:12px 12px 12px 3px;font-size:12px;line-height:1.55;background:var(--s2);border:1px solid var(--f)}
.bbl-me{max-width:240px;padding:9px 12px;border-radius:12px 12px 3px 12px;font-size:12px;line-height:1.55;background:var(--acc);color:#fff}
@keyframes luA{0%{transform:scale(.5);opacity:0}60%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}
@keyframes fuA{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}
`;
    document.head.appendChild(style);
  }

  // ─── EXPOSE ───────────────────────────────────────────────────────────────
  window.FIKRA = {
    sw, openSubs, _buyPlan,
    // Test
    startFan, startDir, pick, getHint, nextQ, backTest, finishTest,
    // Stroop
    goStroop, renderStroop, setSm, doStroop, _sa, _tf, showStroopResult, backGifts,
    // AI
    goAIChat, goAIDoc, goAIImage, goKal,
    renderChat, renderDoc, renderImg, renderKal,
    sendChat, sendDoc, genImg, doScan, setFmt, _dlDoc,
    newChat, backGiftsAI,
    // O'yinlar
    openNG, _fbClubs, _fbStart, _ngt, _ngu, _fbMatch,
    // Turnir/Rank
    openTournament, loadHomeTournament, rankDetail, levelUp, xpGain,
    // Musiqa
    openMusic, playTrack,
    // Profil
    copyRef, shareRef,
    // Util
    toast, uiConfirm, uiPrompt,
    // Auth
    reLogin: login,
  };

  // ─── BOOTSTRAP ────────────────────────────────────────────────────────────
  try { await Promise.race([login(), new Promise(r=>setTimeout(r,3000))]); } catch(e) { console.warn('Login:',e); }
  const lel=document.getElementById('loading');
  if (lel) { lel.style.opacity='0'; lel.style.transition='opacity .3s'; setTimeout(()=>lel.remove(),350); }
  buildUI();
  setInterval(verifyAuth,30000);
  document.addEventListener('keydown',e=>{ if(e.key!=='Escape')return; const ovs=document.getElementsByClassName('ov'); if(ovs.length)ovs[ovs.length-1].remove(); });
  if ('serviceWorker' in navigator&&location.protocol==='https:') {
    window.addEventListener('load',()=>navigator.serviceWorker.register('/service-worker.js').catch(()=>{}));
  }
})();
