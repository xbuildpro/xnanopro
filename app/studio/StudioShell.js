"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import "./studio.css";

// Everything Possible is the front door. The studios run inside an iframe there,
// so switching studio has to navigate the whole window back through EP - not
// just swap the iframe, which left the address bar on the previous studio and
// skipped the token hand-off entirely.
const EP_HOME = "https://www.everything-possible.com";

const STUDIOS = [
  { href: "/studio/images", ep: "/ximage/images", short: "IMG", label: "Image Studio", accent: "green" },
  { href: "/studio/video", ep: "/ximage/video", short: "VID", label: "Video Studio", accent: "silver" },
  { href: "/studio/influencer", ep: "/ximage/influencer", short: "INF", label: "Influencer", accent: "pink" },
  { href: "/studio/vton", ep: "/ximage/vton", short: "VTON", label: "VTON Studio", accent: "cyan" },
  { href: "/studio/kolors", ep: "/ximage/kolors", short: "K1.5", label: "Kolors 1.5", accent: "yellow" },
];

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function blobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function compressImage(file) {
  const raw = await readAsDataUrl(file);
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = raw;
  });
  const maxSide = 1800;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

function dataUrlToParts(url) {
  const [header, data] = String(url || "").split(",");
  return {
    mimeType: header?.match(/data:(.*?);/)?.[1] || "image/jpeg",
    data: data || "",
    dataUrl: url,
  };
}

function initialValues(config) {
  const values = {};
  for (const field of config.fields || []) values[field.key] = field.default ?? "";
  values.prompt = config.defaultPrompt || "";
  values.negativePrompt = config.defaultNegativePrompt || "";
  return values;
}

const SUPABASE_URL = "https://jkewqiqkenjavtbgxuip.supabase.co";
const SUPABASE_KEY = "sb_publishable_ubS1IdiaCZPMV1vEm-zdlw_06Quiqfm";

function userIdFromToken(token) {
  try {
    const claims = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(claims)).sub || "";
  } catch {
    return "";
  }
}

function extensionFor(mimeType) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "video/mp4") return "mp4";
  return "png";
}

// Generated media used to be base64'd into the JSON body of /api/gallery/save.
// Base64 inflates by about a third, so anything at 2K blew past the 4.5 MB
// request cap and was rejected with a 413 before the function even ran. The
// bytes now go straight from the browser to Supabase Storage under the user's
// own token, and only the small metadata row goes through the API.
async function uploadToStorage(dataUrl, tool) {
  const token = captureEpToken();
  const userId = userIdFromToken(token);
  if (!userId) throw new Error("Log in to save media to your gallery.");

  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
  if (!match) throw new Error("The result could not be prepared for saving.");

  const mimeType = match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);

  const storagePath = `${userId}/${tool}/${Date.now()}-${crypto.randomUUID()}.${extensionFor(mimeType)}`;
  const objectUrl = `${SUPABASE_URL}/storage/v1/object/user-media/${storagePath.split("/").map(encodeURIComponent).join("/")}`;

  const upload = await fetch(objectUrl, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": mimeType,
      "x-upsert": "false",
    },
    body: bytes,
  });

  if (!upload.ok) throw new Error("The result was created, but saving it to your gallery failed.");
  return { storagePath, mimeType };
}

