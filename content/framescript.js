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

    case "www.liveleak.com":
      if (aURL.match(/player\.swf.*?token=([^&]+)/))
        return "http://www.liveleak.com/ll_embed?i=" + RegExp.$1
      return aURL.replace("/e/", "/ll_embed?i=");
  }
}

/*
 * Embed replacement core code
 */

function OnPageLoad(aEvent) {
  var document = aEvent.originalTarget;
  if (document.nodeName != "#document") return; // only documents

  // Get objects and embeds. Out if there are none of them.
  var objects = document.getElementsByTagName("object");
  var embeds = document.getElementsByTagName("embed");
  if (objects.length == 0 && embeds.length == 0) return;

  // Handle objects
  for (var index = 0; index < objects.length; index++) {
    var obj = objects[index];
    if (!obj)
        continue;

    var url = obj.getAttribute("data");
    if (!url)
      url = GetObjectParam(obj, "movie");
    if (!url)
      continue;

    var newurl = RewriteEmbedURL(url);
    if (newurl && newurl != url) {
      DoReplaceEmbed(obj, newurl);
      index--;
    }
  }

  // Handle embeds
  for (var index = 0; index < embeds.length; index++) {
    var embed = embeds[index];
    if (!embed)
        continue;

    var url = embed.getAttribute("src");
    if (!url)
      continue;

    var newurl = RewriteEmbedURL(url);
    if (newurl && newurl != url) {
      DoReplaceEmbed(embed, newurl);
      index--;
    }
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
  if (!aUrl.match(/^(?:https?:)?\/\/([a-zA-Z0-9\.-]+)\//)) return false;
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
