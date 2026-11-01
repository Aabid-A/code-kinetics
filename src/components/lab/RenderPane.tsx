import type { RefObject } from "react";
import { buttonContent } from "@/lib/lab/button";
import type { ViewMode } from "@/lib/lab/types";
import { ButtonTemplate } from "./ButtonTemplate";
import type { PartMotion } from "./SharedPart";

export function RenderPane({ mode, contentRef, ...motion }: PartMotion & {
  mode: ViewMode; contentRef: RefObject<HTMLDivElement | null>;
}) {
  return <section className="render-pane pane" aria-labelledby="preview-heading">
    <div className="pane-ground render-ground" aria-hidden="true" />
    <h2 id="preview-heading" className="preview-heading">Component preview</h2>
    <figure className="preview-figure">
      <div className="preview-content" ref={contentRef}>
        <div className="preview-illustration" role={mode === "rendered" ? "img" : undefined}
          aria-label={mode === "rendered" ? buttonContent.description : undefined}>
          <ButtonTemplate active={mode === "rendered"} {...motion} />
        </div>
        <p className="preview-instruction" data-visible={mode === "code"} aria-hidden={mode !== "code"}>
          Choose Morph to see these pieces become a component.
        </p>
      </div>
      <figcaption>Example component · not interactive</figcaption>
    </figure>
  </section>;
}
