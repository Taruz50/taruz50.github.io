(() => {
  const intro = document.querySelector("[data-tutorial-intro]");
  if (!intro) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileFlow = window.matchMedia("(max-width: 700px)");
  const layers = [...intro.querySelectorAll("[data-parallax]")];
  const beats = [...intro.querySelectorAll("[data-intro-beat]")];
  let frame = null;
  let chapterObserver = null;

  const timingProfiles = {
    desktop: { opening: [0, .20], rest: [.22, .46], force: [.50, .74], signature: [.78, 1.08] },
    tablet: { opening: [0, .21], rest: [.24, .49], force: [.53, .77], signature: [.81, 1.08] },
    mobile: { opening: [0, .23], rest: [.23, .47], force: [.48, .72], signature: [.73, 1.08] }
  };

  const clamp = (value, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));

  const update = () => {
    frame = null;
    if (reducedMotion.matches || mobileFlow.matches) return;

    const bounds = intro.getBoundingClientRect();
    const progress = clamp(-bounds.top / Math.max(1, bounds.height - window.innerHeight));
    const profile = window.innerWidth <= 700 ? timingProfiles.mobile : window.innerWidth <= 900 ? timingProfiles.tablet : timingProfiles.desktop;
    intro.style.setProperty("--intro-progress", progress.toFixed(3));

    layers.forEach((layer) => {
      const depth = Number(layer.dataset.parallax || 0);
      const travel = (progress - 0.42) * depth * 220;
      layer.style.setProperty("--parallax-y", `${travel.toFixed(2)}px`);
    });

    let signatureOpacity = 0;
    beats.forEach((beat) => {
      const [start, end] = profile[beat.dataset.introBeat] || [0, 1];
      const fadeIn = clamp((progress - start) / 0.04);
      // The signature stays present until the sticky scene itself releases.
      const fadeOut = end > 1 ? clamp((1 - progress) / 0.035) : clamp((end - progress) / 0.04);
      const opacity = Math.min(fadeIn, fadeOut);
      beat.style.setProperty("--beat-opacity", opacity.toFixed(3));
      beat.style.setProperty("--beat-shift", `${((1 - opacity) * 10).toFixed(2)}px`);
      if (beat.dataset.introBeat === "signature") signatureOpacity = opacity;
    });

    // FORM is atmosphere, never the sole subject of the closing frame.
    const fragment = intro.querySelector(".tutorials-intro-type-fragment");
    if (fragment) fragment.style.setProperty("--fragment-opacity", signatureOpacity.toFixed(3));
  };

  const requestUpdate = () => {
    if (!frame) frame = window.requestAnimationFrame(update);
  };

  const clearTimelineStyles = () => {
    layers.forEach((layer) => layer.style.removeProperty("--parallax-y"));
    const fragment = intro.querySelector(".tutorials-intro-type-fragment");
    if (fragment) fragment.style.removeProperty("--fragment-opacity");
    beats.forEach((beat) => {
      beat.style.removeProperty("--beat-opacity");
      beat.style.removeProperty("--beat-shift");
    });
  };

  const stopChapterReveals = () => {
    if (chapterObserver) chapterObserver.disconnect();
    chapterObserver = null;
    beats.forEach((beat) => beat.classList.remove("is-revealed"));
  };

  const startChapterReveals = () => {
    if (reducedMotion.matches) return;
    if (!("IntersectionObserver" in window)) {
      beats.forEach((beat) => beat.classList.add("is-revealed"));
      return;
    }
    chapterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-revealed");
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8%" });
    beats.forEach((beat) => chapterObserver.observe(beat));
  };

  const setMotionMode = () => {
    const useMobileFlow = mobileFlow.matches;
    const useTimeline = !reducedMotion.matches && !useMobileFlow;
    intro.classList.toggle("is-static", reducedMotion.matches);
    intro.classList.toggle("is-mobile-flow", useMobileFlow);
    intro.classList.toggle("is-animated", useTimeline);
    stopChapterReveals();
    if (!useTimeline) {
      clearTimelineStyles();
      if (useMobileFlow) startChapterReveals();
      return;
    }
    requestUpdate();
  };

  setMotionMode();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
  reducedMotion.addEventListener("change", setMotionMode);
  mobileFlow.addEventListener("change", setMotionMode);
})();
