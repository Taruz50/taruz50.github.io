(() => {
  const button = document.querySelector("[data-copy-email]");
  const status = document.querySelector("[data-copy-status]");
  if (!button || !status) return;
  const email = "taruzcreative@gmail.com";
  const restoreLabel = () => { button.textContent = "COPY EMAIL"; };
  const fallbackCopy = () => {
    const field = document.createElement("textarea");
    field.value = email;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    const copied = document.execCommand("copy");
    field.remove();
    return copied;
  };
  button.addEventListener("click", async () => {
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(email); copied = true; } else { copied = fallbackCopy(); }
    } catch { copied = fallbackCopy(); }
    if (copied) { button.textContent = "COPIED"; status.textContent = "Email address copied to the clipboard."; window.setTimeout(restoreLabel, 1800); }
    else { status.textContent = "Copying is unavailable. Please use the email link instead."; }
  });
})();
