"use client";

import { useEffect, useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { Lab } from "@/components/lab/Lab";
import { PromptBar } from "@/components/lab/PromptBar";
import type { TemplateDefinition } from "@/lib/lab/templates";

// The first screen: the title, one line, and the visitor's own idea as the primary action. Nothing plays and
// nothing is generated until the visitor asks (SPEC R01). The page asks the server once whether generation is
// configured; if it is not (or the check fails) the prompt is not drawn at all and "See it work" leads to the
// first chapter instead. A successful generation mounts a fresh lab directly under the hero, in code mode.
type Availability = "checking" | "ready" | "unavailable";

export function Opening() {
  const ready = useHydrated();
  const [availability, setAvailability] = useState<Availability>("checking");
  const [generated, setGenerated] = useState<{ definition: TemplateDefinition; count: number } | null>(null);

  useEffect(() => {
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 5000);
    fetch("/api/generate", { cache: "no-store", signal: abort.signal })
      .then(response => (response.ok ? response.json() : null))
      .then((body: unknown) => setAvailability(typeof body === "object" && body !== null && "configured" in body && body.configured === true ? "ready" : "unavailable"))
      .catch(() => setAvailability("unavailable"))
      .finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); abort.abort(); };
  }, []);

  return <>
    <section className="opening" aria-labelledby="opening-title" data-compact={generated ? "" : undefined}>
      <h1 id="opening-title" className="opening-title enter enter-1">Code has a shape<span className="stop">.</span></h1>
      <p className="opening-sentence enter enter-2">Describe a component. Watch its code become the thing itself.</p>
      <div className="hero-action enter enter-3" data-availability={availability}>
        {availability === "ready" ? <>
          <PromptBar ready={ready} onGenerated={definition => setGenerated(previous => ({ definition, count: (previous?.count ?? 0) + 1 }))} />
          <a className="hero-secondary" href="#what-this-is">Or see how it works <span aria-hidden="true">↓</span></a>
        </> : null}
        {availability === "unavailable" ? <a className="morph-button hero-primary" href="#button">See it work</a> : null}
        <noscript><a className="morph-button hero-primary" href="#button">See it work</a></noscript>
      </div>
    </section>
    {generated ? <section className="hero-result" aria-labelledby="hero-result-title">
      <h2 id="hero-result-title" className="sr-only">Your generated example</h2>
      <Lab key={generated.count} id="custom" definition={generated.definition} />
    </section> : null}
  </>;
}
