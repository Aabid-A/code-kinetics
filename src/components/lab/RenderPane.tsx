import type { RefObject } from "react";
import type { ViewMode } from "@/lib/lab/types";
import { ButtonTemplate } from "./ButtonTemplate";
import { ToastTemplate } from "./ToastTemplate";
import { BentoTemplate } from "./BentoTemplate";
import { CustomTemplate } from "./CustomTemplate";
import type { PartMotion } from "./SharedPart";

export function RenderPane({ mode, contentRef, ...motion }: PartMotion & {
  mode: ViewMode; contentRef: RefObject<HTMLDivElement | null>;
}) {
  const { template } = motion;
  const templateId = template.id;
  return <section className="render-pane pane" aria-labelledby="preview-heading" data-view-mode={mode}>
    <div className="pane-ground render-ground" aria-hidden="true" />
    <h2 id="preview-heading" className="preview-heading">Component preview</h2>
    <figure className="preview-figure">
      <div className={`preview-content${templateId === "bento" ? " @container" : ""}`} ref={contentRef}>
        <div className="stage-registration" aria-hidden="true" />
        <div className="preview-illustration" role={mode === "rendered" ? "img" : undefined}
          aria-label={mode === "rendered" ? template.description : undefined}>
          {templateId === "button" ? <ButtonTemplate active={mode === "rendered"} {...motion} />
            : templateId === "toast" ? <ToastTemplate active={mode === "rendered"} {...motion} />
              : templateId === "bento" ? <BentoTemplate active={mode === "rendered"} {...motion} />
                : <CustomTemplate active={mode === "rendered"} {...motion} />}
        </div>
        <p className="preview-instruction" data-visible={mode === "code"} aria-hidden={mode !== "code"}>
          Choose Morph to see these pieces become a component.
        </p>
      </div>
      <figcaption>{template.caption}</figcaption>
    </figure>
  </section>;
}
