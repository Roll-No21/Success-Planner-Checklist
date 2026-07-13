/* ============================================================
   Success Planner — global config
   Fill in GOOGLE_CLIENT_ID with your own Google Cloud OAuth
   Client ID (Google Cloud Console → APIs & Services →
   Credentials → OAuth client ID → Web application).
   Add this site's URL to "Authorized JavaScript origins".
   ============================================================ */
window.APP_CONFIG = {
  GOOGLE_CLIENT_ID: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",

  // Repo the app syncs progress data to when a user connects GitHub.
  GITHUB_OWNER: "DecodingM-bit",
  GITHUB_REPO: "Success-Planner---Table",
  GITHUB_BRANCH: "main",

  // Cell cycle: empty -> tick -> cross -> empty
  CELL_STATES: ["empty", "tick", "cross"],

  COLORS: {
    lightBg: "#FFE4C4",
    darkBg: "#696969",
    headerBanner: "#C97B63",   // warm terracotta-brick, echoes cherry-bark
    accentBlossom: "#F2A6C1",  // sakura pink
    accentBlossomDeep: "#D6668F",
    firstColBg: "#AEE0F5",     // "light blue" required for first row/col
    tick: "#3C8F5C",
    cross: "#C1503D",
    empty: "#ffffff"
  }
};
