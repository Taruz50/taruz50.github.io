(() => {
  const catalogue = document.querySelector("[data-services-catalogue]");
  const selectionKey = "taruz-enquiry-selections";
  const readSelections = () => { try { return JSON.parse(sessionStorage.getItem(selectionKey) || "[]"); } catch { return []; } };
  const writeSelections = (items) => { try { sessionStorage.setItem(selectionKey, JSON.stringify(items)); } catch {} };
  let selections = readSelections();
  const viewer = document.querySelector("[data-document-viewer]");
  const documents = {
    quote: ["SAMPLE QUOTE", "Q-TC-2026-001", ["PROJECT", "Spring Campaign"], ["TOTAL", "£180"], "GRAPHIC DESIGN · CAMPAIGN ARTWORK", "A formal quote confirms the proposed scope, deliverables and starting price before work begins."],
    confirmation: ["PROJECT CONFIRMATION", "CONF-TC-2026-001", ["DEPOSIT", "50% · £90"], ["BALANCE", "£90"], "SPRING CAMPAIGN · CONFIRMED SCOPE", "Project confirmation records the agreed creative direction, deliverables and next steps."],
    deposit: ["DEPOSIT INVOICE", "INV-TC-2026-001-D", ["DEPOSIT DUE", "£90"], ["PAYMENT", "Details supplied with confirmed invoice."], "SPRING CAMPAIGN · 50% DEPOSIT", "Confirmed invoices set out the amount due and payment details for the project."],
    receipt: ["PAYMENT RECEIPT", "RCPT-TC-2026-001", ["RECEIVED", "£90"], ["STATUS", "PAYMENT RECEIVED"], "SPRING CAMPAIGN · DEPOSIT RECEIPT", "A payment receipt is issued when a confirmed project payment has been received."]
  };
  if (viewer) {
    const renderDocument = (name) => {
      const [title, reference, first, second, footer, note] = documents[name];
      viewer.querySelector("[data-document-title]").textContent = title;
      viewer.querySelector("[data-document-reference]").textContent = reference;
      viewer.querySelector("[data-document-label-one]").textContent = first[0]; viewer.querySelector("[data-document-value-one]").textContent = first[1];
      viewer.querySelector("[data-document-label-two]").textContent = second[0]; viewer.querySelector("[data-document-value-two]").textContent = second[1];
      viewer.querySelector("[data-document-footer]").textContent = footer; viewer.querySelector("[data-document-note]").textContent = note;
      viewer.querySelector("[role=tabpanel]").setAttribute("aria-labelledby", `sample-document-tab-${name}`);
      viewer.querySelectorAll("[data-document-type]").forEach((button) => button.setAttribute("aria-selected", String(button.dataset.documentType === name)));
    };
    viewer.querySelectorAll("[data-document-type]").forEach((button) => button.addEventListener("click", () => renderDocument(button.dataset.documentType)));
  }
  if (!catalogue) return;
  const cases = [...catalogue.querySelectorAll("[data-service-case]")];
  const selectionId = (item) => `${item.category}::${item.name}`;
  const selected = (item) => selections.some((entry) => selectionId(entry) === selectionId(item));
  const tray = document.createElement("aside");
  tray.className = "selection-tray"; tray.hidden = true; tray.setAttribute("aria-live", "polite"); tray.setAttribute("aria-label", "Selected services"); document.body.append(tray);
  const refresh = () => {
    document.querySelectorAll("[data-service-select]").forEach((button) => { const item = JSON.parse(button.dataset.serviceSelect); const isSelected = selected(item); button.setAttribute("aria-pressed", String(isSelected)); button.textContent = isSelected ? "Added to enquiry" : "Add to enquiry"; });
    const count = selections.length; tray.hidden = !count;
    tray.innerHTML = count ? `<p>YOUR PROJECT — ${count} SELECTION${count === 1 ? "" : "S"}</p><ul>${selections.map((item) => `<li>${item.name}<button type="button" data-remove-selection="${encodeURIComponent(selectionId(item))}" aria-label="Remove ${item.name}">×</button></li>`).join("")}</ul><div><a href="quote.html">Review &amp; request quote <span aria-hidden="true">→</span></a><button type="button" data-clear-selections>Clear</button></div>` : "";
    tray.querySelectorAll("[data-remove-selection]").forEach((button) => button.addEventListener("click", () => { const id = decodeURIComponent(button.dataset.removeSelection); selections = selections.filter((item) => selectionId(item) !== id); writeSelections(selections); refresh(); }));
    tray.querySelector("[data-clear-selections]")?.addEventListener("click", () => { selections = []; writeSelections(selections); refresh(); });
  };
  const setOpen = (chosen, open) => cases.forEach((serviceCase) => {
    const trigger = serviceCase.querySelector(".service-case-trigger"); const panel = serviceCase.querySelector(".service-case-panel");
    if (trigger.disabled) { serviceCase.classList.remove("is-open"); panel.hidden = true; return; }
    const shouldOpen = serviceCase === chosen && open; serviceCase.classList.toggle("is-open", shouldOpen); trigger.setAttribute("aria-expanded", String(shouldOpen)); panel.hidden = !shouldOpen;
  });
  cases.forEach((serviceCase) => {
    const trigger = serviceCase.querySelector(".service-case-trigger"); const category = serviceCase.querySelector(".service-case-title")?.textContent.trim();
    const quoteLink = serviceCase.querySelector(".service-quote-link"); if (quoteLink) quoteLink.href = "quote.html";
    if (!trigger.disabled) trigger.addEventListener("click", () => setOpen(serviceCase, !serviceCase.classList.contains("is-open"))); else return;
    serviceCase.querySelectorAll(".service-price-list li:not(.service-bundle-note)").forEach((row) => {
      const label = row.querySelector("span"); const price = row.querySelector("strong")?.textContent.trim(); if (!label || !price) return;
      const name = label.cloneNode(true); name.querySelector("small")?.remove();
      const item = { category, name: name.textContent.trim(), description: label.querySelector("small")?.textContent.trim() || `${category} support tailored to the project.`, price };
      const button = document.createElement("button"); button.type = "button"; button.className = "service-select-button"; button.dataset.serviceSelect = JSON.stringify(item); button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => { selections = selected(item) ? selections.filter((entry) => selectionId(entry) !== selectionId(item)) : [...selections, item]; writeSelections(selections); refresh(); }); row.append(button);
    });
  });
  refresh();
})();
