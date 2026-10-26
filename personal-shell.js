(() => {
  const header = document.querySelector("[data-personal-header]");
  const menuBtn = document.querySelector("[data-personal-menu-btn]");
  const navLinks = document.querySelector("[data-personal-nav-links]");
  const icon = menuBtn?.querySelector("i");
  const brand = document.querySelector(".personal-shell-brand");

  const current = (window.location.pathname.split("/").pop() || "home.html").toLowerCase();
  const items = [
    ["home.html", "Creative Home"],
    ["gallery.html", "Photography"],
    ["design.html", "Graphic Design"],
    ["tutorials.html", "Tutorials"],
    ["services.html", "Services"],
    ["video.html", "Moving Image"],
    ["andrew.html", "About"],
    ["poetry.html", "Poetry"],
    ["tribute.html", "Tribute"],
    ["index.html", "Professional Portfolio ↗"]
  ];

  if (brand) {
    brand.href = "home.html";
    brand.setAttribute("aria-label", "Taruz creative home");
  }

  if (navLinks) {
    navLinks.innerHTML = items
      .filter(([href]) => href.toLowerCase() !== current)
      .map(([href, label]) => `<li><a${href === "index.html" ? ' class="quiet-link"' : ""} href="${href}">${label}</a></li>`)
      .join("");
  }

  const closeMenu = () => {
    navLinks?.classList.remove("open");
    header?.classList.remove("menu-open");
    menuBtn?.setAttribute("aria-expanded", "false");
    if (icon) icon.className = "ri-menu-line";
  };

  menuBtn?.addEventListener("click", () => {
    const open = !navLinks?.classList.contains("open");
    navLinks?.classList.toggle("open", open);
    header?.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    if (icon) icon.className = open ? "ri-close-line" : "ri-menu-line";
  });

  navLinks?.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 12);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive:true });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeMenu();
  }, { passive:true });
})();