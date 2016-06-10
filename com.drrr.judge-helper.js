// ==UserScript==
// @name         法官 Helper
// @namespace    com.drrr.judge-helper
// @version      0.1
// @description  try to take over the world!
// @author       Willian
// @match        http://drrr.com/room/*
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