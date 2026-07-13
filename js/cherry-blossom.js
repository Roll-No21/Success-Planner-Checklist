/* ============================================================
   Success Planner — cherry-blossom.js
   Lightweight falling-petal ambience for the home page.
   Inspired by: https://codepen.io/nicecue/pen/gOpppqE
   ============================================================ */
(function (global) {
  function startBlossoms(hostSelector, count = 22) {
    const host = document.querySelector(hostSelector);
    if (!host) return;
    const layer = document.createElement("div");
    layer.className = "sp-blossom-layer";
    host.appendChild(layer);

    for (let i = 0; i < count; i++) {
      const petal = document.createElement("span");
      petal.className = "sp-petal";
      const left = Math.random() * 100;
      const duration = 8 + Math.random() * 9;
      const delay = Math.random() * 12;
      const drift = (Math.random() * 80 - 40).toFixed(0) + "px";
      const size = 10 + Math.random() * 10;
      const spin = 360 * (Math.random() > 0.5 ? 1 : -1);
      petal.style.left = left + "vw";
      petal.style.width = size + "px";
      petal.style.height = size * 0.8 + "px";
      petal.style.animationDuration = duration + "s";
      petal.style.animationDelay = -delay + "s";
      petal.style.setProperty("--drift", drift);
      petal.style.setProperty("--spin", spin + "deg");
      layer.appendChild(petal);
    }
  }

  global.SPBlossom = { start: startBlossoms };
})(window);
