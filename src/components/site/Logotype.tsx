// The project's mark and name: two rounded squares joined by one curved line (a piece travelling from code to
// component), the second filled with the accent. One link to the top of the page; its accessible name is the name.
import { SoftAnchor } from "./SoftAnchor";

export function Logotype() {
  return <SoftAnchor className="logotype" href="#top">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
      <rect x="1.75" y="1.75" width="6.5" height="6.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.75" y="11.75" width="6.5" height="6.5" rx="2" fill="var(--accent)" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 8.25 C5 13.5 8.5 15 11.75 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
    <span className="logotype-name">Code Kinetics</span>
  </SoftAnchor>;
}
