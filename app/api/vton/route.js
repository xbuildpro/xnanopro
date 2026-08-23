export const runtime = "nodejs";
export const maxDuration = 300;

const ENDPOINT = "https://fal.run/fal-ai/kling/v1-5/kolors-virtual-try-on";

function asDataUri(image) {
  if (!image) return "";
  if (image.dataUrl) return image.dataUrl;
  if (image.data) return `data:${image.mimeType || "image/jpeg"};base64,${image.data}`;
  return "";
}

export async function POST(request) {
  try {
    const key = process.env.FAL_KEY;
    if (!key) {
      return Response.json(
        { message: "VTON is ready, but the private FAL_KEY still needs to be added to this Vercel project." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const person = body.groups?.person?.[0];
    const garment = body.groups?.garment?.[0];
    if (!person || !garment) {
      return Response.json({ message: "Add both a person image and a garment image." }, { status: 400 });
    }

    const humanImageUrl = asDataUri(person);
    const garmentImageUrl = asDataUri(garment);
    if (!humanImageUrl || !garmentImageUrl) {
      return Response.json({ message: "The person or garment image could not be prepared." }, { status: 400 });
    }

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Key ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        human_image_url: humanImageUrl,
        garment_image_url: garmentImageUrl,
        sync_mode: true,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("VTON fal error", response.status, data);
      return Response.json(
        { message: data?.detail || data?.message || `Virtual try-on failed (${response.status}).` },
        { status: response.status }
      );
    }

    if (!data.image?.url) {
      return Response.json({ message: "The try-on finished without an image. Try clearer person and garment photos." }, { status: 422 });
    }

    return Response.json({ image: data.image });
  } catch (error) {
    console.error("VTON route error", error);
    return Response.json({ message: "VTON hit a temporary server error. Try again." }, { status: 500 });
  }
}
