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
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el) => observer.observe(el));
  }

  const stage = document.querySelector("[data-paint-stage]");
  const trigger = document.querySelector("[data-paint-trigger]");
  if (stage && !reduced) {
    stage.addEventListener("pointermove", (event) => {
      const r = stage.getBoundingClientRect();
      const x = (event.clientX - r.left) / r.width - 0.5;
      const y = (event.clientY - r.top) / r.height - 0.5;
      stage.style.transform = `translate3d(${(x * 8).toFixed(1)}px,${(y * 7).toFixed(1)}px,0) rotate(${(x * 1).toFixed(2)}deg)`;
    });
    stage.addEventListener("pointerleave", () => {
      stage.style.transform = "";
    });
  }

  if (stage && trigger) {
    trigger.addEventListener("click", () => {
      const revealed = stage.classList.toggle("is-revealed");
      trigger.textContent = revealed ? "COVER THE PORTRAIT" : "REVEAL THE PORTRAIT";
    });
  }
})();