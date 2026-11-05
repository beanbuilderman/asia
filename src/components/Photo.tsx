import Image from "next/image";
import type { SiteImage } from "@/lib/content";

/**
 * A website photo, resized by Next.js so phones do not download the full-size originals
 * (some are over 7MB). Width and height are nominal: the stylesheet sets the real shape.
 */
export function Photo({
  image,
  className,
  sizes,
  priority,
  ratio = [16, 10],
  fallbackAlt = "",
}: {
  image: SiteImage;
  className?: string;
  sizes: string;
  priority?: boolean;
  ratio?: [number, number];
  fallbackAlt?: string;
}) {
  const cls = [className, image.focus !== "center" ? `img-${image.focus}` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <Image
      src={image.url}
      alt={image.alt || fallbackAlt}
      width={1600}
      height={Math.round((1600 * ratio[1]) / ratio[0])}
      sizes={sizes}
      className={cls}
      priority={priority}
    />
  );
}
