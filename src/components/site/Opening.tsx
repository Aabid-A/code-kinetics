// The opening statement. The final full stop is the page's only use of the accent colour in type.
export function Opening() {
  return <section className="opening" aria-labelledby="opening-title">
    <h1 id="opening-title" className="opening-title enter enter-1">Code has a shape<span className="stop">.</span></h1>
    <p className="opening-sentence enter enter-2">Press Morph and watch each named piece of this code travel to its place in the finished component.</p>
  </section>;
}
