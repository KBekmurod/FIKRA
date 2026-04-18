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

// ─── Rewarded reklama ──────────────────────────────────────────────────────────
async function showRewardedAd(context) {
  context = context || 'game_retry';
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
