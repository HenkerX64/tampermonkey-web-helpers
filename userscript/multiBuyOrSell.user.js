// ==UserScript==
// @name         Steam Market Helper
// @description  -
// @namespace    https://github.com/HenkerX64
// @updateURL    https://raw.githubusercontent.com/HenkerX64/steam-web-helpers/main/userscript/multiBuyOrSell.user.js
// @version      0.1
// @description  try to take over the world!
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
			"<div class=\"market_commodity_orders_block\">" +
			"<div class=\"market_commodity_orders_interior\">" +
			"<div class=\"market_commodity_orders_header\">" +
			"" +
			"<div class=\"market_commodity_order_summary\" id=\"market_commodity_forsale\" >" +
			"</div>" +
			"</div>" +
			"<div id=\"market_commodity_forsale_table\" class=\"market_commodity_orders_table_container\">" +
			"</div>" +
			"</div>" +
			"</div>" +
			"<div class=\"market_commodity_orders_block\">" +
			"<div class=\"market_commodity_orders_interior\">" +
			"<div class=\"market_commodity_orders_header\">" +
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
            $.ajax( {
                url: 'https://steamcommunity.com/market/itemordershistogram',
                type: 'GET',
                data: {
                    country: g_strCountryCode,
                    language: g_strLanguage,
                    currency: typeof( g_rgWalletInfo ) != 'undefined' && g_rgWalletInfo['wallet_currency'] != 0 ? g_rgWalletInfo['wallet_currency'] : 1,
                    item_nameid: item_nameid,
                    two_factor: BIsTwoFactorEnabled() ? 1 : 0
                }
            } ).error( function ( ) {
            } ).success( function( data ) {
                if ( data.success == 1 ) {
                    $('#market_commodity_forsale').html( data.sell_order_summary );
                    $('#market_commodity_forsale_table').html( data.sell_order_table ).find('tr:last').remove();
                    $('#market_commodity_buyrequests').html( data.buy_order_summary );
                    $('#market_commodity_buyreqeusts_table').html( data.buy_order_table ).find('tr:last').remove();
                    var $tbody_forsale = $('#market_commodity_forsale_table>table>tbody');
                    var $tbody_forbuy = $('#market_commodity_buyreqeusts_table>table>tbody');
                    for(var i=5;i<10;i++) {
                        $tbody_forsale.append('<tr><td align=right>' +data.price_prefix+' '+swhX64.formatNum(data.sell_order_graph[i][0])+' ' +data.price_suffix+'</td><td align=right>'+data.sell_order_graph[i][1]+'</td></tr>');
                        $tbody_forbuy.append('<tr><td align=right>'+data.price_prefix+' '+swhX64.formatNum(data.buy_order_graph[i][0])+' ' +data.price_suffix+'</td><td align=right>'+data.buy_order_graph[i][1]+'</td></tr>');
                    }
                    var td_body = "<td>"
                    +" <a class=\"btn_darkblue_white_innerfade btn_small\" href=\"javascript:void(0)\" onclick=\""
                    +"$J('#"+swhX64.multiAction+"_"+item_nameid+"_price"+(swhX64.multiAction=='sell'?'_paid':'')+"').css('color','white').val($J(this).parent().parent().find('td:first').text());$J('.newmodal_background').click();\""
                    +"><span>use</span></a>"
                    +"</td>";
                    $tbody_forsale.find('tr:not(:first-child)').each(function(i,row) {
                       $(row).append(td_body);
                    });
                    $tbody_forbuy.find('tr:not(:first-child)').each(function(i,row) {
                       $(row).append(td_body);
                    });
                }
            });
        },
        formatNum: function (num) {
            return num.toLocaleString(g_strCountryCode, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
        }
    };

    $(document).ready( function(){
        swhX64.init();
    });

})($J);
