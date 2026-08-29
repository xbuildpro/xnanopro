import { createGoogleClient } from "../../googleClient";

export const runtime = "nodejs";
export const maxDuration = 300;

// Taken from the working 3.0.1 build. The -preview ids were retired and 404 on
// Vertex for this project — "Publisher model .../veo-3.1-generate-preview was
// not found" — so requests are migrated to the current -001 GA ids.
const VIDEO_MODEL_MIGRATIONS = Object.freeze({
  "veo-3.1-fast-generate-preview": "veo-3.1-fast-generate-001",
  "veo-3.1-generate-preview": "veo-3.1-generate-001",
  "veo-3.1-lite-generate-preview": "veo-3.1-lite-generate-001",
});

const SUPPORTED_VIDEO_MODELS = new Set([
  "veo-3.1-lite-generate-001",
  "veo-3.1-fast-generate-001",
  "veo-3.1-generate-001",
]);

// Only these two accept a reference pack; lite is text/frame only.
const REFERENCE_VIDEO_MODELS = new Set([
  "veo-3.1-fast-generate-001",
  "veo-3.1-generate-001",
]);

function normalizeVideoModel(value) {
  const requested = String(value || "veo-3.1-fast-generate-001");
  const migrated = VIDEO_MODEL_MIGRATIONS[requested] || requested;
  if (!SUPPORTED_VIDEO_MODELS.has(migrated)) {
    throw new Error(`Unsupported Veo model: ${requested}. Choose a current Veo 3.1 model ending in -001.`);
  }
  return migrated;
}

function cleanBase64(value = "") {
  return value.replace(/^data:[^;]+;base64,/, "");
}

export async function POST(request) {
  try {
    const client = await createGoogleClient();
    if (!client) return Response.json({ message: "Connect the private Google credentials once to turn on campaign videos." }, { status: 503 });
    const { ai, downloadHeaders } = client;

    const body = await request.json();
    const images = Array.isArray(body.images) ? body.images.slice(0, 3) : [];
    if (!images.length) return Response.json({ message: "Add one to three strong reference photos for the video." }, { status: 400 });
    if (body.rightsConfirmed !== true) return Response.json({ message: "Confirm you own the photos or have permission to use them and send them to Google AI." }, { status: 400 });

    const model = normalizeVideoModel(body.model);
    if (images.length && !REFERENCE_VIDEO_MODELS.has(model)) {
      return Response.json({ message: "That model cannot use reference images. Choose Veo 3.1 or Veo 3.1 Fast." }, { status: 400 });
    }

    let operation = await ai.models.generateVideos({
      model,
      prompt: String(body.prompt || "Create a premium eight-second social campaign video with cinematic movement and sound."),
      config: {
        aspectRatio: body.aspectRatio === "16:9" ? "16:9" : "9:16",
        resolution: "720p",
        personGeneration: "allow_adult",
        referenceImages: images.map((image) => ({
          image: { imageBytes: cleanBase64(image.data), mimeType: image.mimeType || "image/jpeg" },
          referenceType: "asset",
        })),
      },
    });

    const deadline = Date.now() + 270000;
    while (!operation.done && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }
    if (!operation.done) return Response.json({ message: "The video is still rendering. Try again in a moment." }, { status: 504 });

    const generated = operation.response?.generatedVideos?.[0]?.video;
    const uri = generated?.uri;
    if (!uri) return Response.json({ message: "That direction needs a small adjustment. Try a simpler action or camera move." }, { status: 422 });
    const videoResponse = await fetch(uri, { headers: await downloadHeaders() });
    if (!videoResponse.ok || !videoResponse.body) return Response.json({ message: "The video rendered but could not be downloaded. Try again." }, { status: 502 });
    return new Response(videoResponse.body, { headers: { "Content-Type": "video/mp4", "Content-Disposition": "inline; filename=xnanopro-campaign.mp4" } });
  } catch (error) {
    console.error("XNanoPro video error", error);
    const message = String(error?.message || "");
    if (/quota|rate|429/i.test(message)) return Response.json({ message: "The video studio is busy. Your setup is saved—try again shortly." }, { status: 429 });
    if (/safety|blocked|policy/i.test(message)) return Response.json({ message: "Try a clearly adult commercial-fashion direction with natural movement and tasteful styling." }, { status: 422 });
    if (/not found|404/i.test(message)) return Response.json({ message: "The video model is unavailable for this account. Your setup is saved." }, { status: 502 });
    return Response.json({ message: "The video engine hit a temporary snag. Your setup is saved—try again.", detail: message.slice(0, 300) }, { status: 500 });
  }
}
