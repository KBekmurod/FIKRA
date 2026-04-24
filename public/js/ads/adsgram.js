// ─── Adsgram SDK Wrapper ───────────────────────────────────────────────────────
// Docs: https://docs.adsgram.ai

let _adsgramController = null;
let _initialized = false;

function initAdsgram() {
  if (_initialized) return;
  _initialized = true;

  // Block ID env dan yoki inline konfiguratsiyadan
  const blockId = window.ADSGRAM_BLOCK_ID || document.querySelector('meta[name="adsgram-block-id"]')?.content;

  if (typeof window.Adsgram === 'undefined') {
    console.warn('[Adsgram] SDK yuklanmadi — simulyatsiya rejimida');
    return;
  }

  if (!blockId) {
    console.warn('[Adsgram] Block ID sozlanmagan');
    return;
  }

  try {
    _adsgramController = window.Adsgram.init({
      blockId,
      debug: window.location.hostname === 'localhost',
    });
    console.info('[Adsgram] SDK initialized with block:', blockId);
  } catch (e) {
    console.error('[Adsgram] Init error:', e);
    _adsgramController = null;
  }
}

// ─── Obuna tekshiruvi ──────────────────────────────────────────────────────────
// Pro/VIP/Business: reklamasiz. Basic: faqat interstitial. Free: hammasi.
function _shouldShowAd(format, context) {
  const plan = (window.user && window.user.plan) || 'free';
  const tier = plan;

  // Pro, VIP, Business — reklama yo'q
  if (['pro', 'vip', 'business'].includes(tier)) {
    return { show: false, reason: 'premium_user' };
  }

  // Basic — interstitial qoladi, rewarded ixtiyoriy (foydalanuvchi xohlasa token oladi)
  if (tier === 'basic') {
    if (format === 'interstitial') return { show: false, reason: 'basic_skip_interstitial' };
    // rewarded doim ko'rsatiladi — chunki foydalanuvchi xohlab token yig'moqchi
    return { show: true };
  }

  // Free — hammasi
  return { show: true };
}

// ─── Rewarded reklama ──────────────────────────────────────────────────────────
async function showRewardedAd(context) {
  context = context || 'game_retry';

  // Obuna tekshiruvi — rewarded faqat free/basic uchun
  // Pro foydalanuvchi uchun token avtomatik beriladi (reklamasiz)
  const check = _shouldShowAd('rewarded', context);
  if (!check.show && check.reason === 'premium_user') {
    // Pro/VIP ga reklama o'rniga token darhol beriladi (obuna bonusi)
    try {
      const res = await API.adsReward('rewarded_premium', context);
      return { success: true, tokensGiven: res.tokensGiven || 5, newBalance: res.newBalance, premium: true };
    } catch (err) {
      return { success: true, tokensGiven: 5, premium: true };
    }
  }

  return new Promise((resolve) => {
    if (_adsgramController && typeof _adsgramController.show === 'function') {
      _adsgramController.show()
        .then(async (result) => {
          if (result && result.done) {
            try {
              const res = await API.adsReward('rewarded', context);
              resolve({ success: true, tokensGiven: res.tokensGiven, newBalance: res.newBalance, real: true });
            } catch (err) {
              console.error('[Adsgram] Reward API error:', err);
              resolve({ success: true, tokensGiven: 5, newBalance: null, real: true });
            }
          } else {
            resolve({ success: false, reason: 'closed_early' });
          }
        })
        .catch(err => {
          console.warn('[Adsgram] Show error:', err);
          simulateAd(5, context).then(resolve);
        });
      return;
    }
    simulateAd(5, context).then(resolve);
  });
}

// ─── Interstitial reklama ──────────────────────────────────────────────────────
async function showInterstitialAd(context) {
  context = context || 'game_end';

  // Obuna tekshiruvi — Pro/VIP/Basic uchun interstitial yo'q
  const check = _shouldShowAd('interstitial', context);
  if (!check.show) {
    console.log('[Ads] Interstitial skipped for ' + check.reason);
    return { success: true, skipped: true, premium: true };
  }

  return new Promise((resolve) => {
    if (_adsgramController && typeof _adsgramController.show === 'function') {
      _adsgramController.show()
        .then(async () => {
          try { await API.adsReward('interstitial', context); } catch {}
          resolve({ success: true, real: true });
        })
        .catch(() => resolve({ success: true, skipped: true }));
      return;
    }
    simulateAd(0, context).then(() => resolve({ success: true }));
  });
}

function simulateAd(tokensGiven, context) {
  return new Promise((resolve) => {
    if (window.FIKRA && window.FIKRA.showAdsModal) {
      window.FIKRA.showAdsModal(tokensGiven, context, resolve);
    } else {
      resolve({ success: true, tokensGiven });
    }
  });
}

window.ADS = { showRewardedAd, showInterstitialAd, initAdsgram };
