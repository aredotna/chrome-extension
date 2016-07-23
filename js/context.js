(function(){

//------
// model
//------

	function createFrame(msg) {
		markletFrame = document.createElement("iframe");
		markletFrame.name = markletFrame.id = "arena_frame";
		markletFrame.src = getURL(msg);

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
		if (markletDiv) document.body.removeNode(markletDiv);
		if (markletStyle) document.body.removeNode(markletStyle);
	}

	function createStyle() {
		var a = chrome.extension.getURL("css/style.css");
		var linkOpen = '<link type="text/css" rel="stylesheet" href="';
		var linkClose = '">';
		var headHTML = document.getElementsByTagName('head')[0].innerHTML;

		headHTML += linkOpen.concat(a, linkClose);
		document.getElementsByTagName('head')[0].innerHTML = headHTML;
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

	function saveConnection(msg) {
		var key = 'recent-connections-array';
		var recentConnections;

		if(msg.slug && msg.title) {
			chrome.storage.sync.get({'recent-connections-array': []}, function(result){
				recentConnections = result[key];
				recentConnections.push(msg);

				chrome.storage.sync.set({ 'recent-connections-array': recentConnections }, function() {
					console.log('saved connection');
				});
			});
		}
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

	chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
		if (msg.text && (msg.text == "open:dialog")) {
			createFrame(msg);
			createTarget();
			createStyle();

			document.addEventListener('dragstart', startDrag, true);
			document.addEventListener('dragend', stopDrag, true);
			document.addEventListener('mousedown', sendClick, true);

			markletDiv.addEventListener("dragover", dragOver, true);
			markletDiv.addEventListener("dragenter", dragEnter, false);
			markletDiv.addEventListener("dragleave", dragLeave, false);
			markletDiv.addEventListener("drop", drop, false);
		}

		if (msg.text && (msg.text == "connection:saved")) {
			saveConnection(msg);
		}
	});

})();

