(() => {
  // Replace only this placeholder with the endpoint from Formspree, e.g. https://formspree.io/f/abcdwxyz.
  const FORMSPREE_ENDPOINT = "https://formspree.io/f/xoeevobe";
  const form = document.querySelector("[data-quote-form]");
  if (!form) return;

  const services = {
    "Graphic Design": [
      ["Social Graphic", "from £35", "One standalone graphic for social media, announcements, promotions or branded communication."], ["Promotional Poster", "from £50", "A developed poster or flyer with stronger composition, typography and image treatment."], ["Campaign Artwork", "from £65", "One hero visual that establishes the main creative direction for a campaign, launch or event."], ["Cover Artwork", "from £60", "Artwork created for music, podcasts, YouTube, publications or creative series."], ["Composite / Photo Manipulation", "from £60", "Detailed image compositing, masking, relighting, scene-building and visual manipulation."], ["3-piece Social Pack", "from £100", "Three coordinated graphics built around one visual direction."], ["5-piece Campaign", "from £150", "Five coordinated campaign deliverables developed from one creative concept."]
    ],
    "Video Editing": [["Short-form / Reel", "from £60", "A polished short-form edit designed for social platforms."], ["Advanced Promotional Reel", "from £90", "A more developed promotional edit with stronger pacing, structure and visual treatment."], ["1–3 min Promo", "from £150", "A longer promotional piece for products, brands, events or campaigns."], ["Event / Highlight Edit", "from £200", "A structured highlight film created from event or campaign footage."], ["Complex Motion / Compositing", "Quote", "Custom motion, compositing or advanced visual work scoped individually."]],
    "Web Design & Development": [["Landing Page", "from £300", "A focused single-page website built around one clear purpose or campaign."], ["Portfolio Website", "from £500", "A polished multi-section portfolio for showcasing creative or professional work."], ["Business Website", "from £700", "A responsive business website designed around services, information and conversion."], ["Custom Web Experience", "Quote", "A more bespoke digital experience requiring custom functionality or structure."], ["Website Care", "from £40/month", "Ongoing website support and maintenance based on the agreed level of care."]],
    "Creative Package": [["Content", "from £180", "Graphics combined with short-form video content."], ["Campaign", "from £300", "Hero artwork, supporting social content and promotional video."], ["Creative Shoot", "from £220", "Photography, edited images and promotional graphics."], ["Full Creative", "from £450", "A combined package covering photography, design and video."]],
    Other: []
  };

  const service = form.elements.service;
  const specific = form.elements.specificService;
  const suggestions = document.querySelector("#specific-service-options");
  const whatsappField = document.querySelector("[data-whatsapp-field]");
  const contactMethods = [...form.elements.contactMethod];
  const deadlineField = form.elements.deadline;
  const status = document.querySelector("[data-quote-status]");
  const submitButton = form.querySelector("[data-quote-submit]");
  const formFields = form.querySelector("[data-quote-form-fields]");
  const success = form.querySelector("[data-quote-success]");
  const info = document.querySelector("[data-service-info]");
  const infoTitle = info.querySelector("[data-service-info-title]");
  const infoPrice = info.querySelector("[data-service-info-price]");
  const infoDescription = info.querySelector("[data-service-info-description]");
  const infoLink = info.querySelector("[data-service-info-link]");
  const slug = (value) => value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const serviceAliases = { "graphic-design": "Graphic Design", "video-editing": "Video Editing", "web-design-and-development": "Web Design & Development", "creative-package": "Creative Package", "creative-packages": "Creative Package", other: "Other" };
  const aliases = { "content-package": "Content", "campaign-package": "Campaign" };
  const selectionKey = "taruz-enquiry-selections";
  const selectedServices = (() => { try { const items = JSON.parse(sessionStorage.getItem(selectionKey) || "[]"); return Array.isArray(items) ? items : []; } catch { return []; } })();
  const selectionSummary = () => {
    if (!selectedServices.length) return;
    const summary = document.createElement("aside");
    summary.className = "quote-selection-summary";
    summary.setAttribute("aria-labelledby", "quote-selection-summary-title");
    const numericPrices = selectedServices.map((item) => Number((item.price || "").match(/\d+(?:\.\d+)?/)?.[0])).filter(Number.isFinite);
    const total = numericPrices.length === selectedServices.length ? numericPrices.reduce((sum, value) => sum + value, 0) : null;
    summary.innerHTML = `<p>YOUR PROJECT SELECTION${selectedServices.length === 1 ? "" : "S"}</p><h3 id="quote-selection-summary-title">A clear place to start.</h3><div>${selectedServices.map((item) => `<article><small>${item.category}</small><strong>${item.name}</strong><span>${item.description}</span><b>${item.price}</b></article>`).join("")}</div>${total !== null ? `<p class="quote-selection-total">Selected services start from £${total.toLocaleString("en-GB")} combined. This is a starting point, not a final quote.</p>` : ""}<a href="services.html#services-catalogue">+ Add another service</a>`;
    form.before(summary);
    if (selectedServices.length > 1) {
      const multi = document.createElement("option"); multi.value = "Multi-service project"; multi.textContent = "Multi-service project — Combined creative disciplines"; service.append(multi); service.value = multi.value;
      specific.value = selectedServices.map((item) => item.name).join(" + ");
    } else {
      const item = selectedServices[0]; if ([...service.options].some((option) => option.value === item.category)) service.value = item.category; specific.value = item.name;
    }
  };

  const fillSuggestions = () => {
    suggestions.replaceChildren(...(services[service.value] || []).map(([name]) => {
      const option = document.createElement("option");
      option.value = name;
      return option;
    }));
  };
  const selectedItem = () => (services[service.value] || []).find(([name]) => slug(name) === slug(aliases[slug(specific.value)] || specific.value));
  const updateInfo = () => {
    const item = selectedItem();
    if (!service.value) { infoTitle.textContent = "Choose a service to see what’s included."; infoPrice.hidden = true; infoDescription.textContent = "Select a service and then a specific package for a concise scope and starting-price guide."; infoLink.hidden = true; return; }
    if (!item) { infoTitle.textContent = "Choose a specific service or package."; infoPrice.hidden = true; infoDescription.textContent = "The guide will show what is included and the current starting price where applicable."; infoLink.hidden = false; return; }
    const [title, price, description] = item;
    infoTitle.textContent = title; infoPrice.textContent = price; infoPrice.hidden = false; infoDescription.textContent = description; infoLink.hidden = false;
  };

  const updateWhatsAppField = () => {
    const usesWhatsApp = form.elements.contactMethod.value === "WhatsApp";
    whatsappField.hidden = !usesWhatsApp;
  };
  const setDeadlineMinimum = () => {
    const today = new Date();
    const localDate = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
    deadlineField.min = localDate;
  };

  selectionSummary();
  setDeadlineMinimum();
  const params = new URLSearchParams(window.location.search);
  const selectedService = params.get("service");
  const selectedSpecific = params.get("specific") || params.get("package");
  const canonicalService = selectedService && (serviceAliases[slug(selectedService)] || selectedService);
  if (canonicalService && Object.prototype.hasOwnProperty.call(services, canonicalService)) service.value = canonicalService;
  fillSuggestions();
  if (selectedSpecific) specific.value = aliases[slug(selectedSpecific)] || selectedSpecific;
  updateInfo();

  service.addEventListener("change", () => {
    fillSuggestions();
    if (specific.value && !selectedItem()) specific.value = "";
    updateInfo();
  });
  specific.addEventListener("input", updateInfo);
  specific.addEventListener("change", updateInfo);
  contactMethods.forEach((method) => method.addEventListener("change", updateWhatsAppField));
  updateWhatsAppField();

  const isConfiguredEndpoint = /^https:\/\/formspree\.io\/f\/(?!YOUR_FORM_ID$)[A-Za-z0-9_-]+$/.test(FORMSPREE_ENDPOINT);
  const setStatus = (message, isError = false) => {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
    status.setAttribute("role", isError ? "alert" : "status");
  };
  const selectedServicesText = () => selectedServices.length
    ? selectedServices.map((item, index) => `${index + 1}. ${item.category}\n   ${item.name} — ${item.price}`).join("\n")
    : "None selected from the services page";
  const formatDeadline = (value) => value
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(`${value}T12:00:00`))
    : "Not specified";
  const setSubmitting = (isSubmitting) => {
    submitButton.disabled = isSubmitting;
    submitButton.innerHTML = isSubmitting ? "Sending enquiry…" : "Send Project Enquiry <span aria-hidden=\"true\">↗</span>";
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (!isConfiguredEndpoint) {
      setStatus("This enquiry form is not configured yet. Please contact Taruz Creative directly.", true);
      return;
    }

    const values = Object.fromEntries(new FormData(form).entries());
    const payload = new FormData();
    payload.append("_subject", `Taruz project enquiry — ${values.service}`);
    payload.append("_replyto", values.email);
    payload.append("Client name", values.name);
    payload.append("Email", values.email);
    payload.append("Service", values.service);
    if (selectedServices.length) {
      payload.append("Selected services", selectedServicesText());
    } else {
      payload.append("Specific service / package", values.specificService || "Not specified");
    }
    payload.append("Preferred deadline", formatDeadline(values.deadline));
    payload.append("Budget range", values.budget || "Not specified");
    payload.append("Preferred contact method", values.contactMethod);
    payload.append("Phone / WhatsApp number", values.whatsapp || "Not provided");
    payload.append("Reference / inspiration link", values.reference || "Not provided");
    payload.append("Project brief", values.brief);
    payload.append("_gotcha", values._gotcha || "");

    setSubmitting(true);
    setStatus("Sending your enquiry…");
    try {
      const response = await fetch(FORMSPREE_ENDPOINT, { method: "POST", body: payload, headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Form submission failed with ${response.status}`);
      setStatus("");
      formFields.hidden = true;
      success.hidden = false;
      success.focus();
      submitButton.disabled = true;
      submitButton.textContent = "Enquiry received";
    } catch (error) {
      setSubmitting(false);
      setStatus("We couldn’t send your enquiry just now. Please try again, or contact Taruz Creative directly.", true);
    }
  });
})();
