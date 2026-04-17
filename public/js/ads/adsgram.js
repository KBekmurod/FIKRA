// ─── Adsgram SDK Wrapper ───────────────────────────────────────────────────────
// Adsgram dokumentatsiyasi: https://docs.adsgram.ai

let _adsgramController = null;

function initAdsgram() {
  if (typeof window.Adsgram === 'undefined') return;
  _adsgramController = window.Adsgram.init({
    blockId: window.ADSGRAM_BLOCK_ID || '',
  });
}

// Rewarded reklama ko'rsatish
async function showRewardedAd(context = 'game_retry') {
  return new Promise((resolve) => {
    // Agar Adsgram yo'q bo'lsa (dev muhit) — simulyatsiya
    if (!_adsgramController) {
      simulateAd(5, context).then(resolve);
      return;
    }

    _adsgramController.show()
      .then(async (result) => {
        if (result.done) {
          try {
            const res = await API.adsReward('rewarded', context);
            resolve({ success: true, tokensGiven: res.tokensGiven, newBalance: res.newBalance });
          } catch (err) {
            resolve({ success: true, tokensGiven: 5, newBalance: null });
          }
        } else {
          resolve({ success: false });
        }
      })
      .catch(() => resolve({ success: false }));
  });
}

// Interstitial reklama (token berilmaydi — faqat log)
async function showInterstitialAd(context = 'game_end') {
  return new Promise((resolve) => {
    if (!_adsgramController) {
      simulateAd(0, context).then(() => resolve({ success: true }));
      return;
    }

    _adsgramController.show()
      .then(async () => {
        try {
          await API.adsReward('interstitial', context);
        } catch {}
        resolve({ success: true });
      })
      .catch(() => resolve({ success: true }));
  });
}

// Dev muhitda simulyatsiya
function simulateAd(tokensGiven, context) {
  return new Promise((resolve) => {
    window.FIKRA && window.FIKRA.showAdsModal(tokensGiven, context, resolve);
  });
}

// HTML simulyatsiya modal (faqat dev uchun)
window.ADS = { showRewardedAd, showInterstitialAd, initAdsgram };
