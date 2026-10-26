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
    }, { threshold: 0.14, rootMargin: "0px 0px -10% 0px" });

    reveals.forEach((el) => observer.observe(el));
  }

  const stage = document.querySelector("[data-paint-stage]");
  const trigger = document.querySelector("[data-paint-trigger]");
  const reset = document.querySelector("[data-paint-reset]");
  const image = document.querySelector(".paint-image");

  const markImageMissing = () => stage?.classList.add("is-missing");
  if (image) {
    image.addEventListener("error", markImageMissing, { once:true });
    if (image.complete && image.naturalWidth === 0) markImageMissing();
  }

  if (stage && trigger) {
    const revealPortrait = () => {
      stage.classList.remove("is-revealed");
      void stage.offsetWidth;
      stage.classList.add("is-revealed");
      trigger.textContent = "PORTRAIT REVEALED";
      trigger.disabled = true;
      if (reset) reset.hidden = false;
    };

    const resetPortrait = () => {
      stage.classList.remove("is-revealed");
      trigger.textContent = "REVEAL THE PORTRAIT";
      trigger.disabled = false;
      if (reset) reset.hidden = true;
    };

    trigger.addEventListener("click", revealPortrait);
    reset?.addEventListener("click", resetPortrait);
  }
})();