export const runtime = "nodejs";
export const maxDuration = 300;

const SUPABASE_URL = "https://jkewqiqkenjavtbgxuip.supabase.co";
const SUPABASE_KEY = "sb_publishable_ubS1IdiaCZPMV1vEm-zdlw_06Quiqfm";

function readBearer(header) {
  const value = String(header || "");
  return value.toLowerCase().startsWith("bearer ") ? value.slice(7).trim() : "";
}

function readCookie(header, name) {
  const cookies = String(header || "").split(";").map((part) => part.trim());
  const match = cookies.find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

async function getUser(token) {
  if (!token) return null;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return response.json();
}

function decodeDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) return null;
  return { mimeType: match[1], bytes: Buffer.from(match[2], "base64") };
}

function extensionFor(mimeType) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "video/mp4") return "mp4";
  return "png";
}

export async function POST(request) {
  try {
    // The studios run in an iframe on everything-possible.com, where ep_session
    // is a third-party cookie the browser drops. Middleware already accepts the
    // bearer token; this route has to as well or every save 401s and the user
    // is told "0 saved to your Gallery".
    const token = readBearer(request.headers.get("authorization"))
      || readCookie(request.headers.get("cookie"), "ep_session");
    const user = await getUser(token);
    if (!user?.id) return Response.json({ message: "Log in to save media." }, { status: 401 });

    const body = await request.json();
    const mediaType = body.mediaType === "video" ? "video" : "image";
    const tool = String(body.tool || "studio").replace(/[^a-z0-9_-]/gi, "-").toLowerCase();

    let mimeType = String(body.mimeType || (mediaType === "video" ? "video/mp4" : "image/png"));
    let bytes;

    if (body.dataUrl) {
      const decoded = decodeDataUrl(body.dataUrl);
      if (!decoded) return Response.json({ message: "The generated media could not be prepared for saving." }, { status: 400 });
      mimeType = decoded.mimeType || mimeType;
      bytes = decoded.bytes;
    } else if (body.sourceUrl) {
      const mediaResponse = await fetch(body.sourceUrl);
      if (!mediaResponse.ok) return Response.json({ message: "The generated media could not be downloaded for your gallery." }, { status: 502 });
      mimeType = mediaResponse.headers.get("content-type")?.split(";")[0] || mimeType;
      bytes = Buffer.from(await mediaResponse.arrayBuffer());
    } else {
      return Response.json({ message: "No generated media was supplied." }, { status: 400 });
    }

    const ext = extensionFor(mimeType);
    const random = crypto.randomUUID();
    const storagePath = `${user.id}/${tool}/${Date.now()}-${random}.${ext}`;
    const objectUrl = `${SUPABASE_URL}/storage/v1/object/user-media/${storagePath.split("/").map(encodeURIComponent).join("/")}`;

    const upload = await fetch(objectUrl, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type": mimeType,
        "x-upsert": "false",
      },
      body: bytes,
    });

    if (!upload.ok) {
      const detail = await upload.text().catch(() => "");
      console.error("Gallery storage upload failed", upload.status, detail);
      return Response.json({ message: "The result was created, but saving it to your gallery failed." }, { status: 502 });
    }

    const row = {
      user_id: user.id,
      storage_path: storagePath,
      media_type: mediaType,
      tool,
      mime_type: mimeType,
      prompt: String(body.prompt || "").slice(0, 10000) || null,
      metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
    };

    const insert = await fetch(`${SUPABASE_URL}/rest/v1/media_gallery`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(row),
    });

    if (!insert.ok) {
      const detail = await insert.text().catch(() => "");
      console.error("Gallery metadata insert failed", insert.status, detail);
      return Response.json({ message: "The file was saved, but its gallery record could not be created." }, { status: 502 });
    }

    const saved = await insert.json();
    return Response.json({ saved: saved?.[0] || row });
  } catch (error) {
    console.error("Gallery save error", error);
    return Response.json({ message: "The result was created, but gallery saving hit a temporary error." }, { status: 500 });
  }
}
