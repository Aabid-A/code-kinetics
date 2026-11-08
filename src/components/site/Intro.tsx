import { ChapterIndex } from "./ChapterIndex";

// The progressive layer under the hero: why this matters in a few sentences, then the contents.
export function Intro() {
  return <section className="intro" id="what-this-is" aria-labelledby="intro-title">
    <h2 id="intro-title" className="intro-title">What this is</h2>
    <p className="intro-text">
      The calmest interfaces don&rsquo;t blink from one screen to the next. A thumbnail grows into a photo; a card
      opens into a page. Each piece knows where it is going. This lab shows the idea behind that motion, one piece of
      code at a time.
    </p>
    <ChapterIndex />
  </section>;
}
