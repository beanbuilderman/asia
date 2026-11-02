/** Sends the dashboard's only email: the "forgotten password" link. Mailpit locally, SMTP online. */
import nodemailer, { type Transporter } from "nodemailer";

export type OutgoingEmail = { to: string; subject: string; text: string; html: string };

/** Emails captured in tests (EMAIL_TRANSPORT=memory). */
export const sentEmails: OutgoingEmail[] = [];

let transporter: Transporter | null = null;
function smtp(): Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 1025);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "127.0.0.1",
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

/** Never throws: returns false if the email could not be sent. */
export async function sendEmail(email: OutgoingEmail): Promise<boolean> {
  if (process.env.EMAIL_TRANSPORT === "memory") {
    sentEmails.push(email);
    return true;
  }
  if (process.env.EMAIL_TRANSPORT === "off") {
    console.error(`[email] not sent to ${email.to}: email is not set up (EMAIL_TRANSPORT=off)`);
    return false;
  }
  try {
    await smtp().sendMail({ from: process.env.EMAIL_FROM ?? "Asia Joanna Rob website <no-reply@asiajoannarob.com>", ...email });
    return true;
  } catch (e) {
    console.error(`[email] to ${email.to} failed:`, e instanceof Error ? e.message : e);
    return false;
  }
}

export function siteUrl(path = ""): string {
  return `${(process.env.SITE_URL ?? "http://localhost:3200").replace(/\/$/, "")}${path}`;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function passwordResetEmail(to: string, url: string): OutgoingEmail {
  const lines = [
    "Someone asked to reset the password for your website dashboard. The link works for 1 hour, and only once.",
    "If this was not you, you can ignore this email. Your password has not changed.",
  ];
  return {
    to,
    subject: "Reset your website password",
    text: `${lines[0]}\n\nChoose a new password: ${url}\n\n${lines[1]}\n`,
    html: `<!doctype html><html><body style="margin:0;background:#FAF8F5;font-family:Georgia,serif;color:#2A2A2A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #E0D9D1">
<tr><td style="padding:20px 24px;border-bottom:1px solid #E0D9D1;font-size:18px;letter-spacing:2px;text-transform:uppercase">Asia Joanna Rob</td></tr>
<tr><td style="padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55">
<p style="margin:0 0 16px">${esc(lines[0])}</p>
<p style="margin:8px 0 24px"><a href="${esc(url)}" style="display:inline-block;background:#1A1A1A;color:#ffffff;text-decoration:none;padding:12px 22px">Choose a new password</a></p>
<p style="margin:0;color:#7A7570">${esc(lines[1])}</p>
</td></tr></table></td></tr></table></body></html>`,
  };
}
