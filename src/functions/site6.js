
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const { headers } = request;
    const WORKER_API_KEY = headers.get('x-api-key');
    const contentType = headers.get("content-type") || "";

    
    if (WORKER_API_KEY !== '@haruna66') {
        return new Response(JSON.stringify({ error: true, message: 'Invalid API Key' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    if (request.method !== "POST" || !contentType.includes("application/json")) {
        return new Response('Invalid Request Method or Content-Type', { status: 400 });
    }

    try {
        const requestBody = await request.json();
        const { dateFrom, dateTo } = requestBody;
        if (!dateFrom || !dateTo) {
            return new Response(JSON.stringify({ error: true, message: 'Missing date parameters' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        
       
        const FOOTBALL_API_TOKEN = 'b75541b8a8cc43719195871aa2bd419e';
        const API_URL = `https://api.football-data.org/v4/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
        
        const apiResponse = await fetch(API_URL, { headers: { 'X-Auth-Token': FOOTBALL_API_TOKEN } });
        const data = await apiResponse.json();
        
        if (!apiResponse.ok) {
            return new Response(JSON.stringify({ error: true, message: 'Failed to fetch data from Football API.', details: data.message }), { status: apiResponse.status, headers: { 'Content-Type': 'application/json' } });
        }
        
        return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    } catch (e) {
        return new Response(JSON.stringify({ error: true, message: 'Server error.', details: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}