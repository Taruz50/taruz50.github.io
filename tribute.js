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

  const markImageMissing = () => stage?.classList.add("is-missing");
  if (image) {
    image.addEventListener("error", markImageMissing, { once:true });
    if (image.complete && image.naturalWidth === 0) markImageMissing();
  }

  let activeInkAnimation = null;

  const playInk = () => {
    if (!stage || !image || reduced) return;

    activeInkAnimation?.cancel();

    image.style.opacity = "1";
    image.style.clipPath = "";
    image.style.webkitClipPath = "";

    const frames = [
      {
        clipPath: "polygon(49% 39%,54% 37%,59% 40%,61% 46%,58% 51%,52% 54%,46% 51%,43% 46%,45% 41%)",
        opacity: 0.03,
        transform: "scale(1.08)",
        offset: 0
      },
      {
        clipPath: "polygon(37% 24%,53% 18%,69% 23%,79% 35%,77% 52%,68% 64%,50% 72%,32% 66%,21% 53%,22% 36%)",
        opacity: 0.42,
        transform: "scale(1.055)",
        offset: 0.30
      },
      {
        clipPath: "polygon(16% 5%,45% -2%,76% 5%,99% 24%,103% 54%,91% 82%,65% 102%,30% 101%,4% 83%,-5% 53%)",
        opacity: 0.82,
        transform: "scale(1.025)",
        offset: 0.66
      },
      {
        clipPath: "polygon(-8% -8%,108% -6%,110% 108%,-10% 110%)",
        opacity: 1,
        transform: "scale(1)",
        offset: 1
      }
    ];

    activeInkAnimation = image.animate(frames, {
      duration: 1900,
      easing: "cubic-bezier(.16,.74,.18,1)",
      fill: "forwards"
    });

    activeInkAnimation.onfinish = () => {
      image.style.clipPath = "polygon(-8% -8%,108% -6%,110% 108%,-10% 110%)";
      image.style.webkitClipPath = "polygon(-8% -8%,108% -6%,110% 108%,-10% 110%)";
      image.style.opacity = "1";
      image.style.transform = "scale(1)";
    };
  };

  if (stage && image && !reduced) {
    requestAnimationFrame(() => requestAnimationFrame(playInk));
  }

  replay?.addEventListener("click", playInk);
})();