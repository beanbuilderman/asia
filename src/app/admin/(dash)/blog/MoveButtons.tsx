"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { actMovePost } from "../../actions";

/** Up and down arrows on the post list. Moving saves straight away. */
export function MoveButtons({ slug, first, last, title }: { slug: string; first: boolean; last: boolean; title: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const move = (by: -1 | 1) =>
    start(async () => {
      await actMovePost(slug, by);
      router.refresh();
    });
  return (
    <>
      <button type="button" className="mini-btn" disabled={first || pending} onClick={() => move(-1)} aria-label={`Move "${title}" up`}>
        ↑
      </button>
      <button type="button" className="mini-btn" disabled={last || pending} onClick={() => move(1)} aria-label={`Move "${title}" down`}>
        ↓
      </button>
    </>
  );
}
