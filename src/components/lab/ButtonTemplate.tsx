import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { buttonContent, morphSpring, type ButtonPart } from "@/lib/lab/button";
import type { ViewMode } from "@/lib/lab/types";
import { SharedPart, type PartMotion } from "./SharedPart";

// Presentation changes inside the travelling HTML wrappers. Only the surface
// projects size; its lettering has its own position-only projection so glyphs
// are counter-scaled rather than stretched by the growing paint layer.
export function ButtonPartContent({ part, mode, travelling }: {
  part: ButtonPart; mode: ViewMode; travelling: boolean;
}) {
  const code = mode === "code";
  if (part === "label") return buttonContent.label;
  if (part === "surface") return <motion.span
    layout="position" className="surface-lettering"
    initial={{ opacity: travelling ? code ? 0 : 1 : code ? 1 : 0 }}
    animate={{ opacity: code ? 1 : 0 }}
    transition={{ layout: morphSpring, opacity: { duration: .1 } }}
  >{buttonContent.tag}</motion.span>;
  return <>
    <motion.span className="icon-word"
      initial={{ opacity: travelling ? code ? 0 : 1 : code ? 1 : 0 }}
      animate={{ opacity: code ? 1 : 0 }} transition={{ duration: .1 }}
    >{buttonContent.icon}</motion.span>
    <motion.span className="icon-art"
      initial={{ opacity: travelling ? code ? 1 : 0 : code ? 0 : 1 }}
      animate={{ opacity: code ? 0 : 1 }} transition={{ duration: code ? .1 : .16 }}
    ><ArrowUpRight size={18} strokeWidth={1.75} /></motion.span>
  </>;
}

export function ButtonTemplate({ active, ...motion }: PartMotion & { active: boolean }) {
  return <div className="button-template" aria-hidden="true" data-destination="button">
    <span className="destination-surface">
      {active ? <SharedPart part="surface" endpoint="rendered" {...motion}>
        <ButtonPartContent part="surface" mode="rendered" travelling={motion.run.travelling} />
      </SharedPart> : null}
    </span>
    <span className="destination-label">
      <span className="slot-sizer">{buttonContent.label}</span>
      {active ? <SharedPart part="label" endpoint="rendered" {...motion}>{buttonContent.label}</SharedPart> : null}
    </span>
    <span className="destination-icon">
      {active ? <SharedPart part="icon" endpoint="rendered" {...motion}>
        <ButtonPartContent part="icon" mode="rendered" travelling={motion.run.travelling} />
      </SharedPart> : null}
    </span>
  </div>;
}
