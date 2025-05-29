// ==UserScript==
// @name         Steam - Multi-buy & Multi-sell Price Picker
// @name:ru      Steam - Выбор цен для массовой покупки/продажи
// @namespace    https://github.com/HenkerX64
// @version      1.1
// @description  Adds a button to load item price tables without opening the item page.
// @description:ru  Добавляет кнопку для загрузки таблицы цен без перехода на страницу предмета.
// @author       HenkerX64
// @homepage     https://github.com/HenkerX64/tampermonkey-web-helpers
// @supportURL   https://github.com/HenkerX64/tampermonkey-web-helpers/issues
// @downloadURL  https://raw.githubusercontent.com/HenkerX64/tampermonkey-web-helpers/main/steam/multiBuyOrSell.user.js
// @updateURL    https://raw.githubusercontent.com/HenkerX64/tampermonkey-web-helpers/main/steam/multiBuyOrSell.user.js
// @match        *://steamcommunity.com/market/multisell*
// @match        *://steamcommunity.com/market/multibuy*
// @connect      steamcommunity.com
// @grant        none
// @run-at       document-body
// ==/UserScript==

/**
 * README (English):
 * This script adds a button to quickly load the price table (item-orders-histogram) directly on the mass buy/sell page.
 * It prevents the need to open the item page and loads up to 20 price positions instead of the default 5.
 *
 * README (Русский):
 * Этот скрипт добавляет кнопку, которая загружает таблицу цен (item-orders-histogram) прямо на странице массовой покупки/продажи.
 * Это избавляет от необходимости открывать страницу предмета и загружает до 20 позиций вместо стандартных 5.
 */

/**
 * @external UpdateOrderTotal
 * @external ShowDialog
 * @external g_strCountryCode
 * @external g_strLanguage
 * @external g_rgWalletInfo
 * @external $J
 */

