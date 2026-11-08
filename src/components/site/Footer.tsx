// One rule, one row: what this is on the left, the disclaimer on the right, and the credits as a single quiet line.
export function Footer() {
  return <footer className="site-footer">
    <div className="footer-row">
      <div className="footer-about">
        <p className="footer-name">Spatial DOM Transition Lab</p>
        <p>An interactive explainer of shared-element transitions.</p>
      </div>
      <p className="footer-disclaimer">A visual demonstration with fixed examples. No code is compiled or run.</p>
    </div>
    <p className="footer-credits">Optional generation uses Google Gemini; the lab checks its result before drawing it. Typefaces: Instrument Serif, Geist and Geist Mono. Icons: Lucide.</p>
  </footer>;
}
