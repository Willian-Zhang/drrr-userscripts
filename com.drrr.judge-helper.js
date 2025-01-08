// ==UserScript==
// @name         法官 Helper
// @namespace    com.drrr.judge-helper
// @version      0.5
// @description  try to take over the world!
// @author       Willian
// @match        http://drrr.com/room/*
// @match        https://drrr.com/room/*
// @match        http://drrr.local/room*
// @match        https://drrr.local/room*
// @grant        unsafeWindow
// @downloadURL https://update.greasyfork.org/scripts/20061/%E6%B3%95%E5%AE%98%20Helper.user.js
// @updateURL https://update.greasyfork.org/scripts/20061/%E6%B3%95%E5%AE%98%20Helper.meta.js
// ==/UserScript==

// let $ = unsafeWindow.$;
let window = unsafeWindow;
let startRegex = /開始|开始/;
let button = $('.room-submit-btn');
$(window).on('room.chat.message', function (_, chat) {
    if (chat.message && chat.is_me && chat.message.search(startRegex) != -1) {
        resetCounter();
    }
});

let counter = null;
function resetCounter() {
    if (counter) clearInterval(counter);
    let counting = 1;
    counter = setInterval(function () {
        changeDisplay(counting);
        counting++;
    }, 1000);
};
function changeDisplay(sth) {
    button.val(sth);
};

function formDefaultInstruction(key, value) {
    return function () {
        return $.post('', { default: { key: key, value: value } }).done(function (e) { swal(e); });
    };
};
function formSetInstruction(key, value) {
    let settings = {
        to: 'all'
    };
    settings[key] = value;
    return function () {
        return $.post('', settings).done(function (e) { if (e) { swal(e); } });
    };
};
const translator = window.translator;
function isEnglish() {
    return translator.constructor.catalog["Yes"] == "YES"
}
function addTranslation() {
    let catalog = translator.constructor.catalog;
    catalog['Set all to {1}'] = '讓所有人成為 {1}';
    catalog['Set defalut to {1}'] = '設置進入默認為 {1}';
}
if (!isEnglish()) addTranslation();

$(window).on('room.user.menu.show', function (event, menu, user, dropdown) {
    dropdown.resetDevider();
    dropdown.addDevisionIfNot();
    if (user.hasOwnProperty('player')) {
        let playerTag = t(!user.player ? 'player' : 'non-player');
        dropdown.addNode(t('Set all to {1}', playerTag),
            formSetInstruction('player', !user.player)
        );
        dropdown.addNode(t('Set defalut to {1}', playerTag),
            formDefaultInstruction('player', !user.player)
        );
    }
    if (user.hasOwnProperty('alive')) {
        let aliveTag = t(!user.alive ? 'alive' : 'dead');
        dropdown.addNode(t('Set all to {1}', aliveTag),
            formSetInstruction('alive', !user.alive)
        );
        dropdown.addNode(t('Set defalut to {1}', aliveTag),
            formDefaultInstruction('alive', !user.alive)
        );
    }
});