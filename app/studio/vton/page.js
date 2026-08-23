import StudioShell from "../StudioShell";

export const metadata = { title: "VTON Studio — XImage Pro" };

const config = {
  slug: "vton-studio",
  path: "/studio/vton",
  accent: "cyan",
  kicker: "VIRTUAL TRY-ON",
  title: "VTON Studio",
  description: "High-quality person + garment virtual try-on using the commercial Kling Kolors v1.5 endpoint.",
  modelLabel: "Kling Kolors VTON 1.5",
  glyph: "◇",
  endpoint: "/api/vton",
  requiresPrompt: false,
  showPrompt: false,
  uploadGroups: [
    { key: "person", label: "Person image", copy: "Use a clear front-facing full- or half-body photo with the clothing area visible.", max: 1, multiple: false, required: true, button: "Add person image" },
    { key: "garment", label: "Garment image", copy: "Use a clean garment photo with the item clearly visible; flat-lay/product shots work best.", max: 1, multiple: false, required: true, button: "Add garment image" },
  ],
  fields: [
    { key: "model", label: "Model", default: "kling-v1.5-kolors", options: [
      { value: "kling-v1.5-kolors", label: "Kling Kolors VTON 1.5" },
    ] },
    { key: "syncMode", label: "Wait for result", type: "toggle", default: true, help: "Return the completed try-on in the same request." },
  ],
  settingsHelp: "Only controls actually supported by this production VTON model are shown.",
  footerNote: "Cyan workspace • Kling Kolors Virtual Try-On v1.5 • FAL key stays server-side",
  cta: "TRY ON GARMENT",
};

export default function Page() { return <StudioShell config={config} />; }
