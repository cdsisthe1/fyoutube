let popupWindowId;
let monitoredTabId;
let monitoredTabUrl;
let isExtensionUpdate = false;

function closeExistingPopup() {
    if (popupWindowId) {
        chrome.windows.remove(popupWindowId);
        popupWindowId = null;
    }
}

chrome.alarms.create('keepAlive', { delayInMinutes: .03, periodInMinutes: .03 });
chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'keepAlive') console.log("Waking up service worker.");
});

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.youtubeURL) {
        let strippedYouTubeURL = message.youtubeURL.split('&')[0];
        fetch('http://localhost:5000/get_link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ youtube_url: strippedYouTubeURL })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.direct_link) return console.error("No direct link from server.");
            
            closeExistingPopup();
			let createPopup = () => {
				chrome.windows.create({
					url: data.direct_link,
					type: 'popup',
					left: 0,
					top: 130,
					width: 1900,
					height: 840 - 42
				}, window => {
					popupWindowId = window.id;
					monitoredTabUrl = message.type === "openInSameTab" ? strippedYouTubeURL : sender.tab.url;
					monitoredTabId = sender.tab.id;
				});
			};

            if (message.type === "openInSameTab") {
                isExtensionUpdate = true;
                chrome.tabs.update(sender.tab.id, { url: strippedYouTubeURL }, createPopup);
            } else {
                createPopup();
            }
        })
        .catch(error => console.error('Fetch operation error:', error.message));
    }

    if (message.event === "muteTab" && sender.tab) {
        chrome.tabs.update(sender.tab.id, { muted: true });
    }
});

function handleTabUpdate(tabId, tab) {
    if (tabId !== monitoredTabId) return;
    
    if (isExtensionUpdate) {
        isExtensionUpdate = false;
        return;
    }

    if (popupWindowId && monitoredTabUrl && tab.url !== monitoredTabUrl) {
        chrome.windows.remove(popupWindowId);
        popupWindowId = null;
        monitoredTabUrl = null;
        monitoredTabId = null;
    }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') handleTabUpdate(tabId, tab);
});
chrome.tabs.onRemoved.addListener(handleTabUpdate);

chrome.tabs.onActivated.addListener(({tabId}) => {
    if (tabId !== monitoredTabId) return;

    chrome.tabs.get(tabId, tab => {
        if (popupWindowId && tab.url.includes(monitoredTabUrl)) {
            chrome.windows.update(popupWindowId, { focused: true });
        }
    });
});
