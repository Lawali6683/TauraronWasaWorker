
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const { headers } = request;
    const WORKER_API_KEY = headers.get('x-api-key');
    const contentType = headers.get("content-type") || "";

    // Tabbatar cewa an tura request da API key daidai
    if (WORKER_API_KEY !== '@haruna66') {
        return new Response(JSON.stringify({ error: true, message: 'Invalid API Key' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    if (request.method !== "POST" || !contentType.includes("application/json")) {
        return new Response('Invalid Request Method or Content-Type', { status: 400 });
    }

    try {
        const requestBody = await request.json();
        const { matchday } = requestBody;

        // Sanya Football API Token anan
        const FOOTBALL_API_TOKEN = 'b75541b8a8cc43719195871aa2bd419e';
        const PL_CODE = "PL";

        // URLs na API guda 3
        const PL_MATCHES_URL = `https://api.football-data.org/v4/competitions/${PL_CODE}/matches?matchday=${matchday}`;
        const PL_TABLE_URL = `https://api.football-data.org/v4/competitions/${PL_CODE}/standings`;
        const PL_SCORERS_URL = `https://api.football-data.org/v4/competitions/${PL_CODE}/scorers?limit=10`;

        
        const [matchesResponse, tableResponse, scorersResponse] = await Promise.all([
            fetch(PL_MATCHES_URL, { headers: { 'X-Auth-Token': FOOTBALL_API_TOKEN } }),
            fetch(PL_TABLE_URL, { headers: { 'X-Auth-Token': FOOTBALL_API_TOKEN } }),
            fetch(PL_SCORERS_URL, { headers: { 'X-Auth-Token': FOOTBALL_API_TOKEN } })
        ]);

        // Bincika idan duk amsoshin sun dawo daidai
        const matchesData = matchesResponse.ok ? await matchesResponse.json() : null;
        const tableData = tableResponse.ok ? await tableResponse.json() : null;
        const scorersData = scorersResponse.ok ? await scorersResponse.json() : null;
        
        // Haɗa dukkan bayanai a cikin amsa guda ɗaya
        const finalData = {
            matches: matchesData?.matches || [],
            leagueTable: tableData?.standings?.[0]?.table || [],
            scorers: scorersData?.scorers || []
        };
        
        return new Response(JSON.stringify(finalData), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    } catch (e) {
        return new Response(JSON.stringify({
            error: true,
            message: 'Server error while fetching all data.',
            details: e.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}