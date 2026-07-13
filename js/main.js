/* ============================================================
   Success Planner — main.js (home page)
   ============================================================ */
(function () {
  const HOME_META_KEY = "home-meta";
  const defaultMeta = {
    biology: { name: "Biology", image: "images/bio_image.jpg", href: "Biology/biology.html" },
    chemistry: { name: "Chemistry", image: "images/chem_image.jpg", href: "Chemistry/chemistry.html" },
    physics: { name: "Physics", image: "images/physics_image.jpg", href: "pages/subject-table.html?data=Physics/physics-data" }
  };

  let meta = null;
  let summary = null;

  function applyTheme(theme) {
    document.body.dataset.theme = theme;
    localStorage.setItem("sp:theme", theme);
  }

  function initTheme() {
    const saved = localStorage.getItem("sp:theme") || "light";
    applyTheme(saved);
    document.getElementById("sp-theme-toggle").onclick = () => {
      SPUtil.playClick();
      applyTheme(document.body.dataset.theme === "dark" ? "light" : "dark");
    };
  }

  function initHero() {
    const hero = document.getElementById("sp-hero");
    hero.style.setProperty("--hero-image", "url('images/cherry_tree.png')");
    SPBlossom.start("#sp-hero", 24);
  }

  async function renderPlaques() {
    meta = await SPStorage.load(HOME_META_KEY, defaultMeta);
    summary = await SPProgress.getSummary();
    const root = document.getElementById("sp-subjects");
    root.innerHTML = "";
    const editor = SPAuth.isEditorMode();
    let latestDate = null;

    Object.entries(meta).forEach(([key, m]) => {
      const combined = SPProgress.combine(summary[key]);
      if (combined.updatedDate && (!latestDate || combined.updatedDate > latestDate)) latestDate = combined.updatedDate;

      const card = document.createElement("div");
      card.className = "sp-plaque";
      card.innerHTML = `
        <img class="sp-plaque-image" src="${m.image}" alt="${m.name}" onerror="this.style.display='none'">
        <div class="sp-plaque-body">
          <div class="sp-plaque-title" ${editor ? 'contenteditable="true"' : ""}>${m.name}</div>
          <div class="sp-progress-track"><div class="sp-progress-fill" style="width:${combined.percent}%"></div></div>
          <div class="sp-plaque-meta">
            <span>${combined.percent}% complete</span>
            <span>Updated ${SPUtil.formatDate(combined.updatedDate)}</span>
          </div>
          ${editor ? '<div class="sp-plaque-edit">✏️ click the title to rename</div>' : ""}
        </div>
      `;

      if (editor) {
        const titleEl = card.querySelector(".sp-plaque-title");
        titleEl.onblur = async () => {
          meta[key].name = titleEl.textContent.trim();
          await SPStorage.save(HOME_META_KEY, meta);
        };
        titleEl.onclick = (e) => e.stopPropagation();
      }

      card.onclick = () => {
        SPUtil.playClick();
        window.location.href = m.href;
      };
      root.appendChild(card);
    });

    document.getElementById("sp-updated").textContent =
      "Last updated: " + (latestDate ? SPUtil.formatDate(latestDate) : "no progress logged yet");
  }

  window.addEventListener("sp:editorchange", renderPlaques);
  window.addEventListener("sp:authchange", renderPlaques);

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initHero();
    SPAuth.mountToolbar(document.getElementById("sp-toolbar-slot"));
    renderPlaques();
  });
})();
