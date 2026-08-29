// The studios and tools run inside an iframe on everything-possible.com, where
// the ep_session cookie is third-party and gets dropped by Safari (and soon
// Chrome). EP therefore hands the token over in the URL once; we stash it and
// send it as a bearer header on every API call instead.
let epToken = '';

export function captureEpToken() {
  if (epToken) return epToken;
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  const supplied = url.searchParams.get('ep_token');
  if (supplied) {
    epToken = supplied;
    try { sessionStorage.setItem('ep_token', supplied); } catch {}
    url.searchParams.delete('ep_token');
    window.history.replaceState({}, '', url.toString());
    return epToken;
  }
  try { epToken = sessionStorage.getItem('ep_token') || ''; } catch {}
  return epToken;
}

export function epHeaders(extra = {}) {
  const token = captureEpToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}
