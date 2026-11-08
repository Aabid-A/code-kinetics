// Chapter 04: one diagram of the matching-names idea, in the page's line style (1.5 px ink strokes, rule-coloured
// guides, accent on one highlighted pair only). Two drawings, one per width, so the 12 px labels stay readable on
// a phone; both are decorative (aria-hidden) and the figure's visible caption plus the list below are the text
// equivalent.
const pairs = [
  { name: "button:surface", source: "Button", destination: "the button surface" },
  { name: "button:icon", source: "ArrowUpRight", destination: "the arrow icon" },
  { name: "button:label", source: "Explore", destination: "the label" },
] as const;

function Tag({ x, y, width, text, accent = false }: { x: number; y: number; width: number; text: string; accent?: boolean }) {
  return <g>
    <rect className="dg-tag-bg" x={x - width / 2} y={y - 11} width={width} height={22} rx={4} />
    <text className={`dg-mono${accent ? " dg-accent-text" : ""}`} x={x} y={y + 4} textAnchor="middle">{text}</text>
  </g>;
}

export function Diagram() {
  return <figure className="diagram" aria-labelledby="diagram-caption">
    <svg className="diagram-wide" viewBox="0 0 1000 314" aria-hidden="true" focusable="false">
      <text className="dg-eyebrow" x="24" y="26">Source token</text>
      <text className="dg-eyebrow" x="596" y="26">Destination slot</text>
      <rect className="dg-line" x="24" y="44" width="380" height="250" rx="18" />
      <rect className="dg-line" x="596" y="44" width="380" height="250" rx="18" />
      <g className="dg-mono dg-code">
        <text x="52" y="110">{"<Button"}</text>
        <text x="52" y="146" xmlSpace="preserve">{"  icon={<ArrowUpRight />}"}</text>
        <text x="52" y="182">{">"}</text>
        <text x="52" y="218" xmlSpace="preserve">{"  Explore"}</text>
        <text x="52" y="254">{"</Button>"}</text>
      </g>
      <rect className="dg-line dg-accent-line" x="58.4" y="93" width="56.4" height="24" rx="5" />
      <rect className="dg-line" x="125.6" y="129" width="106.8" height="24" rx="5" />
      <rect className="dg-line" x="66.8" y="201" width="65.4" height="24" rx="5" />
      <rect className="dg-line" x="700" y="158" width="176" height="64" rx="14" />
      <rect className="dg-guide" x="726" y="176" width="64" height="28" rx="4" />
      <rect className="dg-guide" x="832" y="178" width="28" height="28" rx="4" />
      <text className="dg-label" x="730" y="196">Explore</text>
      <path className="dg-line" d="M838 202 L854 186 M842 186 H854 V198" />
      <path className="dg-line dg-accent-line" d="M114.8 105 C 330 105, 420 190, 700 190" />
      <path className="dg-line" d="M179 129 C 179 84, 214 72, 270 72 H 830 Q 846 72 846 88 V 178" />
      <path className="dg-line" d="M132.2 213 C 330 272, 640 272, 758 204" />
      <circle className="dg-dot dg-accent-fill" cx="114.8" cy="105" r="3.5" />
      <circle className="dg-dot dg-accent-fill" cx="700" cy="190" r="3.5" />
      <circle className="dg-dot" cx="179" cy="129" r="3.5" />
      <circle className="dg-dot" cx="846" cy="178" r="3.5" />
      <circle className="dg-dot" cx="132.2" cy="213" r="3.5" />
      <circle className="dg-dot" cx="758" cy="204" r="3.5" />
      <Tag x={435} y={160} width={118} text={pairs[0].name} accent />
      <Tag x={560} y={72} width={104} text={pairs[1].name} />
      <Tag x={475} y={256} width={110} text={pairs[2].name} />
    </svg>

    <svg className="diagram-narrow" viewBox="0 0 360 520" aria-hidden="true" focusable="false">
      <text className="dg-eyebrow" x="8" y="20">Source token</text>
      <text className="dg-eyebrow" x="24" y="478">Destination slot</text>
      <rect className="dg-line" x="8" y="32" width="344" height="96" rx="16" />
      <rect className="dg-line" x="8" y="300" width="344" height="190" rx="16" />
      <rect className="dg-line dg-accent-line" x="20" y="62" width="71" height="28" rx="6" />
      <rect className="dg-line" x="107" y="62" width="79" height="28" rx="6" />
      <rect className="dg-line" x="202" y="62" width="118" height="28" rx="6" />
      <g className="dg-mono dg-code">
        <text x="55.5" y="81" textAnchor="middle">Button</text>
        <text x="146.5" y="81" textAnchor="middle">Explore</text>
        <text x="261" y="81" textAnchor="middle">ArrowUpRight</text>
      </g>
      <rect className="dg-line" x="72" y="348" width="216" height="80" rx="16" />
      <rect className="dg-guide" x="104" y="374" width="70" height="28" rx="4" />
      <rect className="dg-guide" x="226" y="374" width="34" height="28" rx="4" />
      <text className="dg-label" x="112" y="393">Explore</text>
      <path className="dg-line" d="M234 396 L250 380 M238 380 H250 V392" />
      <path className="dg-line dg-accent-line" d="M55 90 C 55 200, 100 230, 100 348" />
      <path className="dg-line" d="M146 90 C 146 220, 139 250, 139 374" />
      <path className="dg-line" d="M261 90 C 261 220, 243 250, 243 374" />
      <circle className="dg-dot dg-accent-fill" cx="55" cy="90" r="3.5" />
      <circle className="dg-dot dg-accent-fill" cx="100" cy="348" r="3.5" />
      <circle className="dg-dot" cx="146" cy="90" r="3.5" />
      <circle className="dg-dot" cx="139" cy="374" r="3.5" />
      <circle className="dg-dot" cx="261" cy="90" r="3.5" />
      <circle className="dg-dot" cx="243" cy="374" r="3.5" />
      <Tag x={86} y={190} width={118} text={pairs[0].name} accent />
      <Tag x={144} y={228} width={104} text={pairs[2].name} />
      <Tag x={250} y={266} width={104} text={pairs[1].name} />
    </svg>

    <figcaption id="diagram-caption">
      <p>Three pairs share a name. Each name is written once in the code (left) and once in the component (right), and the engine moves the piece along the line between them. In the implementation, that shared name is called <code>layoutId</code>.</p>
      <ul className="sr-only">
        {pairs.map(pair => <li key={pair.name}>Source token <code>{pair.source}</code> and {pair.destination} share the name <code>{pair.name}</code>.</li>)}
      </ul>
    </figcaption>
  </figure>;
}
