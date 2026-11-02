-- "Forgotten password" links. Only the hash of the emailed token is stored; each link works once, for 1 hour.
CREATE TABLE password_resets (
  id         serial PRIMARY KEY,
  user_id    integer NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
