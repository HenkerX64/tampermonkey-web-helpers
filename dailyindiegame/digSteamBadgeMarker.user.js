// ==UserScript==
// @name         DIG Steam Badge Marker
// @namespace    https://github.com/HenkerX64
// @version      1.2
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

    const ENABLE_AUTO_BUY = document.location.pathname.startsWith('/site_gamelisting_');

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
                  50%  { transform: scale(1.02); opacity: .75; border-color: orange; }
                  100% { transform: scale(1);    opacity: 1;   border-color: red; }
                }
                a.steam-badge-game span {
                  color: #eb0f9b;
                  animation: steam-badge-game-link 3s ease-in-out infinite;
                }
                @keyframes steam-badge-game-link {
                  0%   { transform: scale(1);    opacity: 1;   color: #FD5E0F; }
                  50%  { transform: scale(1.02); opacity: .75; color: red; }
                  100% { transform: scale(1);    opacity: 1;   color: #eb0f9b; }
                }
          `;
            GM_addStyle(css);
        }
    }


    class MultiBuyer {
        constructor() {
            this.running = false;
            this.lastId = null;
            this.init();
        }

        init() {
            const buyLink = document.querySelector("a[href^='account_buytrade_']");
            if (!buyLink) return;

            const match = buyLink.href.match(/account_buytrade_(\d+)\.html/);
            if (!match) return;

            this.lastId = parseInt(match[1], 10);
            this.injectUI(buyLink);
        }

        injectUI(buyLink) {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'block';
            wrapper.style.marginTop = '25px';

            const input = document.createElement('input');
            input.type = 'number';
            input.min = '1';
            input.value = '1';
            input.style.width = '60px';
            input.style.textAlign = 'center';
            input.style.border = '1px solid #aaa';
            input.style.padding = '2px 4px';
            input.title = 'Number of purchases';

            const button = document.createElement('a');
            button.href = 'javascript:void(0)';
            button.textContent = 'AUTO BUY';
            button.style.display = 'inline-block';
            button.style.padding = '3px 8px';
            button.style.background = '#ff0';
            button.style.color = 'black';
            button.style.textDecoration = 'none';
            button.style.fontWeight = 'bold';
            button.style.userSelect = 'none';
            button.style.marginLeft = '10px';
            input.title = 'Start buying in background';

            wrapper.appendChild(input);
            wrapper.appendChild(button);
            buyLink.parentNode.insertBefore(wrapper, buyLink.nextSibling);

            button.addEventListener('click', () => {
                if (this.running) {
                    this.stop(button, input);
                } else {
                    const maxCount = Math.max(1, parseInt(input.value, 10) || 1);
                    this.start(button, input, maxCount);
                }
            });
        }

        start(button, input, maxCount) {
            this.running = true;
            button.textContent = 'BUYING...';
            button.style.background = '#d33';
            button.style.color = 'white';
            input.disabled = true;
            input.style.color = 'white';
            this.makeOrder(maxCount, 0, button, input);
        }

        stop(button, input) {
            this.running = false;
            button.textContent = 'AUTO BUY';
            button.style.background = '#ff0';
            button.style.color = 'black';
            input.disabled = false;
            input.style.color = '';
        }

        makeOrder(maxCount, counter, button, input) {
            if (!this.running) return;
            const current = counter + 1;

            if (current > maxCount) {
                console.log('[MultiBuyer] Finished.');
                location.reload();
                return;
            }

            console.log(`[MultiBuyer] Order ${current}/${maxCount} → #${this.lastId}`);

            fetch(`https://www.dailyindiegame.com/account_buytrade_${this.lastId}.html`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `gameid=${this.lastId}`,
                credentials: 'include'
            }).then(() => {
                this.lastId += 1;
                input.value = maxCount - counter;
                setTimeout(() => this.makeOrder(maxCount, current, button, input), 200);
            }).catch(err => {
                console.error('Fetch error:', err);
                this.stop(button, input);
            });
        }
    }

    new SteamBadgeMarker();
    if (ENABLE_AUTO_BUY) {
        new MultiBuyer();
    }
})();
