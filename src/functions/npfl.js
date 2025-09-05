
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
        // URLs na API guda 3
        const NPFL_FIXTURES_API = "https://raw.githubusercontent.com/abubakarmuhd/npfl-json/main/fixtures.json";
        const NPFL_TABLE_API = "https://raw.githubusercontent.com/abubakarmuhd/npfl-json/main/table.json";
        const NPFL_SCORERS_API = "https://raw.githubusercontent.com/abubakarmuhd/npfl-json/main/scorers.json";

      
        const [fixturesResponse, tableResponse, scorersResponse] = await Promise.all([
            fetch(NPFL_FIXTURES_API),
            fetch(NPFL_TABLE_API),
            fetch(NPFL_SCORERS_API)
        ]);

        // Bincika idan duk amsoshin sun dawo daidai
        const fixturesData = fixturesResponse.ok ? await fixturesResponse.json() : null;
        const tableData = tableResponse.ok ? await tableResponse.json() : null;
        const scorersData = scorersResponse.ok ? await scorersResponse.json() : null;
        
        // Haɗa dukkan bayanai a cikin amsa guda ɗaya
        const finalData = {
            fixtures: fixturesData?.fixtures || fixturesData || [],
            table: tableData?.table || tableData || [],
            scorers: scorersData?.scorers || scorersData || []
        };
        
        return new Response(JSON.stringify(finalData), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    } catch (e) {
        return new Response(JSON.stringify({
            error: true,
            message: 'Server error while fetching NPFL data.',
            details: e.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}