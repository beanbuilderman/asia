import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";

export const instant = false;

const CARDS = [
  { href: "/admin/about/", title: "About", text: "Your photo, introduction, training list and testimonials." },
  { href: "/admin/productions/", title: "Productions", text: "Add a new production, change the wording, add or reorder photos." },
  { href: "/admin/teaching/", title: "Teaching", text: "The photo carousel, your introduction and your teaching experience." },
  { href: "/admin/contact/", title: "Contact", text: "Your email address, the short message and your social links." },
  { href: "/admin/settings/", title: "Settings", text: "How the site appears on Google, the footer, and your password." },
];

export default async function DashboardHome() {
  await requireAdminPage();
  return (
    <>
      <h1>What would you like to change?</h1>
      <p className="muted lead">Pick a page. Changes show on your website as soon as you press Save.</p>
      <div className="card-grid">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="panel card-link">
            <b>{c.title}</b>
            <span className="muted">{c.text}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
