import { handleGetLink } from "./functions/getLink.js";
import { handleNewGame } from "./functions/newgame.js";
import { handleFotbal } from "./functions/fotbal.js";
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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 📌 Route: /getLink (POST file upload)
    if (url.pathname === "/getLink" && request.method === "POST") {
      return await handleGetLink(request);
    }

    // 📌 Route: /newgame
    if (url.pathname === "/newgame") {
      return await handleNewGame(request);
    }

    // 📌 Route: /fotbal
    if (url.pathname === "/fotbal") {
      return await handleFotbal(request);
    }

    // 📌 Route: /champions
    if (url.pathname === "/champions") {
      return await handleChampions(request);
    }

    // 📌 Route: /eropa
    if (url.pathname === "/eropa") {
      return await handleEropa(request);
    }

    // 📌 Route: /fa
    if (url.pathname === "/fa") {
      return await handleFa(request);
    }

    // 📌 Route: /football
    if (url.pathname === "/football") {
      return await handleFootball(request);
    }

    // 📌 Route: /labarinWasa
    if (url.pathname === "/labarinWasa") {
      return await handleLabarinWasa(request);
    }

    // 📌 Route: /laliga
    if (url.pathname === "/laliga") {
      return await handleLaliga(request);
    }

    // 📌 Route: /npfl
    if (url.pathname === "/npfl") {
      return await handleNpfl(request);
    }

    // 📌 Route: /premier
    if (url.pathname === "/premier") {
      return await handlePremier(request);
    }

    // 📌 Route: /search
    if (url.pathname === "/search") {
      return await handleSearch(request);
    }

    // 📌 Route: /siriyaa
    if (url.pathname === "/siriyaa") {
      return await handleSiriyaa(request);
    }

    // 📌 Route: /site6
    if (url.pathname === "/site6") {
      return await handleSite6(request);
    }

    // 📌 Route: /translate
    if (url.pathname === "/translate") {
      return await handleTranslate(request);
    }

    // 📌 Route: /userNotification
    if (url.pathname === "/userNotification") {
      return await handleUserNotification(request);
    }

    // Default: 404
    return new Response("Not Found", { status: 404 });
  },
};
