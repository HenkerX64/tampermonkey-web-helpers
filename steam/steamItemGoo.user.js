// ==UserScript==
// @name        steam item gems value
// @namespace   https://github.com/HenkerX64
// @updateURL   https://raw.githubusercontent.com/HenkerX64/tampermonkey-web-helpers/main/steam/steamItemGoo.user.js
// @version     0.0.2
// @author      lzghzr
// @description Show gems value in marketplace item details
// @supportURL  https://raw.githubusercontent.com/HenkerX64/tampermonkey-web-helpers/issues
// @match       *://steamcommunity.com/market/listings/753/*
// @connect     steamcommunity.com
// @license     MIT
// @grant       none
// @run-at      document-end
// ==/UserScript==
const W = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;
const gooValue = JSON.stringify(W.g_rgAssets).match(/GetGooValue\(.*?, (?<appid>\d+), (?<item_type>\d+), (?<border_color>\d+)/);
if (gooValue !== null)
  getGooValue(gooValue.groups)
    .then(data => addGoo(data.goo_value));
function getGooValue({ appid, item_type, border_color }) {
  return fetch(`//steamcommunity.com/auction/ajaxgetgoovalueforitemtype/?appid=${appid}&item_type=${item_type}&border_color=${border_color}`)
    .then(res => res.json());
}
function addGoo(gooValue) {
  const elmDivItem = document.querySelector('#largeiteminfo_item_descriptors');
  if (elmDivItem !== null)
    elmDivItem.innerHTML += `<div class="descriptor">&nbsp;</div>
<div class="descriptor">Gems：<span style="color: #5b9ace">${gooValue}</span></div>`;
}
