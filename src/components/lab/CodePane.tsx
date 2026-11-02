import type { RefObject } from "react";
import type { ButtonPart } from "@/lib/lab/button";
import { sourceFor, templates } from "@/lib/lab/templates";
import type { ViewMode } from "@/lib/lab/types";
import { SharedPart, type PartMotion } from "./SharedPart";
import { ButtonPartContent } from "./ButtonTemplate";
import { TemplatePartContent } from "./TemplatePart";

export function CodePane({ mode, contentRef, templateId = "button", ...motion }: PartMotion & {
  mode: ViewMode; contentRef: RefObject<HTMLDivElement | null>;
}) {
  const template = templates[templateId];
  return <section className="code-pane pane" aria-labelledby="code-heading" data-view-mode={mode}>
    <div className="pane-ground code-ground" aria-hidden="true" />
    <div className="code-chrome">
      <div className="window-dots" aria-hidden="true"><i /><i /><i /></div>
      <h2 id="code-heading">{template.filename}</h2><span>Fixed example</span>
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
            {mode === "code" ? <SharedPart part={token.part} templateId={templateId} endpoint="code" {...motion}>
              {templateId === "button" ? <ButtonPartContent part={token.part as ButtonPart} mode="code" travelling={motion.run.travelling} />
                : <TemplatePartContent templateId={templateId} part={token.part} mode="code" travelling={motion.run.travelling} />}
            </SharedPart> : <span className="reference-token">{token.text}</span>}
          </span> : <span key={token.id} className={`syntax-${token.syntax}`}>{token.text}</span>)}</code>
        </div>)}
      </div>
    </div>
    <p className="code-note">{mode === "code" ? "Mapped pieces start here." : "Mapped pieces are shown in the preview."}</p>
  </section>;
}
