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


chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.youtubeURL) {
        let videoId = new URL(message.youtubeURL).searchParams.get("v");
        let embedURL = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;


        closeExistingPopup();
        let createPopup = () => {
            chrome.windows.create({
                url: embedURL,
                type: 'popup',
                left: 0,
                top: 130,
                width: 1900,
                height: 840 - 42
            }, window => {
                popupWindowId = window.id;
                monitoredTabUrl = message.type === "openInSameTab" ? message.youtubeURL : sender.tab.url;
                monitoredTabId = sender.tab.id;
            });
        };

        if (message.type === "openInSameTab") {
            isExtensionUpdate = true;
            chrome.tabs.update(sender.tab.id, { url: message.youtubeURL }, createPopup);
        } else {
            createPopup();
        }
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
