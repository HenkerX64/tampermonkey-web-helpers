// ==UserScript==
// @name        steam物品价值
// @namespace   https://github.com/lzghzr/TampermonkeyJS
// @version     0.0.2
// @author      lzghzr
// @description 在市场物品详情中显示价值
// @supportURL  https://github.com/lzghzr/TampermonkeyJS/issues
// @match       *://steamcommunity.com/market/listings/753/*
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
<div class="descriptor">该物品价值：<span style="color: #5b9ace">${gooValue} 个宝石</span></div>`;
}