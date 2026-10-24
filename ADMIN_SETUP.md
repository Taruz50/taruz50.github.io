# Taruz Admin v1 setup

## 1. Create the Supabase project

Create a new Supabase project for Taruz Admin. Keep the database password in a password manager; it is not used by the website and must not be added to this repository.

## 2. Configure authentication

In Supabase Authentication settings:

1. Keep **Email + Password** enabled.
2. Do not build or expose a sign-up screen in Taruz Admin. Create the Taruz administrator user manually from the Supabase Users screen, or invite the email address you want to use.
3. Use the same administrator login on Mac, iPhone, and iPad so all three devices see the same project records.
4. Add the deployed site URL to Supabase's allowed site/redirect URLs. When using a custom admin address, add `https://admin.taruzcreate.com` as well.

## 3. Create the database and RLS policies

Open the Supabase SQL Editor and run the complete contents of `supabase/migrations/20261024_taruz_admin_v1.sql` once. It creates the `projects` table, permitted status values, an update timestamp trigger, and Row Level Security policies.

The policies allow an authenticated user to read, create, edit, or delete only rows where `owner_id = auth.uid()`. This means an authenticated user cannot read another user's projects through the public browser API.

## 4. Add the public client configuration

In **Project Settings → API**, copy only:

- the Project URL
- the browser-safe publishable key (or legacy anon key)

Paste them into `supabase-config.js`:

```js
window.TARUZ_SUPABASE_CONFIG = {
  url: "https://your-project.supabase.co",
  anonKey: "your-publishable-or-anon-key"
};
```

Never add the service-role key, database password, SMTP credentials, or bank details to the site. The browser key is intentionally public; the RLS policies are what restrict project data.

## 5. Deploy and access

Deploy the static site, then bookmark `/admin/` or point `admin.taruzcreate.com` at the deployment. There is intentionally no public-site navigation link to the Admin.

Sign in and create a test project from one device. Open the Admin on a second device with the same login and confirm that the project appears there before using it for client work.

## What v1 does not do

It does not send email, accept payments, expose a client portal, collect signatures, or include bank details in source code. Enter payment details per project only when needed.
