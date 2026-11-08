import { buttonContent } from "@/lib/lab/templates";
import type { PartMotion } from "./SharedPart";
import { DestinationPart } from "./TemplatePart";

// The Button destination: a surface behind an inline label and arrow. Its pieces render through the same
// DestinationPart as every other template; only the slots differ.
export function ButtonTemplate({ active, ...motion }: PartMotion & { active: boolean }) {
  return <div className="button-template" aria-hidden="true" data-destination="button">
    <span className="destination-surface"><DestinationPart part="surface" active={active} {...motion} /></span>
    <span className="destination-label">
      <span className="slot-sizer">{buttonContent.label}</span>
      <DestinationPart part="label" active={active} {...motion} />
    </span>
    <span className="destination-icon"><DestinationPart part="icon" active={active} {...motion} /></span>
  </div>;
}
