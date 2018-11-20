// ==UserScript==
// @name         法官 Helper
// @namespace    com.drrr.judge-helper
// @version      0.4
// @description  try to take over the world!
// @author       Willian
// @match        http://drrr.com/room/*
// @match        https://drrr.com/room/*
// @match        http://drrr.local/room*
// @match        https://drrr.local/room*
// @grant        法官
// ==/UserScript==

var $ = unsafeWindow.$;
var startRegex = /開始|开始/;
var button = $('.room-submit-btn');
$(unsafeWindow).on('room.chat.message',function(_,chat){
    if(chat.message && chat.is_me && chat.message.search(startRegex)!=-1 ){
        resetCounter();
    }
});

var counter = null;
var resetCounter = function(){
    if(counter) clearInterval(counter);
    var counting = 1;
    counter = setInterval(function(){
        changeDisplay(counting);
        counting++;
    },1000);
};
var changeDisplay = function(sth){
    button.val(sth);
};

var formDefaultInstruction = function (key, value){
    return function(){
        return $.post('',{default:{key:key,value:value}}).done(function(e){swal(e);});
    };
};
var formSetInstruction = function (key, value){
    var settings = {
        to:'all'
    };
    settings[key] = value;
    return function(){
        return $.post('',settings).done(function(e){if(e){swal(e);}});
    };
};
var translator = unsafeWindow.translator;
function isEnglish(){
    return translator.constructor.catalog["Yes"] == "YES"
}
function addTranslation(){
    var catalog = translator.constructor.catalog;
    catalog['Set all to {1}']     = '讓所有人成為 {1}';
    catalog['Set defalut to {1}'] = '設置進入默認為 {1}';
}
if(!isEnglish())   addTranslation();

$(unsafeWindow).on('room.user.menu.show',function(event, menu, user, functions){
    functions.resetDevider();
    functions.addDevisionIfNot();
    if(user.hasOwnProperty('player')){
        var playerTag = t(!user.player ? 'player' : 'non-player');
        functions.addNode(t('Set all to {1}', playerTag),
            formSetInstruction('player',!user.player)
            );
        functions.addNode(t('Set defalut to {1}', playerTag),
            formDefaultInstruction('player',!user.player)
            );
    }
    if(user.hasOwnProperty('alive')){
        var aliveTag = t(!user.alive ? 'alive' : 'dead');
        functions.addNode(t('Set all to {1}', aliveTag),
            formSetInstruction('alive',!user.alive)
            );
        functions.addNode(t('Set defalut to {1}', aliveTag),
            formDefaultInstruction('alive',!user.alive)
            );
    }
});