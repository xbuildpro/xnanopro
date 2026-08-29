import { GoogleGenAI } from "@google/genai";

// Everything here is resolved inside the function body on purpose. The previous
// wiring built the workload-identity audience at module scope, which is what
// threw "Cannot access 'u' before initialization" on every /api/video request
// and, before that, "Invalid value for audience". Lazy initialisation makes that
// class of ordering bug impossible.
export async function createGoogleClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const useVertex = String(process.env.GOOGLE_GENAI_USE_VERTEXAI || "").toLowerCase() === "true";

  if (!useVertex) {
    if (!apiKey) return null;
    return {
      ai: new GoogleGenAI({ apiKey, vertexai: false }),
      downloadHeaders: async () => ({ "x-goog-api-key": apiKey }),
    };
  }

  const project = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
  const projectNumber = process.env.GCP_PROJECT_NUMBER;
  const poolId = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID;
  const providerId = process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID;
  const serviceAccount = process.env.GCP_SERVICE_ACCOUNT_EMAIL;

  if (!project || !projectNumber || !poolId || !providerId || !serviceAccount) return null;

  const { getVercelOidcToken } = await import("@vercel/oidc");
  const { ExternalAccountClient } = await import("google-auth-library");

  const audience = `//iam.googleapis.com/projects/${projectNumber}`
    + `/locations/global/workloadIdentityPools/${poolId}`
    + `/providers/${providerId}`;

  const authClient = ExternalAccountClient.fromJSON({
    type: "external_account",
    audience,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url:
      `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccount}:generateAccessToken`,
    subject_token_supplier: { getSubjectToken: getVercelOidcToken },
  });

  return {
    ai: new GoogleGenAI({ vertexai: true, project, location, googleAuthOptions: { authClient } }),
    // Vertex signs the generated-video download with the same impersonated
    // service account; there is no API key to fall back on.
    downloadHeaders: async () => {
      const token = await authClient.getAccessToken();
      return { Authorization: `Bearer ${token?.token || token}` };
    },
  };
}
