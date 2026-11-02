import Link from "next/link";

/** Frame for the sign-in, forgotten password and new password pages. */
export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="auth">
      <div className="auth-inner">
        <p className="auth-brand">Asia Joanna Rob</p>
        <p className="auth-sub">Website dashboard</p>
        <div className="panel">
          <h1>{title}</h1>
          {children}
        </div>
        <p className="auth-back">
          <Link href="/">← Back to the website</Link>
        </p>
      </div>
    </div>
  );
}
