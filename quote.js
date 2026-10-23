(() => {
  const form = document.querySelector("[data-quote-form]");
  if (!form) return;

  const services = {
    "Graphic Design": ["Social Graphic", "Promotional Poster", "Campaign Artwork", "Cover Artwork", "Composite / Photo Manipulation", "3-piece Social Pack", "5-piece Campaign"],
    "Video Editing": ["Short-form / Reel", "Advanced Promotional Reel", "1–3 min Promo", "Event / Highlight Edit"],
    "Web Design & Development": ["Landing Page", "Portfolio Website", "Business Website", "Website Care"],
    "Creative Package": ["Content Package", "Campaign Package", "Creative Shoot", "Full Creative"],
    Other: []
  };

  const service = form.elements.service;
  const specific = form.elements.specificService;
  const suggestions = document.querySelector("#specific-service-options");
  const whatsappField = document.querySelector("[data-whatsapp-field]");
  const contactMethods = [...form.elements.contactMethod];
  const status = document.querySelector("[data-quote-status]");

  const fillSuggestions = () => {
    suggestions.replaceChildren(...(services[service.value] || []).map((name) => {
      const option = document.createElement("option");
      option.value = name;
      return option;
    }));
  };

  const updateWhatsAppField = () => {
    const usesWhatsApp = form.elements.contactMethod.value === "WhatsApp";
    whatsappField.hidden = !usesWhatsApp;
  };

  const params = new URLSearchParams(window.location.search);
  const selectedService = params.get("service");
  const selectedSpecific = params.get("specific");
  if (selectedService && Object.prototype.hasOwnProperty.call(services, selectedService)) service.value = selectedService;
  fillSuggestions();
  if (selectedSpecific) specific.value = selectedSpecific;

  service.addEventListener("change", () => {
    fillSuggestions();
    if (specific.value && !services[service.value]?.includes(specific.value)) specific.value = "";
  });
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
