(function () {
  const PROJECTS = {
    "book-ingest": {
      titles: ["Book Ingest"],
      archive:
        "https://github.com/LiDeChi/wordm-personal-site/releases/download/wordm-deploy-kits-current/book_ingest.tar.gz",
      filename: "book_ingest.tar.gz",
      allowDerivedExperience: false,
    },
    focusor: {
      titles: ["Focusor"],
      archive:
        "https://github.com/LiDeChi/wordm-personal-site/releases/download/wordm-deploy-kits-current/focusor.tar.gz",
      filename: "focusor.tar.gz",
      experienceHref: "https://p-focusor.wordm.us/?lang=zh",
      allowDerivedExperience: false,
    },
    gridnote: {
      titles: ["Gridnote"],
      archive:
        "https://github.com/LiDeChi/wordm-personal-site/releases/download/wordm-deploy-kits-current/gridnote.tar.gz",
      filename: "gridnote.tar.gz",
      experienceHref: "https://p-gridnote.wordm.us/?lang=zh",
      allowDerivedExperience: false,
    },
    "ai-stroke-writer": {
      titles: ["AI Stroke Writer"],
      archive:
        "https://github.com/LiDeChi/wordm-personal-site/releases/download/wordm-deploy-kits-current/ai-stroke-writer.tar.gz",
      filename: "ai-stroke-writer.tar.gz",
      experienceHref: "https://p-ai-stroke-writer.wordm.us/?lang=zh",
      allowDerivedExperience: false,
    },
    "apple-notes-webclipper": {
      titles: ["iNote", "apple-notes-webclipper"],
      archive:
        "https://github.com/LiDeChi/wordm-personal-site/releases/download/wordm-deploy-kits-current/apple-notes-webclipper.tar.gz",
      filename: "apple-notes-webclipper.tar.gz",
      experienceHref: "https://inote.wordm.us/",
      allowDerivedExperience: false,
    },
  };
  const ALLOWED_SLUGS = new Set(Object.keys(PROJECTS));

  function absolute(path) {
    return new URL(path, window.location.origin).toString();
  }

  function langIsZh() {
    return !new URLSearchParams(window.location.search).get("lang")?.startsWith("en");
  }

  function currentSlug(modal) {
    const fromUrl = new URLSearchParams(window.location.search).get("project");
    if (fromUrl && PROJECTS[fromUrl]) return fromUrl;
    const title = modal.querySelector(".project-detail-title")?.textContent?.trim();
    if (!title) return null;
    return Object.entries(PROJECTS).find(([, config]) => config.titles.includes(title))?.[0] || null;
  }

  function normalizeLocation() {
    const url = new URL(window.location.href);
    const project = url.searchParams.get("project");
    if (!project || ALLOWED_SLUGS.has(project)) return;
    url.searchParams.delete("project");
    url.searchParams.delete("unlock");
    url.searchParams.delete("checkout_slug");
    window.history.replaceState(null, "", url.toString());
  }

  function extractProductLink(modal, config) {
    const links = [...modal.querySelectorAll(".project-detail-action-list a")]
      .map((link) => ({
        href: link.href,
        text: link.textContent.trim(),
      }))
      .filter((link) => link.href);
    if (links.length) {
      return (
        links.find((link) => /项目|product page|project page|project/i.test(link.text)) ||
        links.find((link) => /打开|open/i.test(link.text)) ||
        links.find((link) => /线上|live|体验|demo|experience/i.test(link.text)) ||
        links[0]
      );
    }
    if (config && config.experienceHref) {
      return {
        href: config.experienceHref,
        text: "product",
      };
    }
    return null;
  }

  function appendButton(container, label, href, options = {}) {
    if (!href) return;
    const { download = null, external = false } = options;
    const link = document.createElement("a");
    link.className = "public-minimal-action";
    link.href = href;
    if (download) {
      link.download = download;
    }
    if (external) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        window.open(href, "_blank", "noopener,noreferrer");
      });
    } else {
      link.addEventListener("click", (event) => {
        event.stopPropagation();
      });
    }
    link.textContent = label;
    container.appendChild(link);
  }

  function buildMinimalPage(data) {
    const zh = langIsZh();
    const page = document.createElement("section");
    page.className = "project-detail-page public-minimal-page";

    const closeRow = document.createElement("div");
    closeRow.className = "public-minimal-topbar";
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "unlock-plan-btn project-detail-back";
    closeButton.textContent = zh ? "关闭" : "Close";
    closeButton.addEventListener("click", () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      const modal = page.closest(".project-detail-modal");
      modal?.click();
    });
    closeRow.appendChild(closeButton);

    const copy = document.createElement("div");
    copy.className = "public-minimal-copy";
    const title = document.createElement("h2");
    title.className = "project-detail-title public-minimal-title";
    title.textContent = data.title;
    copy.appendChild(title);
    if (data.deck) {
      const deck = document.createElement("p");
      deck.className = "project-detail-deck public-minimal-deck";
      deck.textContent = data.deck;
      copy.appendChild(deck);
    }
    if (data.summary) {
      const summary = document.createElement("p");
      summary.className = "project-detail-summary public-minimal-summary";
      summary.textContent = data.summary;
      copy.appendChild(summary);
    }

    const actions = document.createElement("div");
    actions.className = "public-minimal-actions";
    appendButton(actions, zh ? "产品页" : "Product page", data.productHref, {
      external: true,
    });
    copy.appendChild(actions);

    const media = document.createElement("div");
    media.className = "public-minimal-media";
    if (data.imageSrc) {
      const image = document.createElement("img");
      image.className = "public-minimal-image";
      image.src = data.imageSrc;
      image.alt = data.title;
      image.loading = "lazy";
      media.appendChild(image);
    }

    page.appendChild(closeRow);
    page.appendChild(copy);
    page.appendChild(media);
    return page;
  }

  function enhanceModal(modal) {
    if (!modal || modal.dataset.publicDownloadEnhanced === "1") return;
    const slug = currentSlug(modal);
    const config = slug ? PROJECTS[slug] : null;
    const page = modal.querySelector(".project-detail-page");
    if (!config || !page) {
      modal.click();
      return;
    }

    const imageSrc =
      modal.querySelector(".project-detail-visual-image")?.getAttribute("src") ||
      modal.querySelector(".project-detail-preview-grid img")?.getAttribute("src") ||
      "";
    const product = extractProductLink(modal, config);
    const title = modal.querySelector(".project-detail-title")?.textContent?.trim() || config.titles[0];
    const deck = modal.querySelector(".project-detail-deck")?.textContent?.trim() || "";
    const summary = modal.querySelector(".project-detail-summary")?.textContent?.trim() || "";

    modal.dataset.publicDownloadEnhanced = "1";
    modal.classList.add("public-minimal-modal");
    page.replaceWith(
      buildMinimalPage({
        title,
        deck,
        summary,
        imageSrc,
        productHref: product?.href || "",
      })
    );
  }

  function scan() {
    normalizeLocation();
    document.querySelectorAll(".project-detail-modal").forEach(enhanceModal);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scan);
  } else {
    scan();
  }

  new MutationObserver(scan).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
