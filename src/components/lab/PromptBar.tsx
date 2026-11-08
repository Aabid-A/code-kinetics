"use client";

import { Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { buildTemplate, limits, parseSpec } from "@/lib/lab/generated";
import { validateTemplate, type TemplateDefinition } from "@/lib/lab/templates";

const suggestions = ["A pricing card with a badge", "A login form card", "A weather summary with three stats"];

export function PromptBar({ ready, onGenerated }: { ready: boolean; onGenerated: (template: TemplateDefinition) => void }) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const controller = useRef<AbortController | null>(null);

  async function generate(text: string) {
    const request = text.trim();
    if (!request || busy) return;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true); setFailed(false); setMessage("Generating…");
    try {
      const response = await fetch("/api/generate", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: request }), signal: abort.signal,
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const error = typeof body === "object" && body !== null && "error" in body ? String(body.error) : "Generation failed.";
        throw new Error(error);
      }
      // Never trust the network: rebuild and re-validate before anything renders.
      const template = buildTemplate(parseSpec(typeof body === "object" && body !== null && "spec" in body ? body.spec : null));
      validateTemplate(template);
      onGenerated(template);
      setMessage(`Generated ${template.label}. Choose Morph to component.`);
    } catch (error) {
      if (abort.signal.aborted) return;
      setFailed(true);
      setMessage(error instanceof Error && error.message ? error.message : "Generation failed.");
    } finally {
      if (controller.current === abort) setBusy(false);
    }
  }

  return <form className="prompt-bar" onSubmit={event => { event.preventDefault(); void generate(prompt); }}>
    <label className="prompt-field">
      <span className="prompt-label">What do you want to learn or see?</span>
      <input type="text" value={prompt} maxLength={limits.prompt} disabled={!ready} placeholder="Describe a component, e.g. a pricing card with a badge"
        onChange={event => setPrompt(event.currentTarget.value)} />
    </label>
    <button type="submit" className="morph-button prompt-submit" disabled={!ready || busy || !prompt.trim()}>
      <Sparkles size={18} strokeWidth={1.75} aria-hidden="true" />{busy ? "Generating…" : "Generate"}
    </button>
    <div className="prompt-suggestions">
      {suggestions.map(text => <button key={text} type="button" disabled={!ready || busy}
        onClick={() => { setPrompt(text); void generate(text); }}>{text}</button>)}
    </div>
    <p className="prompt-status" role="status" aria-live="polite" data-failed={failed || undefined}>{message}</p>
  </form>;
}
