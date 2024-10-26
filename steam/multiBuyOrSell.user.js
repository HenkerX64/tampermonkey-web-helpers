// ==UserScript==
// @name         Steam Market Helper
// @description  -
// @namespace    https://github.com/HenkerX64
// @updateURL    https://raw.githubusercontent.com/HenkerX64/tampermonkey-web-helpers/main/steam/multiBuyOrSell.user.js
// @version      0.8
// @description  Open dialog helper for multi buy/sell with price selection from detail page.
// @author       Henkerx64
// @match        *://steamcommunity.com/market/multisell*
// @match        *://steamcommunity.com/market/multibuy*
// @connect      steamcommunity.com
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM.deleteValue
// @grant       GM_xmlhttpRequest
// @grant       GM.xmlHttpRequest
// ==/UserScript==

(function($) {
    'use strict';

    var swhX64 = {
        dialogHandle: null,
        multiAction: 'sell',
        init: function() {
            if ($('#BG_bottom.market_multisell').length > 0) {
                swhX64.multiAction = 'sell';
            }else if ($('#BG_bottom.market_multibuy').length > 0) {
                swhX64.multiAction = 'buy';
            }else{ return; }

            $('#BG_bottom.market_multi'+swhX64.multiAction+' table.market_multi_table>tbody>tr').each(function(i,tr) {
                var nameid = $(tr).find('td:first-child input').data('nameid');
                if (typeof nameid === 'undefined') { return; }
                swhX64.addLoadSpreadBtn(nameid, $(tr).find('input.market_multi_price'+(swhX64.multiAction=='sell'?'_paid':'')));
            });
        },
        addLoadSpreadBtn: function(id, el) {
            $(el).after(" <a class=\"btn_blue_white_innerfade btn_small_wide\" href=\"javascript:void(0)\">"
                        + "<span>open</span>"
                        + "</a>").next().click(function() { swhX64.clickSpreadBtn(id); });
        },
        clickSpreadBtn: function(id) {
            swhX64.createDialog( $('#'+swhX64.multiAction+'_'+id+'_name').text().replace(/^\s+/g,'').replace(/\s+$/g,'') );
            swhX64.Market_LoadOrderSpread(id);
        },
        createDialog: function(title) {
            if ($('#market_commodity_order_spread').length > 0) {
                $('#market_commodity_order_spread').remove();
            }
            var body = "<div id=\"market_commodity_order_spread\">" +
			"<img src=\"https://steamcommunity-a.akamaihd.net/public/images/economy/market/market_bg_949.png\" style=\"position:absolute; top:-82px; right:0; z-index: -1; opacity: 1;\">" +
			"<div class=\"market_commodity_orders_block\" style=\"width: calc(50% - 30px)\">" +
			"<div class=\"market_commodity_orders_interior\">" +
			"<div class=\"market_commodity_orders_header\" style=\"min-height: auto\">" +
			"" +
			"<div class=\"market_commodity_order_summary\" id=\"market_commodity_forsale\" >" +
			"</div>" +
			"</div>" +
			"<div id=\"market_commodity_forsale_table\" class=\"market_commodity_orders_table_container\">" +
			"</div>" +
			"</div>" +
			"</div>" +
			"<div class=\"market_commodity_orders_block\" style=\"width: calc(50% - 30px)\">" +
			"<div class=\"market_commodity_orders_interior\">" +
			"<div class=\"market_commodity_orders_header\" style=\"min-height: auto\">" +
			"<div class=\"market_commodity_order_summary\" id=\"market_commodity_buyrequests\">" +
			"</div>" +
			"</div>" +
			"<div id=\"market_commodity_buyreqeusts_table\" class=\"market_commodity_orders_table_container\">" +
			"</div>" +
			"</div>" +
			"</div>" +
			"</div>";

            swhX64.dialogHandle = ShowDialog(title, body, {});
        },
        Market_LoadOrderSpread: function( item_nameid ) {
            /** @see https://community.akamai.steamstatic.com/public/javascript/market.js*/
            $.ajax( {
                url: 'https://steamcommunity.com/market/itemordershistogram',
                type: 'GET',
                data: {
                    country: g_strCountryCode,
                    language: g_strLanguage,
                    currency: typeof( g_rgWalletInfo ) != 'undefined' && g_rgWalletInfo['wallet_currency'] != 0 ? g_rgWalletInfo['wallet_currency'] : 1,
                    item_nameid: item_nameid,
                }
            } ).error( function ( ) {
            } ).success( function( data ) {
                if ( data.success === 1 ) {
                    $('#market_commodity_forsale').html( data.sell_order_summary );
                    $('#market_commodity_forsale_table').html( data.sell_order_table ).find('tr:last').remove();
                    $('#market_commodity_buyrequests').html( data.buy_order_summary );
                    $('#market_commodity_buyreqeusts_table').html( data.buy_order_table ).find('tr:last').remove();
                    var $tbody_forsale = $('#market_commodity_forsale_table>table>tbody');
                    var $tbody_forbuy = $('#market_commodity_buyreqeusts_table>table>tbody');
                    $tbody_forsale.find('tr').find('td:first').each(function(index, row) {
                        $(row).data('price', data.sell_order_graph[index]);
                    });
                    $tbody_forbuy.find('tr').find('td:first').each(function(index, row) {
                        $(row).data('price', data.buy_order_graph[index]);
                    });

                    for(const sell_graph of data.sell_order_graph.slice(5,20)) {
                        $tbody_forsale.append('<tr><td align=right data-price="'+sell_graph[0]+'">' +data.price_prefix+' '+swhX64.formatNum(sell_graph[0])+' ' +data.price_suffix+'</td><td align=right>'+sell_graph[1]+'</td></tr>');
                    }
                    for(const buy_graph of data.buy_order_graph.slice(5,20)) {
                        $tbody_forbuy.append('<tr><td align=right data-price="'+buy_graph[0]+'">'+data.price_prefix+' '+swhX64.formatNum(buy_graph[0])+' ' +data.price_suffix+'</td><td align=right>'+buy_graph[1]+'</td></tr>');
                    }
                    var targetId = '#'+swhX64.multiAction+"_"+item_nameid+"_price"+(swhX64.multiAction=='sell'?'_paid':'');
                    var td_body = "<td>"
                    +" <a class=\"btn_darkblue_white_innerfade btn_small\" href=\"javascript:void(0)\" onclick=\""
                    +"$J('"+targetId+"').css('color','white').val($J(this).parent().parent().find('td:first').text());$J('.newmodal_background').click();$J('"+targetId+"').trigger('keup').trigger('blur');\""
                    +"><span>use</span></a>";
                    var td_body_sell = " <a class=\"btn_darkblue_white_innerfade btn_small\" href=\"javascript:void(0)\" onclick=\""
                    +"$J('"+targetId+"').css('color','white').val(parseFloat($J(this).parent().parent().find('td:first').text().replace(/[^0-9,]+/g,'').replace(',','.')) - 0.01);$J('.newmodal_background').click();$J('"+targetId+"').trigger('keup').trigger('blur');\""
                    +"><span>-</span></a>"
                    +"</td>";
                    var td_body_buy = " <a class=\"btn_darkblue_white_innerfade btn_small\" href=\"javascript:void(0)\" onclick=\""
                    +"$J('"+targetId+"').css('color','white').val(parseFloat($J(this).parent().parent().find('td:first').text().replace(/[^0-9,]+/g,'').replace(',','.')) + 0.01);$J('.newmodal_background').click();$J('"+targetId+"').trigger('keup').trigger('blur');\""
                    +"><span>+</span></a>"
                    +"</td>";
                    $tbody_forsale.find('tr:not(:first-child)').each(function(i,row) {
                       $(row).append(td_body + td_body_sell);
                    });
                    $tbody_forbuy.find('tr:not(:first-child)').each(function(i,row) {
                       $(row).append(td_body + td_body_buy);
                    });
                } else {
                    const el = $('<div>Oops, ' + EResult[data.success] + ' ... </div>');
                    el.append(" <a class=\"btn_blue_white_innerfade btn_small_wide\" href=\"javascript:void(0)\">"
                              + "<span>try again</span>"
                              + "</a>").find('a').click(function() { swhX64.dialogHandle.Dismiss(); swhX64.clickSpreadBtn(item_nameid); });
                    $('#market_commodity_order_spread').html(el);
                }
            });
        },
        formatNum: function (num) {
            return num.toLocaleString(g_strCountryCode, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
        }
    };

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
        "119": "ClientNoLongerSupported"
    };

    $(document).ready( function(){
        swhX64.init();
    });

})($J);
