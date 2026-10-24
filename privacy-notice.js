(() => {
  const key = "taruz-privacy-notice-seen";
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const hasSeen = () => {
    try { return sessionStorage.getItem(key) === "true"; } catch { return false; }
  };
  const markSeen = () => {
    try { sessionStorage.setItem(key, "true"); } catch { /* Browsing remains available if storage is blocked. */ }
  };
  const loadStyles = () => {
    if (document.querySelector('link[data-privacy-notice-style]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "privacy-notice.css";
    link.dataset.privacyNoticeStyle = "";
    document.head.append(link);
  };
  const show = () => {
    if (hasSeen()) return;
    loadStyles();
    const notice = document.createElement("aside");
    notice.className = "privacy-welcome";
    notice.setAttribute("role", "region");
    notice.setAttribute("aria-labelledby", "privacy-welcome-title");
    notice.innerHTML = `
      <div class="privacy-welcome__paper">
        <p class="privacy-welcome__eyebrow">TARUZ CREATIVE / A SMALL NOTE</p>
        <h2 id="privacy-welcome-title">Lest you get<br /><em>hoodwinked.</em></h2>
        <p>A quick word on privacy: information you choose to share with Taruz is used to respond to enquiries and manage confirmed projects. We don't use advertising or analytics tracking.</p>
        <p class="privacy-welcome__closing">Nothing sneaky hiding in the margins.</p>
        <div class="privacy-welcome__actions"><button type="button" data-privacy-notice-dismiss>Got it</button><a href="privacy.html">Privacy details <span aria-hidden="true">→</span></a></div>
      </div>`;
    const dismiss = () => { markSeen(); notice.classList.add("is-leaving"); window.setTimeout(() => notice.remove(), reduceMotion ? 0 : 180); };
    notice.querySelector("[data-privacy-notice-dismiss]").addEventListener("click", dismiss);
    document.body.append(notice);
    if (!reduceMotion) requestAnimationFrame(() => notice.classList.add("is-visible"));
    const button = notice.querySelector("[data-privacy-notice-dismiss]");
    window.setTimeout(() => button.focus({ preventScroll: true }), reduceMotion ? 0 : 180);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", show, { once: true }); else show();
})();
