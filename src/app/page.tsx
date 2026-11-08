import { Lab } from "@/components/lab/Lab";
import { LabErrorBoundary } from "@/components/lab/LabErrorBoundary";
import { CardToPage } from "@/components/site/CardToPage";
import { Chapter } from "@/components/site/Chapter";
import { Diagram } from "@/components/site/Diagram";
import { Footer } from "@/components/site/Footer";
import { Intro } from "@/components/site/Intro";
import { Opening } from "@/components/site/Opening";
import { SoundProvider } from "@/components/site/Sound";
import { TopBar } from "@/components/site/TopBar";

export default function Home() {
  return <LabErrorBoundary>
    <SoundProvider>
      <div className="page" id="top">
        <div className="drafting-rules" aria-hidden="true"><i /><i /><i /></div>
        <TopBar />
        <main className="page-main">
          <Opening />
          <Intro />
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
          <Chapter id="card-to-page" number="04" label="Card to page"
            title={<>A card <em>opens</em> into a page</>}
            caption="This is the motion you meet in real apps. Choose a project: its cover, title and tag keep their names, so they travel from the card into the page instead of being drawn again.">
            <CardToPage />
          </Chapter>
          <Chapter id="how-it-knows" number="05" label="How it knows" layout="stacked"
            title={<>How it <em>knows</em></>}
            caption="Each piece has the same name in the code and in the component, and the engine moves it along the line between them.">
            <div className="diagram-sheet"><Diagram /></div>
          </Chapter>
          <Footer />
        </main>
        <noscript><p className="compare-notice">Interaction requires JavaScript. The fixed example and explanation remain available.</p></noscript>
      </div>
    </SoundProvider>
  </LabErrorBoundary>;
}
