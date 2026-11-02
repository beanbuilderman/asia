"use client";

import Image from "next/image";
import { createContext, useContext, useEffect, useRef, useState, useTransition } from "react";
import { actResetSection, actSaveSection, actUploadPhoto, type FormState } from "../actions";

type Path = (string | number)[];
type Obj = Record<string | number, unknown>;

// ---------- helpers ----------

function getAt(obj: unknown, path: Path): unknown {
  return path.reduce<unknown>((o, k) => (o as Obj)?.[k], obj);
}

/** Copies only the objects along the path, so untouched list items keep their identity. */
function setAt<T>(obj: T, path: Path, value: unknown): T {
  if (path.length === 0) return value as T;
  const [head, ...rest] = path;
  const copy = (Array.isArray(obj) ? [...obj] : { ...(obj as Obj) }) as Obj;
  copy[head] = setAt(copy[head], rest, value);
  return copy as T;
}

let seq = 0;
const newKey = () => `k${++seq}`;

/**
 * Gives every object inside a list a hidden `_k` so React can follow it when it is moved.
 * The server's validation drops unknown fields, so `_k` is never saved.
 */
function withKeys<T>(v: T): T {
  if (Array.isArray(v)) return v.map((x) => (x && typeof x === "object" ? { ...withKeys(x), _k: newKey() } : x)) as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, withKeys(x)])) as T;
  return v;
}
const keyOf = (item: unknown, i: number) => ((item as { _k?: string })?._k ?? String(i));

/** Shrinks a photo in the browser (max 2400px, JPEG) so uploads stay small and fast on a phone. */
async function shrink(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type) && !/\.(heic|heif)$/i.test(file.name)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    return blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file; // the server checks the type and size anyway
  }
}

async function uploadOne(file: File): Promise<{ url?: string; error?: string }> {
  const fd = new FormData();
  fd.set("photo", await shrink(file));
  try {
    return await actUploadPhoto(fd);
  } catch {
    return { error: "The upload was interrupted. Please check your connection and try again." };
  }
}

// ---------- the section editor ----------

type Ctx = { value: unknown; update: (path: Path, v: unknown) => void };
const EditorCtx = createContext<Ctx | null>(null);
const useEditor = () => useContext(EditorCtx)!;

/** Edits one part of the website and saves it in one go. */
export function SectionEditor({
  sectionKey,
  initial,
  defaults,
  viewHref,
  children,
}: {
  sectionKey: string;
  initial: unknown;
  defaults: unknown;
  viewHref: string;
  children: React.ReactNode;
}) {
  const [value, setValue] = useState(() => withKeys(initial));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(0); // photo uploads in progress
  const [result, setResult] = useState<FormState>(undefined);
  const [pending, start] = useTransition();

  const update = (path: Path, v: unknown) => {
    setValue((x: unknown) => setAt(x, path, v));
    setDirty(true);
    setResult(undefined);
  };

  // Warn before leaving with unsaved changes (closing the tab, or tapping another dashboard page).
  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest?.("a[href]");
      if (!link || link.getAttribute("target") === "_blank" || link.closest(".content-editor")) return;
      if (!confirm("You have unsaved changes. Leave without saving?")) {
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
      const r = await actSaveSection(sectionKey, value);
      setResult(r);
      if (r?.ok) setDirty(false);
    });

  const reset = () => {
    if (!confirm("Put this page back to the original wording and photos? Everything you saved on this page will be replaced.")) return;
    start(async () => {
      const r = await actResetSection(sectionKey);
      setResult(r);
      if (r?.ok) {
        setValue(withKeys(defaults));
        setDirty(false);
      }
    });
  };

  return (
    <EditorCtx.Provider value={{ value, update }}>
      <BusyCtx.Provider value={setBusy}>
        <div className="content-editor">
          {children}
          <p style={{ marginTop: 28 }}>
            <button type="button" className="link-button" onClick={reset} disabled={pending}>
              Put this page back to the original wording and photos
            </button>
          </p>
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
                  <a href={viewHref} target="_blank" rel="noopener">
                    View it
                  </a>
                </span>
              )}
              {!result && <span className="muted">{busy ? "Uploading photos…" : dirty ? "You have unsaved changes." : "No changes yet."}</span>}
            </span>
            <button type="button" className="btn" onClick={save} disabled={pending || !dirty || busy > 0}>
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </BusyCtx.Provider>
    </EditorCtx.Provider>
  );
}

