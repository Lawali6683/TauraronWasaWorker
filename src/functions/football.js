export default {
    async fetch(request, env) {
        const {
            pathname
        } = new URL(request.url);

        // API keys da aka sanya kai tsaye a cikin code
        const allowedKey = '@haruna66';
        const footballToken = 'b75541b8a8cc43719195871aa2bd419e';

        const apiKey = request.headers.get('x-api-key');

        // Bincika idan request ya zo daga shafin da aka amince da shi
        if (apiKey !== allowedKey) {
            return new Response(JSON.stringify({
                error: "Unauthorized access"
            }), {
                status: 401,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        if (request.method !== "POST") {
            return new Response(JSON.stringify({
                error: "Method Not Allowed"
            }), {
                status: 405,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        // --- Football API Handler ---
        if (pathname === '/football-results') {
            try {
                const {
                    date,
                    game1Name,
                    game2Name
                } = await request.json();

                if (!date || !game1Name || !game2Name) {
                    return new Response(JSON.stringify({
                        error: "Missing required parameters"
                    }), {
                        status: 400,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                }

                const footballApiUrl = `https://api.football-data.org/v4/matches?dateFrom=${date}&dateTo=${date}`;

                const response = await fetch(footballApiUrl, {
                    headers: {
                        'X-Auth-Token': footballToken
                    }
                });

                if (!response.ok) {
                    console.error("Error from Football API:", response.status, await response.text());
                    return new Response(JSON.stringify({
                        error: "Failed to fetch football data from external API"
                    }), {
                        status: 502,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                }

                const data = await response.json();
                const match = data.matches.find(match =>
                    (match.homeTeam.name === game1Name && match.awayTeam.name === game2Name) ||
                    (match.homeTeam.name === game2Name && match.awayTeam.name === game1Name)
                );

                if (match && match.status === 'FINISHED') {
                    const homeScore = match.score.fullTime.home;
                    const awayScore = match.score.fullTime.away;
                    return new Response(JSON.stringify({
                        homeScore,
                        awayScore
                    }), {
                        status: 200,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                }

                return new Response(JSON.stringify({
                    error: "Match not found or not finished"
                }), {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

            } catch (error) {
                console.error("Error in football-results worker:", error);
                return new Response(JSON.stringify({
                    error: "Internal server error"
                }), {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            }
        }

        // --- Sarki Comment Handler ---
        if (pathname === '/sarkiCommet.js') {
            try {
                const payload = await request.json();
                const vercelUrl = 'https://tauraron-wasa-admin.vercel.app/api/sarki';
                const vercelApiKey = '@haruna66'; // Ka bar wannan kamar yadda yake

                const vercelResponse = await fetch(vercelUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': vercelApiKey
                    },
                    body: JSON.stringify(payload)
                });

                if (vercelResponse.ok) {
                    const result = await vercelResponse.json();
                    return new Response(JSON.stringify(result), {
                        status: 200,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                } else {
                    const errorText = await vercelResponse.text();
                    return new Response(JSON.stringify({
                        error: `Vercel API returned status ${vercelResponse.status}: ${errorText}`
                    }), {
                        status: vercelResponse.status,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                }
            } catch (error) {
                console.error("Error in sarkiCommet.js worker:", error);
                return new Response(JSON.stringify({
                    error: "Internal Server Error"
                }), {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            }
        }

        // --- User Notification Handler ---
        if (pathname === '/userNotification') {
            try {
                const payload = await request.json();
                console.log("Notification payload received:", payload);
                return new Response("Notification request received successfully.", {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            } catch (error) {
                console.error("Error in userNotification worker:", error);
                return new Response(JSON.stringify({
                    error: "Internal Server Error"
                }), {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            }
        }

        return new Response('Not Found', {
            status: 404,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};
