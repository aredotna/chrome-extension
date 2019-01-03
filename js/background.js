// context menu
chrome.contextMenus.create({
  title: "Add to Are.na",
  contexts: ["page","selection","link","editable","image","video", "audio"],
  onclick: function(options){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        text: "open:dialog",
        options: options,
        title: tabs[0].title,
        url: tabs[0].url,
        tab_id: tabs[0].id
      }, function(content){});
    });
  }
});

chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.sendMessage(tab.id, {
    text: "open:dialog",
    options: { srcUrl: tab.url },
    title: tab.title,
    url: tab.url,
    tab_id: tab.id
  }, function(content){});
});
