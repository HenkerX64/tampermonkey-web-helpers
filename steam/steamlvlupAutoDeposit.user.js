// ==UserScript==
// @name         SteamLvlUp Auto-Deposit
// @namespace    https://github.com/HenkerX64
// @version      1.0
// @description  Automatically deposits in SteamLvlUp when Auto-Deposit is enabled
// @author       Henkerx64, ChatGPT
// @match        https://steamlvlup.com/deposit*
// @updateURL    https://raw.githubusercontent.com/HenkerX64/tampermonkey-web-helpers/main/steam/steamlvlupAutoDeposit.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// @require      https://code.jquery.com/jquery-2.2.3.min.js
// ==/UserScript==

(function($) {
    'use strict';

    const PAGE_LOAD_DELAY_SEC = 5;
    const RELOAD_INTERVAL_SEC = 30;
    const AFTER_CLICK_DELAY_MS = 1000;

    let autoDeposit = GM_getValue('autoDeposit', false);
    let intervalId = null;

    function toggleAutoDeposit() {
        autoDeposit = !autoDeposit;
        GM_setValue('autoDeposit', autoDeposit);
        updateButtonUI();
        autoDeposit ? startAutoDeposit() : stopAutoDeposit();
    }

    function createAutoDepositButton() {
        $('#auto-deposit-button').remove();

        $('<button>', {
            id: 'auto-deposit-button',
            html: '<i class="fas fa-spinner"></i> Auto-Deposit is <strong>OFF</strong>',
            css: {
                padding: '10px',
                background: '#ebe9f4',
                color: '#364053',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '16px',
                marginRight: '10px',
                display: 'flex',
                alignItems: 'center',
                fontFamily: 'SLUP-Semibold',
                gap: '5px'
            },
            click: toggleAutoDeposit
        }).prependTo('.head-user-info');
        updateButtonUI();
    }

    function updateButtonUI() {
        const button = $('#auto-deposit-button');
        const icon = button.find('i');
        const state = button.find('strong');

        state.html(`${autoDeposit ? 'ON' : 'OFF'}`);
        button.css('background', autoDeposit ? 'linear-gradient(to right, #2af599 20%, #0DBBDD 100%)' : '#ebe9f4');

        if (autoDeposit) {
            icon.addClass('fa-spin');
        } else {
            icon.removeClass('fa-spin');
        }
    }

    function startAutoDeposit() {
        if (intervalId) return;
        handleDepositProcess();
        intervalId = setInterval(() => {
            if (autoDeposit && window.location.hash === '#fullsets') {
                location.reload();
            }
        }, RELOAD_INTERVAL_SEC * 1000);
    }

    function stopAutoDeposit() {
        if (!intervalId) return;
        clearInterval(intervalId);
        intervalId = null;
    }

    function selectAllItems() {
        const selectAllButton = $('.select-section .select-btn.select-all');
        if (!selectAllButton.length || !selectAllButton.is(':visible')) return;
        selectAllButton.click();
    }

    function confirmDeposit() {
        const confirmButton = $('.m-buttons .m-b-accept.m-t-deposit');
        if (!confirmButton.length || !confirmButton.is(':visible')) return;
        confirmButton.click();
    }

    function attemptDeposit() {
        const depositButton = $('.select-section .send-trade-btn.deposit-bnt');
        if (!depositButton.length || depositButton.hasClass('disabled') || !depositButton.is(':visible')) return;
        depositButton.click();
        setTimeout(confirmDeposit, AFTER_CLICK_DELAY_MS);
    }

    function handleDepositProcess() {
        if (!autoDeposit) return;
        setTimeout(() => {
            selectAllItems();
            setTimeout(attemptDeposit, AFTER_CLICK_DELAY_MS);
        }, PAGE_LOAD_DELAY_SEC * 1000);
    }

    function initialize() {
        createAutoDepositButton();
        if (autoDeposit && window.location.hash === '#fullsets') {
            startAutoDeposit();
        }
    }

    $(window).on('load', initialize);
})(jQuery);
