(() => {
  requestAnimationFrame(() => document.body.classList.add("is-ready"));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  const handwritingTargets = [...document.querySelectorAll("[data-handwrite]")];
  handwritingTargets.forEach(prepareHandwriting);

  const updateScrollWriting = () => {
    if (reduced) return;
    document.querySelectorAll("[data-scroll-note]").forEach((section) => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const enter = 1 - Math.min(1, Math.max(0, (rect.top - vh * .18) / (vh * .72)));
      const leave = Math.min(1, Math.max(0, (rect.bottom - vh * .08) / (vh * .58)));
      const opacity = Math.max(.12, Math.min(1, Math.min(enter, leave) * 1.15));
      section.style.setProperty("--scroll-opacity", opacity.toFixed(3));

      section.querySelectorAll("[data-handwrite]").forEach((el) => {
        const chars = [...el.querySelectorAll(".handwrite-char")];
        if (!chars.length) return;
        const local = Math.max(0, Math.min(1, (enter * 1.25)));
        const writtenCount = Math.floor(local * chars.length);
        chars.forEach((char, index) => {
          char.classList.toggle("is-written", index < writtenCount);
        });
      });
    });
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateScrollWriting();
      ticking = false;
    });
  };
  updateScrollWriting();
  addEventListener("scroll", onScroll, { passive:true });
  addEventListener("resize", onScroll);

  const pages = [
    {
      number:"01",
      kicker:"FIRST ENTRY",
      title:"A page waiting for its poem.",
      copy:"The writing itself has not been added yet. This page is here to establish the reading experience without inventing words that are not yours."
    },
    {
      number:"02",
      kicker:"FRAGMENT",
      title:"For the unfinished things.",
      copy:"This volume is reserved for fragments, smaller thoughts and pieces that are intentionally incomplete."
    },
    {
      number:"03",
      kicker:"PRIVATE LANGUAGE",
      title:"Some writing stays difficult on purpose.",
      copy:"This page is reserved for writing that keeps its ambiguity instead of translating itself for everyone."
    }
  ];

  const reader = document.querySelector("[data-reader]");
  const readerPage = document.querySelector("[data-reader-page]");
  const readerClose = document.querySelector("[data-reader-close]");
  const fold = document.querySelector("[data-page-fold]");
  const number = document.querySelector("[data-reader-number]");
  const kicker = document.querySelector("[data-reader-kicker]");
  const title = document.querySelector("[data-reader-title]");
  const copy = document.querySelector("[data-reader-copy]");
  let pageIndex = 0;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragging = false;

  const renderPage = (index) => {
    const page = pages[index];
    number.textContent = page.number;
    kicker.textContent = page.kicker;
    title.textContent = page.title;
    copy.textContent = page.copy;
    readerPage.style.setProperty("--fold","0px");
    readerPage.style.transform = "";
    readerPage.classList.remove("is-turning");
  };

  const openReader = (index) => {
    pageIndex = index;
    renderPage(pageIndex);
    reader.classList.add("is-open");
    reader.setAttribute("aria-hidden","false");
    document.body.classList.add("reader-open");
  };

  const closeReader = () => {
    reader.classList.remove("is-open");
    reader.setAttribute("aria-hidden","true");
    document.body.classList.remove("reader-open");
  };

  document.querySelectorAll("[data-book]").forEach((book) => {
    book.addEventListener("click", () => openReader(Number(book.dataset.book || 0)));
  });
  readerClose?.addEventListener("click", closeReader);
  reader?.addEventListener("click", (event) => {
    if (event.target === reader) closeReader();
  });

  const updatePeel = (clientX, clientY) => {
    const rect = readerPage.getBoundingClientRect();
    const dx = Math.max(0, rect.right - clientX);
    const dy = Math.max(0, clientY - rect.top);
    const amount = Math.min(Math.max(dx, dy * .7), Math.min(rect.width * .48, 360));
    readerPage.style.setProperty("--fold", `${amount}px`);
    readerPage.style.transform = `translateX(-${amount * .10}px) rotate(-${amount * .012}deg)`;
    return amount;
  };

  fold?.addEventListener("pointerdown", (event) => {
    dragging = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    fold.setPointerCapture(event.pointerId);
  });
  fold?.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    updatePeel(event.clientX,event.clientY);
  });
  const finishPeel = (event) => {
    if (!dragging) return;
    dragging = false;
    const distance = Math.hypot(event.clientX - dragStartX,event.clientY - dragStartY);
    if (distance > 130) {
      readerPage.classList.add("is-turning");
      setTimeout(() => {
        pageIndex = (pageIndex + 1) % pages.length;
        renderPage(pageIndex);
      }, 280);
    } else {
      readerPage.style.setProperty("--fold","0px");
      readerPage.style.transform = "";
    }
  };
  fold?.addEventListener("pointerup", finishPeel);
  fold?.addEventListener("pointercancel", finishPeel);
  fold?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    readerPage.classList.add("is-turning");
    setTimeout(() => {
      pageIndex = (pageIndex + 1) % pages.length;
      renderPage(pageIndex);
    },280);
  });

  if (reduced) {
    document.querySelectorAll(".handwrite-char").forEach((char) => char.classList.add("is-written"));
    document.querySelectorAll("[data-scroll-note]").forEach((el) => el.style.setProperty("--scroll-opacity","1"));
  }
})();