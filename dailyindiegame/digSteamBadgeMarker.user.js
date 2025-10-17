// ==UserScript==
// @name         DIG Steam Badge Marker
// @namespace    https://github.com/HenkerX64
// @version      1.1
// @description  Marks DailyIndieGame titles that have Steam trading cards, using cached data from steam-badges-db.
// @author       HenkerX64
// @homepage     https://github.com/HenkerX64/tampermonkey-web-helpers
// @supportURL   https://github.com/HenkerX64/tampermonkey-web-helpers/issues
// @downloadURL  https://raw.githubusercontent.com/HenkerX64/tampermonkey-web-helpers/main/dailyindiegame/digSteamBadgeMarker.user.js
// @updateURL    https://raw.githubusercontent.com/HenkerX64/tampermonkey-web-helpers/main/dailyindiegame/digSteamBadgeMarker.user.js
// @match        https://www.dailyindiegame.com/*
// @grant        GM_addStyle
// @grant        GM.xmlHttpRequest
// @connect      githubusercontent.com
// @run-at       document-end
// ==/UserScript==

/** @var {Function} GM_addStyle */
/** @var {{xmlHttpRequest: Function}} GM */

(function () {
    'use strict';

    const BADGES_URL = 'https://raw.githubusercontent.com/nolddor/steam-badges-db/main/data/badges.min.json';
    const CACHE_KEY = 'steam_badges_db';
    const CACHE_TIME = 1000 * 60 * 60 * 6; // 6 Stunden Cache

    class SteamBadgeMarker {
        constructor() {
            this.badgesData = {};
            this.init().then();
        }

        async init() {
            await this.loadBadgeData();
            this.addCssStyles();
            this.markSteamGames();
            this.markSteamGameLinks();
        }

        async loadBadgeData() {
            const cached = this.getCache();
            if (cached) {
                this.badgesData = cached;
                return;
            }

            GM.xmlHttpRequest({
                method: 'GET',
                url: BADGES_URL,
                onload: response => {
                    try {
                        const json = JSON.parse(response.responseText);
                        console.log('Loaded badges DB:', Object.keys(json).length, 'entries');
                        this.badgesData = json;
                        this.setCache(json);
                    } catch (e) {
                        console.error('Failed to parse badges JSON:', e);
                    }
                },
                onerror: err => {
                    console.error('[DIG Steam Marker] Cannot load badges data:', err);
                }
            });
        }

        getCache() {
            try {
                const cache = localStorage.getItem(CACHE_KEY);
                if (!cache) return null;
                const parsed = JSON.parse(cache);
                if (Date.now() - parsed.time > CACHE_TIME) {
                    localStorage.removeItem(CACHE_KEY);
                    return null;
                }
                return parsed.data;
            } catch {
                return null;
            }
        }

        setCache(data) {
            localStorage.setItem(CACHE_KEY, JSON.stringify({time: Date.now(), data}));
        }

        markSteamGames() {
            const images = document.querySelectorAll("img[src^='dig3-images-steam/']");
            images.forEach(img => {
                const match = img.src.match(/dig3-images-steam\/(\d+)\.jpg/);
                if (!match) return;

                const appId = match[1];
                if (this.badgesData[appId]) {
                    this.decorate(img);
                }
            });
        }

        markSteamGameLinks() {
            const links = document.querySelectorAll("a[href^='https://store.steampowered.com/app/']");
            links.forEach(link => {
                const match = link.href.match(/steampowered\.com\/app\/(\d+)/);
                if (!match) return;

                const appId = match[1];
                if (this.badgesData[appId]) {
                    this.decorate(link);
                }
            });
        }

        decorate(img) {
            if (!img) return;
            img.classList.add('steam-badge-game');
        }

        addCssStyles() {
            const css = `
                img.steam-badge-game {
                  display: inline-block;
                  border: 3px solid red;
                  border-radius: 9px;
                  animation: steam-badge-game 1.5s ease-in-out infinite;
                }
                @keyframes steam-badge-game {
                  0%   { transform: scale(1);    opacity: 1;   border-color: dark-red; }
                  50%  { transform: scale(1.05); opacity: .75; border-color: orange; }
                  100% { transform: scale(1);    opacity: 1;   border-color: red; }
                }
                a.steam-badge-game span {
                  color: #eb0f9b;
                  animation: steam-badge-game-link 3s ease-in-out infinite;
                }
                @keyframes steam-badge-game-link {
                  0%   { transform: scale(1);    opacity: 1;   color: #FD5E0F; }
                  50%  { transform: scale(1.05); opacity: .75; color: red; }
                  100% { transform: scale(1);    opacity: 1;   color: #eb0f9b; }
                }
          `;
            GM_addStyle(css);
        }
    }

    new SteamBadgeMarker();
})();
