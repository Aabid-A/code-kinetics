import { CircleCheck, Layers } from "lucide-react";
import { motion } from "motion/react";
import { morphSpring } from "@/lib/lab/button";
import { partFor, type PartKey } from "@/lib/lab/templates";
import type { TemplateId, ViewMode } from "@/lib/lab/types";
import { SharedPart, type PartMotion } from "./SharedPart";

export function TemplatePartContent({ templateId, part, mode, travelling }: {
  templateId: TemplateId; part: PartKey; mode: ViewMode; travelling: boolean;
}) {
  const definition = partFor(templateId, part);
  const code = mode === "code";
  if (definition.kind === "text") return definition.sourceLabel;
  if (definition.kind === "surface") return <motion.span
    layout="position" className="surface-lettering"
    initial={{ opacity: travelling ? code ? 0 : 1 : code ? 1 : 0 }}
    animate={{ opacity: code ? 1 : 0 }}
    transition={{ layout: morphSpring, opacity: { duration: .1 } }}
  >{definition.sourceLabel}</motion.span>;
  const Icon = templateId === "toast" ? CircleCheck : Layers;
  return <>
    <motion.span className="icon-word"
      initial={{ opacity: travelling ? code ? 0 : 1 : code ? 1 : 0 }}
      animate={{ opacity: code ? 1 : 0 }} transition={{ duration: .1 }}
    >{definition.sourceLabel}</motion.span>
    <motion.span className={`icon-art ${code ? "" : "card-icon-art"}`}
      initial={{ opacity: travelling ? code ? 1 : 0 : code ? 0 : 1 }}
      animate={{ opacity: code ? 0 : 1 }} transition={{ duration: code ? .1 : .16 }}
    ><Icon size={20} strokeWidth={1.75} /></motion.span>
  </>;
}

export function DestinationPart({ active, part, templateId, ...motion }: PartMotion & {
  active: boolean; part: PartKey; templateId: TemplateId;
}) {
  return active ? <SharedPart part={part} templateId={templateId} endpoint="rendered" {...motion}>
    <TemplatePartContent part={part} templateId={templateId} mode="rendered" travelling={motion.run.travelling} />
  </SharedPart> : null;
}