async function archiveResult(config, result, prompt, metadata = {}) {
  const body = {
    mediaType: result.type,
    tool: config.slug || config.path?.split("/").filter(Boolean).pop() || "studio",
    prompt,
    metadata: {
      model: config.modelLabel,
      studio: config.title,
      ...metadata,
    },
  };

  const dataUrl = result.dataUrl || (result.url?.startsWith("data:") ? result.url : "");
  if (!dataUrl) return;

  const stored = await uploadToStorage(dataUrl, body.tool);
  body.storagePath = stored.storagePath;
  body.mimeType = stored.mimeType;

  const response = await fetch("/api/gallery/save", {
    method: "POST",
    headers: epHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Gallery save failed.");
  }
}

function ControlField({ field, value, onChange }) {
  if (field.type === "toggle") {
    return (
      <label className="studioToggleRow">
        <span><strong>{field.label}</strong>{field.help && <small>{field.help}</small>}</span>
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
        <i aria-hidden="true" />
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <label className={`studioField ${field.span === 2 ? "span2" : ""}`}>
        <span>{field.label}</span>
        <textarea value={value} rows={field.rows || 3} placeholder={field.placeholder || ""} onChange={(e) => onChange(e.target.value)} />
        {field.help && <small>{field.help}</small>}
      </label>
    );
  }

  if (field.type === "number") {
    return (
      <label className={`studioField ${field.span === 2 ? "span2" : ""}`}>
        <span>{field.label}</span>
        <input type="number" value={value} min={field.min} max={field.max} step={field.step || 1} onChange={(e) => onChange(e.target.value)} />
        {field.help && <small>{field.help}</small>}
      </label>
    );
  }

  return (
    <label className={`studioField ${field.span === 2 ? "span2" : ""}`}>
      <span>{field.label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {(field.options || []).map((option) => {
          const item = typeof option === "string" ? { value: option, label: option } : option;
          return <option key={item.value} value={item.value}>{item.label}</option>;
        })}
      </select>
      {field.help && <small>{field.help}</small>}
    </label>
  );
}

// The token everything-possible hands the iframe. Held in memory rather than a
// cookie, because the cookie is third-party here and browsers drop it.
let epToken = '';

function captureEpToken() {
  if (typeof window === 'undefined') return '';
  if (epToken) return epToken;
  const fromUrl = new URLSearchParams(window.location.search).get('ep_token');
  if (fromUrl) {
    epToken = fromUrl;
    try {
      sessionStorage.setItem('ep_token', fromUrl);
      // Take it back out of the address bar now that it is held in memory.
      const clean = new URL(window.location.href);
      clean.searchParams.delete('ep_token');
      window.history.replaceState({}, '', clean.toString());
    } catch {}
    return epToken;
  }
  try { epToken = sessionStorage.getItem('ep_token') || ''; } catch {}
  return epToken;
}

// Every call to our own API carries the token, so auth never depends on a
// cookie surviving a cross-site iframe.
function epHeaders(extra = {}) {
  const token = captureEpToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

export default function StudioShell({ config }) {
  // Grab the token the moment the studio mounts, before anything can navigate
  // and lose it from the URL.
  useEffect(() => { captureEpToken(); }, []);

  const [values, setValues] = useState(() => initialValues(config));
  const [files, setFiles] = useState({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [results, setResults] = useState([]);
  const inputRefs = useRef({});

  const allFiles = useMemo(() => Object.values(files).flat(), [files]);
  const activeResult = results[0] || null;

  function setValue(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function addFiles(group, incoming) {
    const accepted = [...incoming].filter((file) => file.type.startsWith("image/")).slice(0, group.max || 6);
    if (!accepted.length) return;
    setNotice("Preparing image references…");
    try {
      const prepared = await Promise.all(accepted.map(async (file) => ({ name: file.name, url: await compressImage(file) })));
      setFiles((current) => ({
        ...current,
        [group.key]: group.multiple === false ? prepared.slice(0, 1) : [...(current[group.key] || []), ...prepared].slice(0, group.max || 6),
      }));
      setNotice("");
    } catch {
      setNotice("One image could not be prepared. Try a JPG, PNG, WEBP, or HEIC image.");
    }
  }

  function removeFile(groupKey, index) {
    setFiles((current) => ({ ...current, [groupKey]: (current[groupKey] || []).filter((_, i) => i !== index) }));
  }

  function buildPrompt() {
    if (typeof config.buildPrompt === "function") return config.buildPrompt(values);
    return values.prompt || "";
  }

  async function generate() {
    for (const group of config.uploadGroups || []) {
      if (group.required && !(files[group.key] || []).length) {
        setNotice(`Add ${group.label.toLowerCase()} first.`);
        return;
      }
    }
    if (config.requiresPrompt !== false && !String(values.prompt || "").trim()) {
      setNotice("Add a prompt or creative direction first.");
      return;
    }

    setBusy(true);
    setResults([]);
    setNotice(config.generatingText || "Generating…");

    try {
      const groups = {};
      for (const [key, items] of Object.entries(files)) groups[key] = items.map((item) => dataUrlToParts(item.url));
      const finalPrompt = buildPrompt();
      const payload = {
        ...values,
        prompt: finalPrompt,
        groups,
        images: allFiles.map((item) => dataUrlToParts(item.url)),
        rightsConfirmed: true,
        adultConfirmed: true,
        count: Number(values.count || values.numImages || config.defaultCount || 1),
        aspectRatio: values.aspectRatio || config.defaultAspect || "4:5",
        quality: values.resolution || values.quality || "1K",
      };

      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: epHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });

      if (config.outputType === "video") {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || "Video generation failed.");
        }
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const dataUrl = await blobAsDataUrl(blob);
        const videoResult = { type: "video", url: objectUrl, dataUrl };
        setResults([videoResult]);
        try {
          await archiveResult(config, videoResult, finalPrompt, { aspectRatio: payload.aspectRatio, quality: payload.quality });
          setNotice("Video ready and saved to your Gallery.");
        } catch (saveError) {
          setNotice(`Video ready. ${saveError.message}`);
        }
      } else {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Generation failed.");
        const raw = data.images || (data.image ? [data.image] : []);
        const normalized = raw.map((item) => ({
          type: "image",
          url: item.url || (item.data ? `data:${item.mimeType || item.content_type || "image/png"};base64,${item.data}` : ""),
        })).filter((item) => item.url);
        setResults(normalized);

        if (normalized.length) {
          const saved = await Promise.allSettled(normalized.map((result) => archiveResult(config, result, finalPrompt, { aspectRatio: payload.aspectRatio, quality: payload.quality })));
          const savedCount = saved.filter((item) => item.status === "fulfilled").length;
          const firstSaveError = saved.find((item) => item.status === "rejected")?.reason?.message;
          const shortfall = data.missing > 0
            ? ` ${data.missing} of the ${data.requested} could not be generated—try again to fill the set.`
            : "";
          setNotice(savedCount === normalized.length
            ? `${normalized.length} result${normalized.length === 1 ? "" : "s"} ready and saved to your Gallery.${shortfall}`
            : `${normalized.length} result${normalized.length === 1 ? "" : "s"} ready. ${savedCount} saved to your Gallery. ${firstSaveError || ""}${shortfall}`);
        } else {
          setNotice("No image was returned. Try a different direction.");
        }
      }
    } catch (error) {
      setNotice(error.message || "The engine hit a temporary snag.");
    } finally {
      setBusy(false);
    }
  }

  function downloadResult() {
    if (!activeResult?.url) return;
    const a = document.createElement("a");
    a.href = activeResult.url;
    a.download = `${config.slug || "studio"}-${Date.now()}.${activeResult.type === "video" ? "mp4" : "png"}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <main className={`studioRoot accent-${config.accent}`}>
      <header className="suiteHeader">
        <a className="suiteBrand" href={EP_HOME} target="_top" aria-label="Everything Possible home"><span className="suiteX">X</span><span>IMAGE</span><b>PRO</b></a>
        <nav className="suiteTabs" aria-label="Studios">
          {STUDIOS.map((studio) => (
            <a
              key={studio.href}
              href={`${EP_HOME}${studio.ep}`}
              target="_top"
              className={`accent-tab accent-${studio.accent}${config.path === studio.href ? " active" : ""}`}
            >
              <span>{studio.short}</span>{studio.label}
            </a>
          ))}
        </nav>
        <div className="engineState"><i /> ENGINE ONLINE</div>
      </header>

      <section className="studioBody">
        <aside className="controlRail">
          <div className="railIntro">
            <p>{config.kicker}</p>
            <h1>{config.title}</h1>
            <span>{config.description}</span>
          </div>

          {(config.uploadGroups || []).map((group, groupIndex) => {
            const items = files[group.key] || [];
            return (
              <section className="controlSection" key={group.key}>
                <div className="sectionLabel"><b>{String(groupIndex + 1).padStart(2, "0")}</b><div><strong>{group.label}</strong><small>{group.copy}</small></div></div>
                <button className="dropControl" type="button" onClick={() => inputRefs.current[group.key]?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(group, e.dataTransfer.files); }}>
                  <input ref={(node) => { inputRefs.current[group.key] = node; }} type="file" accept="image/*" multiple={group.multiple !== false} hidden onChange={(e) => addFiles(group, e.target.files)} />
                  <b>+</b><span>{items.length ? `${items.length}/${group.max || 6} added` : group.button || "Add image"}</span>
                </button>
                {!!items.length && <div className="railThumbs">{items.map((item, index) => <div className="railThumb" key={`${item.name}-${index}`}><img src={item.url} alt="" /><button type="button" onClick={() => removeFile(group.key, index)}>×</button></div>)}</div>}
              </section>
            );
          })}

          {config.showPrompt !== false && (
            <section className="controlSection">
              <div className="sectionLabel"><b>{String((config.uploadGroups || []).length + 1).padStart(2, "0")}</b><div><strong>{config.promptLabel || "Prompt"}</strong><small>{config.promptHelp || "Describe exactly what you want."}</small></div></div>
              <textarea className="mainPrompt" rows="5" value={values.prompt} placeholder={config.promptPlaceholder || "Describe the result…"} onChange={(e) => setValue("prompt", e.target.value)} />
              {config.negativePrompt && <><label className="miniLabel">Negative prompt</label><textarea className="mainPrompt compact" rows="3" value={values.negativePrompt} placeholder="What should not appear…" onChange={(e) => setValue("negativePrompt", e.target.value)} /></>}
            </section>
          )}

          <section className="controlSection settingsSection">
            <div className="sectionLabel"><b>{String((config.uploadGroups || []).length + (config.showPrompt === false ? 1 : 2)).padStart(2, "0")}</b><div><strong>Settings</strong><small>{config.settingsHelp || "Fine-tune the generation."}</small></div></div>
            <div className="fieldGrid">
              {(config.fields || []).map((field) => <ControlField key={field.key} field={field} value={values[field.key]} onChange={(value) => setValue(field.key, value)} />)}
            </div>
          </section>

          <button className="generateStudio" type="button" disabled={busy} onClick={generate}><span>{busy ? "WORKING…" : config.cta || "GENERATE"}</span><b>→</b></button>
          {notice && <p className="studioStatus">{notice}</p>}
        </aside>

        <section className="previewStage">
          <header className="previewHeader">
            <div><p>LIVE OUTPUT</p><strong>{config.modelLabel}</strong></div>
            <div className="previewActions"><button disabled={!activeResult} onClick={downloadResult}>↓ Download</button><button disabled={!activeResult} onClick={() => activeResult?.url && window.open(activeResult.url, "_blank")}>↗ Open</button><button disabled={busy} onClick={generate}>↻ Regenerate</button></div>
          </header>

          <div className="previewCanvas">
            {!results.length ? <div className="emptyPreview"><div className="previewGlyph">{config.glyph || "◇"}</div><strong>{config.emptyTitle || "Your generated image will appear here"}</strong><p>{config.emptyCopy || "Set the options on the left and generate."}</p></div> : <div className={`resultWall ${results.length === 1 ? "single" : ""}`}>{results.map((result, index) => result.type === "video" ? <video key={index} src={result.url} controls autoPlay={false} playsInline /> : <img key={index} src={result.url} alt={`Generated result ${index + 1}`} />)}</div>}
          </div>

          <footer className="previewFooter"><span className="accentDot" />{config.footerNote || "Private server-side credentials • generation settings stay with this workspace"}</footer>
        </section>
      </section>
    </main>
  );
}
