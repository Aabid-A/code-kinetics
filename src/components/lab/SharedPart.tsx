import { motion } from "motion/react";
import type { ReactNode } from "react";
import { morphSpring, sharedId, type ButtonPart } from "@/lib/lab/button";

export type MotionRun = {
  generation: number;
  epoch: number;
  spatial: boolean;
  travelling: boolean;
  offscreen: boolean;
};
export type PartMotion = { run: MotionRun; onComplete: (part: ButtonPart, generation: number) => void };

export function SharedPart({ part, endpoint, children, run, onComplete }: PartMotion & {
  part: ButtonPart; endpoint: "code" | "rendered"; children?: ReactNode;
}) {
  const surface = part === "surface";
  return <motion.span
    key={`${part}:${run.epoch}`}
    layout={surface ? true : "position"}
    layoutId={run.spatial ? sharedId(part) : undefined}
    initial={false}
    transition={{ layout: morphSpring }}
    onLayoutAnimationComplete={() => onComplete(part, run.generation)}
    data-part={part}
    data-endpoint={endpoint}
    data-shared-id={sharedId(part)}
    data-travelling={run.travelling || undefined}
    className={`shared-part part-${part} endpoint-${endpoint}`}
    style={{
      borderRadius: surface ? endpoint === "code" ? 6 : 10 : 4,
      backgroundColor: surface ? endpoint === "code" ? "#1a283f" : "#1d4ed8" : undefined,
      boxShadow: surface && endpoint === "rendered" ? "0 6px 20px rgb(23 32 51 / 0.08)" : "none",
    }}
  >{children}</motion.span>;
}
