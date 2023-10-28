let popupWindowId;
let monitoredTabId;  // ID of the tab we're monitoring
let monitoredTabUrl;  // URL of the tab we're monitoring
let isExtensionUpdate = false;  // Flag to track if the URL update was initiated by the extension

// Create a periodic alarm to keep the service worker active
chrome.alarms.create('keepAlive', {
    delayInMinutes: .1,
    periodInMinutes: .1
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'keepAlive') {
        console.log("Waking up service worker.");
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.youtubeURL) {
        console.log("Received URL from content script:", message.youtubeURL);

        // Remove anything after the & from the YouTube URL
        let strippedYouTubeURL = message.youtubeURL.split('&')[0];

        fetch('http://localhost:5000/get_link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ youtube_url: strippedYouTubeURL })
        })
        .then(response => response.json())
        .then(data => {
            if (data.direct_link) {
                if (message.type === "openInSameTab") {
                    isExtensionUpdate = true;
                    chrome.tabs.update(sender.tab.id, { url: strippedYouTubeURL }, (tab) => {
                        chrome.windows.create({
                            url: data.direct_link,
                            type: 'popup',
                            left: 240,
                            top: 120,
                            width: 1410,
                            height: 810
                        }, (window) => {
                            popupWindowId = window.id;
                        });
                        monitoredTabUrl = strippedYouTubeURL;
                    });
                } else {
                    chrome.windows.create({
                        url: data.direct_link,
                        type: 'popup',
                        left: 240,
                        top: 120,
                        width: 1410,
                        height: 810
                    }, (window) => {
                        popupWindowId = window.id;
                        monitoredTabUrl = sender.tab.url;
                    });
                }
            } else {
                console.error("Did not receive a direct link from the server.");
            }
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error.message);
        });
    }
    monitoredTabId = sender.tab.id;  // Store the ID of the tab we're monitoring
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId !== monitoredTabId) return;

    if (changeInfo.status !== 'complete') {
        return;
    }

    if (isExtensionUpdate) {
        isExtensionUpdate = false;
        return;
    }

    if (popupWindowId && monitoredTabUrl) {
        if (tab.url !== monitoredTabUrl) {
            chrome.windows.remove(popupWindowId);
            popupWindowId = null;
            monitoredTabUrl = null;
            monitoredTabId = null;  // Reset the monitored tab ID
        }
    }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (tabId !== monitoredTabId) return;

    if (popupWindowId) {
        chrome.windows.remove(popupWindowId);
        popupWindowId = null;
        monitoredTabUrl = null;
        monitoredTabId = null;  // Reset the monitored tab ID
    }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    if (activeInfo.tabId !== monitoredTabId) return;

    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (popupWindowId && tab.url && tab.url.includes(monitoredTabUrl)) {
            chrome.windows.update(popupWindowId, { focused: true });
        }
    });
});
