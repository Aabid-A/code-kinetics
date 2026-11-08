"use client";

import { useState, useSyncExternalStore } from "react";
import type { TemplateDefinition } from "@/lib/lab/templates";
import { Lab } from "./Lab";
import { PromptBar } from "./PromptBar";

// The generate feature, hosted by its own chapter. Each successful generation mounts a fresh lab (always in
// code mode, so a new example never starts half-morphed); until one exists, nothing but the prompt is shown.
const subscribeReady = () => () => {};

export function TryOwn() {
  const ready = useSyncExternalStore(subscribeReady, () => true, () => false);
  const [generated, setGenerated] = useState<{ definition: TemplateDefinition; count: number } | null>(null);
  return <>
    <PromptBar ready={ready} onGenerated={definition => setGenerated(previous => ({ definition, count: (previous?.count ?? 0) + 1 }))} />
    {generated ? <Lab key={generated.count} id="custom" definition={generated.definition} /> : null}
  </>;
}
