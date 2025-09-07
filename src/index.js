import { handleGetLink } from "./functions/getLink.js";
import { handleNewGame } from "./functions/newgame.js";
import { handleFotbal } from "./functions/footbal.js";
import { handleChampions } from "./functions/champions.js";
import { handleEropa } from "./functions/eropa.js";
import { handleFa } from "./functions/fa.js";
import { handleFootball } from "./functions/football.js";
import { handleLabarinWasa } from "./functions/labarinWasa.js";
import { handleLaliga } from "./functions/laliga.js";
import { handleNpfl } from "./functions/npfl.js";
import { handlePremier } from "./functions/premier.js";
import { handleSearch } from "./functions/search.js";
import { handleSiriyaa } from "./functions/siriyaa.js";
import { handleSite6 } from "./functions/site6.js";
import { handleTranslate } from "./functions/translate.js";
import { handleUserNotification } from "./functions/userNotification.js";

// Domains masu izini
const ALLOWED_ORIGINS = [
    'https://tauraronwasa.pages.dev',
    'https://leadwaypeace.pages.dev',
    'http://localhost:8080'
];

// Helper don bada response da CORS headers
function withCORSHeaders(response, request) {
    const origin = request.headers.get('Origin');
    if (ALLOWED_ORIGINS.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
    response.headers.set('Access-Control-Max-Age', '86400');
    return response;
}

export default {
    async fetch(request, env, ctx) {
        // ✅ Gyara 1: A fara sarrafa kiran OPTIONS kafin komai
        if (request.method === 'OPTIONS') {
            const origin = request.headers.get('Origin');
            if (ALLOWED_ORIGINS.includes(origin)) {
                return withCORSHeaders(new Response(null, { status: 204 }), request);
            }
            return new Response(null, { status: 403 }); // 403 Forbidden idan ba a cikin jerin domains ba
        }

        const url = new URL(request.url);

        // ✅ Gyara 2: Duba API Key a farko
        const WORKER_API_KEY = request.headers.get('x-api-key');
        if (WORKER_API_KEY !== '@haruna66') {
            const forbiddenResponse = new Response('Invalid API Key', { status: 401 });
            return withCORSHeaders(forbiddenResponse, request);
        }

        let response;
        // 📌 Routes
        switch (url.pathname) {
            case "/getLink":
                response = await handleGetLink(request);
                break;
            case "/newgame":
                response = await handleNewGame(request);
                break;
            case "/football":
                response = await handleFotbal(request);
                break;
            case "/champions":
                response = await handleChampions(request);
                break;
            case "/eropa":
                response = await handleEropa(request);
                break;
            case "/fa":
                response = await handleFa(request);
                break;
            case "/football":
                response = await handleFootball(request);
                break;
            case "/labarinWasa":
                response = await handleLabarinWasa(request);
                break;
            case "/laliga":
                response = await handleLaliga(request);
                break;
            case "/npfl":
                response = await handleNpfl(request);
                break;
            case "/premier":
                response = await handlePremier(request);
                break;
            case "/search":
                response = await handleSearch(request);
                break;
            case "/siriyaa":
                response = await handleSiriyaa(request);
                break;
            case "/site6":
                response = await handleSite6(request);
                break;
            case "/translate":
                response = await handleTranslate(request);
                break;
            case "/userNotification":
                response = await handleUserNotification(request);
                break;
            default:
                response = new Response("Not Found", { status: 404 });
                break;
        }

       
        return withCORSHeaders(response, request);
    },
};
