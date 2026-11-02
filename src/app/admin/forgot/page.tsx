"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "../actions";
import { AuthShell } from "../AuthShell";

export default function ForgotPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);
  return (
    <AuthShell title="Reset your password">
      {state?.ok ? (
        <p className="flash ok" role="status">
          {state.message}
        </p>
      ) : (
        <form action={action}>
          <p className="muted small">Enter the email you sign in with and we will email you a link to choose a new password.</p>
          <div className="field">
            <label htmlFor="email">Your email</label>
            <input id="email" name="email" type="email" autoComplete="username" required />
          </div>
          <button type="submit" className="btn btn-block" disabled={pending}>
            {pending ? "Sending…" : "Email me a reset link"}
          </button>
        </form>
      )}
      <p style={{ marginTop: 16 }}>
        <Link href="/admin/login/">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
