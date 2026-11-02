"use client";

import { useActionState } from "react";
import { changePassword } from "../../actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  return (
    <form action={action} className="form-narrow">
      <div className="field">
        <label htmlFor="current">Current password</label>
        <input id="current" name="current" type="password" autoComplete="current-password" required />
      </div>
      <div className="field">
        <label htmlFor="password">New password (at least 10 characters)</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required />
      </div>
      <div className="field">
        <label htmlFor="confirm">New password again</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} required />
      </div>
      {state?.error && <p className="flash bad" role="alert">{state.error}</p>}
      {state?.ok && <p className="flash ok" role="status">{state.message}</p>}
      <button type="submit" className="btn" disabled={pending}>{pending ? "Saving…" : "Change password"}</button>
    </form>
  );
}
