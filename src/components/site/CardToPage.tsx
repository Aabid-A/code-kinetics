"use client";

import { LayoutGroup, MotionConfig, motion } from "motion/react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { morphSpring, sharedIdentity } from "@/lib/lab/motion";

// Chapter 04: the technique as people meet it in real interfaces. Choosing a card turns it into its page: the
// surface, cover, title and tag keep their shared names, so Motion moves each of them from the card to its
// place on the page (and back) instead of drawing a new screen. Same spring and identity rule as the lab.

type ProjectId = "tide-tables" | "field-notes" | "night-market";
type Project = { id: ProjectId; title: string; tag: string; summary: string; role: string; year: string; cover: ReactNode };

function TideCover() {
  return <svg viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <rect width="320" height="240" fill="#1F4E5F" />
    <circle cx="236" cy="70" r="30" fill="#F3F0E8" opacity=".9" />
    {[120, 146, 172, 198].map((y, i) => <path key={y} d={`M-10 ${y} q 30 -14 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0`}
      fill="none" stroke="#F3F0E8" strokeWidth="3" opacity={0.85 - i * 0.18} />)}
  </svg>;
}
function FieldCover() {
  return <svg viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <rect width="320" height="240" fill="#C9A66B" />
    <rect x="70" y="40" width="150" height="170" rx="6" fill="#FBFAF6" />
    {[78, 98, 118, 138, 158].map(y => <line key={y} x1="88" y1={y} x2="202" y2={y} stroke="#D9D4C7" strokeWidth="3" />)}
    <path d="M232 168 c 18 -40 44 -52 64 -50 c -2 26 -22 54 -64 50 z" fill="#4E6B3A" />
    <path d="M232 168 l 40 -32" stroke="#FBFAF6" strokeWidth="2" />
  </svg>;
}
function MarketCover() {
  return <svg viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <rect width="320" height="240" fill="#2A2733" />
    <path d="M0 64 Q 160 110 320 64" fill="none" stroke="#5E5970" strokeWidth="2" />
    {[40, 92, 146, 200, 254].map((x, i) => <g key={x}>
      <line x1={x} y1={64 + Math.sin((x / 320) * Math.PI) * 22} x2={x} y2={86 + Math.sin((x / 320) * Math.PI) * 22} stroke="#5E5970" strokeWidth="2" />
      <circle cx={x} cy={98 + Math.sin((x / 320) * Math.PI) * 22} r={i % 2 ? 11 : 14} fill="#E6B85C" />
    </g>)}
    <rect x="0" y="180" width="320" height="60" fill="#1E1C25" />
    <rect x="36" y="160" width="84" height="26" rx="4" fill="#F0B48F" />
    <rect x="190" y="160" width="96" height="26" rx="4" fill="#D9C27F" />
  </svg>;
}

const projects: readonly Project[] = [
  { id: "tide-tables", title: "Tide Tables", tag: "Mobile app", role: "Product design", year: "2026", cover: <TideCover />,
    summary: "A calm way to read the sea: today’s high and low water as one line you can scrub with a thumb." },
  { id: "field-notes", title: "Field Notes", tag: "Journal", role: "Interface and type", year: "2025", cover: <FieldCover />,
    summary: "A notebook for walks. Every entry keeps the weather, the route and one photograph together." },
  { id: "night-market", title: "Night Market", tag: "Map", role: "Interaction design", year: "2026", cover: <MarketCover />,
    summary: "An evening guide to food stalls, drawn as a lantern-lit street instead of a list of pins." },
];

const name = (project: ProjectId, piece: string) => sharedIdentity(`card-${project}`, piece);

export function CardToPage() {
  const group = useId();
  const ready = useHydrated();
  const [open, setOpen] = useState<ProjectId | null>(null);
  const lastOpened = useRef<ProjectId | null>(null);
  const cards = useRef(new Map<ProjectId, HTMLButtonElement | null>());
  const heading = useRef<HTMLHeadingElement>(null);
  const project = projects.find(entry => entry.id === open) ?? null;

  // Focus follows the view: the page's heading when a card opens, the same card again when the page closes.
  useEffect(() => {
    if (open) heading.current?.focus({ preventScroll: true });
    else if (lastOpened.current) cards.current.get(lastOpened.current)?.focus({ preventScroll: true });
  }, [open]);

  const choose = (id: ProjectId) => { lastOpened.current = id; setOpen(id); };
  const close = () => setOpen(null);

  return <MotionConfig reducedMotion="user" transition={{ layout: morphSpring }}>
    <LayoutGroup id={`card-to-page-${group}`}>
      <div className="ctp-sheet" data-open={open ?? undefined}>
        {project ? <motion.article layoutId={name(project.id, "surface")} className="ctp-page" style={{ borderRadius: 24 }}
          aria-labelledby={`${group}-title`} onKeyDown={event => { if (event.key === "Escape") close(); }}>
          <motion.div layoutId={name(project.id, "cover")} className="ctp-cover ctp-page-cover" style={{ borderRadius: 16 }}>{project.cover}</motion.div>
          <div className="ctp-page-text">
            <motion.p layout="position" layoutId={name(project.id, "tag")} className="ctp-tag">{project.tag}</motion.p>
            <motion.h3 layoutId={name(project.id, "title")} id={`${group}-title`} ref={heading} tabIndex={-1}
              className="ctp-page-title">{project.title}</motion.h3>
            <motion.div className="ctp-page-body" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .2, delay: .15 }}>
              <p className="ctp-summary">{project.summary}</p>
              <dl className="ctp-facts">
                <div><dt>Role</dt><dd>{project.role}</dd></div>
                <div><dt>Year</dt><dd>{project.year}</dd></div>
              </dl>
              <button type="button" className="pill ctp-back" onClick={close}>Back to all projects</button>
            </motion.div>
          </div>
        </motion.article> : <ul className="ctp-grid" aria-label="Projects">
          {projects.map(entry => <li key={entry.id}>
            <motion.button type="button" layoutId={name(entry.id, "surface")} className="ctp-card" disabled={!ready} style={{ borderRadius: 20 }}
              ref={element => { cards.current.set(entry.id, element); }} onClick={() => choose(entry.id)}>
              <motion.div layoutId={name(entry.id, "cover")} className="ctp-cover" style={{ borderRadius: 12 }}>{entry.cover}</motion.div>
              <motion.span layoutId={name(entry.id, "title")} className="ctp-card-title">{entry.title}</motion.span>
              <motion.span layout="position" layoutId={name(entry.id, "tag")} className="ctp-tag">{entry.tag}</motion.span>
            </motion.button>
          </li>)}
        </ul>}
      </div>
      <p className="ctp-caption">
        <strong>4 shared pieces per project</strong><span aria-hidden="true"> · </span>surface, cover, title and tag.
        Fictional projects, drawn for this page.
      </p>
    </LayoutGroup>
  </MotionConfig>;
}
