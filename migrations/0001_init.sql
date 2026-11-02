-- Dashboard logins.
CREATE TABLE admin_users (
  id                  serial PRIMARY KEY,
  email               text NOT NULL,
  name                text NOT NULL DEFAULT '',
  password_hash       text NOT NULL,
  password_changed_at timestamptz NOT NULL DEFAULT now(),
  last_login_at       timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX admin_users_email ON admin_users (lower(email));

-- Website wording and photos edited in the dashboard.
-- One row per page section ('site', 'about', 'productions', 'teaching', 'contact').
-- A section never saved falls back to the original wording in src/content/defaults.ts.
CREATE TABLE site_content (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
