import { motion } from "motion/react";
import type { ReactNode } from "react";
import { morphSpring, sharedIdentity } from "@/lib/lab/motion";
import { partFor, type PartKey, type TemplateDefinition } from "@/lib/lab/templates";

export type MotionRun = {
  generation: number;
  epoch: number;
  spatial: boolean;
  travelling: boolean;
  offscreen: boolean;
};
export type PartMotion = { template: TemplateDefinition; run: MotionRun; onComplete: (part: PartKey, generation: number) => void };

export function SharedPart({ part, endpoint, children, run, onComplete, template }: PartMotion & {
  part: PartKey; endpoint: "code" | "rendered"; children?: ReactNode;
}) {
  const templateId = template.id;
  const { kind } = partFor(template, part);
  const surface = kind === "surface";
  const identity = sharedIdentity(templateId, part);
  return <motion.span
    key={`${part}:${run.epoch}`}
    layout={surface ? true : "position"}
    layoutId={run.spatial ? identity : undefined}
    initial={false}
    transition={{ layout: morphSpring }}
    onLayoutAnimationComplete={() => onComplete(part, run.generation)}
    data-part={part}
    data-endpoint={endpoint}
    data-shared-id={identity}
    data-kind={kind}
    data-template={templateId}
    data-travelling={run.travelling || undefined}
    className={`shared-part part-${surface ? "surface" : kind === "icon" ? "icon" : part} endpoint-${endpoint}`}
    style={{
      borderRadius: surface ? endpoint === "code" ? 6 : templateId === "button" ? 10 : 16 : 4,
      backgroundColor: surface ? endpoint === "code" ? "#2B2E36" : templateId === "button" || part === "feature.surface" ? "#1B1A17" : "#FBFAF6" : undefined,
      boxShadow: surface && endpoint === "rendered" ? templateId === "button" || part === "feature.surface"
        ? "0 8px 20px -10px rgb(27 26 23 / 0.35)" : "0 8px 20px -12px rgb(27 26 23 / 0.22)" : "none",
    }}
  >{children}</motion.span>;
}