const BusyCtx = createContext<React.Dispatch<React.SetStateAction<number>>>(() => {});

// ---------- fields ----------

export function Text({ path, label, area, hint, rows }: { path: Path; label: string; area?: boolean; hint?: string; rows?: number }) {
  const { value, update } = useEditor();
  const id = `f-${path.join("-")}`;
  const v = String(getAt(value, path) ?? "");
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {area ? (
        <textarea id={id} value={v} rows={rows ?? Math.min(14, Math.max(3, Math.ceil(v.length / 60) + v.split("\n").length))} onChange={(e) => update(path, e.target.value)} />
      ) : (
        <input id={id} type="text" value={v} onChange={(e) => update(path, e.target.value)} />
      )}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function Panel({ title, intro, children }: { title: string; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="panel editor-section">
      <h2>{title}</h2>
      {intro && <p className="muted small">{intro}</p>}
      {children}
    </section>
  );
}

/** A list of items with add, remove and move controls. Collapsible when `summary` is given. */
export function List({
  path,
  label,
  max,
  blank,
  render,
  summary,
  addLabel,
  addAt = "end",
}: {
  path: Path;
  label: string;
  max: number;
  blank: () => object;
  render: (i: number) => React.ReactNode;
  summary?: (item: Obj, i: number) => string;
  addLabel?: string;
  addAt?: "start" | "end";
}) {
  const { value, update } = useEditor();
  const items = (getAt(value, path) as Obj[]) ?? [];
  const [openKey, setOpenKey] = useState<string | null>(null);
  const move = (i: number, d: number) => {
    const next = [...items];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    update(path, next);
  };
  const add = () => {
    const item = { ...blank(), _k: newKey() };
    update(path, addAt === "start" ? [item, ...items] : [...items, item]);
    setOpenKey(item._k);
  };
  const remove = (i: number) => {
    const what = summary ? `"${summary(items[i], i)}"` : `${label} ${i + 1}`;
    if (confirm(`Remove ${what}? (Nothing is saved until you press Save.)`)) update(path, items.filter((_, j) => j !== i));
  };
  const addButton = items.length < max && (
    <button type="button" className="mini-btn" onClick={add}>
      + {addLabel ?? `Add ${label.toLowerCase()}`}
    </button>
  );

  return (
    <div className="editor-list">
      {addAt === "start" && addButton}
      {items.map((item, i) => {
        const k = keyOf(item, i);
        const controls = (
          <span className="row-actions" style={{ marginTop: 0 }}>
            <button type="button" className="mini-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${label} ${i + 1} up`}>
              ↑
            </button>
            <button type="button" className="mini-btn" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${label} ${i + 1} down`}>
              ↓
            </button>
            <button type="button" className="mini-btn danger" onClick={() => remove(i)} aria-label={`Remove ${label} ${i + 1}`}>
              Remove
            </button>
          </span>
        );
        if (summary) {
          return (
            <details className="editor-item" key={k} open={openKey === k || undefined} onToggle={(e) => e.currentTarget.open && setOpenKey(k)}>
              <summary>
                <span className="summary-text">{summary(item, i) || `${label} ${i + 1}`}</span>
              </summary>
              <div className="editor-item-body">
                <div className="editor-item-head">{controls}</div>
                {render(i)}
              </div>
            </details>
          );
        }
        return (
          <div className="editor-item" key={k}>
            <div className="editor-item-head">
              <b>
                {label} {i + 1}
              </b>
              {controls}
            </div>
            {render(i)}
          </div>
        );
      })}
      {items.length === 0 && <p className="muted small">Nothing here yet.</p>}
      {addAt === "end" && addButton}
    </div>
  );
}

// ---------- photos ----------

type Img = { url: string; alt: string; focus: "center" | "top"; _k?: string };

function Thumb({ url, alt }: { url: string; alt: string }) {
  return <Image src={url} alt={alt} width={256} height={160} sizes="180px" className="thumb" />;
}

function PhotoDetails({ path, image }: { path: Path; image: Img }) {
  return (
    <>
      <Text path={[...path, "alt"]} label="Short description (read out to blind visitors)" />
      <FocusToggle path={path} image={image} />
    </>
  );
}

function FocusToggle({ path, image }: { path: Path; image: Img }) {
  const { update } = useEditor();
  return (
    <label className="check">
      <input type="checkbox" checked={image.focus === "top"} onChange={(e) => update([...path, "focus"], e.target.checked ? "top" : "center")} />
      Keep the top of the photo in view (for posters, or when heads get cut off)
    </label>
  );
}

/** Upload button that handles one or several photos, shrinking each in the browser first. */
function UploadButton({ multiple, label, onUploaded }: { multiple: boolean; label: string; onUploaded: (urls: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const setBusy = useContext(BusyCtx);
  const [progress, setProgress] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const run = async (files: File[]) => {
    setErrors([]);
    setBusy((n) => n + 1);
    const urls: string[] = [];
    const errs: string[] = [];
    for (let i = 0; i < files.length; i++) {
      setProgress(files.length > 1 ? `Uploading ${i + 1} of ${files.length}…` : "Uploading…");
      const r = await uploadOne(files[i]);
      if (r.url) urls.push(r.url);
      else errs.push(`${files[i].name}: ${r.error}`);
    }
    if (urls.length) onUploaded(urls);
    setErrors(errs);
    setProgress(null);
    setBusy((n) => n - 1);
  };

  return (
    <span className="upload">
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) void run(files);
        }}
      />
      <button type="button" className="mini-btn primary" onClick={() => input.current?.click()} disabled={progress !== null}>
        {progress ?? label}
      </button>
      {errors.map((m, i) => (
        <span key={i} className="flash bad" role="alert" style={{ display: "block" }}>
          {m}
        </span>
      ))}
    </span>
  );
}

/** One photo, such as the portrait on the About page. */
export function PhotoField({ path, label }: { path: Path; label: string }) {
  const { value, update } = useEditor();
  const image = getAt(value, path) as Img;
  return (
    <div className="photo-field">
      <b>{label}</b>
      <div className="photo-field-row">
        <Thumb url={image.url} alt={image.alt} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <UploadButton multiple={false} label="Change photo" onUploaded={([url]) => update(path, { ...image, url })} />
          <PhotoDetails path={path} image={image} />
        </div>
      </div>
    </div>
  );
}

/** A gallery of photos: add several at once, reorder, describe, remove. */
export function PhotoList({ path, max, min = 0, label = "Photo" }: { path: Path; max: number; min?: number; label?: string }) {
  const { value, update } = useEditor();
  const images = (getAt(value, path) as Img[]) ?? [];
  const [editing, setEditing] = useState<string | null>(null);
  const move = (i: number, d: number) => {
    const next = [...images];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    update(path, next);
  };
  const room = max - images.length;
  return (
    <div className="photo-list">
      <ol className="photo-grid">
        {images.map((img, i) => {
          const k = keyOf(img, i);
          return (
            <li key={k} className="photo-tile">
              <Thumb url={img.url} alt={img.alt} />
              <span className="photo-num">{i === 0 ? "1 (shown first)" : i + 1}</span>
              <span className="row-actions" style={{ marginTop: 6 }}>
                <button type="button" className="mini-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${label.toLowerCase()} ${i + 1} earlier`}>
                  ←
                </button>
                <button type="button" className="mini-btn" disabled={i === images.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${label.toLowerCase()} ${i + 1} later`}>
                  →
                </button>
                <button type="button" className="mini-btn" onClick={() => setEditing(editing === k ? null : k)} aria-expanded={editing === k}>
                  {editing === k ? "Done" : "Details"}
                </button>
                <button
                  type="button"
                  className="mini-btn danger"
                  disabled={images.length <= min}
                  onClick={() => update(path, images.filter((_, j) => j !== i))}
                  aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}
                >
                  Remove
                </button>
              </span>
              {editing === k && (
                <div className="photo-details">
                  <PhotoDetails path={[...path, i]} image={img} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {room > 0 ? (
        <UploadButton
          multiple
          label="+ Add photos"
          onUploaded={(urls) =>
            update(path, [...images, ...urls.slice(0, room).map((url) => ({ url, alt: "", focus: "center" as const, _k: newKey() }))])
          }
        />
      ) : (
        <p className="muted small">This is the most photos allowed here ({max}).</p>
      )}
      {images.length > 1 && <p className="hint">Use the arrows to change the order. The first photo is the one people see first.</p>}
    </div>
  );
}
