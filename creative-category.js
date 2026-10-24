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

  if (!document.querySelector('script[src="privacy-notice.js"]')) {
    const privacyNotice = document.createElement("script");
    privacyNotice.src = "privacy-notice.js";
    document.body.append(privacyNotice);
  }

})();
