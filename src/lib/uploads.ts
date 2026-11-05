/** Stores a photo or PDF Asia uploads: Vercel Blob online, the .uploads folder locally. */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { put } from "@vercel/blob";

export const MAX_UPLOAD_BYTES = 3.8 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export class UploadError extends Error {}

export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), ".uploads");

/** Returns the public URL of the stored photo. */
export async function storePhoto(file: File, slot: string): Promise<string> {
  const ext = TYPES[file.type];
  if (!ext) throw new UploadError("Please choose a JPG, PNG or WebP photo.");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("That photo is too big. Please choose a smaller one.");
  if (file.size === 0) throw new UploadError("That file is empty.");
  const bytes = Buffer.from(await file.arrayBuffer());
  // Check the file really is the image type it claims to be.
  const sig = bytes.subarray(0, 12);
  const isJpeg = sig[0] === 0xff && sig[1] === 0xd8;
  const isPng = sig.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const isWebp = sig.subarray(0, 4).toString("ascii") === "RIFF" && sig.subarray(8, 12).toString("ascii") === "WEBP";
  if (!({ jpg: isJpeg, png: isPng, webp: isWebp } as Record<string, boolean>)[ext]) {
    throw new UploadError("That file is not a valid photo.");
  }
  return store(bytes, `site/${slot}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`, file.type);
}

/** Stores a CV. Returns its public URL. */
export async function storePdf(file: File, slot: string): Promise<string> {
  if (file.size === 0) throw new UploadError("That file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("That PDF is too big (over 3.8MB). Try saving it again with smaller pictures.");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") throw new UploadError("Please choose a PDF file. In Word or Pages, use Export or Save as PDF first.");
  // A readable name, so the downloaded file says whose CV it is.
  const tidy = slot.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "cv";
  return store(bytes, `cv/asia-joanna-rob-${tidy}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.pdf`, "application/pdf");
}

async function store(bytes: Buffer, name: string, contentType: string): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(name, bytes, { access: "public", contentType, addRandomSuffix: false });
    return blob.url;
  }
  if (process.env.VERCEL) throw new UploadError("File storage is not set up yet. Ask Sonny to connect it.");
  // Locally: kept outside public/ and served by src/app/uploads/[name]/route.ts, because the
  // production server only serves public/ files that existed when the site was built.
  const dir = LOCAL_UPLOAD_DIR;
  await fs.mkdir(dir, { recursive: true });
  const file2 = path.basename(name);
  await fs.writeFile(path.join(dir, file2), bytes);
  return `/uploads/${file2}`;
}
