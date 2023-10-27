let popupWindowId;
let watchForUrlChange = false;
let monitoredTabId;
let previousUrl = "";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.youtubeURL) {
        console.log("Received URL from content script:", message.youtubeURL);
        previousUrl = message.youtubeURL.split('&')[0]; // Store the base part of the URL

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
                        monitoredTabId = tab.id;
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
                        monitoredTabId = sender.tab.id;
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
    if (popupWindowId && tabId === monitoredTabId) {
        if (changeInfo.url) {
            let currentBaseURL = changeInfo.url.split('&')[0];
            if (currentBaseURL !== previousUrl) {
                chrome.windows.remove(popupWindowId);
                popupWindowId = null;
                watchForUrlChange = false;
            }
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
