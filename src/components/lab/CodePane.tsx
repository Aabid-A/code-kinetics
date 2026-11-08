import type { RefObject } from "react";
import type { ButtonPart } from "@/lib/lab/button";
import { sourceFor } from "@/lib/lab/templates";
import type { ViewMode } from "@/lib/lab/types";
import { SharedPart, type PartMotion } from "./SharedPart";
import { ButtonPartContent } from "./ButtonTemplate";
import { TemplatePartContent } from "./TemplatePart";

export function CodePane({ mode, contentRef, headingId, ...motion }: PartMotion & {
  mode: ViewMode; contentRef: RefObject<HTMLDivElement | null>; headingId: string;
}) {
  const { template } = motion;
  const templateId = template.id;
  return <div className="code-pane pane" role="group" aria-labelledby={headingId} data-view-mode={mode}>
    <div className="pane-ground code-ground" aria-hidden="true" />
    <div className="code-chrome">
      <h3 id={headingId}>{template.filename}</h3><span className="sr-only">{template.generated ? "Generated example" : "Fixed example"}</span>
    </div>
    <pre className="sr-only"><code>{sourceFor(template)}</code></pre>
    <div className="code-content" ref={contentRef}>
      <div className="code-lines" aria-hidden="true">
        {template.lines.map((line, index) => <div className="code-line" key={line.id}>
          <span className="line-number">{index + 1}</span>
          <code>{line.tokens.map(token => token.part ? <span
            className={`source-slot syntax-${token.syntax}`} key={token.id}
            data-source-slot={token.part}
          >
            <span className="slot-sizer">{token.text}</span>
            {mode === "code" ? <SharedPart part={token.part} endpoint="code" {...motion}>
              {templateId === "button" ? <ButtonPartContent part={token.part as ButtonPart} mode="code" travelling={motion.run.travelling} />
                : <TemplatePartContent template={template} part={token.part} mode="code" travelling={motion.run.travelling} />}
            </SharedPart> : <span className="reference-token">{token.text}</span>}
          </span> : <span key={token.id} className={`syntax-${token.syntax}`}>{token.text}</span>)}</code>
        </div>)}
      </div>
    </div>
    <p className="sr-only">{mode === "code" ? "Mapped pieces start here." : "Mapped pieces are shown in the preview."}</p>
  </div>;
}
