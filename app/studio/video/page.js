import StudioShell from "../StudioShell";

export const metadata = { title: "Video Studio — XImage Pro" };

const config = {
  slug: "video-studio",
  path: "/studio/video",
  accent: "silver",
  kicker: "VEO 3.1",
  title: "Video Studio",
  description: "Reference-driven short-form video generation with the full 3.0.1 reference-mode controls kept visible.",
  modelLabel: "Veo 3.1",
  glyph: "▶",
  endpoint: "/api/video",
  outputType: "video",
  defaultAspect: "9:16",
  defaultPrompt: "Create a polished cinematic short-form video with natural movement, strong composition and appropriate sound.",
  promptPlaceholder: "Describe the movement, camera, subject action, environment, lighting and pacing…",
  uploadGroups: [
    { key: "references", label: "Video reference media", copy: "Add up to 3 subject references for the reference-pack workflow.", max: 3, button: "Add reference images" },
  ],
  fields: [
    { key: "model", label: "Model", default: "veo-3.1-fast-generate-001", options: [
      { value: "veo-3.1-fast-generate-001", label: "Veo 3.1 Fast — recommended" },
      { value: "veo-3.1-generate-001", label: "Veo 3.1" },
      { value: "veo-3.1-lite-generate-001", label: "Veo 3.1 Lite — no reference pack" },
    ] },
    { key: "referenceMode", label: "Reference mode", default: "Reference pack", options: ["Text only","Start frame","First + last","Reference pack"] },
    { key: "aspectRatio", label: "Aspect ratio", default: "9:16", options: ["9:16","16:9"] },
    { key: "resolution", label: "Resolution", default: "720p", options: ["720p"] },
    { key: "length", label: "Length", default: "8 seconds", options: ["8 seconds"] },
    { key: "count", label: "Videos", default: "1", options: ["1"] },
    { key: "sound", label: "Generate sound", type: "toggle", default: true, help: "Keep cinematic sound enabled when supported by the model." },
  ],
  generatingText: "Rendering video…",
  footerNote: "Silver workspace • Veo 3.1 • up to 3 references • 720p / 8 sec",
  cta: "GENERATE VIDEO",
};

export default function Page() { return <StudioShell config={config} />; }
