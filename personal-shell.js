(() => {
  const header = document.querySelector("[data-personal-header]");
  const menuBtn = document.querySelector("[data-personal-menu-btn]");
  const navLinks = document.querySelector("[data-personal-nav-links]");
  const icon = menuBtn?.querySelector("i");

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
    if (window.innerWidth > 800) closeMenu();
  }, { passive:true });
})();