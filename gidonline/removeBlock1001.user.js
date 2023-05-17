// ==UserScript==
// @name         Удаление блокировки с сервиса gidonline.io
// @namespace    https://github.com/HenkerX64
// @updateURL    https://raw.githubusercontent.com/HenkerX64/tampermonkey-web-helpers/main/gidonline/removeBlock1001.user.js
// @downloadURL  https://raw.githubusercontent.com/HenkerX64/tampermonkey-web-helpers/main/gidonline/removeBlock1001.user.js
// @version      0.3
// @description  -
// @author       Henkerx64
// @match        *://gidonline.io/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    setTimeout(function() {
        const id = document.getElementById('cdn-player');
        if (!id) {
            return;
        }
        function changeElementVisibility(id, display) {
            const elem = document.getElementById(id);
            if (elem) {
                elem.style.display = display;
            }
        }
        // @see https://gidonline.io/wp-content/themes/gidonline/js/tray.js
        changeElementVisibility('tray', 'block');
        // @see https://gidonline.io/wp-content/themes/gidonline/js/cloudi.js
        changeElementVisibility('ytblink', 'block');
        changeElementVisibility('seriesps-1', 'block');
        changeElementVisibility('seriesps-2', 'block');
        changeElementVisibility('friend', 'block');
        changeElementVisibility('trayn', 'none');
        changeElementVisibility('playh2', 'none');

        const src = id.src;
        if (!src) {
            return;
        }
        const pattern = /&block=[^&]+/;
        if (!src.match(pattern)) {
            return;
        }
        id.src = src.replace(pattern, '');

    }, 500);

})();
