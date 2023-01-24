// ==UserScript==
// @name         Music Playlist helper
// @namespace    com.drrr.music.playlist
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://drrr.com/room/*
// @match        http://drrr.local/room/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=drrr.com
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11
// @grant        unsafeWindow
// @grant        none
// ==/UserScript==

//unsafeWindow.Swal = Swal;
const Swal = Sweetalert2;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const session_name = 'plugin-playlist';
let playlist = [];
let should_cast = false;

function formListText() {
    return playlist.join('\n');
}

function displayCount() {
    $('#playlist-count').text(playlist.length)
}
function save() {
    let value = formListText();
    sessionStorage[session_name] = value;
}
function load() {
    let value = sessionStorage[session_name];
    if (value) {
        editList(value);
    }
}

function updateList(text) {
    for (let song of text.split('\n').map(e => e.trim())) {
        if (!playlist.includes(song)) {
            playlist.push(song)
        }
    }
    displayCount();
    save();
    return playlist;
}

function editList(text) {
    playlist = text.split('\n').map(e => e.trim());
    displayCount();
    save();
    return playlist;
}


let $add_playlist = $('<div id="playlist-add" style="float: left; line-height: 40px; width:30px; margin-left: 10px;" ><span>🎵</span></div>');
$("#musicBox").append($add_playlist);
$add_playlist.click(async function () {
    const { value: text } = await Swal.fire({
        input: 'textarea',
        inputLabel: 'Add to Playlist',
        inputPlaceholder: 'http://...',
        inputAttributes: {
            'aria-label': 'http://...'
        },
        showCancelButton: true
    })

    if (text) {
        updateList(text);
        //Swal.fire('',formListText());
    }
});
let $edit_playlist = $('<div id="playlist-add" style="float: left; line-height: 40px; width:30px; margin-left: 10px;" ><span>🎶</span></div>');
$("#musicBox").append($edit_playlist);
$edit_playlist.click(async function () {
    const { value: text } = await Swal.fire({
        input: 'textarea',
        inputLabel: 'Edit Playlist',
        inputValue: formListText(),
        inputPlaceholder: 'http://...',
        inputAttributes: {
            'aria-label': 'http://...'
        },
        showCancelButton: true
    })

    if (text) {
        editList(text);
        //Swal.fire('',formListText());
    }
});

let $show_playlist = $('<div style="float: left; line-height: 40px; width:30px; margin-left: 10px; margin-right: 10px;" ><span>Show</span><span id="playlist-count"></span></div>');
$("#musicBox").append($show_playlist);
$show_playlist.click(async function () {
    Swal.fire('', formListText());
});

let Standby = "Standby";
let Casting = "Casting...";

let $should_cast = $(`<div style="float: left; line-height: 40px; width:30px; margin-left: 10px;" >${Standby}</div>`);
$("#musicBox").append($should_cast);
$should_cast.click(function () {
    let text = $should_cast.text();
    if (text == Standby) {
        $should_cast.text(Casting);
        should_cast = true;
        trigger_playlist();
    } else {
        $should_cast.text(Standby);
        should_cast = false;
    }
});

async function trigger_playlist() {
    if (event_attached == false) {
        // needs to manual trigger
        let np = box.np();
        let is_playing = false;
        if (np) {
            let howl = box.np().howl;
            let time = howl.seek();
            await sleep(30);
            is_playing = howl.seek() != time;
        }
        if (is_playing) {
            np.howl.once('end', castNext)
        } else {
            castNext();
        }
    }
}
function castNext() {
    let next = playlist.pop(0);
    if (next) {
        displayCount();
        $.post('', {
            music: "music",
            name: "",
            url: next,
        });
    }
}

function music_end(id) {
    let music = this;
    console.log('end', music);
    if (should_cast) {
        castNext();
    }
}
function music_start(music) {
    console.log('start', music);
}

function share_failed() {
    if (should_cast) {
        trigger_playlist();
    }
}

load();

let event_attached = false;
const old_playMusic = DRRRClientBehavior.playMusic;
DRRRClientBehavior.playMusic = function new_playmusic(music) {
    old_playMusic(music);
    let np = box.np();
    if (music == np.music_object) {
        event_attached = true;
        music_start(music)
        np.howl.once('end', music_end.bind(music))
    } else {
        console.error('different music: ', music, np.music_object)
    }
}
$(window).on('room.chat.async-response', function (e, r) {
    if (r && r.message && r.message.startsWith("Sharing failed")) {
        share_failed();
    }
});

