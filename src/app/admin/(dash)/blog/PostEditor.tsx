"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { Post } from "@/content/posts";
import type { SiteImage } from "@/lib/content";
import { actDeletePost, actSavePost } from "../../actions";
import { uploadOne } from "../editor";

/** A section as Asia edits it: paragraphs split by a blank line, one bullet point per line. */
type EditSection = { h2: string; text: string; bullets: string; image?: SiteImage };
type EditPost = Omit<Post, "sections"> & { sections: EditSection[]; hasQuote: boolean };

const toEdit = (p: Post): EditPost => ({
  ...p,
  hasQuote: !!p.quote,
  quote: p.quote ?? { quote: "", name: "" },
  sections: p.sections.map((s) => ({ h2: s.h2, text: (s.p ?? []).join("\n\n"), bullets: (s.list ?? []).join("\n"), image: s.image })),
});

const fromEdit = ({ hasQuote, ...p }: EditPost): Post => ({
  ...p,
  quote: hasQuote ? p.quote : undefined,
  sections: p.sections.map((s) => {
    const para = s.text.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
    const list = s.bullets.split("\n").map((x) => x.replace(/^[-•*]\s+/, "").trim()).filter(Boolean);
    return { h2: s.h2, ...(para.length ? { p: para } : {}), ...(list.length ? { list } : {}), ...(s.image ? { image: s.image } : {}) };
  }),
});

const slugify = (s: string) =>
  s
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

const ITALICS = "Put *asterisks* around words to show them in italics, e.g. *Richard II*.";

