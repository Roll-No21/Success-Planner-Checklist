/* ============================================================
   Success Planner — progress-store.js
   Every subject table reports its % here so the home page can
   show a combined number per subject without loading every
   subject's full table data.
   ============================================================ */
(function (global) {
  const KEY = "home-progress";

  async function report(subjectKey, partKey, percent, dateISO) {
    const summary = (await SPStorage.load(KEY, {})) || {};
    summary[subjectKey] = summary[subjectKey] || {};
    summary[subjectKey][partKey] = { percent, updatedDate: dateISO };
    await SPStorage.save(KEY, summary);
  }

  async function getSummary() {
    return (await SPStorage.load(KEY, {})) || {};
  }

  function combine(subjectSummary) {
    if (!subjectSummary) return { percent: 0, updatedDate: null };
    const parts = Object.values(subjectSummary);
    if (!parts.length) return { percent: 0, updatedDate: null };
    const percent = Math.round(parts.reduce((s, p) => s + p.percent, 0) / parts.length);
    const updatedDate = parts
      .map((p) => p.updatedDate)
      .filter(Boolean)
      .sort()
      .pop() || null;
    return { percent, updatedDate };
  }

  global.SPProgress = { report, getSummary, combine };
})(window);
