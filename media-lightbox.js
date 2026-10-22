(() => {
  const lightbox = document.querySelector("[data-media-lightbox]");
  if (!lightbox) return;

  const imageOutput = lightbox.querySelector("[data-lightbox-output]");
  const videoOutput = lightbox.querySelector("[data-lightbox-video-output]");
  const caption = lightbox.querySelector("[data-lightbox-caption]");
  const description = lightbox.querySelector("[data-lightbox-description]");
  const close = lightbox.querySelector("[data-lightbox-close]");
  const imageTriggers = [...document.querySelectorAll("[data-lightbox-image]")];
  const videoTriggers = [...document.querySelectorAll("[data-lightbox-video]")];
  let opener = null;

  const closeLightbox = () => {
    lightbox.hidden = true;
    imageOutput.removeAttribute("src");
    imageOutput.hidden = true;
    videoOutput.pause();
    videoOutput.removeAttribute("src");
    videoOutput.removeAttribute("poster");
    videoOutput.hidden = true;
    description.hidden = true;
    description.textContent = "";
    opener?.focus();
  };

  imageTriggers.forEach((trigger) => trigger.addEventListener("click", () => {
    opener = trigger;
    imageOutput.src = trigger.dataset.lightboxImage;
    imageOutput.alt = trigger.dataset.lightboxAlt || "Enlarged artwork";
    imageOutput.hidden = false;
    caption.textContent = trigger.dataset.lightboxTitle || trigger.closest("figure")?.querySelector("figcaption")?.textContent || "Selected work";
    lightbox.hidden = false;
    close.focus();
  }));

  videoTriggers.forEach((trigger) => trigger.addEventListener("click", () => {
    opener = trigger;
    videoOutput.src = trigger.dataset.lightboxVideo;
    videoOutput.poster = trigger.dataset.lightboxPoster || "";
    videoOutput.hidden = false;
    caption.textContent = trigger.dataset.lightboxTitle || "Selected film";
    description.textContent = trigger.dataset.lightboxDescription || "";
    description.hidden = !description.textContent;
    lightbox.hidden = false;
    close.focus();
  }));

  close.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !lightbox.hidden) closeLightbox(); });
})();
