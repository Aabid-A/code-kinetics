import { Lab } from "@/components/lab/Lab";
import { LabErrorBoundary } from "@/components/lab/LabErrorBoundary";
import { TryOwn } from "@/components/lab/TryOwn";
import { Chapter } from "@/components/site/Chapter";
import { ChapterIndex } from "@/components/site/ChapterIndex";
import { Diagram } from "@/components/site/Diagram";
import { Footer } from "@/components/site/Footer";
import { Opening } from "@/components/site/Opening";
import { SoundProvider } from "@/components/site/Sound";
import { TopBar } from "@/components/site/TopBar";

export default function Home() {
  return <LabErrorBoundary>
    <SoundProvider>
      <div className="page">
        <div className="drafting-rules" aria-hidden="true"><i /><i /><i /></div>
        <TopBar />
        <main className="page-main">
          <Opening />
          <ChapterIndex />
          <Chapter id="button" number="01" label="Button"
            title={<>One name, one <em>surface</em></>}
            caption="Watch the three named pieces, the button, its arrow and its label, each leave the code and land in one place.">
            <Lab id="button" />
          </Chapter>
          <Chapter id="toast" number="02" label="Toast"
            title={<>Pieces that <em>travel</em> together</>}
            caption="Notice how the card carries its icon and two lines of text along, while the text keeps its shape.">
            <Lab id="toast" />
          </Chapter>
          <Chapter id="bento" number="03" label="Bento" layout="side-right"
            title={<>A whole <em>layout</em></>}
            caption="Notice ten pieces arriving at once; narrow the window and the cards stack in the same order.">
            <Lab id="bento" />
          </Chapter>
          <Chapter id="how-it-knows" number="04" label="How it knows" layout="stacked"
            title={<>How it <em>knows</em></>}
            caption="Each piece has the same name in the code and in the component, and the engine moves it along the line between them.">
            <div className="diagram-sheet"><Diagram /></div>
          </Chapter>
          <Chapter id="your-turn" number="05" label="Your turn"
            title={<>Try your <em>own</em></>}
            caption="Describe a small component and the lab builds a matching example from validated data. No code is compiled or run.">
            <TryOwn />
          </Chapter>
          <Footer />
        </main>
        <noscript><p className="compare-notice">Interaction requires JavaScript. The fixed example and explanation remain available.</p></noscript>
      </div>
    </SoundProvider>
  </LabErrorBoundary>;
}
