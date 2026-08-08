"use client";

import { useMemo, useRef, useState } from "react";
import "./hero.css";
import "./gallery.css";

const WIDGETS = [
  { id: "bg", icon: "✂", title: "Remove the background", eyebrow: "One-click cleanup", copy: "Cut out any person or product with clean, usable edges.", color: "mint", needsPhoto: true, outputs: 1, prompt: "Remove the background completely. Preserve the subject and fine edge detail. Return a clean transparent-background product-quality cutout." },
  { id: "photoshop", icon: "⌁", title: "Fix this photo", eyebrow: "Photoshop for dummies", copy: "Repair lighting, skin tone, clutter and distracting details.", color: "blue", needsPhoto: true, outputs: 1, prompt: "Professionally retouch this photo while keeping it natural and recognizably the same. Fix lighting, color balance, distracting clutter, minor blemishes and composition." },
  { id: "body", icon: "↗", title: "Upgrade my physique", eyebrow: "Still you, better shape", copy: "Choose leaner, athletic, muscular or softly sculpted.", color: "orange", needsPhoto: true, outputs: 4, people: true, prompt: "Create a realistic, flattering physique edit of the clearly adult person. Preserve identity, face, pose and clothing. Keep anatomy natural and believable." },
  { id: "dating", icon: "♥", title: "Make them stop scrolling", eyebrow: "Dating profile pack", copy: "Turn one honest photo into a polished five-shot profile.", color: "pink", needsPhoto: true, outputs: 5, people: true, prompt: "Create a coordinated dating-profile photo set of the clearly adult subject. Keep identity consistent. Use confident, warm, attractive expressions and believable lifestyle settings." },
  { id: "influencer", icon: "✦", title: "AI influencer 10-pack", eyebrow: "Outfits, poses, locations", copy: "Create ten coordinated, scroll-stopping images of an adult fictional influencer.", color: "green", needsPhoto: false, outputs: 10, people: true, prompt: "Create a coordinated social media set featuring the same clearly adult fictional AI influencer in varied outfits, poses, camera angles and aspirational locations. Keep face and identity consistent across the set." },
  { id: "tryon", icon: "◇", title: "Try on this look", eyebrow: "Virtual wardrobe", copy: "Upload yourself and the outfit. See the complete styled result.", color: "violet", needsPhoto: true, outputs: 4, people: true, prompt: "Dress the clearly adult person from the primary identity photo in the supplied outfit references. Preserve identity and realistic anatomy. Make the garment fit naturally with accurate fabric and details." },
  { id: "glam", icon: "☾", title: "After-dark glam", eyebrow: "Bold, tasteful, magnetic", copy: "Editorial, nightlife, swim or boudoir-inspired looks for adults.", color: "red", needsPhoto: true, outputs: 6, people: true, adult: true, prompt: "Create a confident, sensual but non-explicit editorial photo set of the clearly adult consenting subject. Preserve identity. Use sophisticated styling, flattering posing and premium fashion photography." },
  { id: "hair", icon: "≈", title: "New hair, no regret", eyebrow: "Preview the change", copy: "Cuts, color, makeup and a complete style refresh.", color: "gold", needsPhoto: true, outputs: 4, people: true, prompt: "Create realistic beauty previews of the clearly adult subject. Preserve face and identity while applying the requested hair, color, makeup and styling changes." },
  { id: "product", icon: "□", title: "Make this product sell", eyebrow: "Instant campaign", copy: "Turn one product shot into studio, lifestyle and ad-ready images.", color: "cyan", needsPhoto: true, outputs: 6, prompt: "Create a premium commercial campaign set using the supplied product as the exact hero object. Preserve branding, shape and text. Vary studio, lifestyle and close-up compositions." },
  { id: "scene", icon: "◎", title: "Put me somewhere better", eyebrow: "Dream scene creator", copy: "Nightlife, vacation, luxury, fantasy or your own impossible place.", color: "lime", needsPhoto: true, outputs: 4, people: true, prompt: "Place the clearly adult subject naturally into the requested scene. Preserve identity, perspective and realistic lighting. Make the final photo feel captured, not composited." },
  { id: "video", icon: "▶", title: "Make a campaign video", eyebrow: "Image to motion", copy: "Turn up to three photos into an eight-second Reel with cinematic motion and sound.", color: "green", needsPhoto: true, outputs: 1, people: true, video: true, prompt: "Create an eight-second premium social campaign video featuring the clearly adult subject from the reference images. Preserve identity and wardrobe. Use confident natural movement, cinematic camera motion, polished lighting, seamless pacing and a modern energetic soundtrack. No dialogue and no on-screen text." },
];

