import { toastContent } from "@/lib/lab/templates";
import type { PartMotion } from "./SharedPart";
import { DestinationPart } from "./TemplatePart";

export function ToastTemplate({ active, ...motion }: PartMotion & { active: boolean }) {
  const props = { ...motion, active };
  return <div className="toast-template" aria-hidden="true" data-destination="toast">
    <div className="preview-card-glass" data-active={active} />
    <span className="destination-surface" data-destination-slot="surface"><DestinationPart part="surface" {...props} /></span>
    <span className="toast-icon preview-icon-slot" data-destination-slot="icon"><DestinationPart part="icon" {...props} /></span>
    <div className="toast-copy">
      <span className="toast-title preview-text-slot" data-destination-slot="title">
        <span className="slot-sizer">{toastContent.title}</span><DestinationPart part="title" {...props} />
      </span>
      <span className="toast-description preview-text-slot" data-destination-slot="description">
        <span className="slot-sizer">{toastContent.description}</span><DestinationPart part="description" {...props} />
      </span>
    </div>
  </div>;
}
