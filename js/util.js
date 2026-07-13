/* ============================================================
   Success Planner — util.js
   Click sound + toast + date helpers, shared on every page.
   ============================================================ */
(function (global) {
  let clickAudio = null;
  function playClick() {
    try {
      if (!clickAudio) clickAudio = new Audio("/sounds/click.mp3");
      clickAudio.currentTime = 0;
      clickAudio.play().catch(() => {});
    } catch (e) {
      /* sounds/click.mp3 missing — fails silently */
    }
  }

  function toast(message, kind = "info", ms = 2600) {
    let host = document.getElementById("sp-toast-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "sp-toast-host";
      document.body.appendChild(host);
    }
    const el = document.createElement("div");
    el.className = `sp-toast sp-toast--${kind}`;
    el.textContent = message;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 300);
    }, ms);
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return iso;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  global.SPUtil = { playClick, toast, todayISO, formatDate };
})(window);