const BODY_OPTIONS = ["Keep my current shape", "Leaner and defined", "Athletic", "More muscular", "Softly sculpted", "Curvy and balanced"];
const STYLE_OPTIONS = ["Natural and believable", "Polished editorial", "Luxury campaign", "Cinematic nightlife", "Social-media glossy", "Bold flash photography"];
const SENSUALITY = ["Flirty", "Confident", "Sensual editorial", "After-dark fashion", "Boudoir-inspired — covered"];
const MARKETING_ASSETS = [
  ...Array.from({ length: 19 }, (_, index) => ({ type: "image", src: `/marketing/marketing-${String(index + 1).padStart(2, "0")}.jpg` })),
  ...Array.from({ length: 6 }, (_, index) => ({ type: "video", src: `/marketing/marketing-${String(index + 20).padStart(2, "0")}.mp4` })),
];

function dataUrlToParts(dataUrl) {
  const [header, data] = dataUrl.split(",");
  return { mimeType: header.match(/data:(.*?);/)?.[1] || "image/jpeg", data };
}

async function compressFile(file) {
  const raw = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = raw;
  });
  const max = 1400;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.86);
}

export default function Home() {
  const [active, setActive] = useState(null);
  const [files, setFiles] = useState([]);
  const [direction, setDirection] = useState("");
  const [body, setBody] = useState(BODY_OPTIONS[0]);
  const [style, setStyle] = useState(STYLE_OPTIONS[1]);
  const [sensuality, setSensuality] = useState(SENSUALITY[1]);
  const [count, setCount] = useState(4);
  const [aspectRatio, setAspectRatio] = useState("4:5");
  const [quality, setQuality] = useState("1K");
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState([]);
  const [notice, setNotice] = useState("");
  const fileInput = useRef(null);

  const selected = WIDGETS.find((item) => item.id === active);
  const prompt = useMemo(() => {
    if (!selected) return "";
    const extras = [selected.prompt, `Creative direction: ${direction || "Choose the strongest commercially appealing result."}`, `Visual finish: ${style}.`, selected.people ? `Body direction: ${body}.` : "", selected.adult ? `Mood: ${sensuality}. Keep all subjects clearly 21+ and fully within non-explicit editorial styling.` : "", `Output: ${count} coordinated image${count > 1 ? "s" : ""}, aspect ratio ${aspectRatio}, ${quality} quality.`];
    return extras.filter(Boolean).join(" ");
  }, [selected, direction, style, body, sensuality, count, aspectRatio, quality]);

  function openWidget(widget) {
    setActive(widget.id);
    setFiles([]);
    setDirection("");
    setCount(widget.outputs);
    setAspectRatio(widget.id === "influencer" || widget.id === "glam" || widget.id === "video" ? "9:16" : "4:5");
    setResults([]);
    setNotice("");
    setAdultConfirmed(false);
    setRightsConfirmed(false);
    setTimeout(() => document.getElementById("creator")?.scrollIntoView({ behavior: "smooth" }), 20);
  }

  async function addFiles(incoming) {
    const chosen = [...incoming].filter((file) => file.type.startsWith("image/")).slice(0, Math.max(0, 5 - files.length));
    if (!chosen.length) return;
    setNotice("Preparing your references…");
    try {
      const compressed = await Promise.all(chosen.map(async (file) => ({ name: file.name, url: await compressFile(file) })));
      setFiles((current) => [...current, ...compressed].slice(0, 5));
      setNotice("");
    } catch {
      setNotice("One image could not be prepared. Try a JPG or PNG under 15 MB.");
    }
  }

  async function generate() {
    if (selected.needsPhoto && !files.length) return setNotice("Add at least one photo so the result can stay true to your subject.");
    if (selected.people && !rightsConfirmed) return setNotice("Confirm that you own or have permission to use the people shown.");
    if (selected.adult && !adultConfirmed) return setNotice("Confirm that every person shown is 21 or older.");
    setBusy(true);
    setNotice(`Creating ${count} polished ${count === 1 ? "image" : "images"}…`);
    setResults([]);
    try {
      const response = await fetch(selected.video ? "/api/video" : "/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widget: selected.id, prompt, count, aspectRatio, quality, rightsConfirmed, adultConfirmed, images: files.map((file) => dataUrlToParts(file.url)) }),
      });
      if (selected.video) {
        if (!response.ok) { const data = await response.json(); throw new Error(data.message || "Video generation is temporarily unavailable."); }
        const videoBlob = await response.blob();
        setResults([{ url: URL.createObjectURL(videoBlob), mimeType: videoBlob.type || "video/mp4" }]);
        setNotice("Your campaign video is ready.");
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Generation is temporarily unavailable.");
      setResults(data.images || []);
      setNotice(data.images?.length ? `${data.images.length} image${data.images.length === 1 ? "" : "s"} ready.` : "Try a slightly different direction.");
    } catch (error) {
      setNotice(`${error.message} Your setup is saved—nothing was lost.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <nav className="nav">
        <a className="brand" href="#top" aria-label="XNanoPro home"><span className="mark">X</span><span>NANO</span><strong>PRO</strong></a>
        <div className="navLinks"><a href="#widgets">Create</a><a href="#how">How it works</a><a href="#pricing">Pricing</a></div>
        <a className="smallButton" href="#widgets">Make something</a>
      </nav>

      <section className="widgetHero" id="top">
        <div className="heroCopy">
          <div className="eyebrow"><span>●</span> XNANO ENGINE ONLINE</div>
          <h1>WHAT DO YOU<br/><em>WANT TONIGHT?</em></h1>
          <p>Pick a result. Add a photo. We handle the complicated part.</p>
          <a className="primary" href="#widgets">Choose a widget <span>↓</span></a>
        </div>
        <div className="heroModel" aria-hidden="true"><img src="/mara-xnanopro-shirt2.jpeg" alt="" /></div>
      </section>

      <section className="widgetSection" id="widgets">
        <div className="sectionTitle"><div><span>START HERE</span><h2>One job. One widget.</h2></div><p>No layers. No masks. No prompt engineering.</p></div>
        <div className="widgetGrid">
          {WIDGETS.map((widget, index) => (
            <button className={`widgetCard ${widget.color}`} key={widget.id} onClick={() => openWidget(widget)}>
              <span className="widgetNumber">{String(index + 1).padStart(2, "0")}</span>
              <span className="widgetIcon">{widget.icon}</span>
              <span className="widgetEyebrow">{widget.eyebrow}</span>
              <strong>{widget.title}</strong>
              <span className="widgetCopy">{widget.copy}</span>
              <span className="widgetGo">Open widget <b>→</b></span>
            </button>
          ))}
        </div>
      </section>

      {selected && <section className="creator" id="creator">
        <div className="creatorTop"><button onClick={() => setActive(null)}>← All widgets</button><div><span>YOU CHOSE</span><h2>{selected.title}</h2></div><span className="livePill">● READY</span></div>
        <div className="creatorLayout">
          <div className="creatorMain">
            <section className="stepCard">
              <div className="stepHead"><b>01</b><div><h3>Show us what you’re working with</h3><p>{selected.video ? "Add one to three clear photos of the same adult subject. The strongest image guides the opening shot." : selected.needsPhoto ? "Your first image is the main subject. Add extra outfit or style references after it." : "References are optional. Add a face, outfit, location or visual style if you want tighter control."}</p></div></div>
              <div className="dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files); }} onClick={() => fileInput.current?.click()}>
                <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(event) => addFiles(event.target.files)} />
                <span>+</span><strong>Add photos</strong><p>Click or drop JPG, PNG, WEBP or HEIC</p>
              </div>
              {!!files.length && <div className="thumbs">{files.map((file, index) => <div className="thumb" key={`${file.name}-${index}`}><img src={file.url} alt={`Reference ${index + 1}`} /><span>{index === 0 ? "PRIMARY" : `REF ${index + 1}`}</span><button onClick={() => setFiles((items) => items.filter((_, itemIndex) => itemIndex !== index))}>×</button></div>)}</div>}
            </section>

            <section className="stepCard">
              <div className="stepHead"><b>02</b><div><h3>Describe the win</h3><p>Plain English is enough. Short and specific works best.</p></div></div>
              <label>What should the finished images feel like?</label>
              <textarea value={direction} onChange={(event) => setDirection(event.target.value)} placeholder={selected.id === "influencer" ? "Ten confident nightlife and resort looks, luxury but believable…" : "Tell us the look, setting, outfit or result you want…"} />
              <div className="fieldGrid">
                {selected.people && <label>Body direction<select value={body} onChange={(event) => setBody(event.target.value)}>{BODY_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>}
                <label>Visual finish<select value={style} onChange={(event) => setStyle(event.target.value)}>{STYLE_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
                {selected.adult && <label>Mood<select value={sensuality} onChange={(event) => setSensuality(event.target.value)}>{SENSUALITY.map((option) => <option key={option}>{option}</option>)}</select></label>}
              </div>
              {selected.people && <div className="checks"><label><input type="checkbox" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} /> I own these photos or have permission from everyone shown, and agree they may be sent to Google AI to create my results.</label>{selected.adult && <label><input type="checkbox" checked={adultConfirmed} onChange={(event) => setAdultConfirmed(event.target.checked)} /> Everyone shown is 21 or older.</label>}</div>}
            </section>

            <section className="stepCard">
              <div className="stepHead"><b>03</b><div><h3>Choose your set</h3><p>Generate one finished image or a coordinated pack.</p></div></div>
              <div className="modeGrid">{(selected.video ? [1] : [1, 4, selected.outputs]).filter((value, index, array) => array.indexOf(value) === index).map((value) => <button className={count === value ? "active" : ""} key={value} onClick={() => setCount(value)}><strong>{selected.video ? "8-second campaign" : value === 1 ? "Single image" : `${value}-image pack`}</strong><span>{selected.video ? "Vertical or widescreen video with sound" : value === 1 ? "One polished result" : "Coordinated variations"}</span></button>)}</div>
            </section>
          </div>

          <aside className="outputPanel">
            <div className="outputSticky"><h3>Output</h3>
              <label>Aspect ratio<select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)}>{(selected.video ? ["9:16", "16:9"] : ["1:1", "4:5", "3:4", "9:16", "16:9"]).map((ratio) => <option key={ratio}>{ratio}</option>)}</select></label>
              {!selected.video && <label>Quality<select value={quality} onChange={(event) => setQuality(event.target.value)}><option>1K</option><option>2K</option><option>4K</option></select></label>}
              <details><summary>Under-the-hood prompt</summary><p>{prompt}</p></details>
              {notice && <div className={`notice ${busy ? "working" : ""}`}>{busy && <i />}{notice}</div>}
              <button className="generateButton" disabled={busy} onClick={generate}>{busy ? (selected.video ? "Directing your video…" : "Creating…") : selected.video ? "Generate campaign video" : `Generate ${count === 1 ? "image" : `${count} images`}`} <span>✦</span></button>
            </div>
          </aside>
        </div>

        {!!results.length && <div className="results"><div className="sectionTitle"><div><span>YOUR SET</span><h2>{selected.title}</h2></div><p>{results.length} complete</p></div><div className={`resultGrid ${selected.video ? "videoResults" : ""}`}>{results.map((result, index) => <figure key={index}>{selected.video ? <video src={result.url} controls autoPlay playsInline /> : <img src={`data:${result.mimeType};base64,${result.data}`} alt={`Generated result ${index + 1}`} />}<a download={`xnanopro-${selected.id}-${index + 1}.${selected.video ? "mp4" : result.mimeType.includes("png") ? "png" : "jpg"}`} href={selected.video ? result.url : `data:${result.mimeType};base64,${result.data}`}>Download</a></figure>)}</div></div>}
      </section>}

      <section className="showcase" id="showcase">
        <div className="showcaseHead"><div><span>MADE WITH XNANOPRO</span><h2>One face.<br/>Twenty-five possibilities.</h2></div><p>Real campaign-ready stills and motion created for the XNanoPro brand. Tap any video to play.</p></div>
        <div className="showcaseGrid">
          {MARKETING_ASSETS.map((asset, index) => <figure key={asset.src}>
            {asset.type === "image" ? <img src={asset.src} alt={`XNanoPro campaign example ${index + 1}`} loading="lazy" /> : <video src={asset.src} controls playsInline preload="metadata" aria-label={`XNanoPro campaign video ${index + 1}`} />}
            <figcaption><span>{String(index + 1).padStart(2, "0")}</span><b>{asset.type === "video" ? "MOTION" : "CAMPAIGN"}</b></figcaption>
          </figure>)}
        </div>
      </section>

      <section className="how" id="how"><span>THREE MOVES</span><h2>Pick it. Show it. Make it.</h2><div><p><b>01</b> Choose the result you want.</p><p><b>02</b> Upload a photo and choose the vibe.</p><p><b>03</b> Download a finished set.</p></div></section>
      <section className="pricing" id="pricing"><span>EARLY ACCESS</span><h2>CREATE MORE.<br/><em>LOOK BETTER.</em></h2><p>Simple credits. No software to learn.</p><a className="primary" href="#widgets">Make something →</a></section>
      <footer><div className="brand"><span className="mark">X</span><span>NANO</span><strong>PRO</strong></div><p>© 2026 XNanoPro. Adults only for people-focused sensual styles.</p></footer>
    </main>
  );
}