(function ($, showDialogFn, updateOrderTotalFn, language, countryCode, currencyCode) {
    'use strict';

    const translations = {
        en: {
            open: 'prices',
            tryAgain: 'try again',
            use: 'use',
            plus: '+',
            minus: '-',
            requestMuted: 'request disabled',
        },
        ru: {
            open: 'цены',
            tryAgain: 'повторить',
            use: 'исп.',
            plus: '+',
            minus: '-',
            requestMuted: 'запрос отключён',
        },
    };

    const userLang = language === 'russian' ? 'ru' : 'en';
    const t = (key) => translations[userLang][key] || key;
    const FILTER_ASSETS_PER_LOAD = 2500;

    function fixTemporaryInventoryBadRequestErrorWithCount5000() {
        const originalAjax = $.ajax;

        $.ajax = function(options) {
            /** @see https://community.akamai.steamstatic.com/public/javascript/market_multisell.js */
            if (options.url.includes('/inventory/') && options.data && options.data.count && options.data.count === 5000) {
                options.data.count = FILTER_ASSETS_PER_LOAD;
            }

            return originalAjax.apply(this, arguments);
        };
    }

    fixTemporaryInventoryBadRequestErrorWithCount5000();

    function disableCancelBuyOrderRequest() {
        if (!document.location.pathname.startsWith('/market/multibuy')) {
            return;
        }

        const originalAjax = $.ajax;

        $.ajax = function(options) {
            /** @see https://community.akamai.steamstatic.com/public/javascript/market_multibuy.js */
            if (options.url.includes('/market/cancelbuyorder/')) {
                console.log(`${t('requestMuted')}:`, options.url, options.data);

                const deferred = $.Deferred();
                setTimeout(() => deferred.resolve({success: 1}), 100);

                return deferred.promise();
            }

            return originalAjax.apply(this, arguments);
        };
    }

    disableCancelBuyOrderRequest();

    class SteamMarketHelper {
        constructor() {
            this.dialogHandle = null;
            this.multiAction = this.detectMultiAction();
            if (this.multiAction) {
                this.init();
            }
        }

        detectMultiAction() {
            if ($('#BG_bottom.market_multisell').length > 0) {
                return 'sell';
            }
            if ($('#BG_bottom.market_multibuy').length > 0) {
                return 'buy';
            }
            return null;
        }

        init() {
            const styles = `
            <style>
                #BG_bottom.market_multi${this.multiAction} .btn_small_wide {
                    position: absolute;
                    margin-left: -80px;
                }
                #market_commodity_order_spread > img {
                    position: absolute;
                    bottom: -24px;
                    right: -22px;
                    z-index: -1;
                    opacity: 1;
                    width: calc(100% + 44px);
                }
                #market_commodity_order_spread .market_commodity_orders_header {
                    min-height: auto;
                }
            </style>
            `;
            $(`#BG_bottom.market_multi${this.multiAction}`).append(styles);
            $(`#BG_bottom.market_multi${this.multiAction} table.market_multi_table > tbody > tr`)
                .each((i, tr) => {
                    const nameid = $(tr).find('td:first-child input').data('nameid');
                    if (nameid) {
                        this.addPriceLoadButton(nameid, $(tr)
                            .find(`input.market_multi_price${this.multiAction === 'sell' ? '_paid' : ''}`));
                    }
                });
        }

        addPriceLoadButton(nameId, element) {
            const button = $('<a>', {
                class: 'btn_blue_white_innerfade btn_small_wide',
                href: 'javascript:void(0)',
                html: `<span>${t('open')}</span>`,
                click: () => this.handlePriceLoadClick(nameId)
            });
            $(element).after(button);
        }

        handlePriceLoadClick(nameId) {
            const title = $(`#${this.multiAction}_${nameId}_name`).text().trim();
            this.showPriceDialog(title);
            this.fetchPriceData(nameId);
        }

        showPriceDialog(title) {
            const orderSpread = $('#market_commodity_order_spread');
            if (orderSpread.length) {
                orderSpread.remove();
            }
            const body = `
            <div id="market_commodity_order_spread">
                <img src="https://steamcommunity-a.akamaihd.net/public/images/economy/market/market_bg_949.png" alt=""/>
                <div class="market_commodity_orders_block">
                    <div class="market_commodity_orders_interior">
                        <div class="market_commodity_orders_header">
                            <div class="market_commodity_order_summary" id="market_commodity_forsale"></div>
                        </div>
                        <div id="market_commodity_forsale_table" class="market_commodity_orders_table_container"></div>
                    </div>
                </div>
                <div class="market_commodity_orders_block">
                    <div class="market_commodity_orders_interior">
                        <div class="market_commodity_orders_header">
                            <div class="market_commodity_order_summary" id="market_commodity_buyrequests"></div>
                        </div>
                        <div id="market_commodity_buyreqeusts_table" class="market_commodity_orders_table_container"></div>
                    </div>
                </div>
                <div style="clear: both"></div>
            </div>
            `;
            this.dialogHandle = showDialogFn(title, body, {});
        }

        fetchPriceData(nameId) {
            /** @see https://community.akamai.steamstatic.com/public/javascript/market.js */
            $.get('https://steamcommunity.com/market/itemordershistogram', {
                country: countryCode,
                language: language,
                currency: currencyCode,
                item_nameid: nameId,
            })
                .done((data) => this.processPriceData(data, nameId))
                .fail(() => console.error('Failed to load market data.'));
        }

        processPriceData(data, nameId) {
            if (data.success !== 1) {
                this.showErrorDialog(nameId, data.success);
                return;
            }

            $('#market_commodity_forsale').html(data.sell_order_summary);
            $('#market_commodity_forsale_table').html(data.sell_order_table).find('tr:last').remove();
            $('#market_commodity_buyrequests').html(data.buy_order_summary);
            $('#market_commodity_buyreqeusts_table').html(data.buy_order_table).find('tr:last').remove();

            this.extendPriceRows(data.sell_order_graph, data.buy_order_graph, data.price_prefix, data.price_suffix);
            this.addActions(data.sell_order_graph, data.buy_order_graph, nameId);

            this.recalculateDialogPosition();
        }

        showErrorDialog(nameId, errorCode) {
            const button = $('<a>', {
                class: 'btn_blue_white_innerfade btn_small_wide',
                href: 'javascript:void(0)',
                html: `<span>${t('tryAgain')}</span>`,
                click: () => this.handleTryAgainButtonClick(nameId)
            });
            const element = $(`<div>Oops, ${EResult[errorCode]} ... </div>`);
            element.append(button);
            $('#market_commodity_order_spread').html(element);
        }

        handleTryAgainButtonClick(nameId) {
            // noinspection JSUnresolvedReference
            this.dialogHandle.Dismiss();
            this.handlePriceLoadClick(nameId);
            const title = $(`#${this.multiAction}_${nameId}_name`).text().trim();
            this.showPriceDialog(title);
            this.fetchPriceData(nameId);
        }

        extendPriceRows(sellOrderGraph, byuOrderGraph, prefix, suffix) {
            const forSaleBody = $('#market_commodity_forsale_table > table > tbody');
            for (const [price, count] of sellOrderGraph.slice(5, 20)) {
                forSaleBody.append(`
                    <tr>
                        <td align="right">${prefix} ${this.formatNum(price)} ${suffix}</td>
                        <td align="right">${count}</td>
                    </tr>
                `);
            }
            const forBuyBody = $('#market_commodity_buyreqeusts_table > table > tbody');
            for (const [price, count] of byuOrderGraph.slice(5, 20)) {
                forBuyBody.append(`
                    <tr>
                        <td align="right">${prefix} ${this.formatNum(price)} ${suffix}</td>
                        <td align="right">${count}</td>
                    </tr>
                `);
            }
        }

        addActions(sellOrderGraph, byuOrderGraph, nameId) {
            $('#market_commodity_forsale_table > table > tbody tr:not(:first-child)').each((i, tr) => {
                this.addActionColumn(tr, nameId, this.resolveColumnPrice(tr, sellOrderGraph[i]), -0.01);
            });
            $('#market_commodity_buyreqeusts_table > table > tbody tr:not(:first-child)').each((i, tr) => {
                this.addActionColumn(tr, nameId, this.resolveColumnPrice(tr, byuOrderGraph[i]), 0.01);
            });
        }

        addActionColumn(tr, nameId, price, nextPrice) {
            const buttonSamePrice = $('<a>', {
                class: 'btn_darkblue_white_innerfade btn_small',
                href: 'javascript:void(0)',
                html: `<span>${t('use')}</span>`,
                click: () => this.handleActionButtonClick(nameId, price),
            });
            const buttonNextPrice = $('<a>', {
                class: 'btn_darkblue_white_innerfade btn_small',
                href: 'javascript:void(0)',
                html: `<span>${nextPrice > 0 ? t('plus') : t('minus')}</span>`,
                click: () => this.handleActionButtonClick(nameId, price + nextPrice),
            });
            const element = $(`<td>`);
            element.append(buttonSamePrice).append(buttonNextPrice);
            $(tr).append(element);
        }

        handleActionButtonClick(nameId, price) {
            const element = $(`#${this.multiAction}_${nameId}_price${this.multiAction === 'sell' ? '_paid' : ''}`);
            // v_currencyformat( info.amount, GetCurrencyCode( g_rgWalletInfo['wallet_currency'] ) );
            element.css('color', 'white').val(price);
            $('.newmodal_background').click();
            element.trigger('keup').trigger('blur');
            setTimeout(() => updateOrderTotalFn(), 100);
        }

        resolveColumnPrice(tr, orderGraph) {
            if (orderGraph) {
                return orderGraph[0];
            }
            return this.parsePriceToCents($(tr).find('td:first').text()) / 100;
        }

        formatNum(num) {
            return num.toLocaleString(countryCode, {maximumFractionDigits: 2, minimumFractionDigits: 2});
        }

        /** same like GetPriceValueAsInt */
        parsePriceToCents(strAmount) {
            if (!strAmount) return 0;

            strAmount = strAmount.replace(/,/g, '.');
            strAmount = strAmount.replace(/[^\d.]/g, '').replace('.--', '.00');

            if (strAmount.includes('.')) {
                const parts = strAmount.split('.');
                const lastPart = parts.pop();
                strAmount = parts.join('') + '.' + lastPart;
            }

            const flAmount = parseFloat(strAmount) * 100;
            const nAmount = Math.floor(isNaN(flAmount) ? 0 : flAmount + 0.000001);

            return Math.max(nAmount, 0);
        }

        recalculateDialogPosition() {
            setTimeout(() => window.dispatchEvent(new Event('resize')), 10);
        }

    }

    const EResult = {
        "0": "Invalid",
        "1": "OK",
        "2": "Fail",
        "3": "NoConnection",
        "5": "InvalidPassword",
        "6": "LoggedInElsewhere",
        "7": "InvalidProtocolVer",
        "8": "InvalidParam",
        "9": "FileNotFound",
        "10": "Busy",
        "11": "InvalidState",
        "12": "InvalidName",
        "13": "InvalidEmail",
        "14": "DuplicateName",
        "15": "AccessDenied",
        "16": "Timeout",
        "17": "Banned",
        "18": "AccountNotFound",
        "19": "InvalidSteamID",
        "20": "ServiceUnavailable",
        "21": "NotLoggedOn",
        "22": "Pending",
        "23": "EncryptionFailure",
        "24": "InsufficientPrivilege",
        "25": "LimitExceeded",
        "26": "Revoked",
        "27": "Expired",
        "28": "AlreadyRedeemed",
        "29": "DuplicateRequest",
        "30": "AlreadyOwned",
        "31": "IPNotFound",
        "32": "PersistFailed",
        "33": "LockingFailed",
        "34": "LogonSessionReplaced",
        "35": "ConnectFailed",
        "36": "HandshakeFailed",
        "37": "IOFailure",
        "38": "RemoteDisconnect",
        "39": "ShoppingCartNotFound",
        "40": "Blocked",
        "41": "Ignored",
        "42": "NoMatch",
        "43": "AccountDisabled",
        "44": "ServiceReadOnly",
        "45": "AccountNotFeatured",
        "46": "AdministratorOK",
        "47": "ContentVersion",
        "48": "TryAnotherCM",
        "49": "PasswordRequiredToKickSession",
        "50": "AlreadyLoggedInElsewhere",
        "51": "Suspended",
        "52": "Cancelled",
        "53": "DataCorruption",
        "54": "DiskFull",
        "55": "RemoteCallFailed",
        "56": "PasswordUnset",
        "57": "ExternalAccountUnlinked",
        "58": "PSNTicketInvalid",
        "59": "ExternalAccountAlreadyLinked",
        "60": "RemoteFileConflict",
        "61": "IllegalPassword",
        "62": "SameAsPreviousValue",
        "63": "AccountLogonDenied",
        "64": "CannotUseOldPassword",
        "65": "InvalidLoginAuthCode",
        "66": "AccountLogonDeniedNoMail",
        "67": "HardwareNotCapableOfIPT",
        "68": "IPTInitError",
        "69": "ParentalControlRestricted",
        "70": "FacebookQueryError",
        "71": "ExpiredLoginAuthCode",
        "72": "IPLoginRestrictionFailed",
        "73": "AccountLockedDown",
        "74": "AccountLogonDeniedVerifiedEmailRequired",
        "75": "NoMatchingURL",
        "76": "BadResponse",
        "77": "RequirePasswordReEntry",
        "78": "ValueOutOfRange",
        "79": "UnexpectedError",
        "80": "Disabled",
        "81": "InvalidCEGSubmission",
        "82": "RestrictedDevice",
        "83": "RegionLocked",
        "84": "RateLimitExceeded",
        "85": "AccountLoginDeniedNeedTwoFactor",
        "86": "ItemDeleted",
        "87": "AccountLoginDeniedThrottle",
        "88": "TwoFactorCodeMismatch",
        "89": "TwoFactorActivationCodeMismatch",
        "90": "AccountAssociatedToMultiplePartners",
        "91": "NotModified",
        "92": "NoMobileDevice",
        "93": "TimeNotSynced",
        "94": "SMSCodeFailed",
        "95": "AccountLimitExceeded",
        "96": "AccountActivityLimitExceeded",
        "97": "PhoneActivityLimitExceeded",
        "98": "RefundToWallet",
        "99": "EmailSendFailure",
        "100": "NotSettled",
        "101": "NeedCaptcha",
        "102": "GSLTDenied",
        "103": "GSOwnerDenied",
        "104": "InvalidItemType",
        "105": "IPBanned",
        "106": "GSLTExpired",
        "107": "InsufficientFunds",
        "108": "TooManyPending",
        "109": "NoSiteLicensesFound",
        "110": "WGNetworkSendExceeded",
        "111": "AccountNotFriends",
        "112": "LimitedUserAccount",
        "113": "CantRemoveItem",
        "114": "AccountHasBeenDeleted",
        "115": "AccountHasAnExistingUserCancelledLicense",
        "116": "DeniedDueToCommunityCooldown",
        "117": "NoLauncherSpecified",
        "118": "MustAgreeToSSA",
        "119": "ClientNoLongerSupported",
    };

    $(document).ready(() => new SteamMarketHelper());

})($J, ShowDialog, UpdateOrderTotal, g_strLanguage, g_strCountryCode, g_rgWalletInfo?.wallet_currency || 1);
