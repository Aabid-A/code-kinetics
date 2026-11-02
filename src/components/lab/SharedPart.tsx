import { motion } from "motion/react";
import type { ReactNode } from "react";
import { morphSpring } from "@/lib/lab/button";
import { partFor, type PartKey } from "@/lib/lab/templates";
import type { TemplateId } from "@/lib/lab/types";

export type MotionRun = {
  generation: number;
  epoch: number;
  spatial: boolean;
  travelling: boolean;
  offscreen: boolean;
};
export type PartMotion = { templateId?: TemplateId; run: MotionRun; onComplete: (part: PartKey, generation: number) => void };

export function SharedPart({ part, endpoint, children, run, onComplete, templateId = "button" }: PartMotion & {
  part: PartKey; endpoint: "code" | "rendered"; children?: ReactNode;
}) {
  const { kind } = partFor(templateId, part);
  const surface = kind === "surface";
  const identity = `${templateId}:${part}`;
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
      backgroundColor: surface ? endpoint === "code" ? "#1a283f" : templateId === "button" ? "#1d4ed8"
        : part === "feature.surface" ? "rgb(39 27 57 / .92)" : "rgb(23 23 30 / .94)" : undefined,
      boxShadow: surface && endpoint === "rendered" ? templateId === "button"
        ? "0 6px 20px rgb(23 32 51 / 0.08)" : "0 6px 20px rgb(0 0 0 / .18)" : "none",
    }}
  >{children}</motion.span>;
}
