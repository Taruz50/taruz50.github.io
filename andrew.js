(() => {
  requestAnimationFrame(() => document.body.classList.add("is-ready"));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reveals = document.querySelectorAll("[data-story-beat], [data-reveal]");

  if (reduced || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el) => observer.observe(el));
  }

  const journey = document.querySelector(".story-journey");
  const progress = document.querySelector("[data-story-progress]");
  const parallaxItems = document.querySelectorAll("[data-parallax]");

  const updateMotion = () => {
    if (!journey || reduced) return;

    const rect = journey.getBoundingClientRect();
    const viewport = window.innerHeight || document.documentElement.clientHeight;
    const total = Math.max(1, rect.height - viewport);
    const travelled = Math.min(total, Math.max(0, -rect.top));
    const pct = Math.min(100, Math.max(0, (travelled / total) * 100));
    if (progress) progress.style.setProperty("--story-progress", pct + "%");

    parallaxItems.forEach((item) => {
      const r = item.getBoundingClientRect();
      const center = r.top + r.height / 2;
      const delta = (center - viewport / 2) / viewport;
      const shift = Math.max(-18, Math.min(18, delta * -24));
      item.style.transform = "translate3d(0," + shift.toFixed(1) + "px,0)";
    });
  };

  let ticking = false;
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateMotion();
      ticking = false;
    });
  };

  updateMotion();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);

  const hero = document.querySelector(".personal-hero");
  const heroFrame = document.querySelector(".hero-frame");
  if (hero && heroFrame && !reduced && finePointer) {
    hero.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      heroFrame.style.transform = `translate3d(${(x * 10).toFixed(1)}px,${(y * 8).toFixed(1)}px,0) rotate(${(x * 1.2).toFixed(2)}deg)`;
    });
    hero.addEventListener("pointerleave", () => {
      heroFrame.style.transform = "";
    });
  }

  document.querySelectorAll(".early-work__image").forEach((img) => {
    const frame = img.closest(".early-work__frame");
    const markMissing = () => {
      img.hidden = true;
      if (frame) frame.classList.add("is-missing");
    };
    img.addEventListener("error", markMissing, { once: true });
    if (img.complete && img.naturalWidth === 0) markMissing();
  });

})();