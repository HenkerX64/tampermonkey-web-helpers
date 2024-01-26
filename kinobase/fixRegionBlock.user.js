// ==UserScript==
// @name         Удаление блокировки с сервиса kinobase.org
// @namespace    https://github.com/HenkerX64
// @updateURL    https://raw.githubusercontent.com/HenkerX64/tampermonkey-web-helpers/main/kinobase/fixRegionBlock.user.js
// @downloadURL  https://raw.githubusercontent.com/HenkerX64/tampermonkey-web-helpers/main/kinobase/fixRegionBlock.user.js
// @version      0.3
// @description  -
// @author       Henkerx64
// @match        https://kinobase.org/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kinobase.org
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    setTimeout(function() {
        const cookieNamesToChange = [];
        for(let cookie of document.cookie.split(';')) {
            const match = cookie.match(/(country_\w+)=([A-Z]{2,3})(;|$)/);
            if (match && match[2] && !match[2].startsWith('KZ')) {
                cookieNamesToChange.push(match[1]);
            }
        }
        // nothing to do
        if (cookieNamesToChange.length === 0) {
            return;
        }

        function setCookie(cName, cValue, expDays) {
            let date = new Date();
            date.setTime(date.getTime() + (expDays * 24 * 60 * 60 * 1000));
            const expires = "expires=" + date.toUTCString();
            document.cookie = cName + "=" + cValue + "; " + expires + "; path=/";
        }

        for(let cookieName of cookieNamesToChange) {
            setCookie(cookieName, 'KZ', 2); // country_md5(ip)=ISO2
        }
    }, 500);

    const ajaxFix = function() {
        jQuery.ajaxSetup({
            dataFilter: function (data, type) {
                if (typeof data === 'string' && type === 'json' && data.includes('"allow_watch":0,')) {
                    return data.replace(/"allow_watch":0,/,'"allow_watch":1,').replace(/"client_country":"\w+"/,'"client_country":"KZ"');
                }
                return data;
            }
        });
    }

    try {
        ajaxFix();
    } catch(e) {
        setTimeout(ajaxFix, 100);
    }
})();
