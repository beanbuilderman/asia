import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin">{children}</div>;
}
