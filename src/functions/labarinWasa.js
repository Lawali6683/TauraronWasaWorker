
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const { headers } = request;
    const WORKER_API_KEY = headers.get('x-api-key');
    const contentType = headers.get("content-type") || "";
    
    // Sanya key din da kake bukata anan
    if (WORKER_API_KEY !== '@haruna66') {
        return new Response(JSON.stringify({ error: true, message: 'Invalid API Key' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    if (request.method !== "POST" || !contentType.includes("application/json")) {
        return new Response('Invalid Request Method or Content-Type', { status: 400 });
    }

    try {
        const requestBody = await request.json();
        const { matchId, homeTeamName, awayTeamName, date } = requestBody;
        let matchDetails;
        
        // Sanya Football API Token anan
        const FOOTBALL_API_TOKEN = 'b75541b8a8cc43719195871aa2bd419e';
        
        if (matchId) {
            const res = await fetch(`https://api.football-data.org/v4/matches/${matchId}`, { headers: { "X-Auth-Token": FOOTBALL_API_TOKEN } });
            if (res.ok) { matchDetails = await res.json(); }
        }
        
        if (!matchDetails && homeTeamName && awayTeamName && date) {
            const res = await fetch(`https://api.football-data.org/v4/matches?dateFrom=${date}&dateTo=${date}`, { headers: { "X-Auth-Token": FOOTBALL_API_TOKEN } });
            if (res.ok) {
                const data = await res.json();
                matchDetails = data.matches.find(m => m.homeTeam?.name?.toLowerCase() === homeTeamName.toLowerCase() && m.awayTeam?.name?.toLowerCase() === awayTeamName.toLowerCase());
            }
        }
        
        if (!matchDetails) {
            return new Response(JSON.stringify({ error: true, message: "Ba'a samu bayanin wasan ba." }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }
        
        // Wannan translation API key ne, zaka iya boye shi a environment variables idan kana so
        const TRANSLATE_API_KEY = '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';
        const TRANSLATE_API_URL = "https://openrouter.ai/api/v1/chat/completions";
        const { homeTeam, awayTeam, score, status, utcDate, venue, competition, matchday } = matchDetails;
        let shortDetails = "";
        
        if (status === "FINISHED") { shortDetails += `Wannan wasa ya kare. Sakamako na karshe: ${score.fullTime.home} zuwa ${score.fullTime.away}.`; }
        else if (status === "IN_PLAY") { shortDetails += "Wasan yana gudana a yanzu."; }
        else if (status === "SCHEDULED") { shortDetails += "Wasan bai fara ba tukuna."; }
        shortDetails += ` ${homeTeam.name} da ${awayTeam.name}.`;
        if (venue) shortDetails += ` Wuri: ${venue}.`;
        if (competition?.name) shortDetails += ` Gasar: ${competition.name}.`;
        if (matchday) shortDetails += ` Kwanan Wasa: ${matchday}.`;

        const translateRes = await fetch(TRANSLATE_API_URL, {
            method: "POST",
            headers: { Authorization: `Bearer ${TRANSLATE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "openai/gpt-4o",
                messages: [{ role: "user", content: `Ka fassara wannan zuwa hausa, wadda kowa zai gane ba tare da kowa ya gane ka fassara ba. Kada ka rubuta wani jawabi ko misali ko tambaya, ka dawo da fassara kawai. ${shortDetails}` }]
            })
        });

        let hausaTranslation = null;
        if (translateRes.ok) {
            const out = await translateRes.json();
            hausaTranslation = out.choices?.[0]?.message?.content?.trim() || "";
        }
        
        const finalData = { ...matchDetails, hausaDetails: hausaTranslation };
        return new Response(JSON.stringify(finalData), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    } catch (e) {
        return new Response(JSON.stringify({ error: true, message: 'Server error while fetching match details.', details: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}