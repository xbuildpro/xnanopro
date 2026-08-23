import StudioShell from "../StudioShell";

export const metadata = { title: "Kolors 1.5 — XImage Pro" };

const config = {
  slug: "kolors-1-5",
  path: "/studio/kolors",
  accent: "yellow",
  kicker: "KOLORS 1.5",
  title: "Kolors 1.5",
  description: "Prompt-first photoreal image generation with the full supported fal.ai control set exposed without sliders.",
  modelLabel: "Kolors",
  glyph: "▣",
  endpoint: "/api/kolors",
  negativePrompt: true,
  defaultPrompt: "A studio portrait with premium editorial lighting, detailed skin, clean background, 85mm photography",
  defaultNegativePrompt: "blurry, extra fingers, watermark, low resolution, distorted anatomy",
  promptPlaceholder: "Describe the image, subject, lighting, camera, environment and finish…",
  uploadGroups: [],
  fields: [
    { key: "imageSize", label: "Image size", default: "portrait_16_9", options: [
      { value: "square_hd", label: "Square HD" },
      { value: "square", label: "Square" },
      { value: "portrait_4_3", label: "Portrait 3:4" },
      { value: "portrait_16_9", label: "Portrait 9:16" },
      { value: "landscape_4_3", label: "Landscape 4:3" },
      { value: "landscape_16_9", label: "Landscape 16:9" },
      { value: "custom", label: "Custom dimensions" },
    ] },
    { key: "numImages", label: "Images", default: "1", options: ["1","2","3","4"] },
    { key: "customWidth", label: "Custom width", type: "number", default: "1024", min: 256, max: 2048, step: 8, help: "Used only when Image size = Custom dimensions." },
    { key: "customHeight", label: "Custom height", type: "number", default: "1024", min: 256, max: 2048, step: 8, help: "Used only when Image size = Custom dimensions." },
    { key: "steps", label: "Inference steps", type: "number", default: "50", min: 1, max: 50, step: 1 },
    { key: "guidanceScale", label: "Guidance scale (CFG)", type: "number", default: "5", min: 0, max: 20, step: 0.5 },
    { key: "scheduler", label: "Scheduler", default: "EulerDiscreteScheduler", options: [
      "EulerDiscreteScheduler",
      "EulerAncestralDiscreteScheduler",
      "DPMSolverMultistepScheduler",
      "DPMSolverMultistepScheduler_SDE_karras",
      "UniPCMultistepScheduler",
      "DEISMultistepScheduler",
    ] },
    { key: "seed", label: "Seed", type: "number", default: "", min: 0, step: 1, help: "Leave blank for a random seed." },
    { key: "outputFormat", label: "Output format", default: "png", options: ["png","jpeg"] },
    { key: "enableSafetyChecker", label: "Safety checker", type: "toggle", default: true, help: "fal.ai may require account authorization before this can be disabled." },
    { key: "syncMode", label: "Wait for result", type: "toggle", default: true, help: "Return completed output in the same request." },
  ],
  footerNote: "Yellow workspace • full supported Kolors controls • FAL key stays server-side",
  cta: "GENERATE IMAGE",
};

export default function Page() { return <StudioShell config={config} />; }
