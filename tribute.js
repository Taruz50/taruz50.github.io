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

  const handwritingTargets = [...document.querySelectorAll("[data-handwrite]")];

  const prepareHandwriting = (el) => {
    if (el.dataset.handwriteReady) return;
    const text = el.textContent ?? "";
    el.textContent = "";
    el.setAttribute("aria-label", text);

    [...text].forEach((char, index) => {
      const span = document.createElement("span");
      span.className = "handwrite-char";
      span.textContent = char === " " ? "\u00a0" : char;
      span.style.setProperty("--hand-index", index);
      el.appendChild(span);
    });

    el.dataset.handwriteReady = "true";
  };

  handwritingTargets.forEach(prepareHandwriting);

  const playHandwriting = (el) => {
    if (reduced || el.dataset.handwritePlayed === "true") return;
    el.dataset.handwritePlayed = "true";

    const chars = [...el.querySelectorAll(".handwrite-char")];
    let delay = 0;

    chars.forEach((char, index) => {
      const glyph = char.textContent;
      const isSpace = glyph === "\u00a0";
      const punctuationPause = /[,.!?]/.test(glyph || "") ? 120 : 0;
      const naturalVariation = (index % 4) * 8 + (index % 3) * 5;
      delay += isSpace ? 34 : 46 + naturalVariation;

      window.setTimeout(() => {
        char.classList.add("is-written");
      }, delay);

      delay += punctuationPause;
    });
  };

  if (reduced) {
    handwritingTargets.forEach((el) => {
      el.querySelectorAll(".handwrite-char").forEach((char) => char.classList.add("is-written"));
    });
  } else if ("IntersectionObserver" in window) {
    const handwritingObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        playHandwriting(entry.target);
        handwritingObserver.unobserve(entry.target);
      });
    }, { threshold: 0.35, rootMargin: "0px 0px -12% 0px" });

    handwritingTargets.forEach((el) => handwritingObserver.observe(el));
  } else {
    handwritingTargets.forEach(playHandwriting);
  }
})();