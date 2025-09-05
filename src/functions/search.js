
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const { headers } = request;
    const WORKER_API_KEY = headers.get('x-api-key');
    const contentType = headers.get("content-type") || "";

    // Tabbatar da API Key
    if (WORKER_API_KEY !== '@haruna66') {
        return new Response(JSON.stringify({ error: true, message: 'Invalid API Key' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    if (request.method !== "POST" || !contentType.includes("application/json")) {
        return new Response('Invalid Request Method or Content-Type', { status: 400 });
    }

    try {
        const requestBody = await request.json();
        const { query } = requestBody;

        // API Keys (sanya su a nan)
        const FOOTBALL_API_TOKEN = 'b75541b8a8cc43719195871aa2bd419e';
        const TRANSLATE_API_KEY = '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';
        const TRANSLATE_API_URL = "https://openrouter.ai/api/v1/chat/completions";

        const translateText = async (text) => {
            if (!text) return "";
            try {
                const translateRes = await fetch(TRANSLATE_API_URL, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${TRANSLATE_API_KEY}`, "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: "openai/gpt-4o",
                        messages: [{ role: "user", content: `Ka fassara wannan zuwa hausa, wadda kowa zai gane ba tare da kowa ya gane ka fassara ba. Kada ka rubuta wani jawabi ko misali ko tambaya, ka dawo da fassara kawai. ${text}` }]
                    })
                });
                const translateData = await translateRes.json();
                return translateData?.choices?.[0]?.message?.content || text;
            } catch (e) {
                console.error("Translation failed:", e);
                return text; 
            }
        };

        const searchFootballData = async (query) => {
            const knownComps = {
                "champions league": "CL", "premier league": "PL", "laliga": "PD",
                "serie a": "SA", "bundesliga": "BL1", "eredivisie": "DED",
                "europa league": "EL", "fa cup": "FAC", "npfl": ""
            };
            for (const name in knownComps) {
                if (query.includes(name)) {
                    if (knownComps[name]) {
                        const url = `https://api.football-data.org/v4/competitions/${knownComps[name]}/matches`;
                        const res = await fetch(url, { headers: { 'X-Auth-Token': FOOTBALL_API_TOKEN } });
                        if (res.ok) {
                            const data = await res.json();
                            return { type: "competition_matches", data, code: knownComps[name], name };
                        }
                    }
                }
            }
            if (["today", "yau", "yau aka buga", "today's matches", "wasannin yau"].some(t => query.includes(t))) {
                const res = await fetch("https://api.football-data.org/v4/matches", { headers: { 'X-Auth-Token': FOOTBALL_API_TOKEN } });
                if (res.ok) {
                    const data = await res.json();
                    return { type: "today_matches", data };
                }
            }
            const teamMap = {
                "real madrid": 86, "barcelona": 81, "arsenal": 57, "chelsea": 61, "manchester united": 66,
                "juventus": 109, "inter": 108, "ac milan": 98, "liverpool": 64
            };
            for (const k in teamMap) {
                if (query === k) {
                    const url = `https://api.football-data.org/v4/teams/${teamMap[k]}/matches?status=SCHEDULED`;
                    const res = await fetch(url, { headers: { 'X-Auth-Token': FOOTBALL_API_TOKEN } });
                    if (res.ok) {
                        const data = await res.json();
                        return { type: "team_matches", data, team: k };
                    }
                }
            }
            if (query.includes("buffon") || query === "gigi buffon") {
                const url = "https://api.football-data.org/v4/persons/2019/matches?status=FINISHED";
                const res = await fetch(url, { headers: { 'X-Auth-Token': FOOTBALL_API_TOKEN } });
                if (res.ok) {
                    const data = await res.json();
                    return { type: "player_matches", data, player: "Gigi Buffon" };
                }
            }
            if (["table", "tebur", "standings"].some(t => query.includes(t))) {
                const url = "https://api.football-data.org/v4/competitions/DED/standings";
                const res = await fetch(url, { headers: { 'X-Auth-Token': FOOTBALL_API_TOKEN } });
                if (res.ok) {
                    const data = await res.json();
                    return { type: "standings", data, league: "Eredivisie" };
                }
            }
            if (["top 10", "masu kwallo", "scorers"].some(t => query.includes(t))) {
                const url = "https://api.football-data.org/v4/competitions/SA/scorers?limit=10";
                const res = await fetch(url, { headers: { 'X-Auth-Token': FOOTBALL_API_TOKEN } });
                if (res.ok) {
                    const data = await res.json();
                    return { type: "scorers", data, league: "Serie A" };
                }
            }
            return null;
        };

        const fallbackSearch = async (query) => {
            const NEWS_API = "https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?t=";
            const PLAYER_API = "https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=";
            
            const teamRes = await fetch(NEWS_API + encodeURIComponent(query));
            const teamData = await teamRes.json();
            if (teamData.teams?.length) {
                const teamsWithTranslations = await Promise.all(
                    teamData.teams.map(async team => {
                        if (team.strDescriptionEN) {
                            team.strDescriptionHA = await translateText(team.strDescriptionEN);
                        }
                        return team;
                    })
                );
                return { type: "team", teams: teamsWithTranslations };
            }

            const playerRes = await fetch(PLAYER_API + encodeURIComponent(query));
            const playerData = await playerRes.json();
            if (playerData.player?.length) {
                const playersWithTranslations = await Promise.all(
                    playerData.player.map(async player => {
                        if (player.strDescriptionEN) {
                            player.strDescriptionHA = await translateText(player.strDescriptionEN);
                        }
                        return player;
                    })
                );
                return { type: "player", players: playersWithTranslations };
            }

            return { type: "none" };
        };

        let result = await searchFootballData(query.toLowerCase());
        if (!result) {
            result = await fallbackSearch(query);
        }

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (e) {
        return new Response(JSON.stringify({
            error: true,
            message: 'Server error while processing search.',
            details: e.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}