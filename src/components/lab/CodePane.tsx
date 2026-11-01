import type { RefObject } from "react";
import { buttonLines, buttonSource } from "@/lib/lab/button";
import type { ViewMode } from "@/lib/lab/types";
import { SharedPart, type PartMotion } from "./SharedPart";
import { ButtonPartContent } from "./ButtonTemplate";

export function CodePane({ mode, contentRef, ...motion }: PartMotion & {
  mode: ViewMode; contentRef: RefObject<HTMLDivElement | null>;
}) {
  return <section className="code-pane pane" aria-labelledby="code-heading">
    <div className="pane-ground code-ground" aria-hidden="true" />
    <div className="code-chrome">
      <div className="window-dots" aria-hidden="true"><i /><i /><i /></div>
      <h2 id="code-heading">Button.tsx</h2><span>Fixed example</span>
    </div>
    <pre className="sr-only"><code>{buttonSource}</code></pre>
    <div className="code-content" ref={contentRef}>
      <div className="code-lines" aria-hidden="true">
        {buttonLines.map((line, index) => <div className="code-line" key={line.id}>
          <span className="line-number">{index + 1}</span>
          <code>{line.tokens.map(token => token.part ? <span
            className={`source-slot syntax-${token.syntax}`} key={token.id}
            data-source-slot={token.part}
          >
            <span className="slot-sizer">{token.text}</span>
            {mode === "code" ? <SharedPart part={token.part} endpoint="code" {...motion}>
              <ButtonPartContent part={token.part} mode="code" travelling={motion.run.travelling} />
            </SharedPart> : <span className="reference-token">{token.text}</span>}
          </span> : <span key={token.id} className={`syntax-${token.syntax}`}>{token.text}</span>)}</code>
        </div>)}
      </div>
    </div>
    <p className="code-note">{mode === "code" ? "Mapped pieces start here." : "Mapped pieces are shown in the preview."}</p>
  </section>;
}
