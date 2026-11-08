"use client";

import { useEffect, useRef, useState } from "react";

export const chapters = [
  { id: "button", number: "01", label: "Button" },
  { id: "toast", number: "02", label: "Toast" },
  { id: "bento", number: "03", label: "Bento" },
  { id: "how-it-knows", number: "04", label: "How it knows" },
  { id: "your-turn", number: "05", label: "Your turn" },
] as const;

// Floating chapter index (desktop) / plain inline list (below 1024 px). aria-current follows the chapter in view.
// On desktop it hides itself while it would sit over a lab control (or, on viewports shorter than 900 px, over any
// lab sheet), so it can never cover the controls it floats above.
export function ChapterIndex() {
  const nav = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const visible = new Set<string>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target.id); else visible.delete(entry.target.id);
      }
      const first = chapters.find(chapter => visible.has(chapter.id));
      if (first) setCurrent(first.id);
    }, { rootMargin: "-40% 0px -50% 0px" });
    chapters.forEach(chapter => { const section = document.getElementById(chapter.id); if (section) observer.observe(section); });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      const box = nav.current;
      if (!box || getComputedStyle(box).position !== "fixed") { setHidden(false); return; }
      const mine = box.getBoundingClientRect();
      const overlaps = (selector: string) => [...document.querySelectorAll(selector)].some(element => {
        const other = element.getBoundingClientRect();
        return other.width > 0 && other.bottom > mine.top - 8 && other.top < mine.bottom + 8 && other.right > mine.left - 8 && other.left < mine.right + 8;
      });
      setHidden(overlaps(".lab button, .lab summary, .prompt-bar input, .prompt-bar button") || (window.innerHeight < 900 && overlaps(".lab-sheet")));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(check); };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.querySelector("main") ?? document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      mutations.disconnect();
    };
  }, []);

  return <nav ref={nav} className="chapter-index enter enter-3" aria-label="Chapters" data-hidden={hidden || undefined}>
    <ol>
      {chapters.map(chapter => <li key={chapter.id}>
        <a href={`#${chapter.id}`} aria-current={current === chapter.id ? "location" : undefined}>
          {chapter.number}<span className="sr-only"> — {chapter.label}</span>
        </a>
      </li>)}
    </ol>
  </nav>;
}
