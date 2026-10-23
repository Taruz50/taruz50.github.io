(() => {
  const catalogue = document.querySelector("[data-services-catalogue]");
  if (!catalogue) return;
  const cases = [...catalogue.querySelectorAll("[data-service-case]")];
  const quoteRoutes = new Map([
    ["service-case--design", "quote.html?service=Graphic%20Design"],
    ["service-case--video", "quote.html?service=Video%20Editing"],
    ["service-case--web", "quote.html?service=Web%20Design%20%26%20Development"],
    ["service-case--packages", "quote.html?service=Creative%20Package"],
    ["service-case--photo", "quote.html"]
  ]);

  const setOpen = (selected, open) => {
    cases.forEach((serviceCase) => {
      const trigger = serviceCase.querySelector(".service-case-trigger");
      const panel = serviceCase.querySelector(".service-case-panel");
      if (trigger.disabled) {
        serviceCase.classList.remove("is-open");
        panel.hidden = true;
        return;
      }
      const shouldOpen = serviceCase === selected && open;
      serviceCase.classList.toggle("is-open", shouldOpen);
      trigger.setAttribute("aria-expanded", String(shouldOpen));
      panel.hidden = !shouldOpen;
    });
  };

  cases.forEach((serviceCase) => {
    const trigger = serviceCase.querySelector(".service-case-trigger");
    const quoteLink = serviceCase.querySelector(".service-quote-link");
    const route = [...quoteRoutes].find(([className]) => serviceCase.classList.contains(className));
    if (quoteLink && route) quoteLink.href = route[1];
    if (trigger.disabled) return;
    trigger.addEventListener("click", () => setOpen(serviceCase, !serviceCase.classList.contains("is-open")));
  });
})();
