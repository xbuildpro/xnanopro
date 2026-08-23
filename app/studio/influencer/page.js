import StudioShell from "../StudioShell";

export const metadata = { title: "Influencer Studio — XImage Pro" };

const config = {
  slug: "influencer-studio",
  path: "/studio/influencer",
  accent: "pink",
  kicker: "IDENTITY + CAMPAIGN",
  title: "Influencer Studio",
  description: "Build coordinated image sets around one consistent fictional adult influencer or approved subject.",
  modelLabel: "Gemini 3.1 Image",
  glyph: "♥",
  endpoint: "/api/generate",
  defaultCount: 6,
  defaultAspect: "4:5",
  promptPlaceholder: "Luxury resort campaign, confident poses, three outfits, warm sunset light, consistent face and identity…",
  uploadGroups: [
    { key: "identity", label: "Identity reference", copy: "Optional main face/identity reference. Use only people you own or have permission to use.", max: 1, multiple: false, button: "Add identity image" },
    { key: "style", label: "Style references", copy: "Optional outfit, location, makeup or visual-style references.", max: 5, button: "Add style references" },
  ],
  fields: [
    { key: "aspectRatio", label: "Aspect ratio", default: "4:5", options: ["1:1","4:5","3:4","9:16","16:9"] },
    { key: "resolution", label: "Resolution", default: "1K", options: ["1K","2K","4K"] },
    { key: "count", label: "Images", default: "6", options: ["1","2","4","6","10"] },
    { key: "finish", label: "Finish", default: "Social-media glossy", options: ["Natural and believable","Polished editorial","Luxury campaign","Cinematic nightlife","Social-media glossy","Bold flash photography"] },
    { key: "identityStrength", label: "Identity consistency", default: "High", options: ["Natural","High","Very high"] },
    { key: "variation", label: "Variation", default: "Balanced", options: ["Tight","Balanced","Wide"] },
  ],
  buildPrompt(values) {
    return `Create a coordinated campaign featuring the same clearly adult fictional or authorized influencer. Keep face and identity consistent across every result. Creative direction: ${values.prompt}. Finish: ${values.finish}. Identity consistency: ${values.identityStrength}. Variation: ${values.variation}. Use varied poses, camera angles, outfits and locations while maintaining believable anatomy and premium photography.`;
  },
  footerNote: "Pink accent workspace • coordinated identity sets • server-side generation",
  cta: "CREATE CAMPAIGN",
};

export default function Page() { return <StudioShell config={config} />; }
