(function () {
  const PARTS = [
    { key: "physical", label: "Physical", image: "../images/physical_image.jpg", href: "../pages/subject-table.html?data=Chemistry/physical-data&back=chemistry.html" },
    { key: "organic", label: "Organic", image: "../images/organic_image.jpg", href: "../pages/subject-table.html?data=Chemistry/organic-data&back=chemistry.html" },
    { key: "inorganic", label: "Inorganic", image: "../images/inorganic_image.jpg", href: "../pages/subject-table.html?data=Chemistry/inorganic-data&back=chemistry.html" }
  ];

  function applyTheme(theme) { document.body.dataset.theme = theme; localStorage.setItem("sp:theme", theme); }

  async function render() {
    const summary = await SPProgress.getSummary();
    const chem = summary.chemistry || {};
    const root = document.getElementById("sp-subjects");
    root.innerHTML = "";
    PARTS.forEach((p) => {
      const combined = SPProgress.combine({ [p.key]: chem[p.key] || { percent: 0, updatedDate: null } });
      const card = document.createElement("div");
      card.className = "sp-plaque";
      card.innerHTML = `
        <img class="sp-plaque-image" src="${p.image}" alt="${p.label}" onerror="this.style.display='none'">
        <div class="sp-plaque-body">
          <div class="sp-plaque-title">${p.label}</div>
          <div class="sp-progress-track"><div class="sp-progress-fill" style="width:${combined.percent}%"></div></div>
          <div class="sp-plaque-meta">
            <span>${combined.percent}% complete</span>
            <span>Updated ${SPUtil.formatDate(combined.updatedDate)}</span>
          </div>
        </div>`;
      card.onclick = () => { SPUtil.playClick(); window.location.href = p.href; };
      root.appendChild(card);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.body.dataset.theme = localStorage.getItem("sp:theme") || "light";
    document.getElementById("sp-theme-toggle").onclick = () => {
      SPUtil.playClick();
      applyTheme(document.body.dataset.theme === "dark" ? "light" : "dark");
    };
    SPAuth.mountToolbar(document.getElementById("sp-toolbar-slot"));
    render();
  });
})();