function Field({
  id,
  label,
  value,
  onChange,
  area,
  rows,
  hint,
  max,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  area?: boolean;
  rows?: number;
  hint?: React.ReactNode;
  max?: number;
}) {
  const over = max !== undefined && value.trim().length > max;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {area ? (
        <textarea id={id} value={value} rows={rows ?? Math.min(14, Math.max(3, Math.ceil(value.length / 70) + value.split("\n").length))} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {(hint || max) && (
        <span className="hint" style={over ? { color: "var(--danger, #A33)" } : undefined}>
          {hint}
          {hint && max ? " " : ""}
          {max ? `${value.trim().length} of ${max} characters.` : ""}
        </span>
      )}
    </div>
  );
}

/** Upload, preview, describe and remove one optional photo. */
function PostPhoto({ id, image, onChange, addLabel }: { id: string; image?: SiteImage; onChange: (img: SiteImage | undefined) => void; addLabel: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const upload = (file: File) =>
    start(async () => {
      setError(null);
      const r = await uploadOne(file);
      if (r.url) onChange({ url: r.url, alt: image?.alt ?? "", focus: image?.focus ?? "center" });
      else setError(r.error ?? "The photo could not be uploaded.");
    });
  return (
    <div className="post-photo-field">
      {image && (
        // eslint-disable-next-line @next/next/no-img-element -- preview of an uploaded photo
        <img src={image.url} alt="" className="photo-preview" />
      )}
      <input
        ref={input}
        id={`${id}-file`}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      <div className="row-actions">
        <button type="button" className="mini-btn primary" disabled={pending} onClick={() => input.current?.click()}>
          {pending ? "Uploading…" : image ? "Change photo" : addLabel}
        </button>
        {image && (
          <button type="button" className="mini-btn" disabled={pending} onClick={() => onChange(undefined)}>
            Remove photo
          </button>
        )}
      </div>
      {error && (
        <span className="flash bad" role="alert">
          {error}
        </span>
      )}
      {image && (
        <Field
          id={`${id}-alt`}
          label="Describe the photo"
          value={image.alt}
          max={160}
          hint="For Google and people who use screen readers, e.g. The cast of Borders rehearsing at the Arcola."
          onChange={(v) => onChange({ ...image, alt: v })}
        />
      )}
    </div>
  );
}

export function PostEditor({ initial, original, others, isNew, defaultVersion }: { initial: Post; original: string | null; others: { slug: string; h1: string }[]; isNew: boolean; defaultVersion: Post | null }) {
  const router = useRouter();
  const [p, setP] = useState<EditPost>(() => toEdit(initial));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<{ ok?: boolean; error?: string; message?: string } | null>(null);
  const [pending, start] = useTransition();

  const set = <K extends keyof EditPost>(k: K, v: EditPost[K]) => {
    setP((x) => ({ ...x, [k]: v }));
    setDirty(true);
    setResult(null);
  };
  const setSection = (i: number, patch: Partial<EditSection>) => set("sections", p.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const moveItem = <T,>(list: T[], i: number, d: number) => {
    const next = [...list];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    return next;
  };

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest?.("a[href]");
      if (link && !link.closest(".post-editor") && !link.hasAttribute("target") && !confirm("You have unsaved changes. Leave without saving?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  const save = () =>
    start(async () => {
      const r = await actSavePost(original, fromEdit(p));
      setResult(r);
      if (r.ok) {
        setDirty(false);
        if (r.slug && r.slug !== original) router.replace(`/admin/blog/${r.slug}/?saved=1`);
        else router.refresh();
      }
    });

  const liveHref = `/blog/${p.slug}/`;
  const previewHref = original ? `/preview/blog/${original}/` : null;

  return (
    <div className="post-editor">
      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Show on my website</h2>
        <label className="check">
          <input type="checkbox" checked={p.published} onChange={(e) => set("published", e.target.checked)} /> Publish this post (people can read it and Blog
          appears in your menu)
        </label>
        <p className="muted small" style={{ marginBottom: 0 }}>
          Untick it to keep the post as a draft. Drafts are only visible to you, with the Preview button.
        </p>
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Top of the post</h2>
        <Field
          id="h1"
          label="Heading"
          value={p.h1}
          max={120}
          hint={ITALICS}
          onChange={(v) => {
            set("h1", v);
            if (!slugTouched) setP((x) => ({ ...x, h1: v, slug: slugify(v) }));
          }}
        />
        <Field id="date" label="Date shown above the heading (optional)" value={p.date} max={40} hint="For example November 2026 or 5 November 2026." onChange={(v) => set("date", v)} />
        <Field id="intro" label="Introduction" area value={p.intro} max={1200} hint={ITALICS} onChange={(v) => set("intro", v)} />
        <div className="field">
          <span className="label">Main photo (optional)</span>
          <PostPhoto id="main-photo" image={p.image} onChange={(img) => set("image", img)} addLabel="+ Add a photo" />
        </div>
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Sections</h2>
        <p className="muted small">Leave a blank line between paragraphs. Put each bullet point on its own line. {ITALICS}</p>
        <div className="editor-list">
          {p.sections.map((s, i) => (
            <div className="editor-item" key={i}>
              <div className="editor-item-head">
                <b>Section {i + 1}</b>
                <span className="row-actions" style={{ marginTop: 0 }}>
                  <button type="button" className="mini-btn" disabled={i === 0} onClick={() => set("sections", moveItem(p.sections, i, -1))} aria-label={`Move section ${i + 1} up`}>
                    ↑
                  </button>
                  <button type="button" className="mini-btn" disabled={i === p.sections.length - 1} onClick={() => set("sections", moveItem(p.sections, i, 1))} aria-label={`Move section ${i + 1} down`}>
                    ↓
                  </button>
                  <button type="button" className="mini-btn danger" disabled={p.sections.length <= 1} onClick={() => set("sections", p.sections.filter((_, j) => j !== i))} aria-label={`Remove section ${i + 1}`}>
                    Remove
                  </button>
                </span>
              </div>
              <Field id={`s${i}-h2`} label="Heading (optional)" value={s.h2} max={120} onChange={(v) => setSection(i, { h2: v })} />
              <Field id={`s${i}-text`} label="Text" area value={s.text} onChange={(v) => setSection(i, { text: v })} />
              <Field id={`s${i}-list`} label="Bullet points (optional, one per line)" area value={s.bullets} onChange={(v) => setSection(i, { bullets: v })} />
              <div className="field">
                <span className="label">Photo (optional)</span>
                <PostPhoto id={`s${i}-photo`} image={s.image} addLabel="+ Add a photo" onChange={(img) => setSection(i, { image: img })} />
              </div>
            </div>
          ))}
          {p.sections.length < 20 && (
            <button type="button" className="mini-btn" onClick={() => set("sections", [...p.sections, { h2: "", text: "", bullets: "" }])}>
              + Add a section
            </button>
          )}
        </div>
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Quote (optional)</h2>
        <label className="check">
          <input type="checkbox" checked={p.hasQuote} onChange={(e) => set("hasQuote", e.target.checked)} /> Show a quote at the end of the post
        </label>
        {p.hasQuote && (
          <>
            <p className="muted small">Only use quotes the person has agreed you can use.</p>
            <Field id="quote" label="What they said (without quotation marks)" area value={p.quote?.quote ?? ""} max={600} onChange={(v) => set("quote", { name: p.quote?.name ?? "", quote: v })} />
            <Field id="quote-name" label="Who said it" value={p.quote?.name ?? ""} max={80} onChange={(v) => set("quote", { quote: p.quote?.quote ?? "", name: v })} />
          </>
        )}
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>More posts at the bottom (up to 3)</h2>
        {others.length === 0 ? (
          <p className="muted">No other posts yet.</p>
        ) : (
          others.map((o) => {
            const on = p.related.includes(o.slug);
            return (
              <label key={o.slug} className="check">
                <input type="checkbox" checked={on} disabled={!on && p.related.length >= 3} onChange={() => set("related", on ? p.related.filter((r) => r !== o.slug) : [...p.related, o.slug])} />{" "}
                {o.h1}
              </label>
            );
          })
        )}
        <p className="muted small" style={{ marginBottom: 0 }}>
          Only published posts are shown.
        </p>
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>How it appears on Google and when shared</h2>
        <Field id="title" label="Title on Google (optional)" value={p.title} max={90} hint="Ideally under 60 characters. If empty, the heading is used." onChange={(v) => set("title", v)} />
        <Field id="description" label="Description on Google (optional)" area value={p.description} max={240} hint="Ideally under 160 characters. If empty, the start of the introduction is used." onChange={(v) => set("description", v)} />
        <Field id="summary" label="Short summary on the blog list (optional)" area value={p.summary} max={240} hint="If empty, the start of the introduction is used." onChange={(v) => set("summary", v)} />
        <Field
          id="slug"
          label="Web address"
          value={p.slug}
          max={90}
          hint={
            <>
              asiajoannarob.com/blog/<b>{p.slug || "…"}</b>.{" "}
              {isNew ? "Made from the heading; you can change it." : "Changing it after you have shared the link breaks the old link, so only change it if you need to."}
            </>
          }
          onChange={(v) => {
            setSlugTouched(true);
            set("slug", v.toLowerCase().replace(/\s+/g, "-"));
          }}
        />
      </section>

      <div className="editor-savebar" role="region" aria-label="Save">
        <span className="savebar-msg">
          {result?.error && (
            <span className="flash bad" role="alert">
              {result.error}
            </span>
          )}
          {result?.ok && (
            <span className="flash ok" role="status">
              {result.message}{" "}
              {p.published ? (
                <Link href={liveHref} target="_blank">
                  View it
                </Link>
              ) : (
                previewHref && (
                  <Link href={`/preview/blog/${p.slug}/`} target="_blank">
                    Preview
                  </Link>
                )
              )}
            </span>
          )}
          {!result && <span className="muted">{dirty ? "You have unsaved changes." : "No changes yet."}</span>}
        </span>
        {previewHref && (
          <Link className="mini-btn" href={previewHref} target="_blank">
            Preview
          </Link>
        )}
        <button type="button" className="btn" onClick={save} disabled={pending || (!dirty && !isNew)}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>

      {!isNew && (
        <div className="panel" style={{ marginTop: 24 }}>
          <h2 style={{ marginTop: 0 }}>More options</h2>
          <div className="row-actions">
            {defaultVersion && (
              <button
                type="button"
                className="mini-btn"
                onClick={() => {
                  if (confirm("Put this post back to the original template wording? Nothing is saved until you press Save.")) {
                    setP(toEdit({ ...defaultVersion, published: p.published, related: defaultVersion.related.filter((r) => others.some((o) => o.slug === r)) }));
                    setDirty(true);
                    setResult(null);
                  }
                }}
              >
                Put back the original wording
              </button>
            )}
            <button
              type="button"
              className="mini-btn danger"
              disabled={pending}
              onClick={() => {
                if (confirm(`Delete "${p.h1}"? If it is published, the page stops working straight away.`))
                  start(async () => {
                    setDirty(false);
                    const r = await actDeletePost(original!);
                    if (r?.error) setResult(r);
                  });
              }}
            >
              Delete this post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
