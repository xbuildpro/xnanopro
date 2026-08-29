import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 300;

function cleanBase64(value = "") {
  return value.replace(/^data:[^;]+;base64,/, "");
}

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) return Response.json({ message: "Connect the private Google API key once to turn on campaign videos." }, { status: 503 });

    const body = await request.json();
    const images = Array.isArray(body.images) ? body.images.slice(0, 3) : [];
    if (!images.length) return Response.json({ message: "Add one to three strong reference photos for the video." }, { status: 400 });
    if (body.rightsConfirmed !== true) return Response.json({ message: "Confirm you own the photos or have permission to use them and send them to Google AI." }, { status: 400 });

    // Pin the credential mode. @google/genai reads GOOGLE_GENAI_USE_VERTEXAI
    // from the environment when this is left unset, and that flag is set on
    // the deployment — which sent these API-key calls down the Vertex path,
    // where the Veo model 404s and the OIDC audience is rejected.
    const ai = new GoogleGenAI({ apiKey, vertexai: false });
    let operation = await ai.models.generateVideos({
      model: "veo-3.1-generate-preview",
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
    const videoResponse = await fetch(uri, { headers: { "x-goog-api-key": apiKey } });
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
