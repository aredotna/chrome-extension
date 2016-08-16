(function(){

  function createFrame(msg) {
    markletFrame = document.createElement("iframe");
    markletFrame.name = markletFrame.id = "arena_frame";
    if (msg) {
      markletFrame.src = getURL(msg);
    } else {
      markletFrame.src = getURL({
        url: window.location.href,
        title: window.document.title
      });
    }

    document.body.appendChild(markletFrame);
  }

  function getURL(msg) {
    baseUrl = "https://www.are.na/save/";

    if(msg.options.srcUrl) {
      path = msg.options.srcUrl;
    } else if(msg.options.selectionText) {
      path = msg.options.selectionText;
    } else if(msg.options.linkUrl) {
      path = msg.options.linkUrl;
    } else {
      path = msg.options.pageUrl;
    }

    url = baseUrl + encodeURIComponent(path);
    url += "?original_source_url=" + encodeURIComponent(msg.url);
    url += "&original_source_title=" + encodeURIComponent(msg.title);

    return url;
  }

  function createTarget() {
    markletDiv = document.createElement("div");
    markletDiv.id = "arena_div";

    document.body.appendChild(markletDiv);
  }

  function closeBookmarklet() {
    if (markletFrame) document.body.removeChild(markletFrame);
    if (markletDiv) document.body.parentNode.removeChild(markletDiv);
    if (markletStyle) document.body.parentNode.removeChild(markletStyle);
  }

  function createStyle() {
    var url = chrome.extension.getURL("css/style.css");
    var head = document.head;
    var link = document.createElement('link');

    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = url;

    head.appendChild(link);
  }

  function closest(that, tagname) {
    while (that.parentNode) {
      that = that.parentNode;
      if (that.tagName == tagname) {
        return that;
      }
    }
    return false;
  }

  function sendMessage(data) {
    markletFrame.contentWindow.postMessage(data, "*");
  }


  // class functions

  function hasClass(el, className) {
    if (el.classList) {
      return el.classList.contains(className);
    } else {
      return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'));
    }
  }

  function addClass(el, className) {
    if (el.classList) {
      el.classList.add(className);
    } else if (!hasClass(el, className)) {
      el.className += " " + className;
    }
  }

  function removeClass(el, className) {
    if (el.classList) {
      el.classList.remove(className);
    } else if (hasClass(el, className)) {
      var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
      el.className = el.className.replace(reg, ' ');
    }
  }


  // mouse events

  function sendClick() {
    sendMessage({
      action: "click"
    });
  }

  function startDrag(e) {
    var targetParent;

    sendMessage({
      action: "drag"
    });

    if (typeof e.dataTransfer.getData("text/html") == "undefined" || e.target.tagName == "IMG") {

      targetParent = closest(e.target, "A") || document.createElement('A');

      parentHTML = targetParent.cloneNode(false);
      parentHTML.href = parentHTML.href;

      targetImage = e.target.cloneNode(false);
      targetImage.src = targetImage.src;

      parentHTML.appendChild(targetImage);
      e.dataTransfer.setData("text/html", parentHTML.outerHTML);
    }

    markletDiv.style.display = "block";
  }

  function stopDrag(e) {
    markletDiv.style.display = "none";
  }

  function dragOver(e) {
    e.stopPropagation();
    e.preventDefault();
    return false;
  }

  function dragEnter(e) {
    sendMessage({
      action: "dragenter"
    });
    return false;
  }

  function dragLeave(e) {
    sendMessage({
      action: "dragleave"
    });
    return false;
  }

  function drop(e) {
    var data = {
      source: location.href,
      title: document.title
    };

    for (var i in e.dataTransfer.types) {
      data[e.dataTransfer.types[i]] = e.dataTransfer.getData(e.dataTransfer.types[i]);
    }

    sendMessage({
      action: "drop",
      value: data
    });

    e.stopPropagation();
    e.preventDefault();

    return false;
  }


//---------------
// view / control
//---------------

  // initialization

  var markletFrame;
  var markletDiv;
  var markletStyle;

  // listeners

  document.onkeyup = function(e) {
    if (e || window.event) {
      e = window.event;
      if (e.keyCode == 27) closeBookmarklet();
    }
  };

  window.addEventListener("message", function(e) {
    switch (e.data.action) {
      case "close":
        closeBookmarklet();
        break;
      case "expand":
        el = document.getElementById('arena_frame');
        addClass(el, 'is-expanded');
        break;
      case "contract":
        el = document.getElementById('arena_frame');
        removeClass(el, 'is-expanded');
        break;
    }
  });

  function initialize(msg){
    createFrame(msg);
    createTarget();
    createStyle();

    document.addEventListener("dragstart", startDrag, true);
    document.addEventListener("dragend", stopDrag, true);
    document.addEventListener("mousedown", sendClick, true);

    markletDiv.addEventListener("dragover", dragOver, true);
    markletDiv.addEventListener("dragenter", dragEnter, false);
    markletDiv.addEventListener("dragleave", dragLeave, false);
    markletDiv.addEventListener("drop", drop, false);
  }

  chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.text && (msg.text == "open:dialog")) {
      initialize(msg);
    }
  });

})();

