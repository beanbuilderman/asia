"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPassword } from "../../actions";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, undefined);
  if (state?.ok) {
    return (
      <p className="flash ok" role="status">
        {state.message} <Link href="/admin/login/">Sign in</Link>
      </p>
    );
  }
  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      <div className="field">
        <label htmlFor="password">New password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required />
        <span className="hint">At least 10 characters.</span>
      </div>
      <div className="field">
        <label htmlFor="confirm">Type it again</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} required />
      </div>
      {state?.error && (
        <p className="flash bad" role="alert">
          {state.error} {state.error.includes("expired") && <Link href="/admin/forgot/">Ask for a new link</Link>}
        </p>
      )}
      <button type="submit" className="btn btn-block" disabled={pending}>
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
