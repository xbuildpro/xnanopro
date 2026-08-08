import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 300;

const SAFE_REMIX = "Try a confident editorial treatment with tasteful coverage, clearly adult subjects, and premium fashion-photography styling.";

function cleanBase64(value = "") {
  return value.replace(/^data:[^;]+;base64,/, "");
}

async function generateOne(ai, input, aspectRatio, quality, index, total) {
  const interaction = await ai.interactions.create({
    model: "gemini-3.1-flash-image",
    input: [
      { type: "text", text: `${input[0].text} This is variation ${index + 1} of ${total}; make its pose, composition, outfit or setting meaningfully distinct while preserving the requested identity and visual continuity.` },
      ...input.slice(1),
    ],
    response_format: { type: "image", aspect_ratio: aspectRatio, image_size: quality },
  });
  const output = interaction.outputs?.find((item) => item.type === "image" && item.data);
  if (!output) throw new Error("NO_IMAGE");
  return { data: output.data, mimeType: output.mime_type || "image/png" };
}

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) return Response.json({ message: "The image engine needs its private Google API key connected once before the first generation." }, { status: 503 });

    const body = await request.json();
    const count = Math.min(10, Math.max(1, Number(body.count) || 1));
    const prompt = String(body.prompt || "").trim();
    if (!prompt) return Response.json({ message: "Add a short description of the result you want." }, { status: 400 });

    const images = Array.isArray(body.images) ? body.images.slice(0, 5) : [];
    if (images.length && body.rightsConfirmed !== true) {
      return Response.json({ message: "Confirm that you own the photos or have permission to use them and send them to Google AI for processing." }, { status: 400 });
    }
    const input = [{ type: "text", text: prompt }, ...images.map((image) => ({ type: "image", data: cleanBase64(image.data), mime_type: image.mimeType || "image/jpeg" }))];
    const ai = new GoogleGenAI({ apiKey });
    const results = [];

    for (let start = 0; start < count; start += 2) {
      const batch = Array.from({ length: Math.min(2, count - start) }, (_, offset) => generateOne(ai, input, body.aspectRatio || "4:5", body.quality || "1K", start + offset, count));
      const settled = await Promise.allSettled(batch);
      for (const item of settled) if (item.status === "fulfilled") results.push(item.value);
    }

    if (!results.length) return Response.json({ message: `This direction needs a small adjustment. ${SAFE_REMIX}` }, { status: 422 });
    return Response.json({ images: results });
  } catch (error) {
    console.error("XNanoPro generation error", error);
    const message = String(error?.message || "");
    if (/quota|rate|429/i.test(message)) return Response.json({ message: "The studio is busy for a moment. Your setup is saved—try again shortly." }, { status: 429 });
    if (/safety|blocked|policy|NO_IMAGE/i.test(message)) return Response.json({ message: `That exact direction needs a small adjustment. ${SAFE_REMIX}` }, { status: 422 });
    return Response.json({ message: "The engine hit a temporary snag. Your setup is saved—try again." }, { status: 500 });
  }
}
