(() => {
  const form = document.querySelector("#project-form");
  const preview = document.querySelector("[data-document-preview]");
  if (!form || !preview) return;

  const config = window.TARUZ_SUPABASE_CONFIG || {};
  const hasSupabaseConfig = Boolean(config.url && config.anonKey && !config.url.includes("YOUR_") && !config.anonKey.includes("YOUR_"));
  const client = hasSupabaseConfig && window.supabase ? window.supabase.createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }) : null;
  const authGate = document.querySelector("[data-auth-gate]");
  const app = document.querySelector("[data-admin-app]");
  const authForm = document.querySelector("[data-auth-form]");
  const authStatus = document.querySelector("[data-auth-status]");
  const projectList = document.querySelector("[data-project-list]");
  const tabs = [...document.querySelectorAll("[data-document-tab]")];
  const status = document.querySelector("#admin-status");
  const printButton = document.querySelector("[data-print]");
  const copyButton = document.querySelector("[data-copy-email]");
  const filename = document.querySelector("[data-suggested-file]");
  const lineItemsContainer = document.querySelector("[data-line-items]");
  const lineItemsStatus = document.querySelector("[data-line-items-status]");
  const addLineItemButton = document.querySelector("[data-add-line-item]");
  let activeDocument = "quote";
  let currentProjectId = null;
  let projects = [];
  let currentUserId = null;
  let loadedProjectsForUserId = null;
  let projectLoadTimer = null;
  let projectLoadInFlight = false;
  let projectLoading = false;
  let lineItems = [];
  let lineItemsPersisted = true;

  const dateValue = (date) => date.toISOString().slice(0, 10);
  const addDays = (days) => { const date = new Date(); date.setDate(date.getDate() + days); return dateValue(date); };
  const cleanNumber = (value) => Math.max(0, Number.parseFloat(value) || 0);
  const escape = (value) => String(value || "").replace(/[&<>'"]/g, (character) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", "\"":"&quot;" }[character]));
  const placeholder = (value, fallback = "To be confirmed") => escape(value?.trim() || fallback);
  const formatDate = (value) => value ? new Intl.DateTimeFormat("en-GB", { day:"numeric", month:"long", year:"numeric" }).format(new Date(`${value}T12:00:00`)) : "To be confirmed";
  const currencyFormat = (amount, currency) => new Intl.NumberFormat("en-GB", { style:"currency", currency:currency || "GBP", minimumFractionDigits:2 }).format(Math.max(0, amount || 0));
  const cleanQuantity = (value) => Math.max(1, Math.floor(Number.parseFloat(value) || 1));
  const normaliseLineItems = (items = lineItems) => Array.isArray(items) ? items.map((item) => ({ description:String(item?.description || "").trim(), category:String(item?.category || "").trim(), quantity:cleanQuantity(item?.quantity), unitPrice:cleanNumber(item?.unitPrice) })) : [];
  const pricedLineItems = (items = lineItems) => normaliseLineItems(items).filter((item) => item.description || item.category || item.unitPrice > 0);
  const newLineItem = (values = {}) => ({ description:values.description || "", category:values.category || "", quantity:cleanQuantity(values.quantity), unitPrice:cleanNumber(values.unitPrice) });
  const formData = () => {
    const data = Object.fromEntries(new FormData(form).entries());
    if (lineItemsPersisted) data.lineItems = normaliseLineItems();
    return data;
  };
  const field = (name) => form.elements.namedItem(name);
  const year = new Date().getFullYear();
  const nextReference = () => {
    const referencePattern = new RegExp(`^TC-${year}-(\\d{3})$`);
    const lastSequence = projects.reduce((highest, project) => {
      const match = String(project.project_reference || "").match(referencePattern);
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0);
    return `TC-${year}-${String(lastSequence + 1).padStart(3, "0")}`;
  };
  const generatedReferences = (reference) => ({ quoteNumber:`Q-${reference}`, invoiceNumber:`INV-${reference}-D`, receiptNumber:`RCPT-${reference}` });

  const setDefaults = () => {
    lineItems = [newLineItem()]; lineItemsPersisted = true; renderLineItems();
    field("projectReference").value = nextReference();
    field("projectReference").dataset.generated = "true";
    const generated = generatedReferences(field("projectReference").value);
    Object.entries(generated).forEach(([name, value]) => { field(name).value = value; field(name).dataset.generated = "true"; });
    field("quoteDate").value = dateValue(new Date()); field("quoteValidUntil").value = addDays(14); field("invoiceIssueDate").value = dateValue(new Date()); field("paymentDueDate").value = addDays(7);
    field("projectStatus").value = "enquiry";
  };

  const updateGeneratedReferences = () => {
    const generated = generatedReferences(field("projectReference").value.trim() || nextReference());
    Object.entries(generated).forEach(([name, value]) => { if (field(name).dataset.generated === "true" || !field(name).value) { field(name).value = value; field(name).dataset.generated = "true"; } });
  };

  const calculations = (data) => {
    const currentLines = pricedLineItems(data.lineItems);
    const subtotal = Array.isArray(data.lineItems) ? currentLines.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) : cleanNumber(data.projectTotal); const discountRaw = cleanNumber(data.discountValue);
    const discount = data.discountType === "percent" ? subtotal * Math.min(discountRaw, 100) / 100 : Math.min(discountRaw, subtotal);
    const total = Math.max(subtotal - discount, 0);
    const deposit = data.depositManual === "on" ? Math.min(cleanNumber(data.depositAmount), total) : total * Math.min(cleanNumber(data.depositPercentage), 100) / 100;
    const balance = data.balanceManual === "on" ? Math.min(cleanNumber(data.remainingBalance), total) : Math.max(total - deposit, 0);
    const paid = Math.min(cleanNumber(data.amountPaid), total);
    return { subtotal, discount, total, deposit, balance, paid, invoiceBalance:Math.max(total - paid, 0) };
  };

  const updateCalculations = () => {
    const data = formData(); const values = calculations(data); const currency = data.currency || "GBP";
    if (data.depositManual !== "on") field("depositAmount").value = values.deposit.toFixed(2);
    if (data.balanceManual !== "on") field("remainingBalance").value = values.balance.toFixed(2);
    Object.entries({ subtotal:values.subtotal, discount:values.discount, total:values.total, deposit:values.deposit, balance:values.balance, paid:values.paid, invoiceBalance:values.invoiceBalance }).forEach(([name, value]) => { document.querySelector(`[data-calculation="${name}"]`).textContent = currencyFormat(value, currency); });
    return calculations(formData());
  };

  const renderLineItems = () => {
    if (!lineItemsContainer) return;
    if (!lineItemsPersisted && !lineItems.length) {
      lineItemsContainer.innerHTML = '<p class="line-items-legacy">This existing project uses its saved single total. Add a service line to convert its pricing deliberately.</p>';
      return;
    }
    lineItemsContainer.innerHTML = normaliseLineItems().map((item, index) => {
      const total = item.quantity * item.unitPrice;
      return `<fieldset class="line-item" data-line-item="${index}"><legend>Service line ${index + 1}</legend><div class="line-item-grid"><label>Description<input data-line-item-field="description" data-line-item-index="${index}" value="${escape(item.description)}" placeholder="Campaign Artwork" /></label><label>Category <small>Optional</small><input data-line-item-field="category" data-line-item-index="${index}" value="${escape(item.category)}" placeholder="Graphic Design" /></label><label>Quantity<input data-line-item-field="quantity" data-line-item-index="${index}" type="number" min="1" step="1" value="${item.quantity}" inputmode="numeric" /></label><label>Unit price<input data-line-item-field="unitPrice" data-line-item-index="${index}" type="number" min="0" step="0.01" value="${item.unitPrice}" inputmode="decimal" /></label><p class="line-item-total"><span>Line total</span><strong>${currencyFormat(total, field("currency")?.value)}</strong></p><button type="button" class="remove-line-item" data-remove-line-item="${index}" aria-label="Remove service line ${index + 1}" ${lineItems.length === 1 ? "disabled" : ""}>Remove</button></div></fieldset>`;
    }).join("");
    lineItemsContainer.querySelectorAll("[data-line-item-field]").forEach((input) => input.addEventListener("input", (event) => {
      const index = Number(event.target.dataset.lineItemIndex); const name = event.target.dataset.lineItemField;
      if (!lineItems[index]) return;
      lineItems[index][name] = name === "quantity" ? cleanQuantity(event.target.value) : name === "unitPrice" ? cleanNumber(event.target.value) : event.target.value;
      lineItemsPersisted = true;
      const current = normaliseLineItems([lineItems[index]])[0];
      event.target.closest(".line-item")?.querySelector(".line-item-total strong")?.replaceChildren(document.createTextNode(currencyFormat(current.quantity * current.unitPrice, field("currency")?.value)));
      render();
    }));
    lineItemsContainer.querySelectorAll("[data-remove-line-item]").forEach((button) => button.addEventListener("click", () => {
      if (lineItems.length <= 1) return;
      lineItems.splice(Number(button.dataset.removeLineItem), 1); lineItemsPersisted = true; lineItemsStatus.textContent = "Service line removed."; renderLineItems(); render();
    }));
  };

  const deliverables = (data) => (data.deliverables || "").split("\n").map(item => item.trim()).filter(Boolean);
  const list = (items) => `<ul class="deliverable-list">${(items.length ? items : ["Deliverables to be confirmed."]).map(item => `<li>${escape(item)}</li>`).join("")}</ul>`;
  const clientBlock = (data) => `<p><strong>${placeholder(data.clientName, "Client name")}</strong><br>${placeholder(data.clientCompany, "")}${data.clientCompany ? "<br>" : ""}${placeholder(data.clientEmail, "Email to be confirmed")}${data.clientPhone ? `<br>${escape(data.clientPhone)}` : ""}</p>`;
  const pricing = (data, values, entries) => `<div class="document-pricing">${entries.map(([label, value, total]) => `<div class="${total ? "document-total" : ""}"><span>${label}</span><strong>${currencyFormat(value, data.currency)}</strong></div>`).join("")}</div>`;
  const lineItemsTable = (data, items) => {
    const lines = pricedLineItems(items);
    if (!lines.length) return "";
    return `<section class="document-section document-line-items"><h2>Services &amp; pricing</h2><table><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Total</th></tr></thead><tbody>${lines.map((item) => `<tr><td><strong>${escape(item.description || item.category || "Service")}</strong>${item.category && item.description ? `<small>${escape(item.category)}</small>` : ""}</td><td>${item.quantity}</td><td>${currencyFormat(item.unitPrice, data.currency)}</td><td>${currencyFormat(item.quantity * item.unitPrice, data.currency)}</td></tr>`).join("")}</tbody></table></section>`;
  };
  const lineItemsSummary = (items) => {
    const lines = pricedLineItems(items);
    return lines.length ? `<section class="document-section"><h2>Agreed services</h2><p>${lines.map((item) => `${escape(item.description || item.category || "Service")}${item.quantity > 1 ? ` × ${item.quantity}` : ""}`).join(" · ")}</p></section>` : "";
  };
  const paymentDetails = (data) => `<div class="document-payment"><strong>Payment details</strong><p>${placeholder(data.paymentMethod, "Payment method to be confirmed")}<br>${placeholder(data.accountHolder, "Account holder to be confirmed")}<br>${placeholder(data.bankName, "Bank details to be confirmed")}${data.sortCode ? `<br>Sort code: ${escape(data.sortCode)}` : ""}${data.accountNumber ? `<br>Account number: ${escape(data.accountNumber)}` : ""}${data.paymentReference ? `<br>Reference: ${escape(data.paymentReference)}` : ""}</p>${data.paymentNotes ? `<p class="document-muted">${escape(data.paymentNotes)}</p>` : ""}</div>`;
  const base = (title, reference, date, extra = "") => `<header class="document-topline"><div><p class="document-brand">TARUZ CREATIVE</p><h1 class="document-type">${title}</h1></div><p class="document-reference">${reference}<br>${date}</p></header>${extra}`;

  const render = () => {
    if (projectLoading) return;
    const data = formData(); const values = updateCalculations(); const items = deliverables(data); const serviceLines = data.lineItems || []; const reference = placeholder(data.projectReference, nextReference());
    const details = `<section class="document-section document-grid"><div><h2>Client</h2>${clientBlock(data)}</div><div><h2>Project</h2><p><strong>${placeholder(data.projectTitle, "Project title")}</strong><br>${placeholder(data.service, "Service to be confirmed")}<br>${placeholder(data.packageType, "Package to be confirmed")}</p></div></section>`;
    const scope = `<section class="document-section"><h2>Project scope</h2><p>${placeholder(data.scope || data.projectDescription, "Scope to be confirmed")}</p></section><section class="document-section"><h2>Deliverables</h2>${list(items)}</section>`;
    const timeline = `<section class="document-section document-grid"><div><h2>Timeline</h2><p><strong>Start</strong>${formatDate(data.projectStart)}<br><strong>Target delivery</strong>${formatDate(data.targetDelivery)}</p></div><div><h2>Revisions</h2><p>${cleanNumber(data.revisions)} revision round${cleanNumber(data.revisions) === 1 ? "" : "s"} included.</p><p class="document-muted">${placeholder(data.revisionNote, "")}</p></div></section>`;
    const docs = {
      quote: `${base("QUOTE", placeholder(data.quoteNumber, `Q-${reference}`), `${formatDate(data.quoteDate)} · Valid until ${formatDate(data.quoteValidUntil)}`)}${details}${scope}${lineItemsTable(data, serviceLines)}<section class="document-section"><h2>Pricing</h2>${pricing(data, values, [["Subtotal",values.subtotal],["Discount",values.discount],["Total",values.total,true]])}</section>${timeline}<p class="document-notice">This quote is based on the scope described above. Changes to scope or deliverables may require a revised quote.</p><p class="document-footer">Ready to proceed? Reply to the accompanying email to confirm acceptance of this quote. Project work is subject to the agreed scope and Taruz Creative Client Terms.</p>`,
      confirmation: `${base("PROJECT CONFIRMATION", `CONF-${reference}`, formatDate(data.quoteDate))}${details}${scope}${lineItemsSummary(serviceLines)}${timeline}<section class="document-section"><div class="document-summary"><span><strong>Project total</strong>${currencyFormat(values.total,data.currency)}</span><span><strong>Deposit due</strong>${currencyFormat(values.deposit,data.currency)}</span><span><strong>Balance after deposit</strong>${currencyFormat(values.balance,data.currency)}</span></div></section><section class="document-section"><h2>Payment terms</h2><p>Payment of the deposit secures the booking and allows work to begin.</p></section><p class="document-notice">By confirming this project, the client agrees that the scope, deliverables, pricing and timeline above accurately reflect the work requested. Project work is subject to the agreed scope and Taruz Creative Client Terms.</p>`,
      deposit: `${base("DEPOSIT INVOICE", placeholder(data.invoiceNumber, `INV-${reference}-D`), `${formatDate(data.invoiceIssueDate)} · Due ${formatDate(data.paymentDueDate)}`)}${details}${lineItemsTable(data, serviceLines)}<section class="document-section"><h2>Deposit summary</h2><div class="document-pricing"><div><span>Subtotal</span><strong>${currencyFormat(values.subtotal,data.currency)}</strong></div><div><span>Discount</span><strong>${currencyFormat(values.discount,data.currency)}</strong></div><div><span>Project total</span><strong>${currencyFormat(values.total,data.currency)}</strong></div><div><span>Deposit ${data.depositManual === "on" ? "(manual amount)" : `${Math.min(cleanNumber(data.depositPercentage),100)}%`}</span><strong>${currencyFormat(values.deposit,data.currency)}</strong></div><div class="document-total"><span>Amount due now</span><strong>${currencyFormat(values.deposit,data.currency)}</strong></div><div><span>Balance remaining</span><strong>${currencyFormat(values.balance,data.currency)}</strong></div></div></section>${paymentDetails(data)}<p class="document-notice">Payment of the deposit secures the booking and allows work to begin.</p><p class="document-footer">Please use the invoice number as the payment reference where possible.</p>`,
      balance: `${base("FINAL / BALANCE INVOICE", `INV-${reference}-B`, `${formatDate(data.invoiceIssueDate)} · Due ${formatDate(data.paymentDueDate)}`)}${details}${lineItemsTable(data, serviceLines)}<section class="document-section"><h2>Balance summary</h2>${pricing(data, values, [["Project total",values.total],["Deposit paid / amount paid",values.paid],["Balance due",values.invoiceBalance,true]])}</section>${paymentDetails(data)}<p class="document-footer">Final approved files will be delivered once the agreed remaining balance has been paid, unless otherwise agreed.</p>`,
      receipt: `${base("PAYMENT RECEIPT", placeholder(data.receiptNumber, `RCPT-${reference}`), `Received ${formatDate(data.paymentReceivedDate)}`)}${details}<section class="document-section"><span class="receipt-status">PAYMENT RECEIVED</span><div class="document-summary"><span><strong>Amount received</strong>${currencyFormat(values.paid || values.deposit,data.currency)}</span><span><strong>Payment type</strong>${placeholder(data.paymentType)}</span><span><strong>Remaining balance</strong>${currencyFormat(values.invoiceBalance,data.currency)}</span></div></section>${paymentDetails(data)}`,
    };
    preview.innerHTML = docs[activeDocument];
    preview.setAttribute("aria-busy", "false");
    const label = { quote:"Quote", confirmation:"Project-Confirmation", deposit:"Deposit-Invoice", balance:"Balance-Invoice", receipt:"Payment-Receipt" }[activeDocument];
    const client = (data.clientName || "Client").trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "Client";
    filename.textContent = `${reference}-${label}-${client}.pdf`;
    copyButton.textContent = `Copy ${activeDocument === "confirmation" ? "Confirmation" : activeDocument === "quote" ? "Quote" : "Invoice"} Email`;
  };

  const emailText = () => { const data = formData(); const client = data.clientName || "there"; const project = data.projectTitle || "your project"; const files = { quote:`Hi ${client},\n\nPlease find attached the quote for ${project}.\n\nIt outlines the proposed scope, deliverables, timeline and pricing.\n\nIf you're happy to proceed, reply to confirm acceptance and I'll prepare the project confirmation and relevant invoice.`, confirmation:`Hi ${client},\n\nPlease find attached the project confirmation for ${project}.\n\nIt confirms the agreed scope, deliverables, pricing and timeline.`, deposit:`Hi ${client},\n\nPlease find attached the deposit invoice for ${project}.\n\nPayment of the deposit secures the booking and allows work to begin.`, balance:`Hi ${client},\n\nPlease find attached the final balance invoice for ${project}.\n\nPlease use the invoice number as the payment reference where possible.`, receipt:`Hi ${client},\n\nPlease find attached the payment receipt for ${project}.\n\nThank you.` }; return `${files[activeDocument]}\n\nThank you,\nAndrew Taruvinga\nTaruz Creative`; };
  const copyText = async (text) => { try { await navigator.clipboard.writeText(text); return true; } catch { const area = document.createElement("textarea"); area.value = text; area.style.position = "fixed"; area.style.opacity = "0"; document.body.append(area); area.select(); const copied = document.execCommand("copy"); area.remove(); return copied; } };

  const statusLabel = (value) => ({ enquiry:"Enquiry", quote_sent:"Quote sent", accepted:"Accepted", deposit_due:"Deposit due", in_progress:"In progress", balance_due:"Balance due", completed:"Completed", cancelled:"Cancelled" }[value] || "Enquiry");
  const setStatus = (message) => { status.textContent = message; };
  const documentSkeleton = () => `<div class="document-skeleton" aria-label="Loading project data"><span class="skeleton-line skeleton-brand"></span><span class="skeleton-line skeleton-title"></span><span class="skeleton-line skeleton-meta"></span><div class="skeleton-rule"></div><div class="skeleton-columns"><span class="skeleton-line"></span><span class="skeleton-line skeleton-short"></span><span class="skeleton-line"></span><span class="skeleton-line skeleton-short"></span></div><div class="skeleton-block"><span class="skeleton-line skeleton-heading"></span><span class="skeleton-line"></span><span class="skeleton-line"></span><span class="skeleton-line skeleton-short"></span></div></div>`;
  const projectListSkeleton = () => `<div class="project-list-skeleton" aria-label="Loading saved projects"><span></span><span></span><span></span></div>`;
  const setProjectLoading = (loading) => {
    projectLoading = loading;
    app.classList.toggle("is-project-loading", loading);
    document.querySelectorAll("[data-dashboard-count]").forEach((count) => {
      count.classList.toggle("is-skeleton", loading);
      if (loading) count.textContent = "—";
    });
    if (!loading) return;
    projectList.innerHTML = projectListSkeleton();
    preview.innerHTML = documentSkeleton();
    preview.setAttribute("aria-busy", "true");
    filename.textContent = "Loading project data…";
  };
  const resetProject = () => { currentProjectId = null; form.reset(); setDefaults(); render(); setStatus("New project ready."); };
  const updateDashboard = () => {
    const active = projects.filter((project) => !["completed", "cancelled"].includes(project.status)).length;
    const outstanding = projects.filter((project) => ["deposit_due", "balance_due"].includes(project.status)).length;
    [["all", projects.length], ["active", active], ["outstanding", outstanding]].forEach(([name, value]) => {
      const count = document.querySelector(`[data-dashboard-count="${name}"]`);
      count.classList.remove("is-skeleton");
      count.textContent = value;
    });
  };
  const renderProjectList = () => {
    updateDashboard();
    if (!projects.length) { projectList.innerHTML = "<p>No projects saved yet.</p>"; return; }
    projectList.innerHTML = projects.map((project) => `<button type="button" data-open-project="${escape(project.id)}"><span><strong>${escape(project.project_reference)}</strong>${escape(project.project_title || "Untitled project")}<small>${escape(project.client_name || "Client to be confirmed")}</small></span><em>${escape(statusLabel(project.status))}</em></button>`).join("");
    projectList.querySelectorAll("[data-open-project]").forEach((button) => button.addEventListener("click", () => openProject(button.dataset.openProject)));
  };
  const loadProjectsForCurrentUser = async ({ force = false } = {}) => {
    const userId = currentUserId;
    if (!client || !userId || projectLoadInFlight || (!force && loadedProjectsForUserId === userId)) return;
    projectLoadInFlight = true;
    setProjectLoading(true);
    let data;
    let error;
    try {
      ({ data, error } = await client.from("projects").select("id, project_reference, project_title, client_name, status, data, updated_at").order("updated_at", { ascending:false }));
    } catch (requestError) {
      error = requestError;
    }
    projectLoadInFlight = false;
    if (userId !== currentUserId) return;
    if (error) {
      setProjectLoading(false);
      updateDashboard();
      render();
      projectList.innerHTML = `<p>Projects could not be loaded. <button type="button" data-retry-projects>Try again</button></p>`;
      projectList.querySelector("[data-retry-projects]").addEventListener("click", refreshProjects);
      setStatus(error.message);
      return;
    }
    projects = data || []; loadedProjectsForUserId = userId;
    if (!currentProjectId && field("projectReference").dataset.generated === "true") {
      field("projectReference").value = nextReference();
      updateGeneratedReferences();
    }
    setProjectLoading(false);
    renderProjectList();
    render();
  };
  const queueProjectLoad = () => {
    if (!currentUserId || loadedProjectsForUserId === currentUserId || projectLoadTimer) return;
    projectLoadTimer = window.setTimeout(() => {
      projectLoadTimer = null;
      loadProjectsForCurrentUser();
    }, 0);
  };
  const refreshProjects = async () => {
    loadedProjectsForUserId = null;
    await loadProjectsForCurrentUser({ force:true });
  };
  const openProject = (id) => {
    const project = projects.find((item) => item.id === id);
    if (!project) return;
    setProjectLoading(true);
    window.requestAnimationFrame(() => {
      currentProjectId = project.id;
      const saved = project.data || {};
      lineItems = Array.isArray(saved.lineItems) ? normaliseLineItems(saved.lineItems) : [];
      lineItemsPersisted = Array.isArray(saved.lineItems);
      Object.entries(saved).forEach(([name, value]) => { const element = field(name); if (!element) return; if (element.type === "checkbox") element.checked = value === "on" || value === true; else { if (element.tagName === "SELECT" && value && ![...element.options].some((option) => option.value === value)) { const legacyOption = new Option(`${value} (saved)`, value); legacyOption.dataset.legacyValue = "true"; element.add(legacyOption); } element.value = value ?? ""; } });
      field("projectReference").value = project.project_reference || field("projectReference").value;
      field("projectTitle").value = project.project_title || field("projectTitle").value;
      field("clientName").value = project.client_name || field("clientName").value;
      field("projectStatus").value = project.status || "enquiry";
      renderLineItems();
      setProjectLoading(false);
      renderProjectList();
      render(); setStatus(`Loaded ${project.project_reference}.`); window.scrollTo({ top:0, behavior:"smooth" });
    });
  };
  const saveProject = async () => {
    if (!client) return;
    const data = formData(); const values = updateCalculations();
    const projectReference = (data.projectReference || "").trim();
    if (!projectReference) { setStatus("Add a project reference before saving."); field("projectReference").focus(); return; }
    const payload = { project_reference:projectReference, project_title:(data.projectTitle || "").trim() || null, client_name:(data.clientName || "").trim() || null, client_email:(data.clientEmail || "").trim() || null, status:data.projectStatus || "enquiry", total:values.total, balance_due:values.invoiceBalance, data };
    setStatus("Saving project…");
    const request = currentProjectId ? client.from("projects").update(payload).eq("id", currentProjectId).select().single() : client.from("projects").insert(payload).select().single();
    const { data: saved, error } = await request;
    if (error) { setStatus(error.message.includes("duplicate") ? "That project reference already exists. Choose a different reference." : error.message); return; }
    currentProjectId = saved.id; setStatus("Project saved securely."); await refreshProjects();
  };
  const showApp = () => { authGate.hidden = true; app.hidden = false; };
  const showLogin = () => { app.hidden = true; authGate.hidden = false; };
  const applySession = (session) => {
    const userId = session?.user?.id || null;
    if (!userId) {
      currentUserId = null;
      currentProjectId = null;
      loadedProjectsForUserId = null;
      projects = [];
      if (projectLoadTimer) { window.clearTimeout(projectLoadTimer); projectLoadTimer = null; }
      showLogin();
      return;
    }
    const userChanged = userId !== currentUserId;
    currentUserId = userId;
    if (userChanged) { currentProjectId = null; loadedProjectsForUserId = null; projects = []; }
    if (loadedProjectsForUserId !== userId) setProjectLoading(true);
    showApp();
    queueProjectLoad();
  };
  const initialiseAuth = async () => {
    if (!client) { authStatus.textContent = "Supabase has not been configured yet. Add the project URL and publishable key in supabase-config.js."; authForm.querySelector("button").disabled = true; return; }
    try {
      const { data:{ session }, error } = await client.auth.getSession();
      if (session) {
        applySession(session);
      } else {
        applySession(null);
        if (error) authStatus.textContent = "Your saved session could not be restored. Please sign in again.";
      }
    } catch {
      showLogin();
      authStatus.textContent = "Your saved session could not be restored. Please sign in again.";
    }
    client.auth.onAuthStateChange((event, session) => {
      // getSession() above is the only source of truth during startup.
      // Ignoring INITIAL_SESSION prevents it from racing the restored UI state.
      if (event === "INITIAL_SESSION") return;
      window.setTimeout(() => applySession(session), 0);
    });
  };

  addLineItemButton.addEventListener("click", () => {
    if (!lineItemsPersisted && !lineItems.length) {
      lineItems = [newLineItem({ description:field("packageType")?.value || field("projectTitle")?.value || field("service")?.value || "Service", category:field("service")?.value || "", quantity:1, unitPrice:cleanNumber(field("projectTotal")?.value) })];
    } else lineItems.push(newLineItem());
    lineItemsPersisted = true; lineItemsStatus.textContent = `Service line ${lineItems.length} added.`; renderLineItems(); render();
  });
  form.addEventListener("input", (event) => { if (["quoteNumber","invoiceNumber","receiptNumber","projectReference"].includes(event.target.name)) event.target.dataset.generated = "false"; if (event.target.name === "projectReference") updateGeneratedReferences(); render(); });
  form.addEventListener("change", render);
  tabs.forEach((tab) => tab.addEventListener("click", () => { activeDocument = tab.dataset.documentTab; tabs.forEach(item => item.setAttribute("aria-selected", String(item === tab))); render(); }));
  document.querySelector("[data-save-project]").addEventListener("click", saveProject);
  document.querySelector("[data-new-project]").addEventListener("click", resetProject);
  document.querySelector("[data-refresh-projects]").addEventListener("click", refreshProjects);
  printButton.addEventListener("click", () => window.print());
  copyButton.addEventListener("click", async () => { const copied = await copyText(emailText()); status.textContent = copied ? `${copyButton.textContent.replace("Copy ", "")} copied to the clipboard.` : "Copying is unavailable in this browser."; });
  document.querySelector("[data-sign-out]").addEventListener("click", async () => {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) { setStatus("Unable to sign out. Please try again."); return; }
    authStatus.textContent = "";
    applySession(null);
  });
  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!client) return;
    const button = authForm.querySelector("button");
    button.disabled = true;
    authStatus.textContent = "Signing in…";
    try {
      const { data, error } = await client.auth.signInWithPassword(Object.fromEntries(new FormData(authForm).entries()));
      if (error) throw error;
      authStatus.textContent = "Signed in.";
      applySession(data.session);
    } catch (error) {
      authStatus.textContent = error?.message || "Unable to sign in. Check your email and password.";
    } finally {
      button.disabled = false;
    }
  });
  setDefaults(); render(); initialiseAuth();
})();
