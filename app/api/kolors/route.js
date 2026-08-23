export const runtime = "nodejs";
export const maxDuration = 300;

const ENDPOINT = "https://fal.run/fal-ai/kolors";
const SCHEDULERS = new Set([
  "EulerDiscreteScheduler",
  "EulerAncestralDiscreteScheduler",
  "DPMSolverMultistepScheduler",
  "DPMSolverMultistepScheduler_SDE_karras",
  "UniPCMultistepScheduler",
  "DEISMultistepScheduler",
]);
const IMAGE_SIZES = new Set([
  "square_hd",
  "square",
  "portrait_4_3",
  "portrait_16_9",
  "landscape_4_3",
  "landscape_16_9",
]);

function numberOrUndefined(value) {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function POST(request) {
  try {
    const key = process.env.FAL_KEY;
    if (!key) {
      return Response.json(
        { message: "Kolors is ready, but the private FAL_KEY still needs to be added to this Vercel project." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const prompt = String(body.prompt || "").trim();
    if (!prompt) return Response.json({ message: "Add a prompt first." }, { status: 400 });

    const seed = numberOrUndefined(body.seed);
    const steps = Math.min(50, Math.max(1, numberOrUndefined(body.steps) ?? 50));
    const guidance = Math.min(20, Math.max(0, numberOrUndefined(body.guidanceScale) ?? 5));
    const numImages = Math.min(4, Math.max(1, Math.round(numberOrUndefined(body.numImages) ?? 1)));
    const scheduler = SCHEDULERS.has(body.scheduler) ? body.scheduler : "EulerDiscreteScheduler";

    let imageSize = IMAGE_SIZES.has(body.imageSize) ? body.imageSize : "square_hd";
    if (body.imageSize === "custom") {
      const width = Math.min(2048, Math.max(256, Math.round(numberOrUndefined(body.customWidth) ?? 1024)));
      const height = Math.min(2048, Math.max(256, Math.round(numberOrUndefined(body.customHeight) ?? 1024)));
      imageSize = { width, height };
    }

    const input = {
      prompt,
      negative_prompt: String(body.negativePrompt || ""),
      guidance_scale: guidance,
      num_inference_steps: steps,
      enable_safety_checker: body.enableSafetyChecker !== false,
      num_images: numImages,
      image_size: imageSize,
      scheduler,
      output_format: body.outputFormat === "jpeg" ? "jpeg" : "png",
      sync_mode: body.syncMode !== false,
    };
    if (seed !== undefined) input.seed = Math.max(0, Math.round(seed));

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Key ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Kolors fal error", response.status, data);
      return Response.json(
        { message: data?.detail || data?.message || `Kolors request failed (${response.status}).` },
        { status: response.status }
      );
    }

    return Response.json({
      images: Array.isArray(data.images) ? data.images : [],
      seed: data.seed,
      timings: data.timings,
      hasNsfwConcepts: data.has_nsfw_concepts,
    });
  } catch (error) {
    console.error("Kolors route error", error);
    return Response.json({ message: "Kolors hit a temporary server error. Try again." }, { status: 500 });
  }
}
