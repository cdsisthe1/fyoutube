let popupWindowId;
let monitoredTabUrl;  // URL of the tab we're monitoring
let isExtensionUpdate = false;  // Flag to track if the URL update was initiated by the extension

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
                    isExtensionUpdate = true;  // Set the flag to true before updating the tab's URL
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
                        // Store the URL of the tab we're monitoring
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
                        // Store the URL of the tab we're monitoring
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
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Check if the tab has finished loading
    if (changeInfo.status !== 'complete') {
        return;
    }
    
    if (isExtensionUpdate) {
        isExtensionUpdate = false;  // Reset the flag after the tab update
        return;  // Exit the listener since this is an extension-initiated update
    }

    if (popupWindowId && monitoredTabUrl) {
        if (tab.url !== monitoredTabUrl) {
            chrome.windows.remove(popupWindowId);
            popupWindowId = null;
            monitoredTabUrl = null;
        }
    }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (popupWindowId && tabId === monitoredTabId) {
        chrome.windows.remove(popupWindowId);
        popupWindowId = null;
        monitoredTabUrl = null;
    }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (popupWindowId && tab.url && tab.url.includes(monitoredTabUrl)) {
            chrome.windows.update(popupWindowId, { focused: true });
        }
    });
});
