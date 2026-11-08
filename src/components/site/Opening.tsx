// The opening: what this is, why it matters, and what to do first. The final full stop of the title is the page's
// only use of the accent colour in type.
export function Opening() {
  return <section className="opening" aria-labelledby="opening-title">
    <p className="eyebrow opening-eyebrow enter enter-1">An interactive explainer in five short chapters</p>
    <h1 id="opening-title" className="opening-title enter enter-1">Code has a shape<span className="stop">.</span></h1>
    <p className="opening-sentence enter enter-2">
      The calmest interfaces don&rsquo;t blink from one screen to the next. A thumbnail grows into a photo; a card
      opens into a page. Each piece knows where it is going. This lab shows the idea behind that motion, one piece of
      code at a time.
    </p>
    <p className="opening-instruction enter enter-2">Press <strong>Morph</strong> on any example to watch each named piece of code travel to its place in the finished component.</p>
  </section>;
}
