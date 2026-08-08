export default function Home() {
  return (
    <main>
      <nav className="nav">
        <a className="brand" href="#top" aria-label="XNanoPro home"><span className="mark">X</span><span>NANO</span><strong>PRO</strong></a>
        <div className="navLinks"><a href="#studio">Studio</a><a href="#features">Features</a><a href="#pricing">Pricing</a></div>
        <a className="smallButton" href="#studio">Launch Studio</a>
      </nav>

      <section className="hero" id="top">
        <div className="eyebrow"><span aria-hidden="true">✦</span> AI CREATIVE STUDIO</div>
        <h1>MAKE THE<br/><span>IMPOSSIBLE.</span></h1>
        <p className="lede">A fast, focused AI image workspace built to turn an idea, reference, or photo into something worth publishing.</p>
        <div className="actions"><a className="primary" href="#studio">Start Creating <span>→</span></a><a className="secondary" href="#features">See what it does</a></div>
        <div className="signal"><i /> XNanoPro beta is online</div>
      </section>

      <section className="studio" id="studio">
        <div className="panel">
          <div className="panelHead"><span>CREATE</span><span className="model"><i /> XNANO ENGINE</span></div>
          <div className="drop"><div className="plus">+</div><h2>Add an image</h2><p>Drop a reference here or start from a prompt.</p><button type="button">Choose image</button></div>
          <label htmlFor="prompt">WHAT DO YOU WANT TO CREATE?</label>
          <div className="prompt"><textarea id="prompt" placeholder="Describe the image, edit, style, lighting, camera angle..."/><button type="button" aria-label="Generate"><span aria-hidden="true">✦</span> GENERATE</button></div>
          <div className="controls"><span>1:1</span><span>HD</span><span>1 IMAGE</span><span>PRIVATE</span></div>
        </div>
        <aside className="preview"><div className="previewGrid"/><div className="previewCopy"><span>OUTPUT</span><h3>Your next image<br/>starts here.</h3><p>Generated work will appear in this space.</p></div></aside>
      </section>

      <section className="features" id="features">
        <div><b>01</b><h3>Generate</h3><p>Create polished images from natural-language prompts.</p></div>
        <div><b>02</b><h3>Transform</h3><p>Upload a reference and change the scene without losing the idea.</p></div>
        <div><b>03</b><h3>Iterate</h3><p>Keep refining until the output looks exactly the way you want.</p></div>
      </section>

      <section className="pricing" id="pricing"><span>BUILT FOR SPEED</span><h2>CREATE MORE.<br/><em>WAIT LESS.</em></h2><p>Simple plans and usage-based generation are coming next.</p><a className="primary" href="#studio">Try the studio →</a></section>
      <footer><div className="brand"><span className="mark">X</span><span>NANO</span><strong>PRO</strong></div><p>© 2026 XNanoPro. Built for creators.</p></footer>
    </main>
  );
}
