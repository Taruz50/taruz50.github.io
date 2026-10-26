(() => {
  requestAnimationFrame(() => document.body.classList.add("is-ready"));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const items = document.querySelectorAll("[data-poetry-reveal]");

  if (reduced || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    items.forEach((el) => observer.observe(el));
  }

  document.querySelectorAll(".poem-card").forEach((card) => {
    if (reduced || !finePointer) return;
    card.addEventListener("pointermove", (event) => {
      const r = card.getBoundingClientRect();
      const x = (event.clientX - r.left) / r.width - 0.5;
      const y = (event.clientY - r.top) / r.height - 0.5;
      card.style.transform = `translateY(-8px) rotateX(${(-y * 2.4).toFixed(2)}deg) rotateY(${(x * 2.8).toFixed(2)}deg)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });

  const handwritingTargets = [...document.querySelectorAll("[data-handwrite]")];

  const prepareHandwriting = (el) => {
    if (el.dataset.handwriteReady) return;
    const text = el.textContent ?? "";
    el.textContent = "";
    el.setAttribute("aria-label", text);

    [...text].forEach((char) => {
      const span = document.createElement("span");
      span.className = "handwrite-char";
      span.textContent = char === " " ? "\u00a0" : char;
      el.appendChild(span);
    });

    el.dataset.handwriteReady = "true";
  };

  const playHandwriting = (el) => {
    if (reduced || el.dataset.handwriteLooping === "true") return;
    el.dataset.handwriteLooping = "true";

    const chars = [...el.querySelectorAll(".handwrite-char")];
    const writeCycle = () => {
      let delay = 0;

      chars.forEach((char, index) => {
        const glyph = char.textContent;
        const isSpace = glyph === "\u00a0";
        const punctuationPause = /[,.!?]/.test(glyph || "") ? 150 : 0;
        const naturalVariation = (index % 4) * 9 + (index % 3) * 6;
        delay += isSpace ? 38 : 52 + naturalVariation;
        window.setTimeout(() => char.classList.add("is-written"), delay);
        delay += punctuationPause;
      });

      const hold = 1800;
      const retractStart = delay + hold;

      [...chars].reverse().forEach((char, index) => {
        window.setTimeout(() => char.classList.remove("is-written"), retractStart + index * 38);
      });

      const cycleDuration = retractStart + chars.length * 38 + 900;
      window.setTimeout(writeCycle, cycleDuration);
    };

    writeCycle();
  };

  handwritingTargets.forEach(prepareHandwriting);

  if (reduced) {
    handwritingTargets.forEach((el) => {
      el.querySelectorAll(".handwrite-char").forEach((char) => char.classList.add("is-written"));
    });
  } else if ("IntersectionObserver" in window) {
    const handwritingObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        playHandwriting(entry.target);
      });
    }, { threshold: 0.35, rootMargin: "0px 0px -12% 0px" });
    handwritingTargets.forEach((el) => handwritingObserver.observe(el));
  } else {
    handwritingTargets.forEach(playHandwriting);
  }
})();