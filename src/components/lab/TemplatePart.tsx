import { motion } from "motion/react";
import { morphSpring } from "@/lib/lab/button";
import { partFor, type PartKey, type TemplateDefinition } from "@/lib/lab/templates";
import type { ViewMode } from "@/lib/lab/types";
import { NamedIcon } from "./icons";
import { SharedPart, type PartMotion } from "./SharedPart";

export function TemplatePartContent({ template, part, mode, travelling }: {
  template: TemplateDefinition; part: PartKey; mode: ViewMode; travelling: boolean;
}) {
  const definition = partFor(template, part);
  const code = mode === "code";
  if (definition.kind === "text") return definition.sourceLabel;
  if (definition.kind === "surface") return <motion.span
    layout="position" className="surface-lettering"
    initial={{ opacity: travelling ? code ? 0 : 1 : code ? 1 : 0 }}
    animate={{ opacity: code ? 1 : 0 }}
    transition={{ layout: morphSpring, opacity: { duration: .1 } }}
  >{definition.sourceLabel}</motion.span>;
  return <>
    <motion.span className="icon-word"
      initial={{ opacity: travelling ? code ? 0 : 1 : code ? 1 : 0 }}
      animate={{ opacity: code ? 1 : 0 }} transition={{ duration: .1 }}
    >{definition.sourceLabel}</motion.span>
    <motion.span className={`icon-art ${code ? "" : "card-icon-art"}`}
      initial={{ opacity: travelling ? code ? 1 : 0 : code ? 0 : 1 }}
      animate={{ opacity: code ? 0 : 1 }} transition={{ duration: code ? .1 : .16 }}
    ><NamedIcon name={definition.sourceLabel} size={20} strokeWidth={1.75} /></motion.span>
  </>;
}

export function DestinationPart({ active, part, ...motion }: PartMotion & {
  active: boolean; part: PartKey;
}) {
  return active ? <SharedPart part={part} endpoint="rendered" {...motion}>
    <TemplatePartContent part={part} template={motion.template} mode="rendered" travelling={motion.run.travelling} />
  </SharedPart> : null;
}
