import { SoftAnchor } from "./SoftAnchor";

export const chapters = [
  { id: "button", number: "01", label: "Button" },
  { id: "toast", number: "02", label: "Toast" },
  { id: "bento", number: "03", label: "Bento" },
  { id: "card-to-page", number: "04", label: "Card to page" },
  { id: "how-it-knows", number: "05", label: "How it knows" },
] as const;

// The contents: a plain list in the "What this is" section, so a visitor sees the whole journey before starting. It stays in the
// page flow (it never floats), so it can never cover an example or a control.
export function ChapterIndex() {
  return <nav className="chapter-index" aria-label="Chapters">
    <ol>
      {chapters.map(chapter => <li key={chapter.id}>
        <SoftAnchor href={`#${chapter.id}`}>
          <span className="chapter-index-number">{chapter.number}</span>
          <span className="sr-only"> — </span>
          <span className="chapter-index-label">{chapter.label}</span>
        </SoftAnchor>
      </li>)}
    </ol>
  </nav>;
}
