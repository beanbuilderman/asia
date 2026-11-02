import fs from "node:fs/promises";
import path from "node:path";
import { LOCAL_UPLOAD_DIR } from "@/lib/uploads";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Development only: serves photos uploaded on this computer. Online, photos live in Vercel Blob. */
export async function GET(_: Request, ctx: RouteContext<"/uploads/[name]">) {
  const { name } = await ctx.params;
  const type = TYPES[name.split(".").pop() ?? ""];
  if (process.env.VERCEL || !/^[\w-]+\.(jpg|png|webp)$/.test(name) || !type) return new Response("Not found", { status: 404 });
  try {
    const bytes = await fs.readFile(path.join(LOCAL_UPLOAD_DIR, name));
    return new Response(new Uint8Array(bytes), { headers: { "content-type": type, "cache-control": "public, max-age=31536000, immutable" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
