// ==UserScript==
// @name         Удаление блокировки с сервиса gidonline.io
// @namespace    https://github.com/HenkerX64
// @updateURL    https://raw.githubusercontent.com/HenkerX64/tampermonkey-web-helpers/main/gidonline/removeBlock1001.user.js
// @version      0.2
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
        // @see https://gidonline.io/wp-content/themes/gidonline/js/tray.js
        const idTray = document.getElementById('tray');
        if (idTray) {
            document.getElementById('tray').style.display = 'block';
        }
        const src = id.src;
        if (!src) {
            return;
        }
        const pattern = /&block=[^&]+/;
        if (!src.match(pattern)) {
            return;
        }
        id.src = src.replace(pattern, '');

    }, 1000);

})();
