import { bentoContent } from "@/lib/lab/templates";
import type { PartMotion } from "./SharedPart";
import { DestinationPart } from "./TemplatePart";

export function BentoTemplate({ active, ...motion }: PartMotion & { active: boolean }) {
  const props = { ...motion, active };
  return <div className="bento-template grid w-full max-w-[460px] grid-cols-1 gap-3 @min-[360px]:grid-cols-[1.2fr_1fr]" aria-hidden="true" data-destination="bento">
    <div className="bento-card feature-card @min-[360px]:col-start-1 @min-[360px]:row-span-2 @min-[360px]:row-start-1" data-card="feature">
      <div className="preview-card-glass" data-active={active} />
      <span className="destination-surface" data-destination-slot="feature.surface"><DestinationPart part="feature.surface" {...props} /></span>
      <span className="feature-icon preview-icon-slot" data-destination-slot="feature.icon"><DestinationPart part="feature.icon" {...props} /></span>
      <span className="feature-title preview-text-slot" data-destination-slot="feature.title">
        <span className="slot-sizer">{bentoContent.feature.title}</span><DestinationPart part="feature.title" {...props} />
      </span>
      <span className="feature-description preview-text-slot" data-destination-slot="feature.description">
        <span className="slot-sizer">{bentoContent.feature.description}</span><DestinationPart part="feature.description" {...props} />
      </span>
    </div>
    <div className="bento-card metric-card @min-[360px]:col-start-2 @min-[360px]:row-start-1" data-card="metric">
      <div className="preview-card-glass" data-active={active} />
      <span className="destination-surface" data-destination-slot="metric.surface"><DestinationPart part="metric.surface" {...props} /></span>
      <span className="metric-value preview-text-slot" data-destination-slot="metric.value">
        <span className="slot-sizer">{bentoContent.metric.value}</span><DestinationPart part="metric.value" {...props} />
      </span>
      <span className="metric-label preview-text-slot" data-destination-slot="metric.label">
        <span className="slot-sizer">{bentoContent.metric.label}</span><DestinationPart part="metric.label" {...props} />
      </span>
    </div>
    <div className="bento-card status-card @min-[360px]:col-start-2 @min-[360px]:row-start-2" data-card="status">
      <div className="preview-card-glass" data-active={active} />
      <span className="destination-surface" data-destination-slot="status.surface"><DestinationPart part="status.surface" {...props} /></span>
      <span className="status-title preview-text-slot" data-destination-slot="status.title">
        <span className="slot-sizer">{bentoContent.status.title}</span><DestinationPart part="status.title" {...props} />
      </span>
      <span className="status-description preview-text-slot" data-destination-slot="status.description">
        <span className="slot-sizer">{bentoContent.status.description}</span><DestinationPart part="status.description" {...props} />
      </span>
    </div>
  </div>;
}
