export default {
  async fetch(request, env, ctx) {
    // CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Only POST allowed' }), {
        status: 405,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      });
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({ success: false, error: 'Expected application/json Content-Type' }), {
        status: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      });
    }

    const { id, type, filename, mimetype, data } = body;

    if (!id || !type || !filename || !mimetype || !data) {
      return new Response(JSON.stringify({ success: false, error: 'Missing one or more required fields: id, type, filename, mimetype, data' }), {
        status: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      });
    }

    let fileBlob;
    try {
      // Convert base64 to Uint8Array
      const binary = Uint8Array.from(atob(data), c => c.charCodeAt(0));
      fileBlob = new Blob([binary], { type: mimetype });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: 'Failed to decode base64 data' }), {
        status: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      });
    }

    try {
      let link = null;
      // Upload to Catbox, Anonfiles, then Pixeldrain
      link = await uploadToCatbox(fileBlob, filename)
        .catch(() => uploadToAnonfiles(fileBlob, filename))
        .catch(() => uploadToPixeldrain(fileBlob, filename));

      if (link) {
        return new Response(JSON.stringify({ success: true, link }), {
          status: 200,
          headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify({ success: false, error: 'All upload services failed' }), {
          status: 500,
          headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
        });
      }
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: 'Error: ' + (err.message || err) }), {
        status: 500,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      });
    }
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

async function uploadToCatbox(fileBlob, filename) {
  const body = new FormData();
  body.append('reqtype', 'fileupload');
  body.append('fileToUpload', fileBlob, filename);

  const res = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body,
  });
  const text = await res.text();
  if (text.startsWith('http')) return text;
  throw new Error('Catbox failed');
}

async function uploadToAnonfiles(fileBlob, filename) {
  const body = new FormData();
  body.append('file', fileBlob, filename);

  const res = await fetch('https://api.anonfiles.com/upload', {
    method: 'POST',
    body,
  });
  const data = await res.json();
  if (data.status && data.data?.file?.url?.full) return data.data.file.url.full;
  throw new Error('Anonfiles failed');
}

async function uploadToPixeldrain(fileBlob, filename) {
  const body = new FormData();
  body.append('file', fileBlob, filename);

  const res = await fetch('https://pixeldrain.com/api/file', {
    method: 'PUT',
    body,
  });
  const data = await res.json();
  if (data.success && data.id) return `https://pixeldrain.com/u/${data.id}`;
  throw new Error('Pixeldrain failed');
}

// Cloudflare Workers do NOT support atob/btoa by default, so add a polyfill:
function atob(input) {
  // Polyfill for atob in Cloudflare Workers
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input, "base64").toString("binary");
  }
  // Fallback for browsers/environments with atob
  return globalThis.atob(input);
}
