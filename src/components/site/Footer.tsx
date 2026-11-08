// What this is, in plain words, for anyone who scrolled to the end to find out.
export function Footer() {
  return <footer className="site-footer">
    <div className="footer-about">
      <p className="eyebrow">About this lab</p>
      <p>
        Spatial DOM Transition Lab explains shared-element transitions: the technique that lets an interface move one
        piece from place to place instead of swapping screens. Every highlighted name in the code is also a place in
        the component, so the piece can travel between them. It is built with Next.js, React and Motion&rsquo;s layout
        animations.
      </p>
    </div>
    <div className="footer-notes">
      <p>A visual demonstration with fixed examples. No code is compiled or run.</p>
      <p>Chapter 05 asks Google Gemini to describe a new example as data, which the lab checks before drawing it.</p>
      <p>Typefaces: Instrument Serif, Geist and Geist Mono. Icons: Lucide.</p>
    </div>
  </footer>;
}
