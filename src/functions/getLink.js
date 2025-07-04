function corsHeaders(origin = '*') {
  const allowedOrigins = [
    "https://vestinoo-project.vercel.app",
    "https://tauraronwasa.pages.dev"
  ];

  const allow = allowedOrigins.includes(origin) ? origin : '*';

  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

// Polyfill atob
function atob(input) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(input, 'base64').toString('binary');
  }
  return globalThis.atob(input);
}

// Upload helpers
async function uploadToCatbox(blob, filename) {
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', blob, filename);

  const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form });
  const text = await res.text();
  if (text.startsWith('http')) return text;
  throw new Error('Catbox failed');
}
async function uploadToAnonfiles(blob, filename) {
  const form = new FormData();
  form.append('file', blob, filename);

  const res = await fetch('https://api.anonfiles.com/upload', { method: 'POST', body: form });
  const data = await res.json();
  if (data.status && data.data?.file?.url?.full) return data.data.file.url.full;
  throw new Error('Anonfiles failed');
}
async function uploadToPixeldrain(blob, filename) {
  const form = new FormData();
  form.append('file', blob, filename);

  const res = await fetch('https://pixeldrain.com/api/file', { method: 'PUT', body: form });
  const data = await res.json();
  if (data.success && data.id) return `https://pixeldrain.com/u/${data.id}`;
  throw new Error('Pixeldrain failed');
}

// Export handler
export async function handleGetLink(request) {
  const origin = request.headers.get('origin') || '*';

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin)
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Only POST allowed' }), {
      status: 405,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }
    });
  }

  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    return new Response(JSON.stringify({ success: false, error: 'Expected application/json' }), {
      status: 400,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }
    });
  }

  const { filename, mimetype, data } = body;
  if (!filename || !mimetype || !data) {
    return new Response(JSON.stringify({ success: false, error: 'Missing fields' }), {
      status: 400,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }
    });
  }

  let blob;
  try {
    const bin = Uint8Array.from(atob(data), c => c.charCodeAt(0));
    blob = new Blob([bin], { type: mimetype });
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Base64 decode failed' }), {
      status: 400,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }
    });
  }

  try {
    const link = await uploadToCatbox(blob, filename)
      .catch(() => uploadToAnonfiles(blob, filename))
      .catch(() => uploadToPixeldrain(blob, filename));

    return new Response(JSON.stringify({ success: true, link }), {
      status: 200,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }
    });
  }
}
