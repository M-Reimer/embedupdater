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

/*
 * URL rewrite happens here
 */

function RewriteEmbedURL(aURL) {
  switch(GetDomainByURL(aURL)) {
    case "www.youtube.com":
      if (aURL.match(/\/v\//))
        return aURL.replace("/v/", "/embed/")
                   .replace(/^([^?]+?)&/, "$1?");
      return false;

    case "www.dailymotion.com":
      return aURL.replace("/swf/", "/embed/video/");

    case "vimeo.com":
      return aURL.replace(/.*?\/moogaloop.swf.*?clip_id=([^&]+).*/, "https://player.vimeo.com/video/$1");
  }
}

/*
 * Embed replacement core code
 */

function OnPageLoad(aEvent) {
  var document = aEvent.originalTarget;
  if (document.nodeName != "#document") return; // only documents

  // Handle objects
  var objects = document.getElementsByTagName("object");
  for (var index = objects.length - 1; index >= 0; index--) {
    var obj = objects[index];

    var tparent = obj.parentNode.tagName.toLowerCase();
    if (tparent == "embed" || tparent == "object")
      continue;

    var url = obj.getAttribute("data");
    if (!url)
      url = GetObjectParam(obj, "movie");
    if (!url) { // No URL at all --> Fallback content
      // The most common case is that we find an <embed> in our <object>
      var e = obj.getElementsByTagName("embed");
      if (e.length == 1)
        url = e[0].getAttribute("src");
    }
    if (!url)
      continue;

    var newurl = RewriteEmbedURL(url);
    if (newurl && newurl != url)
      DoReplaceEmbed(obj, newurl);
  }

  // Handle embeds
  var embeds = document.getElementsByTagName("embed");
  for (var index = embeds.length - 1; index >= 0; index--) {
    var embed = embeds[index];

    var tparent = embed.parentNode.tagName.toLowerCase();
    if (tparent == "embed" || tparent == "object")
      continue;

    var url = embed.getAttribute("src");
    if (!url)
      continue;

    var newurl = RewriteEmbedURL(url);
    if (newurl && newurl != url)
      DoReplaceEmbed(embed, newurl);
  }
}

// Replaces object/embed with iframe
function DoReplaceEmbed(aNode, aURL) {
  var document = aNode.ownerDocument;

  var width = aNode.hasAttribute("width") ? aNode.getAttribute("width") : aNode.clientWidth;
  var height = aNode.hasAttribute("height") ? aNode.getAttribute("height") : aNode.clientHeight;

  var iframe = document.createElement("iframe");
  iframe.setAttribute("width", width);
  iframe.setAttribute("height", height);
  iframe.setAttribute("frameborder", 0);
  iframe.setAttribute("allowfullscreen", "true");
  iframe.setAttribute("src", aURL);

  aNode.parentNode.replaceChild(iframe, aNode);
}

// Translates full URL to just the domain name
function GetDomainByURL(aUrl) {
  if (!aUrl.match(/^https?:\/\/([a-zA-Z0-9\.-]+)\//)) return false;
  return RegExp.$1;
}

// Read a parameter of an <object>
function GetObjectParam(aObj, aName) {
  if (aObj.tagName.toLowerCase() != "object") return false;
  for (var index = 0; index < aObj.childNodes.length; index++) {
    var param = aObj.childNodes[index];
    if (!("tagName" in param)) continue;
    if (param.tagName.toLowerCase() != "param") continue;
    var curname = param.getAttribute("name");
    if (curname && curname.toLowerCase() == aName.toLowerCase())
      return param.getAttribute("value");
  }
  return false;
}

/*
 * Framescript core code
 */

// Holds our "Session filename"
var gFileName;

// Called on "Framescript startup"
function Startup() {
  var results = sendSyncMessage("embedupdater:get-framescript-filename");
  if (results.length != 1)
    return;
  gFileName = results[0];
  addMessageListener("embedupdater:shutdown-framescript", Shutdown);
  addEventListener("DOMContentLoaded", OnPageLoad);
}

// Called by our "bootstrap.js" using message listener
function Shutdown(message) {
  if (message.data.filename != gFileName) return;
  removeMessageListener("embedupdater:shutdown-framescript", Shutdown);
  removeEventListener("DOMContentLoaded", OnPageLoad);
}

Startup();
