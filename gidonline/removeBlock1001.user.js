// ==UserScript==
// @name         Удаление блокировки с сервиса gidonline.io
// @namespace    https://github.com/HenkerX64
// @updateURL    https://raw.githubusercontent.com/HenkerX64/tampermonkey-web-helpers/main/gidonline/removeBlock1001.user.js
// @version      0.1
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
