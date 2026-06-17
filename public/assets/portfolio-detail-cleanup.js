(() => {
  const PRODUCT_LABELS = {
    zh: "产品页",
    en: "Product page",
  };

  function currentLang() {
    const select = document.querySelector(".site-topbar-lang select");
    const value = select && typeof select.value === "string" ? select.value : "";
    return value === "en" ? "en" : "zh";
  }

  function simplifyProjectDetail(root = document) {
    root
      .querySelectorAll(
        ".project-detail-modal .project-detail-updated," +
          ".project-detail-modal .project-detail-signal-strip," +
          ".project-detail-modal .project-detail-preview-strip," +
          ".project-detail-modal .project-detail-section," +
          ".project-detail-modal .project-detail-unlock-panel"
      )
      .forEach((node) => node.remove());

    root.querySelectorAll(".project-detail-modal .project-detail-action-list").forEach((list) => {
      const links = Array.from(list.querySelectorAll("a.project-detail-action-link"));
      if (!links.length) {
        return;
      }

      const preferred =
        links.find((link) => link.classList.contains("is-primary")) || links[links.length - 1];
      const href = preferred.getAttribute("href");
      if (!href) {
        return;
      }

      const link = document.createElement("a");
      link.className = "project-detail-action-link is-primary";
      link.href = href;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = PRODUCT_LABELS[currentLang()];
      list.replaceChildren(link);
    });
  }

  function start() {
    simplifyProjectDetail(document);
    const observer = new MutationObserver(() => simplifyProjectDetail(document));
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
