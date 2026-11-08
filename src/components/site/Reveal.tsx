"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// One-time, subtle reveal (opacity and at most 12 px) for text blocks that start below the first screen. The
// content is visible in the server HTML and without JavaScript; only after mount, and only when motion is allowed,
// is a block below the fold held back until it scrolls into view. Labs are never wrapped in a Reveal.
export function Reveal({ className, children }: { className?: string; children: ReactNode }) {
  const element = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const target = element.current;
    if (!target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (target.getBoundingClientRect().top < window.innerHeight) return;
    // Held back (state set after mount, once), then released once as the block enters the viewport.
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setPending(false); observer.disconnect(); }
    }, { rootMargin: "0px 0px -10% 0px" });
    const frame = requestAnimationFrame(() => { setPending(true); observer.observe(target); });
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, []);

  return <div ref={element} className={className} data-reveal={pending ? "pending" : "done"}>{children}</div>;
}
