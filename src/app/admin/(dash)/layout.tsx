import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getSession } from "@/lib/auth";
import { logout } from "../actions";
import { AdminNav } from "./AdminNav";

// The dashboard always shows live data; it is not meant to be prerendered.
export const instant = false;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="admin-main">
          <p className="muted" role="status">
            Loading…
          </p>
        </div>
      }
    >
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await getSession();
  if (!session) redirect("/admin/login/");
  return (
    <>
      <header className="admin-top">
        <div className="bar">
          <Link href="/admin/" className="logo">
            Asia Joanna Rob <span className="admin-tag">Dashboard</span>
          </Link>
          <span className="row-actions" style={{ marginTop: 0 }}>
            <a className="mini-btn ghost" href="/" target="_blank" rel="noopener">
              View website
            </a>
            <form action={logout}>
              <button type="submit" className="mini-btn ghost">
                Sign out
              </button>
            </form>
          </span>
        </div>
        <AdminNav />
      </header>
      <main className="admin-main" id="main">
        {children}
      </main>
    </>
  );
}
