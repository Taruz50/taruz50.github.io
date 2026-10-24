(() => {
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
  const status = document.querySelector("[data-quote-status]");
  const info = document.querySelector("[data-service-info]");
  const infoTitle = info.querySelector("[data-service-info-title]");
  const infoPrice = info.querySelector("[data-service-info-price]");
  const infoDescription = info.querySelector("[data-service-info-description]");
  const infoLink = info.querySelector("[data-service-info-link]");
  const slug = (value) => value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const serviceAliases = { "graphic-design": "Graphic Design", "video-editing": "Video Editing", "web-design-and-development": "Web Design & Development", "creative-package": "Creative Package", "creative-packages": "Creative Package", other: "Other" };
  const aliases = { "content-package": "Content", "campaign-package": "Campaign" };

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

  form.addEventListener("submit", (event) => {
    if (!form.checkValidity()) return;
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    const deadline = values.deadline ? new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(`${values.deadline}T12:00:00`)) : "Not specified";
    const lines = [
      "NEW TARUZ CREATIVE PROJECT ENQUIRY",
      "",
      `Name: ${values.name}`,
      `Email: ${values.email}`,
      `Service: ${values.service}`,
      `Specific service / package: ${values.specificService || "Not specified"}`,
      `Preferred deadline: ${deadline}`,
      `Budget range: ${values.budget || "Not specified"}`,
      `Reference / inspiration: ${values.reference || "Not provided"}`,
      `Preferred contact method: ${values.contactMethod}`,
      `WhatsApp number: ${values.whatsapp || "Not provided"}`,
      "",
      "PROJECT BRIEF",
      values.brief
    ];
    const subject = `Project enquiry — ${values.service}${values.specificService ? ` / ${values.specificService}` : ""}`;
    status.textContent = "Your email app is opening with your enquiry ready to send.";
    window.location.href = `mailto:taruzcreative@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  });
})();
