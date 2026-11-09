"use client";

import { Sparkles } from "lucide-react";
import { useId, useRef, useState } from "react";
import { buildTemplate, limits, parseSpec } from "@/lib/lab/generated";
import { validateTemplate, type TemplateDefinition } from "@/lib/lab/templates";

const suggestions = ["A pricing card with a badge", "A login form card", "A weather summary with three stats"];

// "Try your own": the hero's primary interaction. The fixed examples stay the core; when generation fails, the
// message appears inline and the lab keeps working unchanged (when it is not configured the hero does not draw this). One polite live line
// carries loading, success and error text, so each message is announced once.
export function PromptBar({ ready, onGenerated }: { ready: boolean; onGenerated: (template: TemplateDefinition) => void }) {
  const base = useId();
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
    setBusy(true); setFailed(false); setMessage("Generating an example…");
    try {
      const response = await fetch("/api/generate", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: request }), signal: abort.signal,
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const error = typeof body === "object" && body !== null && "error" in body ? String(body.error) : "Generation failed. Try again.";
        throw new Error(error);
      }
      // Never trust the network: rebuild and re-validate before anything renders.
      const template = buildTemplate(parseSpec(typeof body === "object" && body !== null && "spec" in body ? body.spec : null));
      validateTemplate(template);
      onGenerated(template);
      setMessage(`Generated ${template.label}. It appears below. Choose Morph to component.`);
    } catch (error) {
      if (abort.signal.aborted) return;
      setFailed(true);
      setMessage(error instanceof Error && error.message ? error.message : "Generation failed. Try again.");
    } finally {
      if (controller.current === abort) setBusy(false);
    }
  }

  return <div className="hero-prompt">
    <form className="prompt-bar" aria-busy={busy} onSubmit={event => { event.preventDefault(); void generate(prompt); }}>
      <label className="prompt-label" htmlFor={`${base}-input`}>Describe a component</label>
      <div className="prompt-row">
        <input id={`${base}-input`} className="prompt-input" type="text" value={prompt} maxLength={limits.prompt} disabled={!ready}
          placeholder="For example, a pricing card with a badge" autoComplete="off"
          aria-describedby={`${base}-count ${base}-privacy ${base}-status`} aria-invalid={failed || undefined}
          onChange={event => setPrompt(event.currentTarget.value)} />
        <button type="submit" className="pill prompt-submit" disabled={!ready || busy || !prompt.trim()}>
          <Sparkles size={18} strokeWidth={1.75} aria-hidden="true" />{busy ? "Generating…" : "Generate"}
        </button>
      </div>
      <p className="prompt-status" id={`${base}-status`} aria-live="polite" aria-atomic="true" data-failed={failed || undefined}>{message}</p>
      <div className="prompt-suggestions" role="group" aria-label="Suggestions">
        {suggestions.map(text => <button key={text} type="button" className="pill prompt-suggestion" disabled={!ready || busy}
          onClick={() => { setPrompt(text); void generate(text); }}>{text}</button>)}
      </div>
      <p className="prompt-count" id={`${base}-count`}>{prompt.length} / {limits.prompt} characters</p>
      <p className="prompt-privacy" id={`${base}-privacy`}>Your description is sent to Google Gemini to create the example. Don&rsquo;t include personal information.</p>
    </form>
  </div>;
}
