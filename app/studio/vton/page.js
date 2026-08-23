import StudioShell from "../StudioShell";

export const metadata = { title: "VTON Studio — XImage Pro" };

const config = {
  slug: "vton-studio",
  path: "/studio/vton",
  accent: "cyan",
  kicker: "VIRTUAL TRY-ON",
  title: "VTON Studio",
  description: "Person + garment virtual try-on with garment category, crop, preservation and output controls.",
  modelLabel: "IDM-VTON",
  glyph: "◇",
  endpoint: "/api/vton",
  requiresPrompt: false,
  showPrompt: false,
  uploadGroups: [
    { key: "person", label: "Person image", copy: "Use a clear full- or half-body photo with the clothing area visible.", max: 1, multiple: false, required: true, button: "Add person image" },
    { key: "garment", label: "Garment image", copy: "Use a clean product or worn-garment reference with the item clearly visible.", max: 1, multiple: false, required: true, button: "Add garment image" },
  ],
  fields: [
    { key: "category", label: "Garment category", default: "auto", options: [
      { value: "auto", label: "Auto detect" },
      { value: "upper_body", label: "Upper body" },
      { value: "lower_body", label: "Lower body" },
      { value: "dresses", label: "Dress / full body" },
    ] },
    { key: "garmentDescription", label: "Garment description", type: "textarea", span: 2, rows: 3, default: "", placeholder: "Black cropped leather jacket with silver zipper…", help: "Optional text description to help preserve the intended garment." },
    { key: "crop", label: "Auto crop person", type: "toggle", default: false, help: "Allow the model to crop/normalize the person image when useful." },
    { key: "preservePose", label: "Preserve pose", type: "toggle", default: true, help: "Prefer the original pose and body proportions." },
    { key: "preserveFace", label: "Preserve face / identity", type: "toggle", default: true, help: "Keep the subject recognizably the same." },
    { key: "seed", label: "Seed", type: "number", default: "", min: 0, step: 1, help: "Leave blank for random." },
    { key: "count", label: "Outputs", default: "1", options: ["1","2","4"] },
    { key: "outputFormat", label: "Output format", default: "png", options: ["png","jpeg"] },
  ],
  settingsHelp: "Expose the useful try-on controls without sliders.",
  footerNote: "Cyan workspace • person + garment workflow • backend key remains server-side",
  cta: "TRY ON GARMENT",
};

export default function Page() { return <StudioShell config={config} />; }
