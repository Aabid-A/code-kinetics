import type { ReactNode } from "react";

// One chapter of the page: a mono eyebrow ("01 — Button"), a serif title with at most one italic word, one
// sentence saying what to notice, and the chapter's content (a lab). Layout variants are CSS-only.
export function Chapter({ id, number, label, title, caption, layout = "side", children }: {
  id: string; number: string; label: string; title: ReactNode; caption: ReactNode;
  layout?: "side" | "stacked"; children: ReactNode;
}) {
  const heading = `${id}-title`;
  return <section className="chapter" id={id} aria-labelledby={heading} data-layout={layout}>
    <div className="chapter-text">
      <p className="eyebrow"><span className="eyebrow-number">{number}</span> — {label}</p>
      <h2 id={heading} className="chapter-title">{title}</h2>
      <p className="chapter-caption">{caption}</p>
    </div>
    <div className="chapter-body">{children}</div>
  </section>;
}
