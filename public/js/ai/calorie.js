// ─── Calorie Scanner Module ───────────────────────────────────────────────────

const CALORIE = (() => {
  let lastResult = null;

  async function scanFile(file) {
    if (!file) throw new Error('Fayl kerak');
    if (file.size > 10 * 1024 * 1024) throw new Error('Fayl hajmi 10MB dan oshmasin');

    const result = await API.calorie(file);
    lastResult = result;
    return result;
  }

  function getLastResult() { return lastResult; }

  return { scanFile, getLastResult };
})();

window.CALORIE = CALORIE;
