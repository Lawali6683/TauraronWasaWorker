function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function atob(input) {
  // Cloudflare Workers atob polyfill
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(input, 'base64').toString('binary');
  }
  return globalThis.atob(input);
}

async function uploadToCatbox(fileBlob, filename) {
  const body = new FormData();
  body.append('reqtype', 'fileupload');
  body.append('fileToUpload', fileBlob, filename);

  const res = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body
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
    body
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
    body
  });
  const data = await res.json();
  if (data.success && data.id) return `https://pixeldrain.com/u/${data.id}`;
  throw new Error('Pixeldrain failed');
}

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders()
    });
  }

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
    return new Response(JSON.stringify({ success: false, error: 'Missing one or more required fields' }), {
      status: 400,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
    });
  }

  let fileBlob;
  try {
    const binary = Uint8Array.from(atob(data), c => c.charCodeAt(0));
    fileBlob = new Blob([binary], { type: mimetype });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: 'Failed to decode base64' }), {
      status: 400,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
    });
  }

  try {
    let link = await uploadToCatbox(fileBlob, filename)
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
    return new Response(JSON.stringify({ success: false, error: err.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
    });
  }
}

export default {
  fetch: handleRequest
};
