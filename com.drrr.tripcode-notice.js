// ==UserScript==
// @name         DRRR Tripcode helper
// @namespace    com.drrr.tripcode-helper
// @version      3.1.1
// @description  Verifies Tripcode used on DRRR
// @author       Willian
// @match        *://drrr.com/room*
// @match        *://drrr.local/room*
// @match        *://drrr.lan/room*
// @require      https://cdn.jsdelivr.net/npm/dexie@4/dist/dexie.min.js
// @grant        
// ==/UserScript==

class TripcodeHelper {
  constructor() {
    this.load().catch((e) => {
      console.error(e)
    });
  }
  async load() {
    const db = new Dexie("tripcode-find");
    this.db = db;
    await db.version(1).stores({
      tripcode: '++,tripcode, name'
    });

    // Define schema version 2 with an upgrade function
    await db.version(4).stores({
      tripcode: '++,tripcode, name, &[tripcode+name]'
    });

    if (localStorage['drrr-tripcode-1']) {
      const oldData = JSON.parse(localStorage['drrr-tripcode-1']);
      for (const tripcode in oldData) {
        const names = oldData[tripcode];
        for (const name in names) {
          await db.tripcode.add({
            tripcode: tripcode,
            name: name
          });
        }
      }
      localStorage.removeItem('drrr-tripcode-1');
    }
  }

  async remove(name, tripcode) {
    await this.db.tripcode.where({
      tripcode: tripcode,
      name: name
    }).delete();
  }

  async is_name_exist_but_tc_wrong(name, tripcode) {
    let exist = await this.db.tripcode.where({ tripcode: tripcode, name: name }).count();
    if (exist) {
      return false;
    }
    let existName = await this.db.tripcode.where('name').equals(name).count();
    if (existName) {
      return true;
    }
    return false;
  }
  async add_if_noexist(name, tripcode) {
    let exist = await this.db.tripcode.where({ tripcode: tripcode, name: name }).count();
    if (exist) {
      return false;
    }
    await this.db.tripcode.add({
      tripcode: tripcode,
      name: name
    });
    return true;
  }
  async addForcibly(name, tripcode) {
    await this.db.tripcode.add({
      tripcode: tripcode,
      name: name
    });
  }
  async getNames(tripcode) {
    let items = await this.db.tripcode.where('tripcode').equals(tripcode).toArray();
    return items.map(e => e.name);
  }
  async getTripcodes(name) {
    let items = await this.db.tripcode.where('name').equals(name).toArray();
    return items.map(e => e.tripcode);
  }
}
const TP = new TripcodeHelper();

async function scanNewTripcode(event, chat) {
  let user = chat.user || chat.from;
  if (user.tripcode) {
    let result = await TP.is_name_exist_but_tc_wrong(user.name, user.tripcode);
    if (result && chat.type == "join") {
      swal({
        title: "Tripcode",
        text: t("tripcode of {1} should not be {2}",
          t(`<span style="color:#F8BB86">{1}</span>`,
            $("<div>").text(user.name).html()),
          t(`<span style="color:#F8BB86">{1}</span>`,
            user.tripcode)
        ),
        html: true,
        type: "warning"
      });
    }
    if (!result) {
      let added = await TP.add_if_noexist(user.name, user.tripcode)
      if (added) {
        console.log("new tc record", user.name, user.tripcode)
      }
    }
  }
};

function tripcodeOprationPrompt(isRemove = false) {
  let text = isRemove ? `Are you sure to remove {1} to {2}?` : `Are you sure to add {1} to {2}?`;
  let confirmButtonColor = isRemove ? "#DD6B55" : "#36d13e";
  let confirmButtonText = isRemove ? `❌${t("Yes, remove it!")}` : `✅${t("Yes, add it!")}`;
  let successText = isRemove ? "Removed!" : "Added!";
  return function removeTripCodePrompt(name, tripcode) {
    swal({
      title: "Tripcode",
      text: t(text,
        t(`<span style="color:#F8BB86">{1}</span>`,
          tripcode),
        t(`<span style="color:#F8BB86">{1}</span>`,
          $("<div>").text(name).html())
      ),
      type: "warning",
      confirmButtonColor: confirmButtonColor,
      confirmButtonText: confirmButtonText,
      showCancelButton: true,
      closeOnConfirm: false,
      html: true
    }, async function removeTripCode() {
      if (isRemove) {
        await TP.remove(name, tripcode);
      } else {
        await TP.addForcibly(name, tripcode);
      }
      swal("Tripcode", t(successText), "success");
    });
  };
};
function changeTripcodeDisplayForMenu(menu, newTag) {
  $(menu).find('.dropdown-item-tripcode').text(newTag);
};

$(window).on('room.chat.join', scanNewTripcode);
$(window).on('room.chat.message', scanNewTripcode);

$(window).on('room.user.menu.show', async function tripcode_menu(event, menu, user, dropdown) {
  let rightcodes = await TP.getTripcodes(user.name);


  let badTripFlag = false;
  dropdown.resetDevider();
  if (user.tripcode) {
    let result = await TP.is_name_exist_but_tc_wrong(user.name, user.tripcode);
    if (!result) {
      // dropdown.addNode('✅', function(){
      //     tripcodeOprationPrompt(true)(user.name, user.tripcode);
      // });
      if (await TP.add_if_noexist(user.name, user.tripcode)) {
        changeTripcodeDisplayForMenu(menu, `🆕 #${user.tripcode}`);
      } else {
        changeTripcodeDisplayForMenu(menu, `✅ #${user.tripcode}`);
      }
    } else {
      badTripFlag = true;
      changeTripcodeDisplayForMenu(menu, `❌ #${user.tripcode}`);
      dropdown.addDevisionIfNot();
      dropdown.addNode(`❌ #${user.tripcode}`, function () {
        tripcodeOprationPrompt(false)(user.name, user.tripcode);
      });

      rightcodes.forEach(function (tripcode) {
        dropdown.addNode(`✅ #${tripcode}`, function () {
          tripcodeOprationPrompt(true)(user.name, tripcode);
        });
      });
    }
  } else {
    dropdown.addDevisionIfNot();
    dropdown.addNode(`❓${t('Not using tripcode')}`, function () {
      tripcodeOprationPrompt(true)(user.name, user.tripcode);
    });
  }

  if (user.tripcode) {
    let allCodes = rightcodes;
    if (badTripFlag) {
      allCodes.unshift(user.tripcode);
    }
    for (const tripcode of allCodes) {
      let names = await TP.getNames(tripcode);
      if (names.length == 1) {
        continue;
      }
      dropdown.addDevisionIfNot();
      dropdown.addNode(t('Other IDs for #{1}:', tripcode), null, 'dropdown-item-unclickable');

      for (let name of names) {
        if (name == user.name) continue;

        dropdown.addNode(name, () => {
          tripcodeOprationPrompt(true)(name, tripcode);
        });
      }
    }

  } else {
    dropdown.addDevisionIfNot();
    dropdown.addNode(`Other Tripcodes:`, null, 'dropdown-item-unclickable');
    rightcodes.forEach(function (tripcode) {
      dropdown.addNode(`#${tripcode}`, function () {
        tripcodeOprationPrompt(true)(user.name, tripcode);
      });
    });
  }
});