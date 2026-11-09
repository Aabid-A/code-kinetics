"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";

// An in-page link that scrolls smoothly (instantly under reduced motion) and still updates the address, so the
// visitor can share or reload the place. Modified clicks, other buttons and unknown targets keep the browser's
// default behaviour; without JavaScript the link is a plain anchor.
export function SoftAnchor({ href, onClick, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: `#${string}` }) {
  function go(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const id = href.slice(1);
    const target = id === "top" ? document.documentElement : document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (id === "top") window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    history.pushState(null, "", href);
  }
  return <a href={href} onClick={go} {...rest}>{children}</a>;
}
