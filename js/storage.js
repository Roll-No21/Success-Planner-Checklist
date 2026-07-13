/* ============================================================
   Success Planner — storage.js
   Local-first persistence with optional GitHub sync.
   A signed-in user's GitHub token (theirs, pasted by them) is
   kept only in sessionStorage — never written into any file,
   never sent anywhere except api.github.com.
   ============================================================ */
(function (global) {
  const LS_PREFIX = "sp:";
  const GH_TOKEN_KEY = "sp:github_token";

  function localGet(key) {
    try {
      const raw = localStorage.getItem(LS_PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn("storage.localGet failed", e);
      return null;
    }
  }

  function localSet(key, value) {
    try {
      localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn("storage.localSet failed", e);
      return false;
    }
  }

  function getGithubToken() {
    return sessionStorage.getItem(GH_TOKEN_KEY) || null;
  }

  function setGithubToken(token) {
    if (token) sessionStorage.setItem(GH_TOKEN_KEY, token);
    else sessionStorage.removeItem(GH_TOKEN_KEY);
  }

  function githubHeaders() {
    const token = getGithubToken();
    return {
      Authorization: "token " + token,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    };
  }

  function ghPath(key) {
    return `data/${key}.json`;
  }

  async function githubGetSha(path) {
    const { GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } = APP_CONFIG;
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`;
    const res = await fetch(url, { headers: githubHeaders() });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("GitHub read failed: " + res.status);
    const json = await res.json();
    return json.sha;
  }

  async function pushToGithub(key, data) {
    if (!getGithubToken()) return { ok: false, reason: "not-connected" };
    const { GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } = APP_CONFIG;
    const path = ghPath(key);
    try {
      const sha = await githubGetSha(path);
      const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
      const body = {
        message: `Update ${key} progress — ${new Date().toISOString()}`,
        content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
        branch: GITHUB_BRANCH
      };
      if (sha) body.sha = sha;
      const res = await fetch(url, {
        method: "PUT",
        headers: githubHeaders(),
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error("GitHub write failed: " + res.status);
      return { ok: true };
    } catch (e) {
      console.warn("pushToGithub failed", e);
      return { ok: false, reason: e.message };
    }
  }

  async function pullFromGithub(key) {
    const { GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } = APP_CONFIG;
    const path = ghPath(key);
    try {
      const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${path}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  /* Public API ------------------------------------------------ */
  const Storage = {
    async load(key, fallback) {
      const local = localGet(key);
      if (local) return local;
      const remote = await pullFromGithub(key);
      if (remote) {
        localSet(key, remote);
        return remote;
      }
      return fallback;
    },

    async save(key, data) {
      localSet(key, data);
      if (getGithubToken()) {
        return await pushToGithub(key, data);
      }
      return { ok: true, reason: "local-only" };
    },

    isGithubConnected: () => !!getGithubToken(),
    connectGithub: setGithubToken,
    disconnectGithub: () => setGithubToken(null)
  };

  global.SPStorage = Storage;
})(window);
