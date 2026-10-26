(() => {
  requestAnimationFrame(() => document.body.classList.add("is-ready"));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  handwritingTargets.forEach((el) => {
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
  });

  const revealBlocks = [...document.querySelectorAll("[data-tribute-reveal]")];

  const updateScrollState = () => {
    if (reduced) return;
    const vh = window.innerHeight || 1;

    revealBlocks.forEach((block) => {
      const rect = block.getBoundingClientRect();
      const enter = 1 - Math.min(1, Math.max(0, (rect.top - vh * .12) / (vh * .76)));
      const leave = Math.min(1, Math.max(0, (rect.bottom - vh * .06) / (vh * .58)));
      const strength = Math.max(.08, Math.min(1, Math.min(enter, leave) * 1.18));
      block.style.setProperty("--tribute-scroll-opacity", strength.toFixed(3));
      block.classList.toggle("is-visible", strength > .12);
    });

    handwritingTargets.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const enter = 1 - Math.min(1, Math.max(0, (rect.top - vh * .22) / (vh * .55)));
      const leave = Math.min(1, Math.max(0, (rect.bottom - vh * .08) / (vh * .48)));
      const progress = Math.max(0, Math.min(1, Math.min(enter * 1.12, leave * 1.2)));
      const chars = [...el.querySelectorAll(".handwrite-char")];
      const written = Math.floor(progress * chars.length);
      chars.forEach((char,index) => char.classList.toggle("is-written", index < written));
    });
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateScrollState();
      ticking = false;
    });
  };

  updateScrollState();
  addEventListener("scroll", onScroll, { passive:true });
  addEventListener("resize", onScroll);

  if (reduced) {
    revealBlocks.forEach((block) => {
      block.classList.add("is-visible");
      block.style.setProperty("--tribute-scroll-opacity","1");
    });
    handwritingTargets.forEach((el) => {
      el.querySelectorAll(".handwrite-char").forEach((char) => char.classList.add("is-written"));
    });
  }
})();