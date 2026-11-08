import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

// One chapter of the page: a mono eyebrow ("01 — Button"), a serif title with at most one italic word, one
// sentence saying what to notice, and the chapter's content (a lab). The text sits beside the sheet on wide
// screens (`side`, or `side-right` with the text on the right) and above it below 1280 px.
export function Chapter({ id, number, label, title, caption, layout = "side", children }: {
  id: string; number: string; label: string; title: ReactNode; caption: ReactNode;
  layout?: "side" | "side-right" | "stacked"; children: ReactNode;
}) {
  const heading = `${id}-title`;
  return <section className="chapter" id={id} aria-labelledby={heading} data-layout={layout}>
    <Reveal className="chapter-text">
      <p className="eyebrow"><span className="eyebrow-number">{number}</span> — {label}</p>
      <h2 id={heading} className="chapter-title">{title}</h2>
      <p className="chapter-caption">{caption}</p>
    </Reveal>
    <div className="chapter-body">{children}</div>
  </section>;
}
