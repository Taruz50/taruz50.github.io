(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const headers = [...document.querySelectorAll(".creative-page-header, .creative-nav")];
  const targets = [...document.querySelectorAll("[data-reveal]")];
  const updateHeaderState = () => headers.forEach((header) => header.classList.toggle("is-scrolled", window.scrollY > 12));

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });

  document.querySelectorAll("[data-creative-menu]").forEach((menu) => {
    const links = document.getElementById(menu.getAttribute("aria-controls"));
    if (!links) return;
    menu.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      const icon = menu.querySelector("i");
      menu.classList.toggle("is-open", open);
      menu.setAttribute("aria-expanded", String(open));
      if (icon) {
        icon.classList.toggle("ri-menu-line", !open);
        icon.classList.toggle("ri-close-line", open);
      }
    });
  });

  if (reduced.matches || !("IntersectionObserver" in window)) {
    targets.forEach((target) => target.classList.add("is-visible"));
  } else {
    document.documentElement.classList.add("motion-ready");
    const observer = new IntersectionObserver((entries, instance) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); instance.unobserve(entry.target); }
    }), { threshold: .12, rootMargin: "0px 0px -8%" });
    targets.forEach((target) => observer.observe(target));
  }

  const archive = document.querySelector(".creative-gallery .gallery-container");
  const controls = [...document.querySelectorAll("[data-gallery-controls] button")];
  if (archive && controls.length) {
    const items = [...archive.querySelectorAll(".gallery-item")];
    let activeFilter = "all";

    const updateArchive = () => {
      items.forEach((item) => {
        const category = item.querySelector("img")?.dataset.img;
        const matches = activeFilter === "all" || category === activeFilter;
        item.hidden = !matches;
      });
      controls.forEach((button) => button.classList.toggle("btn-clicked", button.dataset.btn === activeFilter));
    };

    controls.forEach((button) => button.addEventListener("click", () => {
      activeFilter = button.dataset.btn || "all";
      updateArchive();
    }));
    updateArchive();
  }

  const lightbox = document.querySelector("[data-design-lightbox]");
  if (lightbox) {
    const imageOutput = lightbox.querySelector("[data-lightbox-output]");
    const videoOutput = lightbox.querySelector("[data-lightbox-video-output]");
    const caption = lightbox.querySelector("[data-lightbox-caption]");
    const description = lightbox.querySelector("[data-lightbox-description]");
    const close = lightbox.querySelector("[data-lightbox-close]");
    const imageTriggers = [...document.querySelectorAll("[data-lightbox-image]")];
    const videoTriggers = [...document.querySelectorAll("[data-lightbox-video]")];
    let opener = null;

    const closeLightbox = () => {
      lightbox.hidden = true;
      imageOutput.removeAttribute("src");
      imageOutput.hidden = true;
      videoOutput.pause();
      videoOutput.removeAttribute("src");
      videoOutput.removeAttribute("poster");
      videoOutput.hidden = true;
      description.hidden = true;
      description.textContent = "";
      opener?.focus();
    };

    imageTriggers.forEach((trigger) => trigger.addEventListener("click", () => {
      opener = trigger;
      imageOutput.src = trigger.dataset.lightboxImage;
      imageOutput.alt = trigger.dataset.lightboxAlt || "Enlarged design artwork";
      imageOutput.hidden = false;
      caption.textContent = trigger.closest("figure")?.querySelector("figcaption")?.textContent || "Selected Work";
      lightbox.hidden = false;
      close.focus();
    }));

    videoTriggers.forEach((trigger) => trigger.addEventListener("click", () => {
      opener = trigger;
      videoOutput.src = trigger.dataset.lightboxVideo;
      videoOutput.poster = trigger.dataset.lightboxPoster || "";
      videoOutput.hidden = false;
      caption.textContent = trigger.dataset.lightboxTitle || "Design speed run";
      description.textContent = trigger.dataset.lightboxDescription || "";
      description.hidden = !description.textContent;
      lightbox.hidden = false;
      close.focus();
    }));

    close.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (event) => { if (event.target === lightbox) closeLightbox(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !lightbox.hidden) closeLightbox(); });
  }
})();
