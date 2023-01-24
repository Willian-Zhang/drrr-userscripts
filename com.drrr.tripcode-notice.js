// ==UserScript==
// @name         DRRR Tripcode helper
// @namespace    com.drrr.tripcode-helper
// @version      2.2
// @description  Verifies Tripcode used on DRRR
// @author       Willian
// @match        http://drrr.com/room*
// @match        http://drrr.local/room*
// @match        https://drrr.com/room*
// @match        https://drrr.local/room*
// ==/UserScript==

class TripcodeHelper {
  constructor() {
    this._key = "drrr-tripcode-1";
    this._load();
  }
  _load() {
    this.tripcodes = localStorage[this._key] ? JSON.parse(localStorage[this._key]) : {};
  }
  _save() {
    localStorage[this._key] = JSON.stringify(this.tripcodes);
  }
  _getTripcodesFromName(name) {
    var result = {};
    for (var tripcode in this.tripcodes) {
      var names = this.tripcodes[tripcode];
      if (names[name])
        result[tripcode] = name;
    }
    return result;
  }
  _getNamesFromTripcode(tripcode) {
    return this.tripcodes[tripcode] === undefined ? null : this.tripcodes[tripcode];
  }
  _setNameTripcode(name, tripcode) {
    if (this.tripcodes[tripcode] === undefined)
      this.tripcodes[tripcode] = {};

    this.tripcodes[tripcode][name] = tripcode;
    this._save();
  }
  _removeNameTripcode(name, tripcode) {
    if (this.tripcodes[tripcode] === undefined ||
      this.tripcodes[tripcode][name] === undefined)
      return false;

    delete this.tripcodes[tripcode][name];
    this._save();
    return true;
  }
  verify(name, tripcode) {
    var tripcodes = this._getTripcodesFromName(name);
    var keys = Object.getOwnPropertyNames(tripcodes);
    if (keys.length) {
      return tripcodes[tripcode] !== undefined;
    } else {
      return "Not found";
    }
  }
  remove(name, tripcode) {
    return this._removeNameTripcode(name, tripcode);
  }
  add(name, tripcode) {
    var verified = this.verify(name, tripcode);
    if (verified === "Not found") {
      this._setNameTripcode(name, tripcode);
      return "Added";
    }
    return verified;
  }
  addForcibly(name, tripcode) {
    this._setNameTripcode(name, tripcode);
  }
  getNames(tripcode) {
    var result = this._getNamesFromTripcode(tripcode);
    return result ? Object.getOwnPropertyNames(result) : [];
  }
  getTripcodes(name) {
    var result = this._getTripcodesFromName(name);
    return result ? Object.getOwnPropertyNames(result) : [];
  }
}
var TP = new TripcodeHelper();

var scanNewTripcode = function (event, chat) {
  var user = chat.user || chat.from;
  if (user.tripcode) {
    var result = TP.add(user.name, user.tripcode);
    if (result === false && chat.type == "join") {
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
  }
};

var tripcodeOprationPrompt = function (isRemove = false) {
  var text = isRemove ? `Are you sure to remove {1} to {2}?` : `Are you sure to add {1} to {2}?`;
  var confirmButtonColor = isRemove ? "#DD6B55" : "#36d13e";
  var confirmButtonText = isRemove ? `❌${t("Yes, remove it!")}` : `✅${t("Yes, add it!")}`;
  var successText = isRemove ? "Removed!" : "Added!";
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
    }, function removeTripCode() {
      if (isRemove) {
        TP.remove(name, tripcode);
      } else {
        TP.addForcibly(name, tripcode);
      }
      swal("Tripcode", t(successText), "success");
    });
  };
};
var changeTripcodeDisplayForMenu = function (menu, newTag) {
  $(menu).find('.dropdown-item-tripcode').text(newTag);
};

$(unsafeWindow).on('room.chat.join', scanNewTripcode);
$(unsafeWindow).on('room.chat.message', scanNewTripcode);

$(unsafeWindow).on('room.user.menu.show', function (event, menu, user, functions) {
  var addDevisionIfNot = functions.addDevisionIfNot;
  var resetDevider = functions.resetDevider;
  var addNode = functions.addNode;

  var rightcodes = TP.getTripcodes(user.name);

  if (user.tripcode || rightcodes.length > 0) {
    var badTripFlag = false;
    resetDevider();
    if (user.tripcode) {
      var result = TP.add(user.name, user.tripcode);
      if (result) {
        // addNode('✅', function(){
        //     tripcodeOprationPrompt(true)(user.name, user.tripcode);
        // });
        changeTripcodeDisplayForMenu(menu, `✅ #${user.tripcode}`);
      } else {
        badTripFlag = true;
        changeTripcodeDisplayForMenu(menu, `❌ #${user.tripcode}`);
        addDevisionIfNot();
        addNode(`❌ #${user.tripcode}`, function () {
          tripcodeOprationPrompt(false)(user.name, user.tripcode);
        });

        rightcodes.forEach(function (tripcode) {
          addNode(`✅ #${tripcode}`, function () {
            tripcodeOprationPrompt(true)(user.name, tripcode);
          });
        });
      }
    } else {
      addDevisionIfNot();
      addNode(`❓${t('Not using tripcode')}`, function () {
        tripcodeOprationPrompt(true)(user.name, user.tripcode);
      });
    }



    resetDevider();
    if (user.tripcode) {
      var allCodes = rightcodes;
      if (badTripFlag) {
        allCodes.unshift(user.tripcode);
      }
      allCodes.forEach(function (tripcode) {
        addDevisionIfNot();
        addNode(t('Other IDs for #{1}:', tripcode), null, 'dropdown-item-unclickable');
        var names = TP.getNames(tripcode);
        names.forEach(function (name) {
          if (name == user.name)
            return;

          addNode(`${name}`, function () {
            tripcodeOprationPrompt(true)(name, tripcode);
          });
        });
      });

    } else {
      addDevisionIfNot();
      addNode(`Other Tripcodes:`, null, 'dropdown-item-unclickable');
      rightcodes.forEach(function (tripcode) {
        addNode(`#${tripcode}`, function () {
          tripcodeOprationPrompt(true)(user.name, tripcode);
        });
      });
    }

  }
});