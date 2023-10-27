let popupWindowId;
let watchForUrlChange = false;  // Flag to start/stop watching for URL changes
let monitoredTabId;  // Tab ID we're monitoring for URL changes

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
                    chrome.tabs.update(sender.tab.id, { url: strippedYouTubeURL }, (tab) => {
                        // The tab will be reloaded. Wait for it to complete loading.
                        watchForUrlChange = false;
                        monitoredTabId = tab.id;  // Store the tab ID where we're looking for URL change
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
                        monitoredTabId = sender.tab.id;  // Store the tab ID where we're looking for URL change
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


// Modify the tabs.onUpdated listener
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (popupWindowId && tabId === monitoredTabId) {
        if (!tab.url.includes('youtube.com/watch?v=')) {
            chrome.windows.remove(popupWindowId);
            popupWindowId = null;
            watchForUrlChange = false;
        }
    }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (popupWindowId && tabId === monitoredTabId) {
        chrome.windows.remove(popupWindowId);
        popupWindowId = null;
    }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    if (popupWindowId && activeInfo.tabId === monitoredTabId) {
        chrome.windows.update(popupWindowId, { focused: true });
    }
});