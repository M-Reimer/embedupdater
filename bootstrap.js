/*
EmbedUpdater - Updates video embeds to make use of HTML5 video playback
Copyright (C) 2015  Manuel Reimer <manuel.reimer@gmx.de>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var globalMM = Components.classes["@mozilla.org/globalmessagemanager;1"]
    .getService(Components.interfaces.nsIMessageListenerManager);
// Prepare the framescript URL to be unique for this "addon session"
// See: https://bugzilla.mozilla.org/show_bug.cgi?id=1051238
const FRAMESCRIPT = "chrome://embedupdater/content/framescript.js?" + Date.now();

// Shitty hack to work around race condition when unloading framescripts...
// https://bugzilla.mozilla.org/show_bug.cgi?id=1187425
function SendFilenameMessageListener(message) {
  return FRAMESCRIPT;
}

function startup(data, reason) {
  globalMM.addMessageListener("embedupdater:get-framescript-filename", SendFilenameMessageListener);
  globalMM.loadFrameScript(FRAMESCRIPT, true);
}

function shutdown(data, reason) {
  globalMM.removeDelayedFrameScript(FRAMESCRIPT);
  globalMM.removeMessageListener("embedupdater:get-framescript-filename", SendFilenameMessageListener);
  globalMM.broadcastAsyncMessage("embedupdater:shutdown-framescript", {filename: FRAMESCRIPT});
}

function install(data, reason) {
}

function uninstall(data, reason) {
}
