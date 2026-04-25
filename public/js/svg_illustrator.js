// ─── SVG Illustrators ──────────────────────────────────────────────────────────
// Avto, kiyim, futbolchi uchun vizual SVG shablonlar

const SVG_ILLUSTRATOR = (() => {

  // Ranglar xaritasi (string → hex)
  const COLOR_MAP = {
    white: '#eeeaff', black: '#1a1a1f', red: '#ff5f7e',
    blue: '#4a7dcc', silver: '#c0c0c0', orange: '#ff9844',
    yellow: '#ffcc44', green: '#00d4aa', pink: '#ff6fa3',
    purple: '#7b68ee', gold: '#d4af37', beige: '#e8d7b8',
  };

  function _color(c) { return COLOR_MAP[c] || '#eeeaff'; }

  // ─── MASHINA SVG (model + rang + tuning darajasi ko'rinadi) ──────────────
  function carSvg(car, opts) {
    opts = opts || {};
    const color = _color(car.carColor || 'white');
    const tuning = car.tuning || {};
    const model = car.carModel || 'lada';
    const hasSpoiler = (tuning.spoiler || 0) >= 2;
    const rimGloss = Math.min((tuning.rims || 0) * 0.2, 1);
    const paintGloss = (tuning.paint || 0) >= 3;
    const size = opts.size || 200;
    const height = Math.round(size * 0.6);

    // Model ga qarab shasi shakli
    let bodyPath, roofPath;
    if (['lada', 'nexia', 'cobalt'].includes(model)) {
      // Oddiy sedan
      bodyPath = 'M20,70 L40,45 L130,45 L165,60 L180,65 L180,85 L20,85 Z';
      roofPath = 'M48,45 L62,28 L120,28 L138,45 Z';
    } else if (['captiva', 'camry'].includes(model)) {
      // SUV / katta sedan
      bodyPath = 'M15,70 L35,40 L140,40 L170,55 L185,62 L185,85 L15,85 Z';
      roofPath = 'M42,40 L58,22 L130,22 L145,40 Z';
    } else if (model === 'bmw') {
      // Sport sedan — pastroq, uzunroq
      bodyPath = 'M15,72 L35,48 L130,48 L168,58 L185,68 L185,85 L15,85 Z';
      roofPath = 'M45,48 L65,30 L125,30 L140,48 Z';
    } else if (model === 'mercedes') {
      // Elegantli
      bodyPath = 'M18,70 L38,44 L135,44 L170,58 L185,64 L185,85 L18,85 Z';
      roofPath = 'M46,44 L62,26 L128,26 L142,44 Z';
    } else {
      // Tesla — futuristik
      bodyPath = 'M12,72 L30,50 L135,42 L175,55 L190,65 L190,85 L12,85 Z';
      roofPath = 'M40,50 L60,25 L130,25 L140,42 Z';
    }

    return `<svg viewBox="0 0 200 100" width="${size}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="display:block">
      <defs>
        <linearGradient id="bg-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${color}" stop-opacity="0.15"/>
          <stop offset="1" stop-color="${color}" stop-opacity="0.05"/>
        </linearGradient>
        <linearGradient id="body-g-${car._id || 'x'}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${color}"/>
          <stop offset="1" stop-color="${color}" stop-opacity="0.7"/>
        </linearGradient>
        ${paintGloss ? `<radialGradient id="gloss-${car._id || 'x'}" cx="50%" cy="20%" r="60%">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>` : ''}
      </defs>
      <rect x="0" y="0" width="200" height="100" fill="url(#bg-g)" rx="8"/>

      <!-- Yo'l chiziqlari -->
      <line x1="5" y1="92" x2="195" y2="92" stroke="#555" stroke-width="0.8" stroke-dasharray="4,3"/>

      <!-- Shassi -->
      <path d="${bodyPath}" fill="url(#body-g-${car._id || 'x'})" stroke="${color === '#1a1a1f' ? '#444' : '#0a0a12'}" stroke-width="0.8"/>
      <!-- Tom -->
      <path d="${roofPath}" fill="${color}" opacity="0.88" stroke="#0a0a12" stroke-width="0.5"/>
      <!-- Derazalar -->
      <path d="${roofPath}" fill="#4d6a9a" opacity="0.55"/>

      <!-- Mashina yonlari chiziq -->
      <line x1="22" y1="75" x2="180" y2="75" stroke="#0a0a12" stroke-width="0.3" opacity="0.4"/>

      ${paintGloss ? `<path d="${bodyPath}" fill="url(#gloss-${car._id || 'x'})"/>` : ''}

      <!-- Old fara -->
      <ellipse cx="175" cy="70" rx="7" ry="4" fill="${tuning.engine >= 3 ? '#fff' : '#ffe680'}" opacity="${0.7 + (tuning.engine||0)*0.06}"/>
      <!-- Orqa fara -->
      <ellipse cx="22" cy="70" rx="5" ry="3" fill="#ff5555" opacity="0.85"/>

      <!-- Spoiler (agar tuning yuqori) -->
      ${hasSpoiler ? `<path d="M20,48 L40,43 L45,45 L25,48 Z" fill="${color}" stroke="#0a0a12" stroke-width="0.5" opacity="0.95"/>` : ''}

      <!-- G'ildirak old -->
      <circle cx="155" cy="85" r="11" fill="#111"/>
      <circle cx="155" cy="85" r="7" fill="${rimGloss > 0.4 ? '#d0d0d8' : '#3a3a42'}" stroke="${rimGloss > 0.6 ? '#ffd700' : '#222'}" stroke-width="${rimGloss > 0.6 ? 1 : 0.5}"/>
      <circle cx="155" cy="85" r="2" fill="#0a0a12"/>
      ${rimGloss > 0.2 ? `
        <line x1="148" y1="85" x2="162" y2="85" stroke="${rimGloss > 0.6 ? '#ffd700' : '#aaa'}" stroke-width="0.7"/>
        <line x1="155" y1="78" x2="155" y2="92" stroke="${rimGloss > 0.6 ? '#ffd700' : '#aaa'}" stroke-width="0.7"/>
      ` : ''}
      ${rimGloss > 0.5 ? `
        <line x1="150" y1="80" x2="160" y2="90" stroke="${rimGloss > 0.6 ? '#ffd700' : '#aaa'}" stroke-width="0.5"/>
        <line x1="160" y1="80" x2="150" y2="90" stroke="${rimGloss > 0.6 ? '#ffd700' : '#aaa'}" stroke-width="0.5"/>
      ` : ''}

      <!-- G'ildirak orqa -->
      <circle cx="48" cy="85" r="11" fill="#111"/>
      <circle cx="48" cy="85" r="7" fill="${rimGloss > 0.4 ? '#d0d0d8' : '#3a3a42'}" stroke="${rimGloss > 0.6 ? '#ffd700' : '#222'}" stroke-width="${rimGloss > 0.6 ? 1 : 0.5}"/>
      <circle cx="48" cy="85" r="2" fill="#0a0a12"/>
      ${rimGloss > 0.2 ? `
        <line x1="41" y1="85" x2="55" y2="85" stroke="${rimGloss > 0.6 ? '#ffd700' : '#aaa'}" stroke-width="0.7"/>
        <line x1="48" y1="78" x2="48" y2="92" stroke="${rimGloss > 0.6 ? '#ffd700' : '#aaa'}" stroke-width="0.7"/>
      ` : ''}
      ${rimGloss > 0.5 ? `
        <line x1="43" y1="80" x2="53" y2="90" stroke="${rimGloss > 0.6 ? '#ffd700' : '#aaa'}" stroke-width="0.5"/>
        <line x1="53" y1="80" x2="43" y2="90" stroke="${rimGloss > 0.6 ? '#ffd700' : '#aaa'}" stroke-width="0.5"/>
      ` : ''}

      <!-- Dvigatel effekti (tuning engine yuqori bo'lsa — ilovalar ostida olov) -->
      ${(tuning.engine || 0) >= 4 ? `
        <ellipse cx="15" cy="86" rx="4" ry="2" fill="#ff9844" opacity="0.6"/>
        <ellipse cx="12" cy="87" rx="3" ry="1.5" fill="#ffcc44" opacity="0.8"/>
      ` : ''}
    </svg>`;
  }

  // ─── OUTFIT SVG (3 qism: ustki, pastki, oyoq) ─────────────────────────────
  function outfitSvg(outfit, opts) {
    opts = opts || {};
    const parts = outfit.outfitParts || {};
    const topColor = _color(parts.top?.color || 'white');
    const bottomColor = _color(parts.bottom?.color || 'black');
    const shoeColor = _color(parts.shoes?.color || 'black');
    const style = outfit.outfitStyle || 'classic';
    const size = opts.size || 150;

    // Uslubga qarab shakllar
    const isSport = style === 'sport';
    const isFormal = style === 'formal';
    const isBohem = style === 'bohem';

    // Top (ustki kiyim)
    let topShape;
    if (isFormal) {
      // Pidjak
      topShape = `
        <path d="M50,45 L60,40 L90,40 L100,45 L102,85 L48,85 Z" fill="${topColor}" stroke="#0a0a12" stroke-width="0.8"/>
        <path d="M60,40 L75,55 L90,40" fill="none" stroke="#0a0a12" stroke-width="0.8"/>
        <line x1="75" y1="55" x2="75" y2="80" stroke="#0a0a12" stroke-width="0.5"/>
        <!-- Tugmalar -->
        <circle cx="75" cy="62" r="1" fill="#0a0a12"/>
        <circle cx="75" cy="72" r="1" fill="#0a0a12"/>
      `;
    } else if (isSport) {
      // Sport futbolka
      topShape = `
        <path d="M52,45 L60,40 L90,40 L98,45 L98,85 L52,85 Z" fill="${topColor}" stroke="#0a0a12" stroke-width="0.8"/>
        <path d="M66,40 L75,48 L84,40" fill="none" stroke="#fff" stroke-width="1" opacity="0.6"/>
        <!-- Sport stripe -->
        <line x1="70" y1="50" x2="70" y2="82" stroke="${_color(parts.top?.pattern === 'stripes' ? 'red' : 'white')}" stroke-width="1.5" opacity="0.6"/>
        <line x1="80" y1="50" x2="80" y2="82" stroke="${_color(parts.top?.pattern === 'stripes' ? 'red' : 'white')}" stroke-width="1.5" opacity="0.6"/>
      `;
    } else if (isBohem) {
      // Uzun libos
      topShape = `
        <path d="M50,45 L58,40 L92,40 L100,45 L105,95 L45,95 Z" fill="${topColor}" stroke="#0a0a12" stroke-width="0.8"/>
        <path d="M58,40 L75,50 L92,40" fill="none" stroke="#0a0a12" stroke-width="0.6"/>
        ${parts.top?.pattern === 'floral' ? `
          <circle cx="60" cy="65" r="2.5" fill="#ff6fa3" opacity="0.7"/>
          <circle cx="85" cy="70" r="2" fill="#ff6fa3" opacity="0.7"/>
          <circle cx="70" cy="80" r="2" fill="#ffcc44" opacity="0.7"/>
        ` : ''}
      `;
    } else {
      // Oddiy ko'ylak (classic/casual)
      topShape = `
        <path d="M52,45 L62,40 L88,40 L98,45 L98,82 L52,82 Z" fill="${topColor}" stroke="#0a0a12" stroke-width="0.8"/>
        <path d="M62,40 L75,52 L88,40" fill="none" stroke="#0a0a12" stroke-width="0.6"/>
      `;
    }

    // Pastki kiyim (shim/yubka)
    let bottomShape;
    if (style === 'bohem') {
      // Uzun yubka — top bilan birlashgan (yo'q, alohida)
      bottomShape = '';
    } else if (isSport) {
      // Sport shim
      bottomShape = `
        <path d="M52,85 L60,140 L74,140 L75,85 Z" fill="${bottomColor}" stroke="#0a0a12" stroke-width="0.6"/>
        <path d="M75,85 L76,140 L90,140 L98,85 Z" fill="${bottomColor}" stroke="#0a0a12" stroke-width="0.6"/>
        <line x1="56" y1="95" x2="62" y2="138" stroke="#fff" stroke-width="0.8" opacity="0.5"/>
        <line x1="88" y1="95" x2="94" y2="138" stroke="#fff" stroke-width="0.8" opacity="0.5"/>
      `;
    } else if (isFormal) {
      // Rasmiy shim
      bottomShape = `
        <path d="M54,85 L62,145 L74,145 L75,85 Z" fill="${bottomColor}" stroke="#0a0a12" stroke-width="0.6"/>
        <path d="M75,85 L76,145 L88,145 L96,85 Z" fill="${bottomColor}" stroke="#0a0a12" stroke-width="0.6"/>
      `;
    } else {
      // Casual shim/jeans
      bottomShape = `
        <path d="M54,82 L62,140 L74,140 L75,82 Z" fill="${bottomColor}" stroke="#0a0a12" stroke-width="0.6"/>
        <path d="M75,82 L76,140 L88,140 L96,82 Z" fill="${bottomColor}" stroke="#0a0a12" stroke-width="0.6"/>
      `;
    }

    // Oyoq kiyim
    const shoeShape = style === 'bohem' ? `
      <ellipse cx="68" cy="150" rx="7" ry="3" fill="${shoeColor}" stroke="#0a0a12" stroke-width="0.5"/>
      <ellipse cx="82" cy="150" rx="7" ry="3" fill="${shoeColor}" stroke="#0a0a12" stroke-width="0.5"/>
    ` : isFormal ? `
      <path d="M58,143 L76,143 L72,150 L58,148 Z" fill="${shoeColor}" stroke="#0a0a12" stroke-width="0.6"/>
      <path d="M74,143 L92,143 L92,148 L78,150 Z" fill="${shoeColor}" stroke="#0a0a12" stroke-width="0.6"/>
    ` : `
      <path d="M58,140 L76,140 L74,148 L56,147 Z" fill="${shoeColor}" stroke="#0a0a12" stroke-width="0.6"/>
      <path d="M74,140 L92,140 L94,147 L76,148 Z" fill="${shoeColor}" stroke="#0a0a12" stroke-width="0.6"/>
    `;

    // Bosh (stick figure style)
    const head = `<circle cx="75" cy="25" r="12" fill="${_color('beige')}" stroke="#0a0a12" stroke-width="0.8"/>`;
    const neck = `<rect x="72" y="35" width="6" height="7" fill="${_color('beige')}" stroke="#0a0a12" stroke-width="0.5"/>`;

    const bg = `
      <rect x="0" y="0" width="150" height="170" fill="url(#outfit-bg-${outfit._id || 'x'})" rx="8"/>
    `;

    return `<svg viewBox="0 0 150 170" width="${size}" height="${Math.round(size * 170 / 150)}" xmlns="http://www.w3.org/2000/svg" style="display:block">
      <defs>
        <linearGradient id="outfit-bg-${outfit._id || 'x'}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${topColor}" stop-opacity="0.1"/>
          <stop offset="1" stop-color="${bottomColor}" stop-opacity="0.05"/>
        </linearGradient>
      </defs>
      ${bg}
      ${head}
      ${neck}
      ${topShape}
      ${bottomShape}
      ${shoeShape}
      ${parts.accessory ? `
        <!-- Aksessuar -->
        <circle cx="75" cy="45" r="3" fill="#ffcc44" stroke="#0a0a12" stroke-width="0.5"/>
        <text x="75" y="48" text-anchor="middle" font-size="4" fill="#0a0a12">✦</text>
      ` : ''}
    </svg>`;
  }

  // ─── FUTBOLCHI SVG (pozitsiya + stat bar) ─────────────────────────────────
  function playerSvg(player, opts) {
    opts = opts || {};
    const stats = player.playerStats || {};
    const pos = player.playerPosition || 'MID';
    const posColors = { GK: '#ffcc44', DEF: '#00d4aa', MID: '#7b68ee', FWD: '#ff5f7e' };
    const color = posColors[pos] || '#7b68ee';
    const total = (stats.speed || 0) + (stats.skill || 0) + (stats.shot || 0) + (stats.defense || 0);
    const rating = Math.round(total / 4);
    const size = opts.size || 100;

    return `<svg viewBox="0 0 100 120" width="${size}" height="${Math.round(size * 1.2)}" xmlns="http://www.w3.org/2000/svg" style="display:block">
      <defs>
        <linearGradient id="card-${player._id || 'x'}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${color}" stop-opacity="0.25"/>
          <stop offset="1" stop-color="${color}" stop-opacity="0.05"/>
        </linearGradient>
      </defs>
      <!-- Karta fon -->
      <rect x="2" y="2" width="96" height="116" rx="8" fill="url(#card-${player._id || 'x'})" stroke="${color}" stroke-width="1.2"/>
      <!-- Reyting -->
      <text x="14" y="22" font-family="Arial" font-size="18" font-weight="900" fill="${color}">${rating}</text>
      <!-- Pozitsiya -->
      <text x="14" y="34" font-family="Arial" font-size="10" font-weight="700" fill="${color}">${pos}</text>
      <!-- Futbolchi figurasi -->
      <g transform="translate(60, 30)">
        <!-- Bosh -->
        <circle cx="0" cy="0" r="8" fill="${_color('beige')}" stroke="#0a0a12" stroke-width="0.6"/>
        <!-- Tana (klub formasi) -->
        <path d="M-9,10 L-12,20 L-12,35 L12,35 L12,20 L9,10 Z" fill="${color}" stroke="#0a0a12" stroke-width="0.6"/>
        <!-- Raqam -->
        <text x="0" y="28" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#fff">${player.jerseyNumber || rating}</text>
        <!-- Oyoqlar -->
        <rect x="-9" y="35" width="6" height="15" fill="#0a0a12"/>
        <rect x="3" y="35" width="6" height="15" fill="#0a0a12"/>
      </g>

      <!-- Stat barlar -->
      <g transform="translate(8, 70)">
        ${['speed', 'skill', 'shot', 'defense'].map((s, i) => {
          const val = stats[s] || 0;
          const labels = { speed: 'TEZ', skill: 'MAH', shot: 'ZAR', defense: 'HIM' };
          return `
            <text x="0" y="${i * 11 + 8}" font-family="Arial" font-size="6" font-weight="700" fill="#aaa">${labels[s]}</text>
            <rect x="20" y="${i * 11 + 3}" width="60" height="5" rx="2" fill="#222"/>
            <rect x="20" y="${i * 11 + 3}" width="${Math.round(60 * val / 99)}" height="5" rx="2" fill="${color}"/>
            <text x="85" y="${i * 11 + 8}" font-family="Arial" font-size="6" font-weight="700" fill="${color}" text-anchor="end">${val}</text>
          `;
        }).join('')}
      </g>
    </svg>`;
  }

  return { carSvg, outfitSvg, playerSvg };
})();

window.SVG_ILLUSTRATOR = SVG_ILLUSTRATOR;
