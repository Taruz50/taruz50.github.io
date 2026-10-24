(() => {
  const lightbox = document.querySelector("[data-media-lightbox]");
  if (!lightbox) return;

  const imageOutput = lightbox.querySelector("[data-lightbox-output]");
  const videoOutput = lightbox.querySelector("[data-lightbox-video-output]");
  const caption = lightbox.querySelector("[data-lightbox-caption]");
  const description = lightbox.querySelector("[data-lightbox-description]");
  const close = lightbox.querySelector("[data-lightbox-close]");
  const figure = lightbox.querySelector("figure");
  const imageTriggers = [...document.querySelectorAll("[data-lightbox-image]")];
  const videoTriggers = [...document.querySelectorAll("[data-lightbox-video]")];
  let opener = null;

  if (!imageOutput || !videoOutput || !caption || !close || !figure) return;

  const icon = (paths) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" focusable="false">${paths}</svg>`;
  const icons = {
    play: icon('<path d="m8 5 11 7-11 7Z" />'),
    pause: icon('<path d="M8 5v14M16 5v14" />'),
    volume: icon('<path d="M5 10v4h3l4 4V6L8 10H5Z" /><path d="M15 9.5a4 4 0 0 1 0 5M17.5 7a7.5 7.5 0 0 1 0 10" />'),
    muted: icon('<path d="M5 10v4h3l4 4V6L8 10H5Z" /><path d="m16 10 4 4m0-4-4 4" />'),
    fullscreen: icon('<path d="M8 4H4v4M16 4h4v4M20 16v4h-4M4 16v4h4" />'),
  };

  const videoFrame = document.createElement("div");
  videoFrame.className = "media-lightbox-video-frame";
  videoFrame.hidden = true;
  videoOutput.before(videoFrame);
  videoFrame.append(videoOutput);

  const centrePlay = document.createElement("button");
  centrePlay.className = "media-lightbox-centre-play";
  centrePlay.type = "button";
  centrePlay.setAttribute("aria-label", "Play video");
  centrePlay.hidden = true;
  centrePlay.innerHTML = icons.play;
  videoFrame.append(centrePlay);

  const controls = document.createElement("div");
  controls.className = "media-lightbox-video-controls";
  controls.hidden = true;
  controls.setAttribute("role", "group");
  controls.setAttribute("aria-label", "Video controls");
  controls.innerHTML = `
    <button class="media-lightbox-control" type="button" data-video-play aria-label="Play video" aria-pressed="false">${icons.play}</button>
    <input class="media-lightbox-seek" type="range" data-video-seek min="0" max="1" value="0" step="0.1" aria-label="Video progress" />
    <span class="media-lightbox-time" aria-live="off"><output data-video-current>0:00</output><span aria-hidden="true"> / </span><output data-video-duration>0:00</output></span>
    <button class="media-lightbox-control" type="button" data-video-mute aria-label="Mute video" aria-pressed="false">${icons.volume}</button>
    <button class="media-lightbox-control" type="button" data-video-fullscreen aria-label="Enter fullscreen" hidden>${icons.fullscreen}</button>
  `;
  videoFrame.after(controls);

  const playButton = controls.querySelector("[data-video-play]");
  const seek = controls.querySelector("[data-video-seek]");
  const currentTime = controls.querySelector("[data-video-current]");
  const duration = controls.querySelector("[data-video-duration]");
  const muteButton = controls.querySelector("[data-video-mute]");
  const fullscreenButton = controls.querySelector("[data-video-fullscreen]");
  const fullscreenRequest = lightbox.requestFullscreen || lightbox.webkitRequestFullscreen;
  const fullscreenExit = document.exitFullscreen || document.webkitExitFullscreen;
  const canFullscreen = typeof fullscreenRequest === "function" && typeof fullscreenExit === "function";
  let rememberedVolume = 1;

  const formatTime = (value) => {
    if (!Number.isFinite(value) || value < 0) return "0:00";
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const updateTime = () => {
    const total = Number.isFinite(videoOutput.duration) ? videoOutput.duration : 0;
    const position = Number.isFinite(videoOutput.currentTime) ? Math.min(videoOutput.currentTime, total || 0) : 0;
    seek.max = String(total || 1);
    seek.value = String(position);
    currentTime.textContent = formatTime(position);
    duration.textContent = formatTime(total);
  };

  const updatePlaybackState = () => {
    const isPlaying = !videoOutput.paused && !videoOutput.ended;
    videoFrame.classList.toggle("is-playing", isPlaying);
    centrePlay.hidden = isPlaying;
    playButton.setAttribute("aria-label", isPlaying ? "Pause video" : "Play video");
    playButton.setAttribute("aria-pressed", String(isPlaying));
    playButton.innerHTML = isPlaying ? icons.pause : icons.play;
  };

  const updateVolumeState = () => {
    const muted = videoOutput.muted || videoOutput.volume === 0;
    muteButton.setAttribute("aria-label", muted ? "Unmute video" : "Mute video");
    muteButton.setAttribute("aria-pressed", String(muted));
    muteButton.innerHTML = muted ? icons.muted : icons.volume;
  };

  const updateFullscreenState = () => {
    const isFullscreen = document.fullscreenElement === lightbox || document.webkitFullscreenElement === lightbox;
    fullscreenButton.setAttribute("aria-label", isFullscreen ? "Exit fullscreen" : "Enter fullscreen");
    fullscreenButton.setAttribute("aria-pressed", String(isFullscreen));
  };

  const togglePlayback = () => {
    if (videoOutput.paused || videoOutput.ended) {
      const playAttempt = videoOutput.play();
      if (playAttempt?.catch) playAttempt.catch(updatePlaybackState);
    } else {
      videoOutput.pause();
    }
  };

  const resetVideoControls = () => {
    videoFrame.classList.remove("is-playing");
    centrePlay.hidden = true;
    seek.value = "0";
    seek.max = "1";
    currentTime.textContent = "0:00";
    duration.textContent = "0:00";
    playButton.innerHTML = icons.play;
    playButton.setAttribute("aria-label", "Play video");
    playButton.setAttribute("aria-pressed", "false");
    updateVolumeState();
  };

  const closeLightbox = () => {
    lightbox.hidden = true;
    imageOutput.removeAttribute("src");
    imageOutput.hidden = true;
    videoOutput.pause();
    videoOutput.currentTime = 0;
    videoOutput.removeAttribute("src");
    videoOutput.removeAttribute("poster");
    videoOutput.load();
    videoOutput.hidden = true;
    videoFrame.hidden = true;
    controls.hidden = true;
    description.hidden = true;
    description.textContent = "";
    resetVideoControls();
    opener?.focus();
  };

  imageTriggers.forEach((trigger) => trigger.addEventListener("click", () => {
    opener = trigger;
    videoOutput.pause();
    videoOutput.hidden = true;
    videoFrame.hidden = true;
    controls.hidden = true;
    imageOutput.src = trigger.dataset.lightboxImage;
    imageOutput.alt = trigger.dataset.lightboxAlt || "Enlarged artwork";
    imageOutput.hidden = false;
    caption.textContent = trigger.dataset.lightboxTitle || trigger.closest("figure")?.querySelector("figcaption")?.textContent || "Selected work";
    description.hidden = true;
    description.textContent = "";
    lightbox.hidden = false;
    close.focus();
  }));

  videoTriggers.forEach((trigger) => trigger.addEventListener("click", () => {
    opener = trigger;
    imageOutput.hidden = true;
    videoOutput.src = trigger.dataset.lightboxVideo;
    videoOutput.poster = trigger.dataset.lightboxPoster || "";
    videoOutput.playsInline = true;
    videoOutput.load();
    videoOutput.hidden = false;
    videoFrame.hidden = false;
    controls.hidden = false;
    resetVideoControls();
    centrePlay.hidden = false;
    caption.textContent = trigger.dataset.lightboxTitle || "Selected film";
    description.textContent = trigger.dataset.lightboxDescription || "";
    description.hidden = !description.textContent;
    lightbox.hidden = false;
    close.focus();
  }));

  playButton.addEventListener("click", togglePlayback);
  centrePlay.addEventListener("click", togglePlayback);
  videoOutput.addEventListener("click", () => { if (!videoOutput.hidden) togglePlayback(); });
  seek.addEventListener("input", () => {
    if (!Number.isFinite(videoOutput.duration)) return;
    videoOutput.currentTime = Number(seek.value);
    updateTime();
  });
  muteButton.addEventListener("click", () => {
    if (videoOutput.muted || videoOutput.volume === 0) {
      videoOutput.muted = false;
      videoOutput.volume = rememberedVolume || 1;
    } else {
      rememberedVolume = videoOutput.volume || 1;
      videoOutput.muted = true;
    }
    updateVolumeState();
  });
  fullscreenButton.addEventListener("click", () => {
    const isFullscreen = document.fullscreenElement === lightbox || document.webkitFullscreenElement === lightbox;
    const action = isFullscreen ? fullscreenExit : fullscreenRequest;
    const disableFullscreen = () => { fullscreenButton.hidden = true; };
    try {
      const fullscreenAttempt = action.call(isFullscreen ? document : lightbox);
      fullscreenAttempt?.catch?.(disableFullscreen);
      if (!isFullscreen) window.setTimeout(() => {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) disableFullscreen();
      }, 350);
    } catch {
      disableFullscreen();
    }
  });
  ["loadedmetadata", "durationchange", "timeupdate", "seeked"].forEach((event) => videoOutput.addEventListener(event, updateTime));
  ["play", "pause", "ended"].forEach((event) => videoOutput.addEventListener(event, updatePlaybackState));
  videoOutput.addEventListener("volumechange", updateVolumeState);
  document.addEventListener("fullscreenchange", updateFullscreenState);
  document.addEventListener("webkitfullscreenchange", updateFullscreenState);
  close.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !lightbox.hidden) closeLightbox(); });

  if (canFullscreen) fullscreenButton.hidden = false;
  videoOutput.controls = false;
  videoOutput.removeAttribute("controls");
  videoOutput.setAttribute("playsinline", "");
  lightbox.classList.add("media-lightbox--custom-controls");
  resetVideoControls();
})();
