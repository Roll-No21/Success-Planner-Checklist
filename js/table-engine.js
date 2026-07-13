/* ============================================================
   Success Planner — table-engine.js
   Generic editable progress-table renderer, shared by every
   subject page. One instance per table on the page.

   Cell click (view mode):  empty -> tick -> cross -> tick ...
   Clearing a cell back to empty is an editor-only action.
   ============================================================ */
(function (global) {
  function uid(prefix) {
    return prefix + Math.random().toString(36).slice(2, 9);
  }

  function cellSymbol(v) {
    return v === "tick" ? "✅" : v === "cross" ? "❌" : "☐";
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  class SPTable {
    constructor(opts) {
      this.container = opts.container;
      this.storageKey = opts.storageKey;
      this.defaultData = opts.defaultData;
      this.onProgress = opts.onProgress || function () {};
      this.subjectKey = opts.subjectKey || null;
      this.partKey = opts.partKey || "main";
      this.data = null;
      this.expanded = new Set();
      this.undoStack = [];
      this.redoStack = [];
      window.addEventListener("sp:editorchange", () => this.render());
      window.addEventListener("sp:authchange", () => this.render());
    }

    async load() {
      this.data = await SPStorage.load(this.storageKey, deepClone(this.defaultData));
      this.render();
    }

    snapshot() {
      this.undoStack.push(deepClone(this.data));
      if (this.undoStack.length > 60) this.undoStack.shift();
      this.redoStack = [];
    }

    undo() {
      if (!this.undoStack.length) return;
      this.redoStack.push(deepClone(this.data));
      this.data = this.undoStack.pop();
      this.persist(false);
      this.render();
    }

    redo() {
      if (!this.redoStack.length) return;
      this.undoStack.push(deepClone(this.data));
      this.data = this.redoStack.pop();
      this.persist(false);
      this.render();
    }

    colCellCount(col) {
      return col.type === "group" ? col.count : 1;
    }

    totalInteractiveCells() {
      const cols = this.data.columns.filter((c) => c.type !== "text");
      return this.data.rows.length * cols.reduce((s, c) => s + this.colCellCount(c), 0);
    }

    countTicks() {
      let ticks = 0;
      const cols = this.data.columns.filter((c) => c.type !== "text");
      this.data.rows.forEach((row) => {
        cols.forEach((c) => {
          const v = row.cells[c.key];
          if (c.type === "group") ticks += (v || []).filter((x) => x === "tick").length;
          else if (v === "tick") ticks += 1;
        });
      });
      return ticks;
    }

    progressPercent() {
      const total = this.totalInteractiveCells();
      if (!total) return 0;
      return Math.round((this.countTicks() / total) * 100);
    }

    persist(touchDate = true) {
      if (touchDate) this.data.updatedDate = SPUtil.todayISO();
      SPStorage.save(this.storageKey, this.data);
      const pct = this.progressPercent();
      this.onProgress(pct, this.data.updatedDate);
      if (this.subjectKey) SPProgress.report(this.subjectKey, this.partKey, pct, this.data.updatedDate);
    }

    cycleCell(row, col, subIndex) {
      if (!SPAuth.isLoggedIn()) {
        SPUtil.toast("Sign in to update progress", "warn");
        return;
      }
      this.snapshot();
      const order = { empty: "tick", tick: "cross", cross: "tick" };
      if (col.type === "group") {
        const arr = row.cells[col.key];
        arr[subIndex] = order[arr[subIndex] || "empty"];
      } else {
        row.cells[col.key] = order[row.cells[col.key] || "empty"];
      }
      SPUtil.playClick();
      this.persist();
      this.render();
    }

    clearCell(row, col, subIndex) {
      this.snapshot();
      if (col.type === "group") row.cells[col.key][subIndex] = "empty";
      else row.cells[col.key] = "empty";
      SPUtil.playClick();
      this.persist();
      this.render();
    }

    addRow() {
      this.snapshot();
      const blank = { chapter: "New chapter" };
      this.data.columns.forEach((c) => {
        if (c.type === "group") blank[c.key] = new Array(c.count).fill("empty");
        else if (c.type === "cell") blank[c.key] = "empty";
      });
      this.data.rows.push({ id: uid("row_"), cells: blank });
      this.persist();
      this.render();
    }

    removeRow(rowId) {
      if (!confirm("Remove this row?")) return;
      this.snapshot();
      this.data.rows = this.data.rows.filter((r) => r.id !== rowId);
      this.persist();
      this.render();
    }

    addColumn() {
      const label = prompt("New column name:");
      if (!label) return;
      const isGroup = confirm("Should this column have numbered sub-items (e.g. Lecture 1-10)?\nOK = yes, Cancel = single cell");
      let count = 1;
      if (isGroup) {
        count = parseInt(prompt("How many sub-items?", "10"), 10) || 1;
      }
      this.snapshot();
      const key = uid("col_");
      this.data.columns.push({ key, label, type: isGroup ? "group" : "cell", count });
      this.data.rows.forEach((r) => {
        r.cells[key] = isGroup ? new Array(count).fill("empty") : "empty";
      });
      this.persist();
      this.render();
    }

    removeColumn(colKey) {
      if (colKey === this.data.columns[0].key) {
        SPUtil.toast("The first column can't be removed", "warn");
        return;
      }
      if (!confirm("Remove this column?")) return;
      this.snapshot();
      this.data.columns = this.data.columns.filter((c) => c.key !== colKey);
      this.data.rows.forEach((r) => delete r.cells[colKey]);
      this.persist();
      this.render();
    }

    reorderColumn(fromKey, toKey) {
      const cols = this.data.columns;
      if (fromKey === cols[0].key || toKey === cols[0].key) return; // lock first col
      const fromIdx = cols.findIndex((c) => c.key === fromKey);
      const toIdx = cols.findIndex((c) => c.key === toKey);
      if (fromIdx < 0 || toIdx < 0) return;
      this.snapshot();
      const [moved] = cols.splice(fromIdx, 1);
      cols.splice(toIdx, 0, moved);
      this.persist(false);
      this.render();
    }

    setColor(target, key, color) {
      this.snapshot();
      const store = target === "row" ? (this.data.rowColors ||= {}) : (this.data.colColors ||= {});
      store[key] = color;
      this.persist(false);
      this.render();
    }

    renameChapter(row, value) {
      this.snapshot();
      row.cells.chapter = value;
      this.persist(false);
    }

    renameColumnLabel(col, value) {
      this.snapshot();
      col.label = value;
      this.persist(false);
      this.render();
    }

    /* ------------------------- render ------------------------- */
    render() {
      const editor = SPAuth.isEditorMode();
      const loggedIn = SPAuth.isLoggedIn();
      const d = this.data;
      const el = document.createElement("div");
      el.className = "sp-table-wrap";

      // toolbar (editor actions)
      if (editor) {
        const bar = document.createElement("div");
        bar.className = "sp-edit-toolbar";
        bar.innerHTML = `
          <button class="sp-btn" data-act="undo">↶ Undo</button>
          <button class="sp-btn" data-act="redo">↷ Redo</button>
          <button class="sp-btn" data-act="add-row">+ Row</button>
          <button class="sp-btn" data-act="add-col">+ Column</button>
          <span class="sp-edit-hint">Editor mode — drag column headers to reorder, click text to rename, use the swatches to recolor.</span>
        `;
        bar.querySelector('[data-act="undo"]').onclick = () => this.undo();
        bar.querySelector('[data-act="redo"]').onclick = () => this.redo();
        bar.querySelector('[data-act="add-row"]').onclick = () => this.addRow();
        bar.querySelector('[data-act="add-col"]').onclick = () => this.addColumn();
        el.appendChild(bar);
      }

      const table = document.createElement("table");
      table.className = "sp-table";

      // header
      const thead = document.createElement("thead");
      const trh = document.createElement("tr");
      d.columns.forEach((col, i) => {
        const th = document.createElement("th");
        th.className = "sp-th" + (i === 0 ? " sp-th--first" : "");
        if (d.colColors && d.colColors[col.key]) th.style.background = d.colColors[col.key];
        th.draggable = editor && i !== 0;
        th.dataset.key = col.key;

        const labelSpan = document.createElement("span");
        labelSpan.textContent = col.label + (col.type === "group" ? ` (${col.count})` : "");
        labelSpan.contentEditable = editor;
        labelSpan.className = "sp-th-label";
        labelSpan.onblur = () => this.renameColumnLabel(col, labelSpan.textContent.replace(/\s*\(\d+\)$/, "").trim());
        th.appendChild(labelSpan);

        if (col.type === "group") {
          const toggle = document.createElement("button");
          toggle.className = "sp-group-toggle";
          toggle.textContent = this.expanded.has(col.key) ? "▾" : "▸";
          toggle.title = "Expand / collapse";
          toggle.onclick = () => {
            SPUtil.playClick();
            this.expanded.has(col.key) ? this.expanded.delete(col.key) : this.expanded.add(col.key);
            this.render();
          };
          th.appendChild(toggle);
        }

        if (editor && i !== 0) {
          const controls = document.createElement("span");
          controls.className = "sp-th-controls";
          const color = document.createElement("input");
          color.type = "color";
          color.className = "sp-swatch";
          color.value = (d.colColors && d.colColors[col.key]) || "#ffffff";
          color.oninput = () => this.setColor("col", col.key, color.value);
          controls.appendChild(color);
          const del = document.createElement("button");
          del.className = "sp-th-del";
          del.textContent = "✕";
          del.onclick = () => this.removeColumn(col.key);
          controls.appendChild(del);
          th.appendChild(controls);

          th.addEventListener("dragstart", (e) => e.dataTransfer.setData("text/key", col.key));
          th.addEventListener("dragover", (e) => e.preventDefault());
          th.addEventListener("drop", (e) => {
            e.preventDefault();
            this.reorderColumn(e.dataTransfer.getData("text/key"), col.key);
          });
        }
        trh.appendChild(th);
      });
      thead.appendChild(trh);
      table.appendChild(thead);

      // body
      const tbody = document.createElement("tbody");
      d.rows.forEach((row) => {
        const tr = document.createElement("tr");
        if (d.rowColors && d.rowColors[row.id]) tr.style.background = d.rowColors[row.id];

        d.columns.forEach((col, i) => {
          const td = document.createElement("td");
          td.className = "sp-td" + (i === 0 ? " sp-td--first" : "");

          if (col.type === "text") {
            const span = document.createElement("span");
            span.textContent = row.cells[col.key];
            span.contentEditable = editor;
            span.className = "sp-chapter-text";
            span.onblur = () => this.renameChapter(row, span.textContent.trim());
            td.appendChild(span);
            if (editor) {
              const del = document.createElement("button");
              del.className = "sp-row-del";
              del.textContent = "✕";
              del.title = "Remove row";
              del.onclick = () => this.removeRow(row.id);
              td.appendChild(del);
              const color = document.createElement("input");
              color.type = "color";
              color.className = "sp-swatch sp-swatch--row";
              color.value = (d.rowColors && d.rowColors[row.id]) || "#ffffff";
              color.oninput = () => this.setColor("row", row.id, color.value);
              td.appendChild(color);
            }
          } else if (col.type === "group") {
            const wrap = document.createElement("div");
            wrap.className = "sp-group-cell";
            if (this.expanded.has(col.key)) {
              row.cells[col.key].forEach((v, si) => {
                wrap.appendChild(this.buildCellButton(row, col, si, v, editor, loggedIn, si + 1));
              });
            } else {
              const done = row.cells[col.key].filter((x) => x === "tick").length;
              const summary = document.createElement("button");
              summary.className = "sp-group-summary";
              summary.textContent = `${done}/${col.count}`;
              summary.onclick = () => { this.expanded.add(col.key); this.render(); };
              wrap.appendChild(summary);
            }
            td.appendChild(wrap);
          } else {
            td.appendChild(this.buildCellButton(row, col, null, row.cells[col.key], editor, loggedIn));
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      el.appendChild(table);

      this.container.innerHTML = "";
      this.container.appendChild(el);
    }

    buildCellButton(row, col, subIndex, value, editor, loggedIn, numLabel) {
      const btn = document.createElement("button");
      btn.className = `sp-cell sp-cell--${value || "empty"}`;
      btn.textContent = cellSymbol(value) + (numLabel ? "" : "");
      if (numLabel) btn.title = `${col.label} ${numLabel}`;
      btn.disabled = !loggedIn;
      btn.onclick = (e) => {
        if (editor && e.shiftKey) this.clearCell(row, col, subIndex);
        else this.cycleCell(row, col, subIndex);
      };
      if (editor) {
        btn.title = (btn.title ? btn.title + " — " : "") + "Shift+click to clear";
      }
      return btn;
    }
  }

  global.SPTable = SPTable;
})(window);
