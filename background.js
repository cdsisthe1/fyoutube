let popupWindowId;
let watchForUrlChange = false;  // Flag to start/stop watching for URL changes
let monitoredTabId;  // Tab ID we're monitoring for URL changes
let previousUrl = "";  // Store the previous URL to compare with the new one

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.youtubeURL) {
        console.log("Received URL from content script:", message.youtubeURL);
        previousUrl = "";  // Reset the previous URL

        fetch('http://localhost:5000/get_link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ youtube_url: message.youtubeURL })
        })
        .then(response => response.json())
        .then(data => {
            if (data.direct_link) {
                if (message.type === "openInSameTab") {
                    chrome.tabs.update(sender.tab.id, { url: message.youtubeURL }, (tab) => {
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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Ensure that we're only acting on the monitored tab
    if (popupWindowId && tabId === monitoredTabId) {
        if (changeInfo.status === "complete" && tab.url.includes('youtube.com/watch?')) {
            // Tab finished loading. Now, start watching for URL changes.
            watchForUrlChange = true;
            previousUrl = tab.url;  // Store the current URL as the previous URL
        }

        if (watchForUrlChange && changeInfo.url && changeInfo.url !== previousUrl) {
            // If the URL has changed, close the popup window
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
