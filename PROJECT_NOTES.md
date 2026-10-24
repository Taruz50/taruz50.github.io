# Taruz Creative — Project Notes

## Public site

The public creative site is static HTML/CSS/JavaScript. `home.html` is the main creative route, with separate Services, Quote, Links Hub, Privacy and Client Terms pages. A session-only privacy notice is shared across public pages.

Services supports a public multi-service selection flow. Selections are stored in the browser and carried into `quote.html`; no public selection data is sent to the Admin until a project is intentionally created there.

The public Quote form posts directly to Formspree with AJAX, so a visitor stays on the site and receives an on-page confirmation. Its only configuration is `FORMSPREE_ENDPOINT` at the top of `quote.js`; replace `https://formspree.io/f/YOUR_FORM_ID` with the endpoint provided for the Taruz form. The form sends the enquiry fields as clearly labelled values, including the selected service summary, and includes Formspree-compatible `_gotcha` honeypot support. It does not send data to Supabase or the Admin.

## Client workflow

The workflow is quote → project confirmation → deposit invoice → balance invoice → payment receipt. The Admin generates these documents from one project record and supports print/save-as-PDF. References use `TC-YYYY-###`, with related `Q-TC-YYYY-###`, `CONF-TC-YYYY-###`, `INV-TC-YYYY-###-D`, `INV-TC-YYYY-###-B` and `RCPT-TC-YYYY-###` formats. A project may contain multiple editable service line items; their subtotal is the source for discount, total, deposit and balance calculations.

`terms.html` explains fair project-wide terms that sit alongside the agreed quote, confirmation, invoices and receipt. Project-specific written terms take priority where lawful.

## Admin and Supabase

`project-admin.html` and `project-admin.js` form the protected Admin interface. Supabase Auth identifies the user and the `projects` database stores project data. Row-level security follows an owner model: a signed-in user can access only project rows assigned to their own user ID. Line items are stored in the existing owner-scoped `data` JSONB payload, so no schema or RLS change is needed. Existing projects without line items retain their saved single-project-total fallback until they are deliberately converted. Browser configuration contains only the public project URL and publishable/anon key; service-role keys must never be placed in public files.

## Privacy

The Privacy Policy explains how enquiry and project information is used for the workflow and reasonable business records. Quote enquiries are processed by Formspree once its endpoint is configured; Formspree processes the submitted fields to deliver the enquiry to Taruz Creative under its applicable terms and safeguards. Never place passwords, secret keys, live bank details or private client data in public files, documentation, examples or screenshots.

## Deployment and Auth

Deploy the static site to `taruzcreate.com`. In Supabase Auth, configure the production URL and approved redirect URLs to match the deployed Admin URL before relying on password sign-in or recovery flows.

## Known v1 limitation

Client-side reference allocation can collide when simultaneous new projects are created from different devices. Resolve a duplicate by assigning a new reference, or move reference allocation to a database-side sequence in a future release.

## Future ideas (not current implementation)

- Database-side reference generation.
- A reviewed acceptance or e-signature step after legal advice.
- Configurable document email templates and delivery tracking.
- A documented retention schedule and optional consent workflow if new marketing or analytics features are introduced.
