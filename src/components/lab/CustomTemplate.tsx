import { customKey } from "@/lib/lab/generated";
import type { PartMotion } from "./SharedPart";
import { DestinationPart } from "./TemplatePart";

// One generic destination for any generated spec. Slots are laid out by data
// (card, icon, texts), so the morph machinery never needs per-example code.
export function CustomTemplate({ active, ...motion }: PartMotion & { active: boolean }) {
  const spec = motion.template.generated;
  if (!spec) return null;
  const props = { ...motion, active };
  return <div className="custom-template" aria-hidden="true" data-destination="custom" data-layout={spec.layout}>
    {spec.cards.map((card, c) => <div className="custom-card" key={c} data-card={c}>
      <div className="preview-card-glass" data-active={active} />
      <span className="destination-surface" data-destination-slot={customKey(c, "surface")}>
        <DestinationPart part={customKey(c, "surface")} {...props} />
      </span>
      {card.icon ? <span className="custom-icon preview-icon-slot" data-destination-slot={customKey(c, "icon")}>
        <DestinationPart part={customKey(c, "icon")} {...props} />
      </span> : null}
      {card.texts.map((entry, t) => <span key={t} className={`custom-text text-${entry.style} preview-text-slot`}
        data-destination-slot={customKey(c, t)}>
        <span className="slot-sizer">{entry.text}</span><DestinationPart part={customKey(c, t)} {...props} />
      </span>)}
    </div>)}
  </div>;
}
