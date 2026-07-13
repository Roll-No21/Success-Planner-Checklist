/* ============================================================
   Success Planner — auth.js
   Google Sign-In gates interaction. Editor mode is a further
   toggle available once signed in. GitHub is an optional sync
   target the user connects with their own personal token
   (never stored anywhere but this browser's sessionStorage).
   ============================================================ */
(function (global) {
  const state = {
    user: null,        // { name, email, picture } | null
    editorMode: false
  };

  function emit(name) {
    window.dispatchEvent(new CustomEvent(name, { detail: state }));
  }

  function decodeJwt(token) {
    try {
      const payload = token.split(".")[1];
      return JSON.parse(decodeURIComponent(escape(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))));
    } catch (e) {
      return null;
    }
  }

  function handleGoogleCredential(response) {
    const payload = decodeJwt(response.credential);
    if (!payload) return;
    state.user = { name: payload.name, email: payload.email, picture: payload.picture };
    sessionStorage.setItem("sp:user", JSON.stringify(state.user));
    SPUtil.toast(`Signed in as ${payload.name.split(" ")[0]}`, "success");
    emit("sp:authchange");
  }

  function restoreSession() {
    try {
      const raw = sessionStorage.getItem("sp:user");
      if (raw) state.user = JSON.parse(raw);
    } catch (e) {}
  }

  function signOut() {
    state.user = null;
    state.editorMode = false;
    sessionStorage.removeItem("sp:user");
    SPStorage.disconnectGithub();
    emit("sp:authchange");
    emit("sp:editorchange");
  }

  function toggleEditor() {
    if (!state.user) {
      SPUtil.toast("Sign in to use Editor mode", "warn");
      return;
    }
    state.editorMode = !state.editorMode;
    emit("sp:editorchange");
  }

  function promptGithubConnect() {
    const token = prompt(
      "Paste a GitHub personal access token (repo scope) to sync your progress to GitHub.\n" +
      "This token stays only in this browser tab's memory — it's cleared when you close the tab, " +
      "and is never written into any file.\n\nLeave blank to cancel."
    );
    if (token && token.trim()) {
      SPStorage.connectGithub(token.trim());
      SPUtil.toast("GitHub connected for this session", "success");
      emit("sp:authchange");
    }
  }

  function githubDisconnect() {
    SPStorage.disconnectGithub();
    SPUtil.toast("GitHub disconnected", "info");
    emit("sp:authchange");
  }

  function renderToolbar(container) {
    container.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "sp-toolbar";

    if (state.user) {
      const avatar = document.createElement("img");
      avatar.className = "sp-avatar";
      avatar.src = state.user.picture || "";
      avatar.alt = state.user.name;
      wrap.appendChild(avatar);

      const ghBtn = document.createElement("button");
      ghBtn.className = "sp-btn sp-btn--ghost";
      ghBtn.textContent = SPStorage.isGithubConnected() ? "GitHub ✓" : "Connect GitHub";
      ghBtn.onclick = () => {
        SPUtil.playClick();
        SPStorage.isGithubConnected() ? githubDisconnect() : promptGithubConnect();
      };
      wrap.appendChild(ghBtn);

      const editorBtn = document.createElement("button");
      editorBtn.className = "sp-btn sp-editor-toggle" + (state.editorMode ? " active" : "");
      editorBtn.title = "Editor mode";
      editorBtn.innerHTML = "✏️";
      editorBtn.onclick = () => { SPUtil.playClick(); toggleEditor(); };
      wrap.appendChild(editorBtn);

      const signOutBtn = document.createElement("button");
      signOutBtn.className = "sp-btn sp-btn--ghost";
      signOutBtn.textContent = "Sign out";
      signOutBtn.onclick = () => { SPUtil.playClick(); signOut(); };
      wrap.appendChild(signOutBtn);
    } else {
      const gWrap = document.createElement("div");
      gWrap.id = "sp-google-btn";
      wrap.appendChild(gWrap);

      const note = document.createElement("span");
      note.className = "sp-preview-note";
      note.textContent = "Preview only — sign in to track progress";
      wrap.appendChild(note);
    }

    container.appendChild(wrap);

    if (!state.user && global.google && google.accounts && google.accounts.id) {
      google.accounts.id.renderButton(
        document.getElementById("sp-google-btn"),
        { theme: "outline", size: "medium", shape: "pill" }
      );
    }
  }

  function initGoogle() {
    if (!global.google || !google.accounts || !google.accounts.id) return;
    google.accounts.id.initialize({
      client_id: APP_CONFIG.GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      auto_select: false
    });
  }

  function mountToolbar(container) {
    restoreSession();
    initGoogle();
    renderToolbar(container);
    window.addEventListener("sp:authchange", () => renderToolbar(container));
    window.addEventListener("sp:editorchange", () => renderToolbar(container));
  }

  global.SPAuth = {
    mountToolbar,
    isLoggedIn: () => !!state.user,
    isEditorMode: () => state.editorMode,
    currentUser: () => state.user
  };
})(window);
