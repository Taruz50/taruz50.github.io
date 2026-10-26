(() => {
  requestAnimationFrame(() => document.body.classList.add("is-ready"));

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reveals = document.querySelectorAll("[data-tribute-reveal]");

  if (reduced || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el) => observer.observe(el));
  }

  const stage = document.querySelector("[data-paint-stage]");
  const replay = document.querySelector("[data-ink-replay]");
  const image = document.querySelector(".paint-image");
  const brush = document.querySelector("[data-ink-brush]");

  const markImageMissing = () => stage?.classList.add("is-missing");
  if (image) {
    image.addEventListener("error", markImageMissing, { once:true });
    if (image.complete && image.naturalWidth === 0) markImageMissing();
  }

  const playInk = () => {
    if (!stage || !brush || reduced) return;
    stage.classList.remove("is-brushing");
    void stage.offsetWidth;
    stage.classList.add("is-brushing");
  };

  if (stage && brush && !reduced) {
    requestAnimationFrame(() => requestAnimationFrame(playInk));
  }

  replay?.addEventListener("click", playInk);
})();