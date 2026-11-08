import { Lab } from "@/components/lab/Lab";
import { LabErrorBoundary } from "@/components/lab/LabErrorBoundary";
import { TryOwn } from "@/components/lab/TryOwn";
import { Chapter } from "@/components/site/Chapter";
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
          <Chapter id="button" number="01" label="Button"
            title={<>One name, one <em>surface</em></>}
            caption="Watch the three named pieces, the button, its arrow and its label, each leave the code and land in one place.">
            <Lab id="button" />
          </Chapter>
          <section id="toast" aria-label="Toast" className="chapter-bare"><Lab id="toast" /></section>
          <section id="bento" aria-label="Bento" className="chapter-bare"><Lab id="bento" /></section>
          <div id="try" className="chapter-bare"><TryOwn /></div>
        </main>
        <noscript><p className="compare-notice">Interaction requires JavaScript. The fixed example and explanation remain available.</p></noscript>
      </div>
    </SoundProvider>
  </LabErrorBoundary>;
}
