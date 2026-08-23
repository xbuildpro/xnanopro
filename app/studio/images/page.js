import StudioShell from "../StudioShell";

export const metadata = { title: "Image Studio — XImage Pro" };

const config = {
  slug: "image-studio",
  path: "/studio/images",
  accent: "green",
  kicker: "NANO BANANA 3.0.1",
  title: "Image Studio",
  description: "Full-featured image generation with references, search grounding, resolution and model controls.",
  modelLabel: "Gemini 3.1 / Nano Banana",
  glyph: "✦",
  endpoint: "/api/generate",
  promptLabel: "Prompt",
  promptHelp: "Describe the finished image in detail.",
  promptPlaceholder: "Describe the subject, pose, lighting, camera, environment, styling and finish…",
  uploadGroups: [
    { key: "references", label: "Reference images", copy: "Add up to 6 subject, product, style or composition references.", max: 6, button: "Add reference images" },
  ],
  fields: [
    { key: "model", label: "Model", default: "gemini-3.1-flash-image", options: [
      { value: "gemini-3.1-flash-image", label: "Gemini 3.1 — Nano Banana" },
      { value: "gemini-3.1-flash-image", label: "Nano Banana 2 / current engine" },
    ] },
    { key: "aspectRatio", label: "Aspect ratio", default: "4:5", options: ["Auto","1:1","4:5","3:4","9:16","16:9"] },
    { key: "resolution", label: "Resolution", default: "1K", options: ["1K","2K","4K"] },
    { key: "count", label: "Images", default: "1", options: ["1","2","4","6","10"] },
    { key: "useGoogleSearch", label: "Use Google Search", type: "toggle", default: false, help: "Keep the 3.0.1 search-grounding option visible for supported generations." },
  ],
  footerNote: "Nano Banana 3.0.1 controls preserved • private Google credentials stay server-side",
  cta: "GENERATE IMAGE",
};

export default function Page() { return <StudioShell config={config} />; }
